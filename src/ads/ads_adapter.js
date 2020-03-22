(function () {
  "use strict";

  var Executor = require('../util/Executor.js');
  var Sorting = require('../util/Sorting.js');

  // This function tries to interpret the passed string as an array type declaration.
  // If valid an object will be returned containing the following attributes:
  // - type: The element type
  // - range: An array of tuples containing the first and last index of the range for each dimension
  // If the passed string is not a valid array declaration this function returns false.
  var parseArrayType = function (i_type) {
    // This regex returns a match if our type is an array and has valid field range limits.
    // The whole field range limits and the element type will be available as detailed search results.
    var m = /^\s*ARRAY\s*\[\s*(\-?\d+\s*\.\.\s*\-?\d+(?:\s*,\s*\-?\d+\s*\.\.\s*\-?\d+)*)\s*\]\s*OF\s+(.+)\s*$/i.exec(i_type);
    if (m) {
      // The next regex returns all found range limit tuples.
      var range = [], r, rx = /\s*,?\s*(\-?\d+)\s*\.\.\s*(\-?\d+)\s*/g;
      rx.lastIndex = 0;
      while ((r = rx.exec(m[1])) !== null) {
        range.push([parseInt(r[1]), parseInt(r[2])]);
      }
      return { type: m[2], range: range };
    } else {
      return false;
    }
  };

  var forEachArrayIndex = function (i_range, i_callback) {
    var offset = arguments.length === 4 ? arguments[2] : 0;
    var indices = arguments.length === 4 ? arguments[3] : [];
    var start = i_range[offset][0], end = i_range[offset][1];
    for (var i = start; i <= end; i++) {
      indices.push(i);
      if (offset < i_range.length - 1) {
        forEachArrayIndex(i_range, i_callback, offset + 1, indices);
      }
      else {
        i_callback(JSON.stringify(indices));
      }
      indices.pop();
    }
  };

  var forEachNode = function (i_node, i_callback) {
    i_callback(i_node);
    if (Array.isArray(i_node.data)) {
      for (var i = 0, l = i_node.data.length; i < l; i++) {
        forEachNode(i_node.data[i], i_callback);
      }
    }
  };

  var convertDataType = function (i_datatype) {
    var type = {
      name: i_datatype.name.toUpperCase(),
      size: i_datatype.size,
      comment: i_datatype.comment
    };
    if (Array.isArray(i_datatype.datatyps)) {
      type.data = i_datatype.datatyps.map(function (i_data) {
        return {
          name: i_data.name,
          type: i_data.type.toUpperCase(),
          size: i_data.size,
          comment: i_data.comment
        };
      });
    }
    return type;
  };

  var convertSymbol = function (i_symbol) {
    return {
      name: i_symbol.name.toUpperCase(),
      // For unknown reasons TwinCAT 2 sometimes publishes the 'INT' and 'UINT' type as 'INT16' and 'UINT16'.
      // To be able to access those kind of variables we must transform our type to a valid IEC61131-3 type.
      type: i_symbol.type.toUpperCase().replace(/^(U?INT)16$/, '$1'),
      size: i_symbol.size,
      comment: i_symbol.comment
    };
  };

  var createNode = function (i_datatypes, i_path, i_name, i_type, i_size) {
    var node = {
      path: i_path.toUpperCase(),
      name: i_name.toUpperCase(),
      type: i_type.toUpperCase(),
      size: i_size
    };
    var datatype = i_datatypes[i_type];
    if (datatype && Array.isArray(datatype.data)) {
      node.data = datatype.data.map(function (i_type) {
        return createNode(i_datatypes, i_path + '.' + i_type.name, i_type.name, i_type.type, i_type.size);
      });
    }
    else {
      var arraytype = parseArrayType(i_type);
      if (arraytype) {
        datatype = i_datatypes[arraytype.type];
        var size = datatype ? datatype.size : 1;
        node.data = [];
        forEachArrayIndex(arraytype.range, function (i_indices) {
          node.data.push(createNode(i_datatypes, i_path + i_indices, i_indices, arraytype.type, size));
        });
      }
    }
    return node;
  };

  var getArrayElementWithName = function (i_array, i_name) {
    for (var i = 0, l = i_array.length; i < l; i++) {
      if (i_array[i].name === i_name) {
        return i_array[i];
      }
    }
    return null;
  };

  var getTreeRoots = function (i_datatypes, i_symbols) {
    var roots = [], symbol, parts, data, node, name, idx;
    for (var i = 0, l = i_symbols.length; i < l; i++) {
      symbol = i_symbols[i];
      parts = symbol.name.split('.');
      idx = 0;
      data = roots;
      while (data !== undefined && idx < parts.length - 1) {
        name = parts[idx];
        node = getArrayElementWithName(data, name);
        if (node === null) { 
          node = {
            // TODO: Why 'name' instead of 'path'???
            path: name,
            name: name
          };
          data.push(node);
        }
        data = node.data;
        idx++;
      }
      if (!node.data) {
        node.data = [];
      }
      node.data.push(createNode(i_datatypes, symbol.name, parts[parts.length - 1], symbol.type.toUpperCase(), symbol.size));
    }
    for (var i = 0, l = roots.length; i < l; i++) {
      data = roots[i];
      data.type = data.name.length > 0 ? 'PROGRAM' : 'GLOBAL';
    }
    return roots;
  };

  // constructor
  var AdsAdapter = function (i_ads, i_config) {
    this._ads = i_ads;
    this._config = i_config;
    this._client = false;
    this._datatypes = false;
    this._symbols = false;
    this._instances = false;
    this._roots = false;
  };

  AdsAdapter.GET_TREE_NODES_URL = '/get_ads_tree_nodes';

  // prototype
  AdsAdapter.prototype = Object.create(Object.prototype);
  AdsAdapter.prototype.constructor = AdsAdapter;

  AdsAdapter.prototype._connect = function (i_callback) {
    if (!this._client) {
      this._client = this._ads.connect(this._config, i_callback);
    }
    else if (i_callback) {
      i_callback();
    }
  };

  AdsAdapter.prototype._disconnect = function (i_callback) {
    var client = this._client;
    if (client) {
      this._client = false;
      client.end(i_callback);
    }
    else if (i_callback) {
      i_callback();
    }
  };

  var VERBOSE_DATATYPES_AND_SYMBOLS = !false;

  AdsAdapter.prototype.init = function (i_success, i_error) {
    var that = this, tasks = [];
    // connect if required
    tasks.push(function (i_suc, i_err) {
      that._connect(i_suc);
    });
    // load datatypes
    tasks.push(function (i_suc, i_err) {
      that._client.getDatatyps(function (i_exception, i_datatypes) {
        if (!i_exception) {
          that._debug_datatypes = i_datatypes;
          var datatypes = {}, datatype;
          for (var i = 0, l = i_datatypes.length; i < l; i++) {
            datatype = convertDataType(i_datatypes[i]);
            datatypes[datatype.name] = datatype;
          }
          that._datatypes = datatypes;
          // console.log(JSON.stringify(datatypes, undefined, 2));

          // TODO remove if debugged
          if (false) {
            var types = [];
            for (var i = 0, l = i_datatypes.length; i < l; i++) {
              var name = i_datatypes[i].name;
              var idx = Sorting.getInsertionIndex(name, types, true, function (i_name1, i_name2) {
                return Sorting.compareTextsAndNumbers(i_name1, i_name2, true, true);
              });
              if (idx >= 0) {
                types.splice(idx, 0, name);
              }
            }
            console.log(JSON.stringify(types, undefined, 2));
          }

          i_suc();
        }
        else {
          that._disconnect(function () {
            i_err(i_exception);
          });
        }
      });
    });
    // load symbols
    tasks.push(function (i_suc, i_err) {
      that._client.getSymbols(function (i_exception, i_symbols) {
        if (!i_exception) {
          that._debug_symbols = i_symbols;
          var symbols = [];
          for (var i = 0, l = i_symbols.length; i < l; i++) {
            symbols.push(convertSymbol(i_symbols[i]));
          }
          that._symbols = symbols;

          if (false) {
            for (var i = 0, l = symbols.length; i < l; i++) {
              var path = symbols[i].name.split('.');
              if (path.length > 2) {
                console.log(symbols[i].name);
              }
            }
          }

          // TODO remove if debugged
          if (false) {
            var types = [];
            for (var i = 0, l = i_symbols.length; i < l; i++) {
              var type = i_symbols[i].type;
              var idx = Sorting.getInsertionIndex(type, types, true, function (i_name1, i_name2) {
                return Sorting.compareTextsAndNumbers(i_name1, i_name2, true, true);
              });
              if (idx >= 0) {
                types.splice(idx, 0, type);
              }
            }
            console.log(JSON.stringify(types, undefined, 2));
          }

          i_suc();
        }
        else {
          that._disconnect(function () {
            i_err(i_exception);
          });
        }
      }, true);
    });
    // build instances tree
    tasks.push(function (i_suc, i_err) {
      that._roots = getTreeRoots(that._datatypes, that._symbols);
      i_suc();
    });
    // build instances
    tasks.push(function (i_suc, i_err) {
      var instances = {};
      for (var i = 0, l = that._roots.length; i < l; i++) {
        forEachNode(that._roots[i], function (i_node) {
          instances[i_node.path] = i_node;
        });
      }
      that._instances = instances;
      if (VERBOSE_DATATYPES_AND_SYMBOLS) {
        console.log('### DATATYPES ###');
        console.log(JSON.stringify(that._debug_datatypes, undefined, 2));
        console.log('### SYMBOLS ###');
        console.log(JSON.stringify(that._debug_symbols, undefined, 2));
        // too much instances ...
        // console.log('### ROOTS ###');
        // console.log(JSON.stringify(that._roots, undefined, 2));
        // console.log('### INSTANCES ###');
        // console.log(JSON.stringify(that._instances, undefined, 2));
      }
      i_suc();
    });
    Executor.run(tasks, i_success, i_error);
  };

  var LOAD_CHILDREN = 'LOAD_CHILDREN';

  AdsAdapter.prototype.handleFancyTreeRequest = function (i_request, i_path, i_success, i_error) {
    var nodes = [], node, folder, data;
    if (i_request === LOAD_CHILDREN) {
      var instance = this._instances[i_path.toUpperCase()];
      data = instance ? instance.data : false
    }
    else {
      data = this._roots;
    }
    var length = data ? data.length : 0;
    for (var i = 0, l = data.length; i < l; i++) {
      node = data[i];
      folder = node.data && node.data.length > 0;
      nodes.push({
        title: node.name + ' (' + node.type + ')',
        folder: folder,
        lazy: folder,
        data: {
          url: AdsAdapter.GET_TREE_NODES_URL,
          path: node.path,
          request: LOAD_CHILDREN
        },
        //icon: that.getIcon(node.path)
      });
    }
    nodes.sort(function (i_node1, i_node2) {
      return Sorting.compareTextsAndNumbers(i_node1.data.path, i_node2.data.path, true, true);
    });
    i_success(nodes);
  };

  // TODO: What is this for? Remove if unused!!!
  AdsAdapter.prototype.forEach = function (i_callback) {
    var roots = this._roots;
    for (var i = 0, l = roots.length; i < l; i++) {
      forEachNode(roots[i], function (i_node) {
        i_callback(i_node.path, i_node.name, i_node.type);
      });
    }
  };

  // TODO: What is this for? Remove if unused!!!
  AdsAdapter.prototype.getSymbol = function (i_path) {
    return this._symbols[i_path.toUpperCase()];
  };

  AdsAdapter.prototype.read = function (i_variables, i_success, i_error) {
    var ads = this._ads, client = this._client, instances = this._instances, i, l = i_variables.length, instance, variables = [], bytelength;
    for (i = 0; i < l; i++) {
      instance = instances[i_variables[i].toUpperCase()];
      if (instance) {
        if (true) {
          variables.push({
            symname: instance.path,
            bytelength: {
              length: instance.size,
              name: instance.type// === 'INT16' ? 'INT' : instance.type
            },
          });
        }
        else if (true) {
          variables.push({
            symname: instance.path,
            bytelength: instance.size,
          });
        }
        else {
          bytelength = ads[instance.type === 'INT16' ? 'INT' : instance.type];
          if (bytelength) {
            variables.push({
              symname: instance.path,
              bytelength: bytelength,
            });
          }
        }
      }
    }
    //console.log(JSON.stringify(variables, undefined, 2));
    client.multiRead(variables, function (i_exception, i_handles) {
      if (i_exception) {
        client.end();
        i_error(i_exception);
      } else {
        var results = {};
        i_handles.forEach(function (i_handle) {
          if (i_handle.err) {
            console.error(i_handle.err);
          } else {
            results[i_handle.symname] = i_handle.value;
          }
        });
        i_success(results);
      }
    });
  };

  // TODO use or remove
  AdsAdapter.prototype.read_DEPRECATED = function (i_variables, i_success, i_error) {
    var variables = [], i, l = i_variables.length, ads = this._ads, client = this._client, symbols = this._symbols, symbol, bytelength;
    for (i = 0; i < l; i++) {
      symbol = symbols[i_variables[i].toUpperCase()];
      if (symbol) {
        bytelength = ads[symbol.type];
        if (bytelength) {
          variables.push({
            symname: symbol.path,
            bytelength: bytelength,
          });
        }
      }
    }
    //console.log(JSON.stringify(variables, undefined, 2));
    client.multiRead(variables,
      function (i_exception, i_handles) {
        if (i_exception) {
          client.end();
          i_error(i_exception);
        } else {
          var results = {};
          i_handles.forEach(function (i_handle) {
            if (i_handle.err) {
              console.error(i_handle.err);
            } else {
              results[i_handle.symname] = i_handle.value;
            }
          });
          i_success(results);
        }
      }
    );
  };

  // export
  if (typeof require === 'function') {
    module.exports = AdsAdapter;
  }
  else {
    window.AdsAdapter = AdsAdapter;
  }
}());
