var argv = require('yargs-parser')(process.argv.slice(2));

var puts = console.log;

var options = {
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
};

this.getDefault = function (option){
  var result = '';
  if(typeof option.default !== 'undefined'){
    result = '  [default: ';
    
    if(option.default){
      result += '"' + option.default + '"]';
    } else {
      result += 'null]';
    }  
  } 
  return result;
};

this.showHelp = function () {
  puts('Generates a memorable password\r\n');
  puts('Options:');  
  var keys = Object.keys(options);

  keys.forEach(function(key) {
    var opt = options[key];
    var defaultValue = this.getDefault(opt);
    puts('  -' + key + ': ' + opt.description + defaultValue);
  }, this);
};

this.run = function () {
  var MEMORABLE = 'memorable';
  var generatePassword = require('./password-generator'),
    pattern = argv.p || null;
  if (argv.h) {
    return this.showHelp();
  }
  var memorable = argv.c || MEMORABLE;
  
  if (pattern) {
    pattern = new RegExp(pattern);
    memorable = false;
  }
  puts(generatePassword(argv.l, memorable === MEMORABLE, pattern));
};
