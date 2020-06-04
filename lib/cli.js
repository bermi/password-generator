var argv = process.argv.slice(2).reduce(
  function parseArg(memo, arg, idx, rawArgs) {
  var nextArg = rawArgs[idx + 1] || true;
  if (arg[0] === '-') {
    var equalIdx = arg.indexOf('=');
    if (equalIdx === -1) {
      memo[arg[1]] = nextArg && nextArg[0] === '-' ? true : nextArg;
    } else {
      memo[arg[1]] = arg.slice(equalIdx + 1).trim();
    }
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
