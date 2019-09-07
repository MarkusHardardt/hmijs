(function() {
  "use strict";

  var enable = {
      run : true,
      pipe : true,
      decouple : true,
      promise : true,
      unstress : true
  };
  
  var MANY = 10000;

  var Executor = typeof require === 'function' ? require('./Executor.js') : window.Executor;

  var test_decoupler = function(i_time1, i_time2, i_trigger, i_duration, i_tolerance, i_passed, i_failed) {
    var start = new Date().getTime(), times = [];
    var run = Executor.decouple(function() {
      times.push(new Date().getTime() - start);
    }, i_time1, i_time2);
    run();
    var interval = setInterval(function() {
      run();
      var now = new Date().getTime();
      if (now >= start + i_duration) {
        clearInterval(interval);
        var offset = i_time1 && i_time2 ? i_time1 : 0;
        var duration = i_time1 && i_time2 ? i_time2 : i_time1;
        for (var i = 0, l = times.length; i < l; i++) {
          var dt = Math.abs(times[i] - offset - i * duration);
          if (dt > i_tolerance) {
            i_failed('call ' + i + ' out of sequence: ' + JSON.stringify(times));
            return;
          }
        }
        i_passed('sequence ok');
      }
    }, i_trigger);
  };

  var test = function(i_handler) {
    // //////////////////////////////////////////////////////////////////////////////////
    // Executor.run
    // //////////////////////////////////////////////////////////////////////////////////
    if (enable.run) {
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.parallel.number');
        var sequence = [], start = new Date().getTime();
        for (var i = 0; i < 20; i++) {
          sequence.push(function(i_success, i_error) {
            setTimeout(function() {
              i_success(new Date().getTime() - start);
            }, 50);
          });
        }
        sequence.parallel = 5;
        Executor.run(sequence, function(i_results) {
          for (var i = 0; i < 20; i++) {
            var act = i_results[i], nom = (Math.floor(i / 5) + 1) * 50, err = nom - act;
            if (Math.abs(err) > 20) {
              i_failed('array with 20 functions parallel = 5: ' + err + 'ms, idx: ' + i + ', durations: ' + JSON.stringify(i_results));
              return;
            }
          }
          i_passed('array with 20 functions parallel = 5');
        }, i_failed);
      });
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.run.outer_inner_cbs');
        // if we got an outer and an inner i_success/i_error callback we may use
        // the same function names
        var debug_func = function(i_success, i_error) {
          Executor.run([ function(i_success, i_error) {
            // here we use the functions passed as arguments of our anonymous
            // task
            // function one line above
            i_success('called inner success');
          } ], function(i_suc) {
            // here we use the success-callback passed as arguments of our
            // debug_func
            i_success('exec: ' + i_suc);
          }, function(i_err) {
            // here we use the error-callback passed as arguments of our
            // debug_func
            i_error('exec: ' + i_err);
          });
        };
        debug_func(i_passed, i_failed);
      });
      // in this run - success
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.run');
        var tasks = [];
        for (var i = 0; i < 10; i++) {
          tasks.push(function(i_success, i_error) {
            // call immediately
            i_success();
          });
        }
        var this_call = true;
        tasks.parallel = true;
        Executor.run(tasks, function() {
          if (this_call) {
            i_passed('called success-callback during this run');
          }
          else {
            i_failed('called success-callback after this run');
          }
        }, i_failed);
        this_call = false;
      });
      // in this run - error
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.run');
        var tasks = [], cnt = 0;
        for (var i = 0; i < 10; i++) {
          tasks.push(function(i_success, i_error) {
            cnt++;
            if (cnt === 7) {
              // call immediately
              i_error();
            }
          });
        }
        var this_call = true;
        tasks.parallel = true;
        Executor.run(tasks, i_failed, function() {
          if (this_call) {
            i_passed('called error-callback during this run');
          }
          else {
            i_failed('called error-callback after this run');
          }
        });
        this_call = false;
      });
      // simple function call
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.run');
        Executor.run(function(i_success, i_error) {
          i_success('called success');
        }, function() {
          i_passed('called success');
        }, i_failed);
      });
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.run');
        Executor.run(function(i_success, i_error) {
          i_error('called error');
        }, i_failed, i_passed);
      });
      // empty sequence call
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.run');
        Executor.run([], function() {
          i_passed('empty array serial');
        }, i_failed);
      });
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.run');
        var tasks = [];
        tasks.parallel = true;
        Executor.run(tasks, function() {
          i_passed('empty array parallel');
        }, i_failed);
      });
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.run');
        var sequence = [ function(i_success, i_error) {
          setTimeout(i_success, 10);
        } ];
        Executor.run(sequence, function() {
          i_passed('array with single function');
        }, i_failed);
      });
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.run');
        var sequence = [];
        for (var i = 0; i < 10; i++) {
          sequence.push(function(i_success, i_error) {
            setTimeout(i_success, Math.ceil(10 + 10 * Math.random()));
          });
        }
        Executor.run(sequence, function() {
          i_passed('array with 10 functions serial');
        }, i_failed);
      });
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.run');
        var sequence = [];
        for (var i = 0; i < 10; i++) {
          sequence.push(function(i_success, i_error) {
            setTimeout(i_success, Math.ceil(10 + 10 * Math.random()));
          });
        }
        sequence.parallel = true;
        Executor.run(sequence, function() {
          i_passed('array with 10 functions parallel');
        }, i_failed);
      });
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.run');
        var sequence = [ true ];
        for (var i = 0; i < 10; i++) {
          sequence.push(function(i_success, i_error) {
            setTimeout(i_success, Math.ceil(10 + 10 * Math.random()));
          });
        }
        Executor.run(sequence, function() {
          i_passed('array with 10 functions parallel initialized via boolean');
        }, i_failed);
      });
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.run');
        var sequence = [];
        for (var i = 0; i < 10; i++) {
          (function() {
            var seq = i;
            sequence.push(function(i_success, i_error) {
              setTimeout(function() {
                // console.log('sequence: ' + seq);
                i_success();
              }, Math.ceil(4));
            })
          }());
        }
        Executor.run(sequence, function() {
          i_passed('array with 10 functions parallel delayed');
        }, i_failed);
      });
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.run');
        var sequence = [];
        for (var i = 0; i < 3; i++) {
          var subseq = [];
          for (var j = 0; j < 4; j++) {
            (function() {
              var seq = i, part = j;
              subseq.push(function(i_success, i_error) {
                setTimeout(function() {
                  i_success([ seq, part ]);
                }, Math.ceil(3 + 2 * Math.random()));
              });
            }());
          }
          subseq.parallel = true;
          sequence.push(subseq);
        }
        Executor.run(sequence, function(i_result) {
          i_passed('matrix with 3x4 functions');
        }, i_failed);
      });
      // timeouts
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.run');
        var sequence = [ function(i_success, i_error) {
          setTimeout(i_success, 100);
        } ];
        Executor.run(sequence, function() {
          i_failed('no timeout detected (too early response)');
        }, function() {
          i_passed('timeout detected -> error callback');
        }, 10);
      });
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.run');
        var sequence = [ function(i_success, i_error) {
          setTimeout(i_success, 100);
        } ];
        Executor.run(sequence, function() {
          i_failed('no timeout detected (too early response)');
        }, function() {
          i_failed('wrong error callback');
        }, function() {
          i_passed('timeout detected -> timeout callback before millis');
        }, 10);
      });
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.run');
        var sequence = [ function(i_success, i_error) {
          setTimeout(i_success, 100);
        } ];
        Executor.run(sequence, function() {
          i_failed('no timeout detected (too early response)');
        }, function() {
          i_failed('wrong error callback');
        }, 10, function() {
          i_passed('timeout detected -> timeout callback after millis');
        });
      });
      // may immediate successes
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.run-many');
        var tasks = [];
        for (var i = 0; i < MANY; i++) {
          tasks.push(function(i_success, i_error) {
            // call immediately
            i_success();
          });
        }
        var this_call = true;
        tasks.parallel = true;
        Executor.run(tasks, function() {
          if (this_call) {
            i_passed('called success-callback during this run');
          }
          else {
            i_failed('called success-callback after this run');
          }
        }, i_failed);
        this_call = false;
      });

      
    }
    // //////////////////////////////////////////////////////////////////////////////////
    // Executor.pipe
    // //////////////////////////////////////////////////////////////////////////////////
    if (enable.pipe) {
      // pipe on this run - success immediately
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.pipe');
        var pipe = Executor.pipe(i_failed);
        var this_call = true;
        pipe(function(i_success, i_error) {
          if (this_call) {
            i_passed('called pipe on this call');
          }
          else {
            i_failed('called pipe after this call');
          }
        });
        this_call = false;
      });
      // pipe on this run with many jobs - success immediately
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.pipe');
        var pipe = Executor.pipe(i_failed);
        pipe(function(i_success, i_error) {
          setTimeout(i_success, 0);
        });
        for (var i = 0; i < MANY; i++) {
          pipe(function(i_success, i_error) {
            i_success();
          });
        }
        pipe(function(i_success, i_error) {
          i_success();
          i_passed('pipe called many times on this call');
        });
      });
      // pipe on this run - success immediately
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.pipe');
        var pipe = Executor.pipe();
        var this_call = true;
        pipe(function(i_success, i_error) {
          // call immediately
          i_success();
          this_call = false;
        });
        pipe(function(i_success, i_error) {
          if (this_call) {
            i_failed('called pipe next on this run');
          }
          else {
            i_passed('called pipe next after this run');
          }
        });
      });
      // pipe sequence
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.pipe');
        var pipe = Executor.pipe(i_failed), index = 0, count = 10;
        for (var i = 0; i < count; i++) {
          (function() {
            var idx = i;
            pipe(function(i_success, i_error) {
              if (idx === index) {
                index++;
                i_success();
              }
              else {
                i_error('invalid index: ' + index);
              }
            });
          }());
        }
        pipe(function(i_success, i_error) {
          i_success();
          i_passed('all calls at specified index');
        });
      });
      // timeout
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.pipe:error_on_timeout');
        var done = false, timeout = setTimeout(function() {
          if (!done) {
            done = true;
            i_failed('no tiemout');
          }
        }, 100);
        var pipe = Executor.pipe(function(i_exception) {
          done = true;
          i_passed('error on "' + i_exception + '"');
        }, 50);
        pipe(function(i_success, i_error) {
          // nop
        });
      });
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.pipe:separate_callback_on_timeout');
        var done = false, timeout = setTimeout(function() {
          if (!done) {
            done = true;
            i_failed('no tiemout');
          }
        }, 100);
        var pipe = Executor.pipe(function() {
          if (!done) {
            done = true;
            i_failed('called error function instead of separate callback');
          }
        }, function(i_exception) {
          done = true;
          i_passed('callback on "' + i_exception + '"');
        }, 50);
        pipe(function(i_success, i_error) {
          // nop
        });
      });

      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.pipe:separate_other_callback_on_timeout');
        var done = false, timeout = setTimeout(function() {
          if (!done) {
            done = true;
            i_failed('no tiemout');
          }
        }, 100);
        var pipe = Executor.pipe(function() {
          if (!done) {
            done = true;
            i_failed('called error function instead of separate callback');
          }
        }, 50, function(i_exception) {
          done = true;
          i_passed('other callback on "' + i_exception + '"');
        });
        pipe(function(i_success, i_error) {
          // nop
        });
      });
    }
    // //////////////////////////////////////////////////////////////////////////////////
    // Executor.decouple
    // //////////////////////////////////////////////////////////////////////////////////
    if (enable.decouple) {
      // decouple: (i_time1, i_time2, i_trigger, i_duration, i_tolerance,
      // i_passed, i_failed)
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.decouple');
        test_decoupler(100, undefined, 5, 250, 10, i_passed, i_failed);
      });
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.decouple');
        test_decoupler(50, 100, 5, 300, 10, i_passed, i_failed);
      });
    }
    // //////////////////////////////////////////////////////////////////////////////////
    // Executor.unstress
    // //////////////////////////////////////////////////////////////////////////////////
    if (enable.unstress) {
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.unstress:shots');
        var unstress = Executor.unstress(function(i_exception) {
          i_failed(i_exception.toString());
        });
        var shots = [], idx = 0, max = 25;
        var interval = setInterval(function() {
          if (idx < max) {
            idx++;
            unstress(function(i_success, i_error) {
              shots.push(idx);
              setTimeout(i_success, 200);
            });
          }
          else {
            clearInterval(interval);
            setTimeout(function() {
              if (shots.length === 4) {
                i_passed('4 shots');
              }
              else {
                i_failed(JSON.stringify(shots));
              }
            }, 300);
          }
        }, 20);
      });

      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.unstress:error');
        var unstress = Executor.unstress(function(i_message) {
          i_passed(i_message);
        });
        var shots = [], idx = 0, max = 25;
        var interval = setInterval(function() {
          if (idx < max) {
            idx++;
            unstress(function(i_success, i_error) {
              shots.push(idx);
              setTimeout(function() {
                i_error('called error');
              }, 200);
            });
          }
          else {
            clearInterval(interval);
            setTimeout(function() {
              i_failed(JSON.stringify(shots));
            }, 300);
          }
        }, 20);
      });

      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.unstress:exception');
        var unstress = Executor.unstress(function(i_exception) {
          i_passed(i_exception.toString());
        });
        unstress(function(i_success, i_error) {
          throw new Error('throwed exception');
        });
      });

      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('unstress:error_on_timeout');
        var done = false, timeout = setTimeout(function() {
          if (!done) {
            done = true;
            i_failed('no tiemout');
          }
        }, 100);
        var unstress = Executor.unstress(function(i_exception) {
          done = true;
          i_passed('error on "' + i_exception + '"');
        }, 50);
        unstress(function(i_success, i_error) {
          // nop
        });
      });

      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.unstress:separate_callback_on_timeout');
        var done = false, timeout = setTimeout(function() {
          if (!done) {
            done = true;
            i_failed('no tiemout');
          }
        }, 100);
        var unstress = Executor.unstress(function() {
          if (!done) {
            done = true;
            i_failed('called error function instead of separate callback');
          }
        }, function(i_exception) {
          done = true;
          i_passed('callback on "' + i_exception + '"');
        }, 50);
        unstress(function(i_success, i_error) {
          // nop
        });
      });

      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('Executor.unstress:separate_other_callback_on_timeout');
        var done = false, timeout = setTimeout(function() {
          if (!done) {
            done = true;
            i_failed('no tiemout');
          }
        }, 100);
        var unstress = Executor.unstress(function() {
          if (!done) {
            done = true;
            i_failed('called error function instead of separate callback');
          }
        }, 50, function(i_exception) {
          done = true;
          i_passed('other callback on "' + i_exception + '"');
        });
        unstress(function(i_success, i_error) {
          // nop
        });
      });
    }
    // //////////////////////////////////////////////////////////////////////////////////
    // promise (not Executor stuff but tested here anyway)
    // //////////////////////////////////////////////////////////////////////////////////
    if (enable.promise) {
      // promise resolve
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('promise:resolve');
        var promise = new Promise(function(i_resolve, i_reject) {
          setTimeout(function() {
            i_resolve('done');
          }, 10);
        });
        promise.then(function(i_data) {
          i_passed(i_data);
        }, function(i_data) {
          i_failed(i_data);
        });
      });

      // promise reject
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('promise:reject');
        var promise = new Promise(function(i_resolve, i_reject) {
          setTimeout(function() {
            i_reject(new Error('error'));
          }, 10);
        });
        promise.then(function(i_data) {
          i_failed(i_data);
        }, function(i_data) {
          i_passed(i_data);
        });
      });

      // promise resolve
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('promise:then');
        var promise = new Promise(function(i_resolve, i_reject) {
          setTimeout(function() {
            i_resolve('done');
          }, 10);
        });

        promise.then(function(i_data) {
          i_passed(i_data);
        })['catch'](function(i_data) {
          i_failed(i_data);
        });
      });
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('promise:catch');
        var promise = new Promise(function(i_resolve, i_reject) {
          setTimeout(function() {
            i_reject(new Error('error'));
          }, 10);
        });
        promise.then(function(i_data) {
          i_failed(i_data);
        })['catch'](function(i_data) {
          i_passed(i_data);
        });
      });
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('promise:wrapper');
        var timeout = function(i_delay) {
          return new Promise(function(i_resolve, i_reject) {
            setTimeout(i_resolve, i_delay);
          });
        };
        timeout(10).then(function() {
          i_passed('wrapped');
        });
      });
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('promise:chained');
        var array = [], timeout = function(i_delay) {
          return new Promise(function(i_resolve, i_reject) {
            setTimeout(i_resolve, i_delay);
          });
        };
        timeout(10).then(function() {
          array.push(0);
          return timeout(10);
        }).then(function() {
          array.push(1);
          return timeout(10);
        }).then(function() {
          array.push(2);
          return timeout(10);
        }).then(function() {
          array.push(3);
          return timeout(10);
        }).then(function() {
          array.push(4);
          i_passed(JSON.stringify(array));
        });
      });
      i_handler.addTest(function(i_passed, i_failed) {
        i_handler.setMessagePrefix('promise:wrapper');
        var action = function(i_resolve, i_reject) {
          setTimeout(function() {
            i_resolve(42);
          }, 10);
        };
        // Parallel
        return Promise.all([ action, action, action, ]).then(function(i_results) {
          i_passed(JSON.stringify(i_results));
        });
      });
    }
  };

  if (typeof require === 'function') {
    module.exports = test;
  }
  else {
    window.testExecutor = test;
  }
}());
