var options = {
  l: {
    description: 'Password length                      [default: null]',
    hasArg: true
  },
  c: {
    description: 'Generates a non memorable password   [default: "memorable"]',
    hasArg: true
  },
  p: {
    description: 'Pattern to match for the generated password',
    hasArg: true
  },
  h: {
    description: 'Displays this help'
  }
};

var argv = process.argv.slice(2).reduce(
  function parseArg(memo, arg, idx, rawArgs) {
  var nextArg = rawArgs[idx + 1];
  if (/^-(.)([^=]*?)(=(.*))?$/.test(arg)) {
    var opt = RegExp.$1;
    var val = options[opt] && !options[opt].hasArg
                ? true
                : (RegExp.$3
                    ? RegExp.$4
                    : RegExp.$2 ||
                      (!nextArg || /^-/.test(nextArg) ? '' : nextArg));
    memo[opt] = val;
  }
  return memo;
}, {});

var puts = console.log;

var options = {
  l: {
    description: 'Password length                      [default: null]'
  },
  c: {
    description: 'Generates a non memorable password   [default: "memorable"]'
  },
  p: {
    description: 'Pattern to match for the generated password'
  },
  h: {
    description: 'Displays this help'
  }
};

this.showHelp = function () {
  puts('Generates a memorable password\r\n');
  puts('Options:');
  var keys = Object.keys(options);

  keys.forEach(function (key) {
    puts('  -' + key + ': ' + options[key].description);
  });
};

this.run = function () {
  var MEMORABLE, generatePassword, memorable, pattern;
  MEMORABLE = 'memorable';
  generatePassword = require('./password-generator');
  pattern = argv.p || null;
  if (argv.h) {
    return this.showHelp();
  }
  memorable = argv.c || MEMORABLE;

  if (pattern) {
    pattern = new RegExp(pattern);
    memorable = false;
  }
  puts(generatePassword(argv.l, memorable === MEMORABLE, pattern));
};
