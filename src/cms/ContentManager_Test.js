(function() {
  "use strict";

  var s_delete_data_after_test = false;

  var s_verbose_get_objects = typeof require === 'function';

  var jsonfx = typeof require === 'function' ? require('../util/jsonfx.js') : window.jsonfx;
  var Executor = typeof require === 'function' ? require('../util/Executor.js') : window.Executor;
  var Utilities = typeof require === 'function' ? require('../util/Utilities.js') : window.Utilities;
  var SqlHelper = typeof require === 'function' ? require('../util/SqlHelper.js') : window.SqlHelper;
  var ContentManager = typeof require === 'function' ? require('./ContentManager.js') : window.ContentManager;

  var ROOT = '$_debug_config_data_handler/';
  var SOURCE = ROOT + 'projects/test/';
  var MOVED = ROOT + 'projects/test_moved/';

  var prepare_objects = function(i_objects, i_root, i_referencesTo, i_referencesFrom) {
    var r = i_root;

    // lib/base/
    i_referencesTo['lib/base/boolean.j'] = [];
    i_objects[r + 'lib/base/boolean.j'] = true;

    i_referencesTo['lib/base/number.j'] = [];
    i_objects[r + 'lib/base/number.j'] = 42;

    i_referencesTo['lib/base/string.j'] = [];
    i_objects[r + 'lib/base/string.j'] = 'lib hello world';

    i_referencesTo['lib/base/object.j'] = [];
    i_objects[r + 'lib/base/object.j'] = {
        a : 'a',
        b : 'b',
        c : 'c'
    };

    i_referencesTo['lib/base/array.j'] = [];
    i_objects[r + 'lib/base/array.j'] = [ 'A', 'B', 'C' ];

    i_referencesTo['lib/base/function.j'] = [];
    i_objects[r + 'lib/base/function.j'] = function() {
      return 'abcABC';
    };

    // lib/test/
    i_referencesTo['lib/test/use.j'] = [ 'lib/base/boolean.j', 'lib/base/number.j', 'lib/base/string.j', 'lib/base/object.j', 'lib/base/array.j', 'lib/base/function.j' ];
    i_objects[r + 'lib/test/use.j'] = {
        bool : r + 'lib/base/boolean.j',
        num : r + 'lib/base/number.j',
        str : r + 'lib/base/string.j',
        obj : r + 'lib/base/object.j',
        arr : r + 'lib/base/array.j',
        func : r + 'lib/base/function.j'
    };

    i_referencesTo['lib/test/include.j'] = [ 'lib/base/boolean.j', 'lib/base/number.j', 'lib/base/string.j', 'lib/base/object.j', 'lib/base/array.j', 'lib/base/function.j' ];
    i_objects[r + 'lib/test/include.j'] = {
        bool : 'include:' + r + 'lib/base/boolean.j',
        num : 'include:' + r + 'lib/base/number.j',
        str : 'include:' + r + 'lib/base/string.j',
        obj : 'include:' + r + 'lib/base/object.j',
        arr : 'include:' + r + 'lib/base/array.j',
        func : 'include:' + r + 'lib/base/function.j',
    };

    i_referencesTo['lib/test/overwrite.j'] = [ 'lib/test/include.j' ];
    i_objects[r + 'lib/test/overwrite.j'] = {
        include : r + 'lib/test/include.j',
        bool : false,
        num : 88,
        str : 'overwriten',
        obj : {
            b : 'b repaced',
            d : 'd added'
        },
        func : function() {
          return typeof this.source === 'object' ? this.source.func() : 'no source';
        }
    };

    i_referencesTo['lib/test/overwrite_source.j'] = [ 'lib/test/include.j' ];
    i_objects[r + 'lib/test/overwrite_source.j'] = {
        include : r + 'lib/test/include.j',
        source : true,
        bool : false,
        num : 88,
        str : 'overwriten',
        obj : {
            b : 'b repaced',
            d : 'd added'
        },
        func : function() {
          return typeof this.source == 'object' ? this.source.func() : 'no source';
        }
    };

    // m1
    i_referencesTo['m1/data.j'] = [ 'm2/data.j', 'm3/data.j', 'm2/data.t', 'm2/data.h', 'm2/data.l' ];
    i_objects[r + 'm1/data.j'] = {
        num : {
          include : r + 'm2/data.j'
        },
        value : 'include:' + r + 'm2/data.j',
        jso : 'include:' + r + 'm3/data.j',
        txt : 'include:' + r + 'm2/data.t',
        htm : 'include:' + r + 'm2/data.h',
        lab : 'include:' + r + 'm2/data.l'
    };

    i_referencesTo['m1/data.t'] = [ 'm2/data.j', 'm2/data.t', 'm3/data.t', 'm2/data.h', 'm2/data.l' ];
    i_objects[r + 'm1/data.t'] = 'number=include:' + r + 'm2/data.j text2=include:' + r + 'm2/data.t text3=include:' + r + 'm3/data.t html=include:' + r + 'm2/data.h label=include:' + r + 'm2/data.l';

    i_referencesTo['m1/data.h'] = [ 'm2/data.j', 'm2/data.t', 'm2/data.h', 'm3/data.h', 'm2/data.l' ];
    i_objects[r + 'm1/data.h'] = {
      en : '<b>number=include:' + r + 'm2/data.j text=include:' + r + 'm2/data.t html2=include:' + r + 'm2/data.h html3=include:' + r + 'm3/data.h label=include:' + r + 'm2/data.l</b>'
    };

    i_referencesTo['m1/data.l'] = [ 'm2/data.j', 'm2/data.t', 'm2/data.h', 'm2/data.l', 'm3/data.l' ];
    i_objects[r + 'm1/data.l'] = {
        en : 'number=include:' + r + 'm2/data.j',
        es : 'text=include:' + r + 'm2/data.t',
        de : 'html=include:' + r + 'm2/data.h',
        fr : 'label2=include:' + r + 'm2/data.l',
        it : 'label3=include:' + r + 'm3/data.l',
    };

    i_referencesTo['m3/data.t'] = [ 'm1/data.t', 'm3/data.t' ];
    i_objects[r + 'm3/data.t'] = 'text1=include:' + r + 'm1/data.t text3=include:' + r + 'm3/data.t';

    // m2
    i_referencesTo['m2/data.j'] = [];
    i_objects[r + 'm2/data.j'] = 42;

    i_referencesTo['m2/data.t'] = [];
    i_objects[r + 'm2/data.t'] = 'text2';

    i_referencesTo['m2/data.h'] = [];
    i_objects[r + 'm2/data.h'] = {
      en : '<b>html2</b>'
    };

    i_referencesTo['m2/data.l'] = [];
    i_objects[r + 'm2/data.l'] = {
        de : 'Hallo Welt!',
        en : 'Hello World!',
        es : 'Hola Mundo!',
        fr : 'Bonjour le monde!',
        it : 'Ciao mondo!'
    };

    // m3
    i_referencesTo['m3/data.j'] = [ 'm1/data.j', 'm3/data.j' ];
    i_objects[r + 'm3/data.j'] = {
        back : {
          include : r + 'm1/data.j'
        },
        self : {
          include : r + 'm3/data.j'
        }
    };

    i_referencesTo['m3/data.h'] = [ 'm1/data.h', 'm3/data.h' ];
    i_objects[r + 'm3/data.h'] = {
      en : '<b>html1=include:' + r + 'm1/data.h html3=include:' + r + 'm3/data.h</b>'
    };

    i_referencesTo['m3/data.l'] = [ 'm1/data.l', 'm3/data.l' ];
    i_objects[r + 'm3/data.l'] = {
        de : 'label3=include:' + r + 'm3/data.l',
        en : 'label1=include:' + r + 'm1/data.l',
        es : 'to be removed'
    };

    // root
    i_referencesTo['root.j'] = [ 'lib/test/overwrite.j', 'm1/data.j' ];
    i_objects[r + 'root.j'] = {
        object2 : {
          include : r + 'lib/test/overwrite.j'
        },
        object1 : {
          include : r + 'm1/data.j'
        }
    };
    // build backward references
    var name, i, l, r;
    for (name in i_referencesTo) {
      if (i_referencesTo.hasOwnProperty(name)) {
        i_referencesFrom[name] = [];
      }
    }
    for (name in i_referencesTo) {
      if (i_referencesTo.hasOwnProperty(name)) {
        r = i_referencesTo[name];
        for (i = 0, l = r.length; i < l; i++) {
          i_referencesFrom[r[i]].push(name);
        }
      }
    }
  };

  var store_objects = function(i_handler, i_objects, i_passed, i_failed) {
    var tasks = [];
    for ( var i in i_objects) {
      if (i_objects.hasOwnProperty(i)) {
        (function() {
          var id = i, obj = i_objects[i];
          tasks.push(function(i_success, i_error) {
            var string = /\.j$/.test(id) ? jsonfx.stringify(obj, false) : obj;
            i_handler.getModificationParams(id, undefined, string, function(i_params) {
              i_handler.setObject(id, undefined, string, i_params.checksum, function(i_result) {
                i_success('stored: "' + id + '"');
              }, function(i_exc) {
                i_error('CANNOT SET OBJECT: EXCEPTION: ' + JSON.stringify(i_exc));
              })
            }, function(i_exc) {
              i_error('CANNOT GET MODIFICATION PARAMS: EXCEPTION: ' + JSON.stringify(i_exc));
            });
          });
        }());
      }
    }
    Executor.run(tasks, function() {
      i_passed('stored objects');
    }, i_failed);
  };

  var check_references = function(i_handler, i_referencesTo, i_referencesFrom, i_root, i_passed, i_failed) {
    var tasks = [];
    for ( var i in i_referencesTo) {
      if (i_referencesTo.hasOwnProperty(i)) {
        (function() {
          var id = i_root + i, refTo = i_referencesTo[i], refFrom = i_referencesFrom[i];
          tasks.push(function(i_success, i_error) {
            i_handler.getReferencesTo(id, function(i_results) {
              if (refTo.length !== i_results.length) {
                i_error('different reference to other count: ' + id);
                return;
              }
              else {
                for (var idx = 0, len = refTo.length; idx < len; idx++) {
                  if (i_results.indexOf(i_root + refTo[idx]) === -1) {
                    i_error('reference to other not found: ' + refTo[idx]);
                    return;
                  }
                }
              }
              i_success();
            }, i_error);
          });
          tasks.push(function(i_success, i_error) {
            i_handler.getReferencesToCount(id, function(i_result) {
              if (refTo.length !== i_result) {
                i_error('different reference to other count: ' + id);
              }
              else {
                i_success();
              }
            }, i_error);
          });
          tasks.push(function(i_success, i_error) {
            i_handler.getReferencesFrom(id, function(i_results) {
              if (refFrom.length !== i_results.length) {
                i_error('different reference from other count: ' + id);
                return;
              }
              else {
                for (var idx = 0, len = refFrom.length; idx < len; idx++) {
                  if (i_results.indexOf(i_root + refFrom[idx]) === -1) {
                    i_error('reference from other not found: ' + refFrom[idx]);
                    return;
                  }
                }
              }
              i_success();
            }, i_error);
          });
          tasks.push(function(i_success, i_error) {
            i_handler.getReferencesFromCount(id, function(i_result) {
              if (refFrom.length !== i_result) {
                i_error('different reference from other count: ' + id);
              }
              else {
                i_success();
              }
            }, i_error);
          });
        }());
      }
    }
    Executor.run(tasks, function() {
      i_passed('checked references');
    }, i_failed);
  };

  var check_get_objects = function(i_handler, i_referencesTo, i_root, i_languages, i_mode, i_passed, i_failed) {
    var tasks = [], l, i;
    for (l = 0; l < i_languages.length; l++) {
      for (i in i_referencesTo) {
        if (i_referencesTo.hasOwnProperty(i)) {
          (function() {
            var id = i_root + i, lang = i_languages[l];
            tasks.push(function(i_success, i_error) {
              i_handler.getObject(id, lang, i_mode, function(i_object) {
                var jso = /\.j$/.test(id);
                var object = jso ? jsonfx.reconstruct(i_object) : i_object;
                if (s_verbose_get_objects) {
                  console.log('"' + id + '":"' + lang + '":' + i_mode + ':\n' + (jso ? jsonfx.stringify(object, i_mode !== ContentManager.RAW) : object) + '\n');
                }
                i_success();
              }, i_error);
            });
          }());
        }
      }
    }
    Executor.run(tasks, function() {
      i_passed('build objects');
    }, i_failed);
  };

  var exp = function(i_handler, i_hmi) {
    var handler = i_hmi.cms, objects = {}, references = {}, users = {};
    // //////////////////////////////////////////////////////////////////////////////////////
    // *** DELETE DEBUG DATA - IF AVAILABLE FROM FAILED TEST ***
    // //////////////////////////////////////////////////////////////////////////////////////

    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:clear debug data');
      handler.getRefactoringParams(ROOT, undefined, 'delete', function(i_params) {
        if (i_params.error === 'No data available') {
          i_passed('no data available for delete:\n' + JSON.stringify(i_params, undefined, 2));
        }
        else if (typeof i_params.error === 'string') {
          i_failed('CANNOT DELETE: EXCEPTION: ' + JSON.stringify(i_params));
        }
        else {
          handler.performRefactoring(ROOT, undefined, 'delete', i_params.checksum, function(i_result) {
            i_passed('deleted debug data: ' + JSON.stringify(i_params, undefined, 2));
          }, function(i_exc) {
            i_failed('CANNOT DELETE: EXCEPTION: ' + i_exc);
          })
        }
      }, function(i_exc) {
        i_failed('CANNOT DELETE: EXCEPTION: ' + JSON.stringify(i_exc));
      })
    });
    // //////////////////////////////////////////////////////////////////////////////////////
    // *** START ***
    // //////////////////////////////////////////////////////////////////////////////////////

    // insert objects with multiple cross references into data base
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:store_objects');
      // before we store we got to initialize
      prepare_objects(objects, SOURCE, references, users);
      store_objects(handler, objects, i_passed, i_failed);
    });
    // check all cross references in forward and reverse direction
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:check_references');
      check_references(handler, references, users, SOURCE, i_passed, i_failed);
    });
    // build all objects for language 'en'
    // return;
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:build_objects:raw');
      check_get_objects(handler, references, SOURCE, handler.getLanguages(), ContentManager.RAW, i_passed, i_failed);
    });
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:build_objects_include');
      check_get_objects(handler, references, SOURCE, handler.getLanguages(), ContentManager.INCLUDE, i_passed, i_failed);
    });
    // move root
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:move root');
      handler.getRefactoringParams(SOURCE + 'root.j', ROOT + 'root.j', 'move', function(i_params) {
        handler.performRefactoring(SOURCE + 'root.j', ROOT + 'root.j', 'move', i_params.checksum, function(i_result) {
          i_passed('moved root:\n' + JSON.stringify(i_params, undefined, 2));
        }, function(i_exc) {
          i_failed('move root: ' + i_exc);
        })
      }, function(i_exc) {
        i_failed('move root: ' + i_exc);
      })
    });
    // move lib
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:move root');
      handler.getRefactoringParams(SOURCE + 'lib/', ROOT + 'lib/', 'move', function(i_params) {
        // console.log('move lib:\n' + JSON.stringify(i_params, undefined, 2));
        handler.performRefactoring(SOURCE + 'lib/', ROOT + 'lib/', 'move', i_params.checksum, function(i_result) {
          i_passed('moved lib:\n' + JSON.stringify(i_params, undefined, 2));
        }, function(i_exc) {
          i_failed('move lib: ' + i_exc);
        })
      }, function(i_exc) {
        i_failed('move lib: ' + i_exc);
      })
    });
    // move m1
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:move root');
      handler.getRefactoringParams(ROOT + 'projects/test/m1/', ROOT + 'ext/module1/', 'move', function(i_params) {
        // console.log('move m1:\n' + JSON.stringify(i_params, undefined, 2));
        handler.performRefactoring(ROOT + 'projects/test/m1/', ROOT + 'ext/module1/', 'move', i_params.checksum, function(i_result) {
          i_passed('moved m1:\n' + JSON.stringify(i_params, undefined, 2));
        }, function(i_exc) {
          i_failed('move m1: ' + i_exc);
        })
      }, function(i_exc) {
        i_failed('move m1: ' + i_exc);
      })
    });
    // copy module1
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:move root');
      handler.getRefactoringParams(ROOT + 'ext/module1/', ROOT + 'ext/module1_copy/', 'copy', function(i_params) {
        // console.log('copy m1:\n' + JSON.stringify(i_params, undefined, 2));
        handler.performRefactoring(ROOT + 'ext/module1/', ROOT + 'ext/module1_copy/', 'copy', i_params.checksum, function(i_result) {
          i_passed('copied m1:\n' + JSON.stringify(i_params, undefined, 2));
        }, function(i_exc) {
          i_failed('copy m1: ' + i_exc);
        })
      }, function(i_exc) {
        i_failed('copy m1: ' + i_exc);
      })
    });
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:clear debug data');
      var id = SOURCE + 'lib/base/number.j';
      handler.getRefactoringParams(id, undefined, 'delete', function(i_params) {
        handler.performRefactoring(id, undefined, 'delete', i_params.checksum, function(i_result) {
          i_passed('deleted debug data: ' + JSON.stringify(i_params, undefined, 2));
        }, function(i_exc) {
          i_failed('CANNOT DELETE: EXCEPTION: ' + i_exc);
        })
      }, function(i_exc) {
        i_failed('CANNOT DELETE: EXCEPTION: ' + JSON.stringify(i_exc));
      })
    });
    // tree
    var path = false;
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:root_nodes');
      handler.getTreeChildNodes('$', function(i_nodes) {
        path = i_nodes[0].path;
        i_passed('root nodes: ' + jsonfx.stringify(i_nodes, true));
      }, function(i_exc) {
        i_failed('EXCEPTION: ' + JSON.stringify(i_exc));
      })
    });
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:child_nodes');
      handler.getTreeChildNodes(path, function(i_nodes) {
        i_passed('child nodes: ' + jsonfx.stringify(i_nodes, true));
      }, function(i_exc) {
        i_failed('EXCEPTION: ' + JSON.stringify(i_exc));
      })
    });
    // get all languages of label with includes
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:multilanguage_included');
      handler.getObject(SOURCE + 'm3/data.l', undefined, ContentManager.INCLUDE, function(i_result) {
        i_passed('child nodes: ' + jsonfx.stringify(i_result, true));
      }, function(i_exc) {
        i_failed('EXCEPTION: ' + JSON.stringify(i_exc));
      })
    });
    // update
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:modify_label');
      var id = SOURCE + 'm3/data.l';
      handler.getObject(id, undefined, ContentManager.RAW, function(i_label) {
        i_label.es = null;
        handler.getModificationParams(id, undefined, i_label, function(i_params) {
          // console.log('>>> modify label params:\n' +
          // jsonfx.stringify(i_params, true));
          handler.setObject(id, undefined, i_label, i_params.checksum, function() {
            handler.getObject(id, undefined, ContentManager.RAW, function(i_lab) {
              // console.log('>>> modify label values orig:\n' +
              // jsonfx.stringify(i_label, true) + '\nnew:\n' +
              // jsonfx.stringify(i_lab, true));
              if (Utilities.equals(i_label, i_lab)) {
                i_passed('modified');
              }
              else {
                i_failed('not modified');
              }
            }, i_failed);
          }, i_failed);
        }, i_failed);
      }, i_failed);
    });
    // exists
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:exists_pass');
      handler.exists(SOURCE + 'm3/data.l', function(i_result) {
        if (i_result === true) {
          i_passed('exists');
        }
        else {
          i_failed('should exists but does not');
        }
      }, function(i_exc) {
        i_failed('EXCEPTION: ' + JSON.stringify(i_exc));
      })
    });
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:exists_fail');
      handler.exists(SOURCE + 'm3/da_ta.l', function(i_result) {
        if (i_result === false) {
          i_passed('not exists');
        }
        else {
          i_failed('should not exists but does');
        }
      }, function(i_exc) {
        i_failed('EXCEPTION: ' + JSON.stringify(i_exc));
      })
    });
    // CHECKSUM
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:checksum-htm');
      handler.getChecksum(SOURCE + 'm2/data.h', function(i_result) {
        if (i_result === 'c730898bcc1becd1f56b7f03b4ada20e') {
          i_passed('checksum valid');
        }
        else {
          i_failed('checksum invalid');
        }
      }, function(i_exc) {
        i_failed('EXCEPTION: ' + JSON.stringify(i_exc));
      })
    });
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:checksum-jso');
      handler.getChecksum(SOURCE + 'm2/data.j', function(i_result) {
        if (i_result === 'd29a07b204953257995b3f0e3064fc06') {
          i_passed('checksum valid');
        }
        else {
          i_failed('checksum invalid');
        }
      }, function(i_exc) {
        i_failed('EXCEPTION: ' + JSON.stringify(i_exc));
      })
    });
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:checksum-lab');
      handler.getChecksum(SOURCE + 'm2/data.l', function(i_result) {
        if (i_result === '613198ac463ee49e61701541f225f69a') {
          i_passed('checksum valid');
        }
        else {
          i_failed('checksum invalid');
        }
      }, function(i_exc) {
        i_failed('EXCEPTION: ' + JSON.stringify(i_exc));
      })
    });
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('ContentManager:checksum-txt');
      handler.getChecksum(SOURCE + 'm2/data.t', function(i_result) {
        if (i_result === '73ea7efdb553a1980b2b38f45ec56b76') {
          i_passed('checksum valid');
        }
        else {
          i_failed('checksum invalid');
        }
      }, function(i_exc) {
        i_failed('EXCEPTION: ' + JSON.stringify(i_exc));
      })
    });
    // //////////////////////////////////////////////////////////////////////////////////////
    // *** DELETE DEBUG DATA ***
    // //////////////////////////////////////////////////////////////////////////////////////

    if (s_delete_data_after_test) {
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('ContentManager:clear debug data');
        handler.getRefactoringParams(ROOT, undefined, 'delete', function(i_params) {
          handler.performRefactoring(ROOT, undefined, 'delete', i_params.checksum, function(i_result) {
            i_passed('deleted debug data: ' + JSON.stringify(i_params, undefined, 2));
          }, function(i_exc) {
            i_failed('CANNOT DELETE: EXCEPTION: ' + i_exc);
          })
        }, function(i_exc) {
          i_failed('CANNOT DELETE: EXCEPTION: ' + JSON.stringify(i_exc));
        })
      });
    }
  };

  if (typeof require === 'function') {
    module.exports = exp;
  }
  else {
    window.testContentManager = exp;
  }
}());
