(function() {
  "use strict";

  var test_config = {
    enable : true,
    tests : {
      texts_and_numbers_case_insensitive : true,
      texts_and_numbers_case_sensitive : true,
      texts_and_long_numbers : true,
      strings_ignorecase : true,
      sorted_set : true
    }
  };
  
  var Sorting = typeof require === 'function' ? require('./Sorting.js') : window.Sorting;

  var compare_texts_and_numbers = function(i_handler, i_string1, i_string2, i_ignorecase, i_signed, i_result) {
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('Sorting:texts-and-numbers');
      var res = Sorting.compareTextsAndNumbers(i_string1, i_string2, i_ignorecase, i_signed);
      var str = i_ignorecase ? 'ignore case:' : 'case sensitive:';
      str += ' "' + i_string1 + '" ';
      str += i_result > 0 ? '>' : (i_result < 0 ? '<' : '=');
      str += ' "' + i_string2 + '"';
      if (res === i_result) {
        i_passed(str);
      }
      else {
        str += ' [' + (res > 0 ? '>' : (i_result < 0 ? '<' : '=')) + ']';
        i_failed(str);
      }
    });
  };

  var compare_strings_ignorecase = function(i_handler, i_string1, i_string2, i_result) {
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('Sorting:strings-ignorecase');
      var res = Sorting.compareStringsIgnorecase(i_string1, i_string2);
      var str = '"' + i_string1 + '" ';
      str += i_result > 0 ? '>' : (i_result < 0 ? '<' : '=');
      str += ' "' + i_string2 + '"';
      if (res === i_result) {
        i_passed(str);
      }
      else {
        str += ' [' + (res > 0 ? '>' : (i_result < 0 ? '<' : '=')) + ']';
        i_failed(str);
      }
    });
  };

  var check_sorted_set = function(i_handler, i_noEqualObjectsAllowed) {
    i_handler.addTest(function(i_passed, i_failed) {
      i_handler.setMessagePrefix('Sorting:sorted_set');
      var compare = Sorting.getTextsAndNumbersCompareFunction(i_noEqualObjectsAllowed, true);
      var set = new Sorting.SortedSet(i_noEqualObjectsAllowed, compare);
      set.insert('aBc42def50');
      set.insert('');
      set.insert('abc0010');
      set.insert('abc0002');
      set.insert('abc42def50');
      set.insert('abc42def50');
      set.insert('abc42def50');
      set.insert('abc42def40');
      set.insert('');
      set.insert('0');
      set.insert('1');
      set.insert('abc42def0040gh');
      set.insert('10');
      set.insert('abc0');
      set.insert('abc10');
      set.insert('abc2');
      set.insert('abc000010');
      set.insert('abc2');
      set.insert('abc10');
      set.insert('2');
      set.insert('10');
      set.insert('abc42def050gh');
      set.insert('002');
      set.insert('abc42def0050gh');
      set.insert('abc42def0040gh');
      set.insert('abc42def050gh');
      set.insert('abc42def00060gh');
      set.insert('00010');
      set.insert('002');
      set.insert('a');
      set.insert('abc42def50');
      set.insert('A');
      set.insert('10');
      set.insert('a');
      set.insert('10');
      set.insert('b');
      set.insert('abc2');
      set.insert('abc002');
      set.insert('abc42def50');
      set.insert('abc42def60');
      set.insert('abc42def00050gh');
      set.insert('abc42def050gh');
      set.insert('abc42def00050gh');
      set.insert('abc0042def050gh');
      var obj1 = set.get(0), obj2, res;
      for (var i = 1, l = set.size(); i < l; i++) {
        obj2 = set.get(i);
        res = compare(obj1, obj2);
        if (i_noEqualObjectsAllowed) {
          if (res !== Sorting.SMALLER) {
            i_failed('found equal or bigger object');
            return;
          }
        }
        else {
          if (res === Sorting.BIGGER) {
            i_failed('found bigger object');
            return;
          }
        }
        obj1 = obj2;
      }
      i_passed('sorted set OK (mode: ' + (i_noEqualObjectsAllowed ? 'ignore case + no equal' : 'case sensitive + equal allowed') + ')');
    });
  };

  var exp = function(i_handler) {
    if (!test_config.enable) {
      return;
    }
    if (test_config.tests.texts_and_numbers_case_insensitive) {
      // check case insensitive
      compare_texts_and_numbers(i_handler, '', '', false, false, Sorting.EQUAL);
      compare_texts_and_numbers(i_handler, '0', '1', false, false, Sorting.SMALLER);
      compare_texts_and_numbers(i_handler, '10', '2', false, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, '10', '002', false, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, '00010', '002', false, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'a', 'A', false, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'a', 'b', false, false, Sorting.SMALLER);
      compare_texts_and_numbers(i_handler, 'abc2', 'abc0', false, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'abc10', 'abc2', false, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'abc000010', 'abc2', false, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'abc10', 'abc002', false, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'abc0010', 'abc0002', false, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'abc42def50', 'abc42def50', false, false, Sorting.EQUAL);
      compare_texts_and_numbers(i_handler, 'abc42def50', 'abc42def40', false, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'abc42def50', 'abc42def60', false, false, Sorting.SMALLER);
      compare_texts_and_numbers(i_handler, 'abc42def00050gh', 'abc42def050gh', false, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'abc42def0050gh', 'abc42def0040gh', false, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'abc42def050gh', 'abc42def00060gh', false, false, Sorting.SMALLER);
      compare_texts_and_numbers(i_handler, 'abc42def00050gh', 'abc0042def050gh', false, false, Sorting.EQUAL);
    }
    if (test_config.tests.texts_and_numbers_case_sensitive) {
      // check case sensitive
      compare_texts_and_numbers(i_handler, '', '', true, false, Sorting.EQUAL);
      compare_texts_and_numbers(i_handler, '0', '1', true, false, Sorting.SMALLER);
      compare_texts_and_numbers(i_handler, '10', '2', true, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, '10', '002', true, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, '00010', '002', true, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'a', 'A', true, false, Sorting.EQUAL);
      compare_texts_and_numbers(i_handler, 'a', 'b', true, false, Sorting.SMALLER);
      compare_texts_and_numbers(i_handler, 'abc2', 'abc0', true, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'abc10', 'abc2', true, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'abc000010', 'abc2', true, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'abc10', 'abc002', true, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'abc0010', 'abc0002', true, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'abc42def50', 'abc42def50', true, false, Sorting.EQUAL);
      compare_texts_and_numbers(i_handler, 'aBc42def50', 'abc42def40', true, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'aBc42def50', 'abc42def60', true, false, Sorting.SMALLER);
      compare_texts_and_numbers(i_handler, 'aBc42def00050gh', 'abc42def050gh', true, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'aBc42def0050gh', 'abc42def0040gh', true, false, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'aBc42def050gh', 'abc42def00060gh', true, false, Sorting.SMALLER);
      compare_texts_and_numbers(i_handler, 'aBc42def00050gh', 'abc0042def050gh', true, false, Sorting.EQUAL);
    }
    if (test_config.tests.texts_and_long_numbers) {
      // check some really long numbers with sign
      compare_texts_and_numbers(i_handler, '=1.15+CC-K10', '=1.15+CC-K2', false, true, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, '=1.15+CC-K000000000100000000000000000000000000000000000000000', '=1.15+CC-K0000020000000000000000000000000000000000000000', false, true, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'm000100m', 'm000000200m', false, true, Sorting.SMALLER);
      compare_texts_and_numbers(i_handler, 'm000200m', 'm000000100m', false, true, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'm-000100m', 'm000000200m', false, true, Sorting.SMALLER);
      compare_texts_and_numbers(i_handler, 'm000100m', 'm-000000200m', false, true, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'm-000100m', 'm-000000200m', false, true, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, 'm-000200m', 'm-000000100m', false, true, Sorting.SMALLER);
      compare_texts_and_numbers(i_handler, '00010000000000000000000', '00010000000000000000001', false, true, Sorting.SMALLER);
      compare_texts_and_numbers(i_handler, '00010000000000000000001', '00010000000000000000000', false, true, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, '-00010000000000000000000', '00010000000000000000001', false, true, Sorting.SMALLER);
      compare_texts_and_numbers(i_handler, '00010000000000000000000', '-00010000000000000000001', false, true, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, '-00010000000000000000000', '-00010000000000000000001', false, true, Sorting.BIGGER);
      compare_texts_and_numbers(i_handler, '-00010000000000000000001', '-00010000000000000000000', false, true, Sorting.SMALLER);
    }
    if (test_config.tests.strings_ignorecase) {
      // check strings ignorecase
      compare_strings_ignorecase(i_handler, '', '', Sorting.EQUAL);
      compare_strings_ignorecase(i_handler, 'abc', 'AbC', Sorting.EQUAL);
      compare_strings_ignorecase(i_handler, 'BCa', 'bCa', Sorting.EQUAL);
      compare_strings_ignorecase(i_handler, 'abc', 'AbCx', Sorting.SMALLER);
      compare_strings_ignorecase(i_handler, 'BCax', 'bCa', Sorting.BIGGER);
      compare_strings_ignorecase(i_handler, 'abc0', 'AbC', Sorting.BIGGER);
      compare_strings_ignorecase(i_handler, 'BCa', 'bCa0', Sorting.SMALLER);
    }
    if (test_config.tests.sorted_set) {
      // check sorted set
      check_sorted_set(i_handler, false);
      check_sorted_set(i_handler, true);
    }
  };

  if (typeof require === 'function') {
    module.exports = exp;
  }
  else {
    window.testSorting = exp;
  }
}());