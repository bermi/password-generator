module.exports = function (grunt) {

  var pkg = require("./package.json");

  var banner = "/*! " + pkg.name + " - v" + pkg.version + " " +
      '(<%= grunt.template.today("yyyy-mm-dd") %>)' +
      "\n* -----------------\n" +
      "* Copyright(c) 2011-" + new Date().getFullYear() +
      " Bermi Ferrer <bermi@bermilabs.com>\n" +
      "* https://github.com/bermi/password-generator \n" +
      "* MIT Licensed\n*/";

  // Project configuration.
  grunt.initConfig({
    watch: {
      files: ['Gruntfile', 'index.js', 'lib/*.js', 'test/*.js', 'bin/*'],
      tasks: 'jshint'
    },
    jshint: {
      all: ['Gruntfile', 'index.js', 'lib/*.js', 'test/*.js', 'bin/*'],
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
        white: true,
        globals: {
          describe: true,
          expect: true,
          it: true,
          before: true,
          ender: true
        }
      }
    },
    pkg: '<json:package.json>',
    meta: {
      banner: banner
    },
    concat: {
      dist: {
        src: ['lib/password-generator.js'],
        dest: 'dist/password-generator.js'
      }
    },
    uglify: {
      dist: {
        src: ['<banner>', 'dist/password-generator.js'],
        dest: 'dist/password-generator.min.js'
      },
      options: {
        banner: banner
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task.
  grunt.registerTask('default', ['jshint']);

  // Build task.
  grunt.registerTask('build', ['jshint', 'concat', 'uglify']);

};