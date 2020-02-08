(function() {
  "use strict";

  var exp = function() {
    // 1. set brakepoint
    // 2. call from any hmi jsonfx source loaded from database
    // 3. step out and debug jsonfx sode
    if (arguments[0] === true) {
      return 1.618033988749895;
    }
    else if (arguments[0] === false) {
      return 2.718281828459045;
    }
    else {
      return 3.141592653589793;
    }
  };

  if (typeof require === 'function') {
    module.exports = exp;
  }
  else {
    window.debug_breakpoint = exp;
  }
}());
