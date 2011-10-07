var argv, fs, optimist, path, puts;

fs = require('fs');
path = require('path');
puts = console.log;
optimist = require('optimist');

argv = optimist.usage('Generates a memorable password', {
  l: {
    description: 'Password length',
    "default": null
  },
  c: {
    description: 'Generates a non memorable password',
    "default": 'memorable'
  },
  h: {
    description: 'Displays this help'
  }
}).argv;

this.run = function() {
  var generatePassword = require('./password-generator');
  if (argv.h) {
    return optimist.showHelp();
  }
  puts(generatePassword(argv.l, argv.c === 'memorable'));
};