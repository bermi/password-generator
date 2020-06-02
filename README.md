# password-generator

Memorable password generator. For the command line, Node.js and browsers.


[![Build Status](https://api.travis-ci.org/bermi/password-generator.svg)](http://travis-ci.org/bermi/password-generator)  [![Dependency Status](https://david-dm.org/bermi/password-generator.svg)](https://david-dm.org/bermi/password-generator) [![](http://img.shields.io/npm/v/password-generator.svg) ![](http://img.shields.io/npm/dm/password-generator.svg)](https://www.npmjs.org/package/password-generator)


## Installation

    $ npm install password-generator -g

## Usage

### From the CLI

    password-generator -h

Displays this help

    Generates a memorable password

    Options:
      -l  Password length
      -c  Generates a non memorable password  [default: false]
      -p  Pattern to match for the generated password
      -h  Displays this help

Simple memorable pass

    password-generator
    => maqetaxaku

Custom length

    password-generator -l 30
    => nugiferagiraqadamedewubaqirali

Non memorable

    password-generator -c
    => QPnb3gl7_0

Customize the pattern to match for each password character

    password-generator -p "[\d\W\w\p]"
    => Je;VgG?{Yd

Any number or letter

    password-generator -p "[\w]"
    => 3NHPqzjIAq

Combine multiple strategies 6 memorable and 3 numbers

    echo "`password-generator -l 6``password-generator -p "[0-9]" -l 3`"
    => wazawe351


### From Node.js

    var generatePassword = require('password-generator');

### From the browser

    <script src="https://raw.github.com/bermi/password-generator/master/dist/password-generator.min.js" type="text/javascript"></script>


### Browser support

Since v2.0.0 this library relies on cryptographic random values generated via [`crypto.getRandomValues`](https://developer.mozilla.org/en/docs/Web/API/RandomSource/getRandomValues). IE11 was the first IE version to include this method. Check [caniuse.com](http://caniuse.com/#feat=getrandomvalues) for details.

### Usage

#### Default settings (memorable 10 letters)

    generatePassword() // -> xexeyimahi

#### Custom length not memorable

    generatePassword(12, false) // -> 76PAGEaq6i5c

#### Characters should match a pattern

    generatePassword(12, false, /\d/) // -> 252667390298

#### Customize the password prefix

    generatePassword(12, false, /\d/, 'foo-') // -> foo-67390298

#### Example with custom validation rules

Given the pattern regexp can only match a single character
you can build a function that generates multiple passwords until you
hit one that complies with your rules.

The following example will generate a password with the following requirements

* Must contain at least two numbers
* Must contain at least three uppercase letters
* Must contain at least three lowercase letters
* Must contain at least two special characters
* Must NOT contain sequences of two or more repeated characters


```javascript
var generatePassword = require("password-generator");

var maxLength = 18;
var minLength = 12;
var uppercaseMinCount = 3;
var lowercaseMinCount = 3;
var numberMinCount = 2;
var specialMinCount = 2;
var UPPERCASE_RE = /([A-Z])/g;
var LOWERCASE_RE = /([a-z])/g;
var NUMBER_RE = /([\d])/g;
var SPECIAL_CHAR_RE = /([\?\-])/g;
var NON_REPEATING_CHAR_RE = /([\w\d\?\-])\1{2,}/g;

function isStrongEnough(password) {
  var uc = password.match(UPPERCASE_RE);
  var lc = password.match(LOWERCASE_RE);
  var n = password.match(NUMBER_RE);
  var sc = password.match(SPECIAL_CHAR_RE);
  var nr = password.match(NON_REPEATING_CHAR_RE);
  return password.length >= minLength &&
    !nr &&
    uc && uc.length >= uppercaseMinCount &&
    lc && lc.length >= lowercaseMinCount &&
    n && n.length >= numberMinCount &&
    sc && sc.length >= specialMinCount;
}

function customPassword() {
  var password = "";
  var randomLength = Math.floor(Math.random() * (maxLength - minLength)) + minLength;
  while (!isStrongEnough(password)) {
    password = generatePassword(randomLength, false, /[\w\d\?\-]/);
  }
  return password;
}

console.log(customPassword()); // => 2hP5v?1KKNx7_a-W
```


## Running tests

    npm install
    make test

## Building

    npm install
    make all

## License

(The MIT License)

Copyright (c) 2011-2020 Bermi Ferrer &lt;bermi@bermilabs.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
