module.exports = function (grunt) {
  grunt.registerTask("check-git-clean",
    "Check current GIT repository is clean",
    function() {
        var exec = require('child_process').exec;
        var done = this.async();

        var opts = this.options({
          ignore: []
        });

        var ignoreList = grunt.task.normalizeMultiTaskFiles(opts.ignore)[0].src;

        opts.ignore.forEach(function(filename) {
          if (~filename.indexOf('*')) {
            return;
          }

          if (~ignoreList.indexOf(filename)) {
            return;
          }

          ignoreList.push(filename);
        });

        exec('git status -s', function(err, stdout, stderr) {
          if (err) {
            grunt.fatal('Can not get GIT status:\n  ' + stderr);
          }

          stdout = stdout.split('\n')
            .map(function(line) {
              var parts = line.trim().split(' ');

              if (parts.length < 2) {
                return;
              }
              return parts[1].trim();
            })
            .filter(function(filename) {
              return filename && !~ignoreList.indexOf(filename);
            });

          if (stdout.length) {
            grunt.fatal('GIT repo not clean.\nCommit all and clean repo before retrying.\nFiles to commit or reset:\n - ' + stdout.join('\n - '));
          }

          exec('git rev-parse --abbrev-ref HEAD', function(err, stdout, stderr) {
            if (err) {
              grunt.fatal('Can not get GIT branch name:\n  ' + stderr);
            }

            stdout = stdout.trim();

            if (stdout === 'HEAD') {
              grunt.fatal('GIT repo in detached head.\nCheckout dev branch first.');
            }

            grunt.log.ok('GIT repo clean.');
            done();
          });
        });
    }
  );
};