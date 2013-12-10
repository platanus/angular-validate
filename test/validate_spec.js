'use strict';

describe('', function() {

  beforeEach(module('platanus.validate'));

  beforeEach(module(function($provide) {
    $provide.factory('IsTrueValidator', function() {
      return function() { return true; };
    });

    $provide.factory('IsFalseValidator', function() {
      return function() { return false; };
    });

    $provide.factory('IsOddValidator', function() {
      return function(_value) { return parseInt(_value, 10) % 2 === 0; };
    });

    $provide.factory('IsEqualToValidator', function() {
      return function(_v1, _v2) { return _v1 == _v2; };
    });
  }));

  describe('validate directive', function() {

    var scope;

    beforeEach(inject(function($rootScope, $compile) {
      var element = angular.element(
        '<form name="form">\
          <input name="test1" ng-model="inputs.test1" validate="is-odd" type="text"/>\
          <input name="test2" ng-model="inputs.test2" validate="is-false, is-true" type="text"/>\
          <input name="test3" ng-model="inputs.test3" validate="is test1 == $value as is-four" type="text"/>\
          <input name="test4" ng-model="inputs.test4" validate="is-equal-to: \'hello\'" type="text"/>\
        </form>'
      );

      scope = $rootScope;
      scope.inputs = { test1: '4', test2: '', test3: '4', test4: '' };
      $compile(element)(scope);
      scope.$digest();
    }));

    it('should validate using specified validator', function() {
      scope.form.test1.$setViewValue('2');
      expect(scope.form.test1.$valid).toEqual(true);
    });

    it('should validate using more than one validator', function() {
      scope.form.test2.$setViewValue('wharever');
      expect(scope.form.test2.$valid).toEqual(false);
    });

    it('should validate using inline validations', function() {
      expect(scope.form.test3.$valid).toEqual(true);
      scope.form.test3.$setViewValue('different than 4');
      expect(scope.form.test3.$valid).toEqual(false);
    });

    it('should store errors using given aliases', function() {
      scope.form.test3.$setViewValue('different than 4');
      expect(scope.form.test3.$error.isFour).toEqual(true);
    });

    it('should store errors using given aliases', function() {
      scope.form.test4.$setViewValue('bye');
      expect(scope.form.test4.$valid).toEqual(false);
      scope.form.test4.$setViewValue('hello');
      expect(scope.form.test4.$valid).toEqual(true);
    });
  });


  describe('validators', function() {

    var scope;

    beforeEach(inject(function($rootScope, $compile) {
      var element = angular.element(
        '<form name="form">\
          <input name="test1" ng-model="inputs.test1" validate="required" type="text"/>\
          <input name="test2" ng-model="inputs.test2" validate="match: \'^\\d+\'" type="text"/>\
        </form>'
      );

      scope = $rootScope;
      scope.inputs = { test1: '', test2: '' };
      $compile(element)(scope);
      scope.$digest();
    }));

    it('should allow values that arent blank when using required', function() {
      scope.form.test1.$setViewValue('');
      expect(scope.form.test1.$valid).toEqual(false);
      scope.form.test1.$setViewValue('2');
      expect(scope.form.test1.$valid).toEqual(true);
    });

    it('should allow values that matches expression when using match', function() {
      scope.form.test2.$setViewValue('2');
      expect(scope.form.test2.$valid).toEqual(false);
    });

  });

  describe('validateGroup directive', function() {

    var scope;

    beforeEach(inject(function($rootScope, $compile) {
      var element = angular.element(
        '<form name="form">\
          <input name="test1" ng-model="inputs.test1" validation-group="teapot" type="text"/>\
          <input name="test2" ng-model="inputs.test2" validation-group="teapot" validate="is-equal-to: form.test1.$viewValue" type="text"/>\
        </form>'
      );

      scope = $rootScope;
      scope.self = scope;
      scope.inputs = { test1: '2', test2: '6' };
      $compile(element)(scope);
      scope.$digest();
    }));

    it('should revalidate invalid', inject(function($timeout) {
      // make sure test2 is invalid
      scope.form.test2.$setViewValue('3');
      scope.$digest();
      expect(scope.form.test2.$valid).toEqual(false);

      // change test1 value so test2 is revalidated
      scope.form.test1.$setViewValue('3');
      scope.$digest();
      $timeout.flush();
      expect(scope.form.test2.$valid).toEqual(true);
    }));
  });
});

