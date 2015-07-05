# password-generator

Memorable password generator. For the command line, Node.js and browsers.

[![Build Status](https://secure.travis-ci.org/bermi/password-generator.png?branch=master)](http://travis-ci.org/bermi/password-generator)

[![browser support](http://ci.testling.com/bermi/password-generator.png)](http://ci.testling.com/bermi/password-generator)

## Installation

    $ npm install password-generator

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

    <script src="https://cdn.rawgit.com/bermi/password-generator/master/dist/password-generator.min.js" type="text/javascript"></script>

#### Usage

##### Default settings (memorable 10 letters)

    generatePassword() // -> xexeyimahi

##### Custom length not memorable

    generatePassword(12, false) // -> 76PAGEaq6i5c

##### Characters should match a pattern

    generatePassword(12, false, /\d/) // -> 252667390298

##### Customize the password prefix

    generatePassword(12, false, /\d/, 'foo-') // -> foo-67390298


## Running tests

    npm install
    make test

## Building

    npm install
    make all

## License

(The MIT License)

Copyright (c) 2011-2012 Bermi Ferrer &lt;bermi@bermilabs.com&gt;

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
