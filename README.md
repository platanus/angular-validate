Platanus Angular Validations Framework [![Build Status](https://secure.travis-ci.org/platanus/angular-validate.png)](https://travis-ci.org/platanus/angular-validate)
===============

Small set of directives to make angular form validation a breeze.

## Installation:

**Optional** Use bower to retrieve package

```
bower install angular-validate --save
```

Include angular module

```javascript
angular.module('platanus.validate')
```

## Usage

TODO: improve this

Define some validators:

```javascript
module('teapot')
  .factory('IsTrueValidator', function() {
    return function() { return true; };
  })
  .factory('IsFalseValidator', function() {
    return function() { return false; };
  })
  .factory('IsOddValidator', function() {
    return function(_value) { return parseInt(_value, 10) % 2 === 0; };
  })
  .factory('IsEqualToValidator', function() {
    return function(_v1, _v2) { return _v1 == _v2; };
  });
```

Use them in the markup:

```html
<input ng-model="fa" validate="is-odd" type="text"/>
<input ng-model="fe" validate="is-false, is-true" type="text"/>
<input ng-model="foo" validate="is-equal-to: \'hello\'" type="text"/>
```

Validations can also be inlined, use `$value` to reffer to model value:

```html
<input ng-model="bar" validate="is $value == 4 as is-four" type="text"/>
```

Use aliases to customize `model.$error` flags:

```html
<input ng-model="bar" validate="is-greater-than: 4 as is-greater-than-four" type="text"/>
<input ng-model="bar" validate="is $value == 4 as is-four" type="text"/>
```

Use group validations to keep dependant input validations in sync:

```html
<input ng-model="bar" validate-group="foobar" validate="is-greater-than: 4" type="text"/>
<input ng-model="foo" validate-group="foobar" validate="is $value != bar as equals-bar" type="text"/>
```

Members of a group will be revalidates if **invalid** and any other member of the group **changes** and is **valid**.

It is also posible to force revalidation of a valid group member, to do so use the **!** modifier: `validate-group="!foobar"`

