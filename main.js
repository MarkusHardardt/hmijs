(function () {
  "use strict";

  // debug
  var s_verbose_sql_queries = !true;

  // load configurations
  var main_config = require('./main_config.json');
  var db_access = require('./cfg/db_access.json');
  var db_config = require('./cfg/db_config.json');
  // load helper and handler
  var jsonfx = require('./src/util/jsonfx.js');
  var Executor = require('./src/util/Executor.js');
  var SqlHelper = require('./src/util/SqlHelper.js');
  var ContentManager = require('./src/cms/ContentManager.js');
  var WebServer = require('./src/util/WebServer.js');
  var AdsAdapter = require('./src/ads/ads_adapter.js');
  //  var DataHandler = require('./src/util/DataHandler.js');


  // here we store our init tasks
  var tasks = [];
  // create 'hmi' environment object
  var hmi = {};
  // here we add our libraries
  hmi.lib = {};
  // load math
  hmi.lib.math = require('./src/util/math.js');
  hmi.lib.jsonfx = jsonfx;
  hmi.lib.exec = Executor;
  hmi.lib.regex = require('./src/util/Regex.js');
  hmi.lib.sql = SqlHelper;
  // add hmi-object-framweork
  var hmi_object = require('./src/util/hmi_object.js');
  hmi.create = function (i_object, i_jqueryElement, i_success, i_error, i_initData) {
    hmi_object.create(i_object, i_jqueryElement, i_success, i_error, hmi, i_initData);
  };
  hmi.destroy = hmi_object.destroy;
  // create and init web server
  var webServer = new WebServer();
  var minimized = main_config.client.minimized === true;
  webServer.enableRandomFileId(minimized);
  webServer.setTitle('hmijs v0.2');
  webServer.addStaticDir('./images', 'images');
  webServer.prepareFavicon('images/favicon.ico');
  // for our browser we need js and css content - therefore we must add all
  // required files
  webServer.addStaticFile('./node_modules/jquery/dist/' + (minimized ? 'jquery.min.js' : 'jquery.js'));
  webServer.addStaticFile('./node_modules/jquery-ui-dist/' + (minimized ? 'jquery-ui.min.css' : 'jquery-ui.css'));
  webServer.addStaticFile('./node_modules/jquery-ui-dist/' + (minimized ? 'jquery-ui.min.js' : 'jquery-ui.js'));
  webServer.addStaticFile('./node_modules/datatables/media', minimized ? 'css/jquery.dataTables.min.css' : 'css/jquery.dataTables.css');
  webServer.addStaticFile('./node_modules/datatables/media', minimized ? 'js/jquery.dataTables.min.js' : 'js/jquery.dataTables.js');
  webServer.addStaticFile('./node_modules/jquery.fancytree/dist', minimized ? 'skin-lion/ui.fancytree.min.css' : 'skin-lion/ui.fancytree.css');
  webServer.addStaticFile('./node_modules/jquery.fancytree/dist/' + (minimized ? 'jquery.fancytree-all.min.js' : 'jquery.fancytree-all.js'));
  webServer.addStaticFile('./src/ext/jquery/jquery.ui.touch-punch.js');
  webServer.addStaticFile('./src/ext/jquery/jquery.transform2d.js');
  webServer.addStaticFile('./src/ext/jquery/ajaxblob.js');
  webServer.addStaticFile('./src/ext/jquery/layout-default-latest.css');
  webServer.addStaticFile('./src/ext/jquery/jquery.layout-latest.js');
  webServer.addStaticFile('./src/ext/jquery/dataTables.pageResize.min.js');
  webServer.addStaticFile('./src/ext/jquery/dataTables.scrollResize.min.js');
  webServer.addStaticFile('./src/ext/html2img/base64.js');
  webServer.addStaticFile('./src/ext/html2img/canvas2image.js');
  webServer.addStaticFile('./src/ext/html2img/html2canvas.min.js');
  webServer.addStaticFile('./src/ext/cryptojs/md5.js');
  // webServer.addStaticFile('./src/ext/cryptojs/core-min.js');
  // webServer.addStaticFile('./src/ext/cryptojs/enc-base64-min.js'); //
  webServer.addStaticFile('./node_modules/codemirror/lib/codemirror.css');
  webServer.addStaticFile('./node_modules/codemirror/lib/codemirror.js');
  webServer.addStaticFile('./node_modules/codemirror/mode/javascript/javascript.js');
  webServer.addStaticFile('./node_modules/codemirror/mode/xml/xml.js');
  webServer.addStaticFile('./node_modules/codemirror/addon/edit/matchbrackets.js');
  webServer.addStaticFile('./node_modules/codemirror/addon/edit/closebrackets.js');
  webServer.addStaticFile('./node_modules/codemirror/addon/search/search.js');
  webServer.addStaticFile('./node_modules/codemirror/addon/dialog/dialog.css');
  webServer.addStaticFile('./node_modules/codemirror/addon/dialog/dialog.js');
  webServer.addStaticFile('./node_modules/codemirror/addon/search/searchcursor.js');
  webServer.addStaticFile('./node_modules/codemirror/addon/search/match-highlighter.js');
  webServer.addStaticFile('./node_modules/codemirror/addon/hint/show-hint.css');
  webServer.addStaticFile('./node_modules/codemirror/addon/hint/show-hint.js');
  webServer.addStaticFile('./node_modules/codemirror/addon/hint/javascript-hint.js');
  webServer.addStaticFile('./node_modules/codemirror/addon/scroll/annotatescrollbar.js');
  webServer.addStaticFile('./node_modules/codemirror/addon/search/matchesonscrollbar.js');
  webServer.addStaticFile('./node_modules/codemirror/addon/search/matchesonscrollbar.css');
  webServer.addStaticFile('./src/ext/sprintf/' + (minimized ? 'sprintf.min.js' : 'sprintf.js'));
  webServer.addStaticFile('./src/ext/diff_match_patch/' + (minimized ? 'diff_match_patch.js' : 'diff_match_patch_uncompressed.js'));
  webServer.addStaticFile('./node_modules/file-saver/dist/' + (minimized ? 'FileSaver.min.js' : 'FileSaver.js'));
  webServer.addStaticFile('./src/debug/debug_breakpoint.js');
  webServer.addStaticFile('./src/util/Utilities.js');
  webServer.addStaticFile('./src/util/HashLists.js');
  webServer.addStaticFile('./src/util/TestHandler.js');
  webServer.addStaticFile('./src/util/Sorting.js');
  webServer.addStaticFile('./node_modules/js-beautify/js/lib/beautify.js');
  webServer.addStaticFile('./node_modules/js-beautify/js/lib/beautify-html.js');
  webServer.addStaticFile('./node_modules/js-beautify/js/lib/beautify-css.js');
  webServer.addStaticFile('./src/util/jsonfx.js');
  webServer.addStaticFile('./src/util/Executor.js');
  webServer.addStaticFile('./src/util/Regex.js');
  if (main_config.client.cms_with_sql_proxy || (main_config.client.test_enabled && main_config.client.test_with_sql_proxy)) {
    webServer.addStaticFile('./src/util/SqlHelper.js');
  }
  webServer.addStaticFile('./src/util/math.js');
  webServer.addStaticFile('./src/cms/ContentManager.js');
  webServer.addStaticFile('./src/util/ObjectPositionSystem.js');
  webServer.addStaticFile('./cfg/ui/hmi_styles.css');
  webServer.addStaticFile('./src/util/hmi_object.js');
  // deliver main config to client
  webServer.post('/get_client_config', function (i_request, i_response) {
    i_response.send(jsonfx.stringify(main_config.client, false));
  });

  // prepare content management system
  // we need the handler for database access
  var sqlHelper = new SqlHelper(db_access, s_verbose_sql_queries);
  // we directly replace our icon directory to make sure on server and client
  // (with debug proxy too) our icons will be available
  db_config.icon_dir = '/' + webServer.addStaticDir(db_config.icon_dir) + '/';
  db_config.jsonfx_pretty = main_config.jsonfx_pretty === true;
  hmi.cms = new ContentManager(sqlHelper.createAdapter, db_config);
  // we need access via ajax from clients
  webServer.post(ContentManager.GET_CONTENT_DATA_URL, function (i_request, i_response) {
    hmi.cms.handleRequest(i_request.body, function (i_result) {
      i_response.send(jsonfx.stringify(i_result, false));
    }, function (i_exception) {
      i_response.send(jsonfx.stringify(i_exception.toString(), false));
    });
  });
  // the tree control requests da via 'GET' so we handle those request
  // separately
  webServer.get(ContentManager.GET_CONTENT_TREE_NODES_URL, function (i_request, i_response) {
    hmi.cms.handleFancyTreeRequest(i_request.query.request, i_request.query.path, function (i_result) {
      i_response.send(jsonfx.stringify(i_result, false));
    }, function (i_exception) {
      i_response.send(jsonfx.stringify(i_exception.toString(), false));
    });
  });
  // ADS
  var adsAdapter = false, dataHandler = false, dataHandlerObject = false;
  if (main_config.server.ads) {
    tasks.push(function (i_success, i_error) {
      var nodeAds = require('node-ads');
      var cfg = require(main_config.server.ads);
      cfg.amsPortSource = 32906;
      adsAdapter = new AdsAdapter(nodeAds, cfg);
      adsAdapter.init(function () {
        console.log('connected via ads to: ' + JSON.stringify(cfg, undefined, 2));
        //dataHandler = new DataHandler(adsAdapter);
        /*
        dataHandlerObject = {
          type: 'handler',
          prepare: function (that, i_success, i_error) {
            console.log('handler prepare');
            i_success();
          },
          refresh: function (i_date) {
            dataHandler.refresh(i_date);
          },
          destroy: function (that, i_success, i_error) {
            console.log('handler destroy');
            i_success();
          }
        };*/
        //hmi.create(dataHandlerObject);
        // TODO remove next line
        //console.log(JSON.stringify(adsAdapter._roots, undefined, 2));
        if (false) {
          webServer.get(AdsAdapter.GET_TREE_NODES_URL, function (i_request, i_response) {
            adsAdapter.handleFancyTreeRequest(i_request.query.request, i_request.query.path, function (i_result) {
              i_response.send(jsonfx.stringify(i_result, false));
            }, function (i_exception) {
              i_response.send(jsonfx.stringify(i_exception.toString(), false));
            });
          });
        }
        if (false) {
          webServer.post('/read_ads_variable', function (i_request, i_response) {
            adsAdapter.read([i_request.body.path], function (i_result) {
              i_response.send(jsonfx.stringify(i_result, false));
            }, function (i_exception) {
              i_response.send(jsonfx.stringify(i_exception.toString(), false));
            });
          });
        }
        if (false) {
          var WebSocket = require('ws');
          var webSocketServer = new WebSocket.Server({
            port: 1234
          });
          webSocketServer.on('connection', function connection(i_socket) {
            console.log('Verbindung von Client');
            i_socket.on('message', function (i_data) {
              console.log("Neue Nachricht: " + i_data);
              i_socket.send('Hello client');
              console.log("Beantworted:");
              setTimeout(function () {
                i_socket.send('shutdown');
                console.log("Send shutdown to client");
              }, 1000);
            });
            i_socket.on('close', function () {
              console.log("Client beendet Verbindung");
            });
          });
          adsAdapter.read(['GENERALCOMMANDS.I_HMI_QC_HEARTBEAT', 'MACHMANUALMODE.I_HEARTBEAT'], function (i_result) {
            console.log(JSON.stringify(i_result, undefined, 2));
          }, function (i_exception) {
            console.error(i_exception.toString());
          });
        }
        i_success();
      }, i_error);
    });
  }


  // build document
  var document_body = '';
  if (main_config.client.cms_with_sql_proxy || (main_config.client.test_enabled && main_config.client.test_with_sql_proxy)) {
    webServer.post('/get_db_config', function (i_request, i_response) {
      i_response.send(jsonfx.stringify(db_config, false));
    });
    document_body += '<script>';
    // we need next to load node.js module files to use it inside browser
    // without require()
    webServer.addStaticFile('./src/debug/node_js_and_browser_helper.js');
    // for debugging pursope we need our browser sql handler (evil!!!)
    document_body += '_debug_addAction(function () {window.exports = {};});';
    document_body += '_debug_loadFile("/' + webServer.addStaticDir('./node_modules/sqlstring/lib') + '/SqlString.js");';
    document_body += '_debug_addAction(function () {delete window.exports;});';
    document_body += '</script>';
    // enable sql access via proxy
    var s_proxy_id = 0, s_connections = {};
    // TODO: make sure this is never ever available in production mode !!!
    webServer.post('/debug_sql_server', function (i_request, i_response) {
      var body = i_request.body;
      if (body.connect == 'true') {
        console.log('DEBUG-SQL-PROXY: connect');
        sqlHelper.getConnection(function (i_connection) {
          var id = 'debug_sql_proxy_id_' + (s_proxy_id++);
          s_connections[id] = i_connection;
          i_response.send({
            id: id,
            config: db_config
          });
        }, function (i_exc) {
          i_response.send('EXCEPTION! cannot open mysql connection: ' + i_exc);
        });
      }
      else if (typeof body.query === 'string') {
        console.log('DEBUG-SQL-PROXY: ' + body.query);
        var connection = s_connections[body.id];
        if (connection) {
          connection.query(body.query, function (i_exception, i_results, i_fields) {
            if (i_exception) {
              i_response.send('EXCEPTION! caccon open mysql connection: ' + i_exception);
            }
            else {
              i_response.send(JSON.stringify(i_results));
            }
          });
        }
        else {
          i_response.send('EXCEPTION! No connection available!');
        }
      }
      else if (body.release == 'true') {
        console.log('DEBUG-SQL-PROXY: release');
        var connection = s_connections[body.id];
        if (connection) {
          connection.release();
          delete s_connections[body.id];
          i_response.send(body.id);
        }
        else {
          i_response.send('EXCEPTION: Cannot release connection!');
        }
      }
      else {
        console.log('DEBUG-SQL-PROXY: unexpected request: ' + JSON.stringify(body));
      }
    });
  }
  // test
  if (main_config.client.test_enabled) {
    // add some tests
    webServer.addStaticFile('./src/util/jsonfx_test.js');
    webServer.addStaticFile('./src/util/Executor_Test.js');
    webServer.addStaticFile('./src/util/seq_ctrl_test.js');
    webServer.addStaticFile('./src/util/Sorting_Test.js');
    webServer.addStaticFile('./src/cms/ContentManager_Test.js');

    // test ajax
    webServer.addStaticFile('./src/test/Ajax_Test.js');
    var testAjax = require('./src/test/Ajax_Test.js');
    testAjax(webServer);

    // and finally ...
    webServer.addStaticFile('./src/test/Test.js');
    // document_body += '<script>_debug_addAction(performTests);</script>';
  }

  var fn_add_files = function (i_file) {
    if (Array.isArray(i_file)) {
      for (var i = 0, l = i_file.length; i < l; i++) {
        fn_add_files(i_file[i]);
      }
    }
    else if (typeof i_file === 'string' && i_file.length > 0) {
      webServer.addStaticFile(i_file);
    }
  };
  fn_add_files(main_config.static_client_files);
  webServer.addStaticFile(main_config.touch ? main_config.scrollbar_hmi : main_config.scrollbar_config);
  // TODO only in config mode
  webServer.addStaticFile('./src/cms/ContentEditor.js');
  // add the final static file: our hmi main loader
  webServer.addStaticFile('./src/app/hmi_main.js');

  webServer.setBody(document_body);

  if (main_config.server.test_enabled) {
    tasks.push(function (i_success, i_error) {
      var performTests = require('./src/test/Test.js');
      performTests(hmi, i_success, i_error);
    });
  }
  tasks.push(function (i_success, i_error) {
    if (typeof main_config.server.cycle_millis === 'number' && main_config.server.cycle_millis > 0) {
      setInterval(function () {
        hmi_object.refresh(new Date());
      }, main_config.server.cycle_millis);
      i_success();
    }
    else {
      i_error('Invalid cycle millis');
    }
  });
  // finally ...
  Executor.run(tasks, function () {
    Object.seal(hmi);
    // start server if required
    if (typeof main_config.server.web_server_port === 'number') {
      webServer.listen(main_config.server.web_server_port, function () {
        console.log('hmijs web server listening on port: ' + main_config.server.web_server_port);
      });
    }
  }, function (i_exc) {
    console.error(i_exc);
  });
}());
