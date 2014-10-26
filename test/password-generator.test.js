(function (root) {

  var expect = root.expect || require('expect.js'),
    generatePassword;

  // This test is meant to run in both, the browser and the CLI
  if (typeof require !== 'undefined') {
    generatePassword = require('../');
  } else {
    generatePassword = root.generatePassword;
  }


  describe("When using the password generator, it:", function () {
    it('should generate a 10 chararacter memorable password', function () {
      expect(generatePassword()).to.match(/([bcdfghjklmnpqrstvwxyz][aeiou]){5}/);
    });
    it('should generate a 6 chararacter memorable password', function () {
      expect(generatePassword()).to.match(/([bcdfghjklmnpqrstvwxyz][aeiou]){3}/);
    });
    it('should generate a 1000 chararacter non memorable password', function () {
      var pass = generatePassword(1000, false);
      expect(pass).to.match(/[bcdfghjklmnpqrstvwxyz]{4}/ig);
      expect(pass.length).to.be(1000);
    });
    it('should generate passwords matching regex pattern', function () {
      var pass = generatePassword(5, false, /\d/);
      expect(pass).to.match(/^\d{5}$/);
    });
    it('should generate passwords with a given preffix', function () {
      var pass = generatePassword(7, false, /\d/, 'foo-');
      expect(pass).to.match(/^foo\-\d{3}$/);
    });
    it('should generate long passwords without throwing exceeding the ' +
    'call stack limits' , function () {
      var pass = generatePassword(1200, false, /\d/);
      expect(pass).to.match(/^\d{1200}$/);
    });
  });

}(this));