(function() {
  "use strict";
  
  var TestHandler = function (i_config) {
    var that = this;
    this._passed = false;
    var messages = [];
    this._messages = messages;
    this._message_prefix = '';
    var seq_ctrl = typeof require === 'function' ? require('./seq_ctrl.js') : window.seq_ctrl;
    var pipe = new seq_ctrl.Pipe({
      cycleMillis : i_config.watchdogTimeout,
      started : function() {
        messages.push('TestHandler: started');
      },
      stopped : function() {
        messages.push('');
        messages.push('TestHandler: ' + (that._passed ? 'PASSED :-)' : '!!! FAILED !!! :-('));
        i_config.callback(that._passed, messages.join('\n'));
        console.error(that._passed ? 'PASSED :-)' : '!!! FAILED !!! :-(');
      },
      running : function() {
        messages.push('TestHandler: running');
      },
      maxPendingCycles : 0,
      maxPendingCyclesReached : function() {
        messages.push('TestHandler: Max pending cycles reached');
        pipe.stop();
      },
      _maxTries : 1,
      _maxTriesReached : function() {
        messages.push('TestHandler: Max tries reached');
        pipe.stop();
      },
      errorCallingFunction : function(i_exception) {
        messages.push('EXCEPTION! TestHandler calling task: ' + i_exception);
        pipe.stop();
      }
    });
    this._pipe = pipe;
  };
  
  TestHandler.prototype = {
    addTest : function (i_test) {
      var that = this;
      this._pipe.add(function (i_success, i_error) {
        i_test(function (i_message) {
          var prefix = that._message_prefix;
          var msg = prefix ? prefix + ': ' : '';
          msg += 'SUCCESS ==> ';
          msg += i_message;
          that._messages.push(msg);
          i_success();
        }, function (i_message) {
          var prefix = that._message_prefix;
          var msg = prefix ? prefix + ': ' : '';
          msg += 'FAILED ==> ';
          msg += i_message;
          that._messages.push(msg);
          i_error();
        });
      });
    },
    setMessagePrefix : function (i_message_prefix) {
      this._message_prefix = i_message_prefix ? i_message_prefix : '';
    },
    complete : function () {
      var that = this;
      this._pipe.add(function (i_success, i_error) {
        that._passed = true;
        i_success();
        that._pipe.stop();
      });
    }
  };

  if (typeof require === 'function') {
    module.exports = TestHandler;
  }
  else {
    window.TestHandler = TestHandler;
  }
}());
