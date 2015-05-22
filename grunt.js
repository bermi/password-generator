module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    lint: {
      files: ['grunt.js', 'index.js', 'lib/*.js', 'test/*.js', 'bin/*']
    },
    watch: {
      files: ['grunt.js', 'index.js', 'lib/*.js', 'test/*.js', 'bin/*'],
      tasks: 'lint'
    },
    jshint: {
      options: {
        strict: false,
        bitwise: true,
        curly: true,
        eqeqeq: true,
        forin: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        nonew: true,
        plusplus: true,
        regexp: true,
        noempty: true,
        sub: true,
        undef: true,
        trailing: true,
        eqnull: true,
        browser: true,
        node: true,
        indent: 2,
        onevar: true,
        white: true
      },
      globals: {
        describe: true,
        expect: true,
        it: true,
        before: true,
        ender: true
      }
    },
    pkg: '<json:package.json>',
    meta: {
      banner: "/*! <%= pkg.name %> - v<%= pkg.version %> " +
      '(<%= grunt.template.today("yyyy-mm-dd") %>)' +
      "\n* -----------------\n" +
      "* Copyright(c) 2011-2015 Bermi Ferrer <bermi@bermilabs.com>\n" +
      "* MIT Licensed\n*/"
    },
    concat: {
      dist: {
        src: ['lib/password-generator.js'],
        dest: 'dist/password-generator.js'
      }
    },
    min: {
      dist: {
        src: ['<banner>', 'dist/password-generator.js'],
        dest: 'dist/password-generator.min.js'
      }
    }
  });

  // Default task.
  grunt.registerTask('default', 'lint');

  // Build task.
  grunt.registerTask('build', 'lint concat min');

};