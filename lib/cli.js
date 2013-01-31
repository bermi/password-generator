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
  p: {
    description: 'Pattern to match for the generated password'
  },
  h: {
    description: 'Displays this help'
  }
}).argv;

this.run = function () {
  var generatePassword = require('./password-generator'),
    pattern = argv.p || null;
  if (argv.h) {
    return optimist.showHelp();
  }
  if (pattern) {
    pattern = new RegExp(pattern);
    argv.c = false;
  }
  puts(generatePassword(argv.l, argv.c === 'memorable', pattern));
};