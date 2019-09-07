(function() {
  "use strict";

  var test_config = {
    enable : true,
    tests : {
      simple : true,
      arrays : true,
      objects : true,
      functions : true
    }
  };
  
  // store for performance reasons
  var Utilities = typeof require === 'function' ? require('./Utilities.js') : window.Utilities;
  var jsonfx = typeof require === 'function' ? require('./jsonfx.js') : window.jsonfx;
  
  var exp = function(i_handler) {
    if (!test_config.enable) {
      return;
    }
    if (test_config.tests.simple) {
      // boolean true
      i_handler.addTest(function (i_passed, i_failed) {
        i_handler.setMessagePrefix('jsonfx');
        if (jsonfx.parse(jsonfx.stringify(true), false, true) === true) {
          i_passed('compact-mode boolean true');
        } else {
          i_failed('compact-mode boolean true');
        }
      });
      i_handler.addTest(function (i_passed, i_failed) {
        if (jsonfx.parse(jsonfx.stringify(true, true), true, true) === true) {
          i_passed('pretty-mode boolean true');
        } else {
          i_failed('pretty-mode boolean true');
        }
      });
      // boolean false
      i_handler.addTest(function (i_passed, i_failed) {
        if (jsonfx.parse(jsonfx.stringify(false), false, true) === false) {
          i_passed('compact-mode boolean false');
        } else {
          i_failed('compact-mode boolean false');
        }
      });
      i_handler.addTest(function (i_passed, i_failed) {
        if (jsonfx.parse(jsonfx.stringify(false, true), true, true) === false) {
          i_passed('pretty-mode boolean false');
        } else {
          i_failed('pretty-mode boolean false');
        }
      });
      // number
      i_handler.addTest(function (i_passed, i_failed) {
        if (jsonfx.parse(jsonfx.stringify(42), false, true) === 42) {
          i_passed('compact-mode number');
        } else {
          i_failed('compact-mode number');
        }
      });
      i_handler.addTest(function (i_passed, i_failed) {
        if (jsonfx.parse(jsonfx.stringify(42, true), true, true) === 42) {
          i_passed('pretty-mode number');
        } else {
          i_failed('pretty-mode number');
        }
      });
      // string
      i_handler.addTest(function (i_passed, i_failed) {
        if (jsonfx.parse(jsonfx.stringify('test string'), false, true) === 'test string') {
          i_passed('compact-mode string');
        } else {
          i_failed('compact-mode string');
        }
      });
      i_handler.addTest(function (i_passed, i_failed) {
        if (jsonfx.parse(jsonfx.stringify('test string', true), true, true) === 'test string') {
          i_passed('pretty-mode string');
        } else {
          i_failed('pretty-mode string');
        }
      });
    }
    if (test_config.tests.arrays) {
      // array
      i_handler.addTest(function (i_passed, i_failed) {
        var a1 = [true, false, 1.234, 42, 'test', {}, [], function () {}];
        var a2 = jsonfx.parse(jsonfx.stringify(a1), false, true);
        if (Utilities.equals(a1, a2)) {
          i_passed('compact-mode array');
        } else {
          i_failed('compact-mode array');
        }
      });
      i_handler.addTest(function (i_passed, i_failed) {
        var a1 = [true, false, 1.234, 42, 'test', {}, [], function () {}];
        var a2 = jsonfx.parse(jsonfx.stringify(a1, true), true, true);
        if (Utilities.equals(a1, a2)) {
          i_passed('pretty-mode array');
        } else {
          i_failed('pretty-mode array');
        }
      });
    }
    if (test_config.tests.objects) {
      // object
      i_handler.addTest(function (i_passed, i_failed) {
        var o1 = {
          b1 : true, 
          b2 : false, 
          n1 : 1.234,
          n2 : 42, 
          s : 'test', 
          o1 : {}, 
          a : [], 
          f : function () {}
        };
        var o2 = jsonfx.parse(jsonfx.stringify(o1), false, true);
        if (Utilities.equals(o1, o2)) {
          i_passed('compact-mode object');
        } else {
          i_failed('compact-mode object');
        }
      });
      i_handler.addTest(function (i_passed, i_failed) {
        var o1 = {
          b1 : true, 
          b2 : false, 
          n1 : 1.234,
          n2 : 42, 
          s : 'test', 
          o1 : {}, 
          a : [], 
          f : function () {}
        };
        var o2 = jsonfx.parse(jsonfx.stringify(o1, true), true, true);
        if (Utilities.equals(o1, o2)) {
          i_passed('pretty-mode object');
        } else {
          i_failed('pretty-mode object');
        }
      });
    }
    if (test_config.tests.functions) {
      // function
      i_handler.addTest(function (i_passed, i_failed) {
        var f1 = function () { console.log('TEST'); };
        var f2 = jsonfx.parse(jsonfx.stringify(f1), false, true);
        if (Utilities.equals(f1, f2)) {
          i_passed('compact-mode function (only type but no source code checked)');
        } else {
          i_failed('compact-mode function (only type but no source code checked)');
        }
      });
      i_handler.addTest(function (i_passed, i_failed) {
        var f1 = function () { console.log('TEST'); };
        var f2 = jsonfx.parse(jsonfx.stringify(f1, true), true, true);
        if (Utilities.equals(f1, f2)) {
          i_passed('pretty-mode function (only type but no source code checked)');
        } else {
          i_failed('pretty-mode function (only type but no source code checked)');
        }
      });
    }
  };
  
  if (typeof require === 'function') {
    module.exports = exp;
  }
  else {
    window._test_jsonfx = exp;
  }
}());