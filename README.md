# password-generator

Memorable password generator.

## Installation

    $ npm install password-generator

## Usage

    var generatePassword = require('password-generator');

Default settings (memorable 10 letters)

    generatePassword() // -> xexeyimahi

Custom length not memorable

    generatePassword(12, false) // -> 76PAGEaq6i5c

Characters should match a pattern

    generatePassword(12, false, /\d/) // -> 252667390298

Customize the password prefix

    generatePassword(12, false, /\d/, 'foo-') // -> foo-67390298


## Running tests

    make test

## License 

(The MIT License)

Copyright (c) 2011 Bermi Ferrer &lt;bermi@bermilabs.com&gt;

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