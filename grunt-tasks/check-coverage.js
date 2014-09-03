var spawn = require('child_process').spawn;
var fs = require('fs');

function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cbCalled = true;
      cb(err);
    }
  }
}

module.exports = function (grunt) {
    grunt.registerMultiTask('check-coverage', 'Check current tests code coverage', function(){
        var finaly = this.async();

        var opts = this.options({
          minimumCov: 80,
          testRunnerFile: 'test/testrunner.html'
        });
        var files = this.filesSrc;

        prepareFiles(function(errorPrepare) {
          if (errorPrepare) {
            return revert(function(errorRollback) {
              if (errorRollback) {
                grunt.fatal('Error while preparing file and rollback.\n' + errorPrepare + '\n' + errorRollback);
              }

              grunt.fatal('Error while preparing files for coverage.\n' + errorPrepare);
            });
          }

          getFileCov(function(err, json, html) {
            if (err) {
              grunt.log.error('Unable to get coverage.\n' + err);
            }
            else {
              grunt.file.write('cov.html', html);
            }

            revert(function(error) {
              if (error) {
                grunt.fatal('Error while rollbacking files.\n' + error);
              }

              if (json && json.coverage) {
                grunt.log.writeln('');
                if (json.coverage < opts.minimumCov) {
                  grunt.fatal('coverage too low: ' + json.coverage);
                }
                else {
                  grunt.log.writeln('coverage: ' + json.coverage);
                }
              }

              finaly();
            });
          });
        });

        function revert(cb) {
          grunt.log.writeln('restore backup files');
          var count = 0;
          var errors = [];

          function done(err) {
            if (err) {
              errors.push(err);
            }

            if (++count === files.length) {
              if (!errors.length) {
                errors = null;
              }
              cb(errors);
            }
          }

          files.forEach(function(file) {
            fs.stat(file + '~', function(err) {
              if (err) {
                return done();
              }

              copyFile(file + '~', file, function(err) {
                if (err) {
                  grunt.log.write('-');
                  return done('unable to restore file:\n' + file + '\n' + err);
                }

                try {
                  grunt.file.delete(file + '~');
                }
                catch(error) {
                  grunt.log.write('-');
                  done('unable to delete backup file:\n' + file + '\n' + err);
                  return;
                }

                grunt.log.write('.');
                done();
              });
            });
          });
        }

        function prepareFiles(cb) {
          grunt.log.writeln('prepare files for jscoverage (backup to files~ and convert files with jscoverage)');
          var count = 0;
          var errors = [];

          function done(err) {
            if (err) {
              errors.push(err);
            }

            if (++count === files.length) {
              if (!errors.length) {
                errors = null;
              }
              cb(errors);
            }
          }

          files.forEach(function(file) {
            copyFile(file, file + '~', function(err) {
              if (err) {
                grunt.log.write('-');
                return done('unable to backup file:\n' + file + '\n' + err);
              }
              grunt.log.write('.');

              var checker = spawn('./node_modules/.bin/jscoverage', [file, file]);

              checker.on('close', function(code) {
                if (code !== 0) {
                  return done('unable to prepare file with jscoverage:\n' + file + '\n' + err);
                }

                done();
              });
            });
          });
        }

        function getFileCov(cb) {
          grunt.log.writeln('\nGetting coverage...\n');

          var resultJSON = '';
          var resultHTML = '';
          var errors = [];

          var convertor = spawn('node_modules/.bin/json2htmlcov');
          var testrunner = spawn('node_modules/.bin/mocha-phantomjs', ['-R', 'json-cov', opts.testRunnerFile]);

          testrunner.stdout.on('data', function (data) {
            resultJSON += data;
          });

          testrunner.stderr.on('data', function (data) {
            errors.push(data);
          });

          testrunner.on('close', function (code) {
            if (code !== 0 && !errors.length) {
              errors.push('testrunner exited with code ' + code);
            }

            if (!errors.length && resultJSON) {

              resultJSON = resultJSON.replace(/^[^{]*{/, '{');
              resultJSON = resultJSON.replace(/}[^}]*$/, '}');
              resultJSON = resultJSON.replace(/\\"/g, '\\"');

              convertor.stdin.write(resultJSON);
            }

            convertor.stdin.end();
          });

          convertor.stdout.on('data', function (data) {
            resultHTML += data;
          });

          convertor.stderr.on('data', function (data) {
            errors.push(data);
          });

          convertor.on('close', function (code) {
            if (code !== 0 && !errors.length) {
              errors.push('convertor exited with code ' + code);
            }

            if (!errors.length) {
              try {
                resultJSON = JSON.parse(resultJSON);
                errors = null;
              }
              catch(error) {
                errors.push(error);
              }
            }

            cb(errors, resultJSON, resultHTML);
          });
        }
    });
};