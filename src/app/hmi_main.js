(function () {
  "use strict";

  // polyfill for requestAnimationFrame (by Opera engineer Erik M�ller)
  (function () {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function (i_callback, i_element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function () {
          i_callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function (i_id) {
        clearTimeout(i_id);
      };
    }
  }());
  // create 'hmi' environment object
  var hmi = {};
  // debug brakeports
  hmi.debug_breakpoint = window.debug_breakpoint;
  // here we add our libraries
  hmi.lib = {};
  // load math
  hmi.lib.math = window.math;
  hmi.lib.jsonfx = window.jsonfx;
  hmi.lib.exec = window.Executor;
  hmi.lib.regex = window.Regex;
  // here all droppables will be stored
  hmi.droppables = {};

  // add hmi-object-framweork
  var hmi_object = window.hmi_object;
  hmi.create = function (i_object, i_jqueryElement, i_success, i_error, i_initData) {
    hmi_object.create(i_object, i_jqueryElement, i_success, i_error, hmi, i_initData);
  };
  hmi.destroy = hmi_object.destroy;
  hmi.showPopup = function (i_config, i_success, i_error) {
    hmi_object.showPopup(hmi, i_config, i_success, i_error);
  };
  hmi.showDefaultConfirmationPopup = function (i_config, i_success, i_error) {
    hmi_object.showDefaultConfirmationPopup(hmi, i_config, i_success, i_error);
  };
  // all static files have been loaded and now we create the hmi.
  $(document).ready(function () {
    var main = [];
    main.parallel = false;
    // load client config
    var config = false;
    main.push(function (i_success, i_error) {
      $.ajax({
        type: 'POST',
        url: '/get_client_config',
        contentType: 'application/json;charset=utf-8',
        data: '',
        dataType: 'text',
        success: function (i_config) {
          config = jsonfx.parse(i_config, false, true);
          i_success();
        },
        error: i_error,
        timeout: 10000
      });
    });
    // prepare content management system
    main.push(function (i_success, i_error) {
      if (config.cms_with_sql_proxy || (config.test_enabled && config.test_with_sql_proxy)) {
        $.ajax({
          type: 'POST',
          url: '/get_db_config',
          contentType: 'application/json;charset=utf-8',
          data: '',
          dataType: 'text',
          success: function (i_config) {
            var sqlHelper = new SqlHelper('/debug_sql_server');
            hmi.cms = new ContentManager(sqlHelper.createAdapter, jsonfx.parse(i_config, false, true));
            i_success();
          },
          error: i_error,
          timeout: 10000
        });
      }
      else {
        hmi.cms = new ContentManager.Proxy(i_success, i_error);
      }
    });
    main.push(function (i_success, i_error) {
      var languages = hmi.cms.getLanguages();
      if (Array.isArray(languages) && languages.length > 0) {
        hmi.languages = languages;
        hmi.language = languages[0];
        i_success();
      }
      else {
        i_error('no languages available');
      }
    });
    main.push(function (i_success, i_error) {
      // TODO add task if required
      i_success();
    });
    // perform tests
    main.push(function (i_success, i_error) {
      if (config.test_enabled) {
        performTests(hmi, i_success, i_error);
      }
      else {
        i_success();
      }
    });
    main.push(function (i_success, i_error) {
      var raf_cycle = typeof config.raf_cycle === 'number' && config.raf_cycle > 0 ? config.raf_cycle : 60;
      var raf_idx = 0;
      var loop = function () {
        raf_idx++;
        if (raf_idx >= raf_cycle) {
          raf_idx = 0;
          hmi_object.refresh(new Date());
        }
        window.requestAnimationFrame(loop, document.body);
      };
      // start the loop
      window.requestAnimationFrame(loop, document.body);
      i_success();
    });
    // connect websocket
    if (false) {
      main.push(function (i_success, i_error) {
        var msg_socket = new WebSocket("ws://localhost:1234");
        console.log("Created new WebSocket " + JSON.stringify(msg_socket));
        msg_socket.onopen = function (i_event) {
          console.log("opened, now send message");
          msg_socket.send("hello server");
          console.log("send");
        };
        msg_socket.onmessage = function got_packet(i_message) {
          console.log("==>MESSAGE: " + i_message.data);
          if (i_message.data === "shutdown") {
            console.log("!!! RECEIVED SHUTDOWN !!!");
            msg_socket.close();
            console.log("closed");
          }
        };
        msg_socket.onclose = function (i_event) {
          console.log("==>CLOSED");
        };
        msg_socket.onError = function (i_event) {
          console.log("ERROR");
        };
        i_success();
      });
    }
    // load hmi
    Executor.run(main, function () {
      Object.seal(hmi);
      var body = $(document.body);
      body.empty();
      body.addClass('hmi-body');
      var object = getContentEditor(hmi);
      hmi.create(object, body, function () {
        console.log('hmijs started');
      }, function (i_exception) {
        console.error(i_exception);
      });
      body.on('unload', function () {
        if (clientHandler) {
          clientHandler.shutdown();
        }
        hmi.destroy(object, function () {
          console.log('hmijs stopped');
        }, function (i_exception) {
          console.error(i_exception);
        });
      });
    }, function (i_exception) {
      console.error(i_exception);
    });
  });
}());
