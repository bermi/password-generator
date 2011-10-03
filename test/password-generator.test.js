
/**
 * Module dependencies.
 */

var assert = require('assert'),
    generatePassword = require('../');

module.exports = {
    'should generate a 10 chararacter memorable password': function(){
        assert.ok(generatePassword().match(/([bcdfghjklmnpqrstvwxyz][aeiou]){5}/));
    },
    'should generate a 6 chararacter memorable password': function(){
        assert.ok(generatePassword().match(/([bcdfghjklmnpqrstvwxyz][aeiou]){3}/));
    },
    'should generate a 1000 chararacter non memorable password': function(){
        var pass = generatePassword(1000, false);
        assert.ok(pass.match(/[bcdfghjklmnpqrstvwxyz]{4}/ig));
        assert.ok(pass.length === 1000);
    },
    'should generate passwords matching regex pattern': function(){
        var pass = generatePassword(5, false, /\d/);
        assert.ok(pass.match(/^\d{5}$/));
    },
    'should generate passwords with a given preffix': function(){
        var pass = generatePassword(7, false, /\d/, 'foo-');
        assert.ok(pass.match(/^foo\-\d{3}$/));
    }
};

