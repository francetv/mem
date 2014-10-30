module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bwr: grunt.file.readJSON('bower.json'),

    clean: {
      cov: ['cov.html'],
      dist: ["<%= pkg.name %>.min.js"],
      build_residues: ["<%= pkg.name %>.js"]
    },
    test: {
      dev: ['test/**/testrunner*.html'],
      build: ['test/**/buildtester*.html']
    },
    requirejs: {
      dist: {
        options: {
          baseUrl: "./src",
          name: "<%= pkg.name %>",
          out: "<%= pkg.name %>.js",
          optimize: "none"
        }
      }
    },
    uglify: {
      dist: {
        files: {
          '<%= pkg.name %>.min.js': ['<%= pkg.name %>.js']
        }
      }
    },
    'check-coverage': {
      src: ['src/**/*.js'],
      options: {
        minimumCov: 90,
        testRunnerFile: 'test/testrunner.html'
      }
    },
    'check-git-clean': {
      options: {
        ignore: [
          '<%= pkg.name %>.js',
          '<%= pkg.name %>.min.js',
          'cov.html'
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-mocha-phantomjs');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.loadTasks('grunt-tasks');

  grunt.renameTask('mocha_phantomjs', 'test');

  grunt.registerTask('build', ['clean:dist', 'clean:build_residues', 'requirejs', 'uglify', 'clean:build_residues']);

  grunt.registerTask('default', ['test:dev', 'build', 'test:build']);
};