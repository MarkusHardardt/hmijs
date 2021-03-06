(function() {
  "use strict";

  var exec = function(i_object, i_success, i_error, i_timeout, i_millis) {
    if (typeof i_object === 'function') {
      var done = false, timeout = false;
      try {
        var this_call = true, success, result, error, exception;
        // call safely ...
        i_object(function(i_result) {
          // on success:
          if (!done) {
            done = true;
            if (timeout) {
              clearTimeout(timeout);
            }
            if (this_call) {
              success = true;
              result = i_result;
            }
            else {
              i_success(i_result);
            }
          }
        }, function(i_exception) {
          // on error:
          if (!done) {
            done = true;
            if (timeout) {
              clearTimeout(timeout);
            }
            if (this_call) {
              error = true;
              exception = i_exception;
            }
            else {
              i_error(i_exception);
            }
          }
        });
        this_call = false;
        if (error) {
          i_error(exception);
        }
        else if (success) {
          i_success(result);
        }
        // start watchdog only if required
        else if (i_millis && i_timeout) {
          timeout = setTimeout(function() {
            if (!done) {
              done = true;
              i_timeout(i_object);
            }
          }, Math.ceil(i_millis));
        }
      }
      catch (exc) {
        done = true;
        i_error(exc);
      }
    }
    else if (Array.isArray(i_object)) {
      // There are several ways to configure the serial / parallel behavior of
      // this mechanism. So at first we try to resolve how many tasks may be
      // called together and what is our first task.
      var start = typeof i_object[0] === 'boolean' || typeof i_object[0] === 'number' ? 1 : 0, end = i_object.length, count = 1;
      if (i_object.parallel === true || i_object[0] === true) {
        count = end - start;
      }
      else if (typeof i_object.parallel === 'number' && i_object.parallel > 0) {
        count = Math.min(i_object.parallel, end - start);
      }
      else if (typeof i_object[0] === 'number' && i_object[0] > 0) {
        count = Math.min(i_object[0], end - start);
      }
      // We store our task states inside an array and by calling 'next()' we
      // either trigger the next task or our success callback.
      var states = [], results, done = false, next = function() {
        if (!done) {
          var t, this_call, success, error, exception;
          // First we loop over all tasks and trigger the next that has not been
          // already triggered.
          for (t = start; t < end; t++) {
            if (states[t] === undefined) {
              states[t] = false;
              this_call = true;
              success = false;
              error = false;
              exception = undefined;
              (function() {
                var task = t;
                exec(i_object[task], function(i_result) {
                  states[task] = true;
                  if (i_result !== undefined) {
                    if (results) {
                      results.push(i_result);
                    }
                    else {
                      results = [ i_result ];
                    }
                  }
                  if (this_call) {
                    success = true;
                  }
                  else {
                    next();
                  }
                }, function(i_exception) {
                  done = true;
                  if (this_call) {
                    error = true;
                    exception = i_exception;
                  }
                  else {
                    i_error(i_exception);
                  }
                }, i_timeout, i_millis);
              }());
              this_call = false;
              if (error) {
                i_error(exception);
                return;
              }
              else if (!success) {
                return;
              }
            }
          }
          // Reaching this point means that no more tasks have to be started. So
          // we check if any task has not succeeded so far.
          for (t = start; t < end; t++) {
            if (!states[t]) {
              return;
            }
          }
          // Reaching this point means that all tasks have succeeded. So we are
          // done.
          done = true;
          i_success(results);
        }
      };
      // Now we call our next function as often as allowed. But if no tasks
      // available at all we succeed.
      var t, e = start + count;
      if (start < e) {
        for (t = start; t < e; t++) {
          next();
        }
      }
      else {
        i_success();
      }
    }
    else {
      i_error('Cannot execute! Object is not a function and no array: ' + i_object);
    }
  };

  var exp = {
      run : function() {
        // init callbacks and helpers
        var ai, al = arguments.length, ar;
        var on_success = al > 1 && typeof arguments[1] === 'function' ? arguments[1] : false;
        var on_error = al > 2 && typeof arguments[2] === 'function' ? arguments[2] : false;
        var on_timeout = on_error, millis = false;
        for (ai = 3; ai < al; ai++) {
          ar = arguments[ai];
          if (on_timeout !== ar && typeof ar === 'function') {
            on_timeout = ar;
          }
          else if (!millis && typeof ar === 'number' && ar > 0) {
            millis = ar;
          }
        }
        var this_call = true, success, result, error, exception;
        exec(arguments[0], function(i_result) {
          if (this_call) {
            success = true;
            result = i_result;
          }
          else if (on_success) {
            on_success(i_result);
          }
        }, function(i_exception) {
          if (this_call) {
            error = true;
            exception = i_exception;
          }
          else if (on_error) {
            on_error(i_exception);
          }
          else {
            throw new Error('EXCEPTION! Cannot execute: ' + i_exception);
          }
        }, on_timeout, millis);
        this_call = false;
        if (error) {
          if (on_error) {
            on_error(exception);
          }
          else {
            throw new Error('EXCEPTION! Cannot execute: ' + exception);
          }
        }
        else if (success && on_success) {
          on_success(result);
        }
      },
      pipe : function() {
        // init callbacks and helpers
        var ai, al = arguments.length, ar;
        var on_error = al > 0 && typeof arguments[0] === 'function' ? arguments[0] : false;
        var on_timeout = on_error, timeout = false, millis = false;
        for (ai = 1; ai < al; ai++) {
          ar = arguments[ai];
          if (on_timeout !== ar && typeof ar === 'function') {
            on_timeout = ar;
          }
          else if (!millis && typeof ar === 'number' && ar > 0) {
            millis = ar;
          }
        }
        var tasks = [], running = false, run = function() {
          if (!running) {
            var task, this_call, success, error, exception;
            while (tasks.length > 0) {
              try {
                // get next task, remove from pipe and run task
                task = tasks[0]
                tasks.splice(0, 1);
                running = true;
                this_call = true;
                success = false;
                error = false;
                exception = undefined;
                task(function() {
                  // handle success callback only once and if still running
                  if (running) {
                    running = false;
                    if (this_call) {
                      success = true;
                    }
                    else if (tasks.length > 0) {
                      run();
                    }
                  }
                }, function(i_exception) {
                  // handle error callback only once and if still running
                  if (running) {
                    running = false;
                    tasks.splice(0, tasks.length);
                    if (this_call) {
                      error = true;
                      exception = i_exception;
                    }
                    else if (on_error) {
                      on_error(i_exception);
                    }
                    else {
                      console.error('ERROR! On performing task: ' + i_exception);
                    }
                  }
                });
                this_call = false;
                if (error) {
                  if (on_error) {
                    on_error(exception);
                  }
                  else {
                    console.error('ERROR! On performing task: ' + exception);
                  }
                  return;
                }
                else if (!success) {
                  if (millis && on_timeout) {
                    timeout = setTimeout(function() {
                      if (running) {
                        running = false;
                        tasks.splice(0, tasks.length);
                        if (on_timeout) {
                          on_timeout('timeout: ' + task.toString());
                        }
                      }
                    }, Math.ceil(millis));
                  }
                  return;
                }
              }
              catch (exc) {
                running = false;
                tasks.splice(0, tasks.length);
                if (on_error) {
                  on_error(exc);
                }
                else {
                  console.error('EXCEPTION! On performing task: ' + exc);
                }
                return;
              }
            }
          }
        };
        return function() {
          if (typeof arguments[0] === 'function') {
            tasks.push(arguments[0]);
            if (!running) {
              run();
            }
          }
        };
      },
      decouple : function() {
        // init callbacks and times
        var action = false, delay = false, millis = false, ai, al = arguments.length, ar;
        for (ai = 0; ai < al; ai++) {
          ar = arguments[ai];
          if (!action && typeof ar === 'function') {
            action = ar;
          }
          else if (!millis && typeof ar === 'number' && ar > 0) {
            millis = ar;
          }
          else if (!delay && typeof ar === 'number' && ar > 0) {
            if (ar > millis) {
              delay = millis;
              millis = ar;
            }
            else {
              delay = ar;
            }
          }
        }
        var perform = function() {
          try {
            action();
          }
          catch (exc) {
            console.error('EXCEPTION! Cannot perform minimum timeout action: ' + exc);
          }
        };
        var timeout = undefined, prev = undefined, trigger = function() {
          // we only perform if we are not already waiting in a timeout
          if (timeout === undefined) {
            var time = new Date().getTime();
            if (prev === undefined || time >= prev + millis) {
              // if first call or previous is the minimum time in the past we
              // perform immediately
              prev = time;
              perform();
            }
            else {
              // if previous call is too short in the past we wait until timeout
              timeout = setTimeout(function() {
                prev = new Date().getTime();
                timeout = undefined;
                perform();
              }, millis + prev - time);
            }
          }
        };
        var delay_timeout = undefined;
        return delay ? function() {
          if (delay_timeout === undefined) {
            delay_timeout = setTimeout(function() {
              delay_timeout = undefined;
              trigger();
            }, delay);
          }
        } : trigger;
      },
      unstress : function() {
        // init callbacks and helpers
        var ai, al = arguments.length, ar;
        var on_error = al > 0 && typeof arguments[0] === 'function' ? arguments[0] : false;
        var on_timeout = on_error, timeout = false, millis = false;
        for (ai = 1; ai < al; ai++) {
          ar = arguments[ai];
          if (on_timeout !== ar && typeof ar === 'function') {
            on_timeout = ar;
          }
          else if (!millis && typeof ar === 'number' && ar > 0) {
            millis = ar;
          }
        }
        // If not busy we change to busy and run the task.
        // On success, error or in case of an exception and if meanwhile
        // another task has been passed we call this function again.
        var latest_requested_task, busy = false;
        var run = function(i_task) {
          if (typeof i_task === 'function') {
            latest_requested_task = i_task;
            if (!busy) {
              busy = true;
              try {
                i_task(function() {
                  if (busy) {
                    busy = false;
                    if (timeout) {
                      clearTimeout(timeout);
                    }
                    if (latest_requested_task !== i_task) {
                      run(latest_requested_task);
                    }
                  }
                }, function(i_exception) {
                  if (busy) {
                    busy = false;
                    if (timeout) {
                      clearTimeout(timeout);
                    }
                    on_error(i_exception);
                    if (latest_requested_task !== i_task) {
                      run(latest_requested_task);
                    }
                  }
                });
                if (busy && millis && on_timeout) {
                  timeout = setTimeout(function() {
                    if (busy) {
                      busy = false;
                      if (on_timeout) {
                        on_timeout('timeout: ' + i_task.toString());
                      }
                      if (latest_requested_task !== i_task) {
                        run(latest_requested_task);
                      }
                    }
                  }, Math.ceil(millis));
                }
              }
              catch (exc) {
                busy = false;
                if (timeout) {
                  clearTimeout(timeout);
                }
                if (on_error) {
                  on_error(exc);
                }
              }
            }
          }
        };
        return run;
      }
  };

  Object.seal(exp);

  // export
  if (typeof require === 'function') {
    module.exports = exp;
  }
  else {
    window.Executor = exp;
  }
}());
