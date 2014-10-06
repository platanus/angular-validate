/**
 * Angular Validation Framework
 * @version v0.1.0 - 2014-10-06
 * @link https://github.com/platanus/angular-validate
 * @author Ignacio Baixas <ignacio@platan.us>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */

(function(angular, undefined) {
'use strict';
// groups are global, think about making them scope depedant (maybe an option for that?)
var groups = {};

// js tokenized split
function jsSplit(_string, _by) {
  var s = 0, c = 0, p = 0, inString = 0, lp = 0, splits = [], ch;
  for(var i = 0, l = _string.length; i < l; i++) {
    ch = _string[i];
    if(inString) {
      // when inside a string, consider slashes
      if(ch === '\'') { inString = (inString % 2) ? 0 : 1; }
      else if(ch === '\\') { inString++; }
      else { inString = 1; }
    } else {
      // when outside a string, consider sbrackets, parenthesis and curly braces
      if(ch === '\'') { inString = 1; }
      else if(ch === '[') { s++; } else if(ch === ']') { s--; }
      else if(ch === '{') { c++; } else if(ch === '}') { c--; }
      else if(ch === '(') { p++; } else if(ch === ')') { p--; }
      else if(ch === _by && !s && !p && !c) {
        splits.push(_string.substring(lp, i));
        lp = i+1;
      }
    }
  }

  if(s || p || c || inString) {
    // TODO. report invalid expression
    return null;
  }

  splits.push(_string.substring(lp));
  return splits;
}

angular.module('platanus.validate', ['platanus.inflector'])
  /**
   * validate directive.
   *
   * Adds validation to a given input, input must register a ng model.
   *
   * Usage:
   *
   * Suposing both RequiredValidator and NumberValidator are provided,
   * the following will trigger `required` and `number` errors if value does
   * not meet the requirements.
   *
   * ```javascript
   * <input type="text" validate="required, number"></input>
   * ```
   *
   * The directive also support inline conditional expressions
   *
   * ```javascript
   * <input type="text" validate="is $value == 0"></input>
   * ```
   *
   * Its also posible to register errors using custom names. In the following case,
   * the ngModel's $error property will have a number and a titleRequired property, this
   * is usefull for custom error messages.
   *
   * ```javascript
   * <input type="text" name="title" validate="required as title-required, number"></input>
   * ```
   *
   */
  .directive('validate', ['$parse', '$injector', '$inflector', function($parse, $injector, $inflector) {

    return {
      restrict: 'AC',
      require: 'ngModel',
      link: function(_scope, _element, _attrs, _ctrl) {

        // parse validation expression
        // IDEA: find a way of storing error metadata, not just the message
        var validations = [];
        angular.forEach(jsSplit(_attrs.validate, ','), function(_val) {
          var m = _val.match(/^\s*(is\s+)?(.*?)(\s+as\s+([^\s]+))?\s*$/i), dsc = {}, name;
          if(!m) return; // TODO: throw.
          if(m[3]) dsc.as = $inflector.camelize(m[4]);
          if(!m[1]) {
            m = m[2].match(/^(\w[\w\d-]+)(?::(.*?))?$/);
            if(!m) return; // TODO: throw.
            if(!dsc.as) dsc.as = $inflector.camelize(m[1]);
            dsc.fun = $injector.get($inflector.camelize(m[1], true) + 'Validator');
            if(m[2]) dsc.dyn = $parse(m[2]);
          } else dsc.dyn = $parse(m[2]);

          validations.push(dsc);
        });

        // apply each validation on value change
        _ctrl.$parsers.push(function(_value) {
          var i = 0, dsc, isValid, allValid = true;
          while((dsc = validations[i++])) {
            isValid = dsc.dyn ? dsc.dyn(_scope, { $value: _value }) : [];
            if(dsc.fun) {
              if(!angular.isArray(isValid)) isValid = [isValid];
              isValid.unshift(_value);
              isValid = dsc.fun.apply(null, isValid);
            }

            _ctrl.$setValidity(dsc.as || 'validate', isValid);
            if(!isValid) allValid = false;
          }
          return allValid ? _value : undefined;
        });
      }
    };
  }])
  /**
   * The validation group directive allows two or more inputs to trigger validations on each other
   * whenever one of the group's input changes.
   *
   * The revalidation process happens only on invalid inputs, this is to provide proper feedback to user.
   */
  .directive('validationGroup', ['$timeout', function($timeout) {

    return {
      restrict: 'AC',
      require: 'ngModel',
      link: function(_scope, _element, _attrs, _ctrl) {

        var name = _attrs.validationGroup, always = false;
        if(name[0] === '!') {
          name = name.substr(1);
          always = true;
        }

        var group = groups[name];
        if(group === undefined) group = groups[_attrs.validationGroup] = [];
        group.push({ model: _ctrl, always: always });

        // create a watch that revalidates all other group controls that are invalid
        // whenever this control value changes and is valid.
        _scope.$watch(function() {
          return _ctrl.$viewValue;
        }, function() {
          if(_ctrl.$invalid) return;

          // revalidate all other group models if valid
          angular.forEach(group, function(_other) {
            if(_ctrl !== _other.model && (_other.always || _other.model.$invalid)) {
              $timeout(function() {
                _other.model.$setViewValue(_other.model.$viewValue);
              }, 0);
            }
          });
        });

        // make sure to unregister model from group when element is destroyed.
        _element.on('$destroy', function() {
          for(var i = group.length - 1; i >= 0; i--) {
            if(group[i] === _ctrl) {
              group.splice(i, 1);
            }
          }
        });
      }
    };
  }])
  /**
   * Required validator, only allows non blank values
   */
  .constant('RequiredValidator', function(_value) {
    return !!_value;
  })
  /**
   * Match validator, only allows values that match a given regexp.
   *
   * Usage:
   *
   * ```html
   * <input type="text" validate="match: '^\d{3}-\d{3}-\d{8}$' as phone"></input>
   * ```
   */
  .constant('MatchValidator', function(_value, _regex) {
    if(!_value) {
      return true;
    }
    return (new RegExp(_regex)).test(_value);
  });

})(angular);