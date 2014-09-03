module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bwr: grunt.file.readJSON('bower.json'),

    clean: {
      cov: ['cov.html'],
      dist: ["<%= pkg.name %>.min.js"/*, "<%= pkg.name %>.standalone.min.js"*/],
      build_residues: ["<%= pkg.name %>.js"/*, "<%= pkg.name %>.standalone.js"*/]
    },
    test: {
      dev: ['test/**/testrunner*.html'],
      build: ['test/**/buildtester*.html']
    },
    requirejs: {
/*
      standalone: {
        options: {
          baseUrl: "./src",
          name: "<%= pkg.name %>",
          out: "<%= pkg.name %>.standalone.js",
          paths: {
            'other_module': 'path/to/other_module.min'
          },
          optimize: "none"
        }
      },
*/
      dist: {
        options: {
          baseUrl: "./src",
          name: "<%= pkg.name %>",
          out: "<%= pkg.name %>.js",
/*
          paths: {
            other_module: 'empty:'
          }
*/
          optimize: "none"
        }
      }
    },
    uglify: {
/*
      standalone: {
        files: {
          '<%= pkg.name %>.standalone.min.js': ['<%= pkg.name %>.standalone.js']
        }
      },
*/
      dist: {
        files: {
          '<%= pkg.name %>.min.js': ['src/<%= pkg.name %>.js']
        }
      }
    },
    bump: {
      options: {
        files: ['package.json', 'bower.json'],
        updateConfigs: ['pkg', 'bwr'],
        commit: true,
        commitMessage: 'Release version %VERSION%',
        commitFiles: [
          'package.json',
          'bower.json',
          '<%= pkg.name %>.min.js',
/*
          '<%= pkg.name %>.standalone.min.js',
*/
          'cov.html'
        ],
        commitForceAdd: true,
        createTag: true,
        tagName: '%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin',
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
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
          '<%= pkg.name %>*.js',
          '<%= pkg.name %>.min.js',
/*
          '<%= pkg.name %>.standalone.js',
          '<%= pkg.name %>.standalone.min.js',
*/
          'cov.html'
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-mocha-phantomjs');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-bump');

  grunt.loadTasks('grunt-tasks');

  grunt.renameTask('mocha_phantomjs', 'test');

  grunt.registerTask('build', ['clean:dist', 'clean:build_residues', 'requirejs', 'uglify', 'clean:build_residues']);

  grunt.registerTask('default', ['test:dev', 'build', 'test:build']);
};