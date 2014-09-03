module.exports = function (grunt) {
  grunt.registerTask("check-meta-consistency",
    "Check package meta-data consistency (same versions and names in package.json and bower.json",
    function() {
      var pkgName = grunt.config('pkg.name');
      var bwrName = grunt.config('bwr.name');
      var pkgVersion = grunt.config('pkg.version');
      var bwrVersion = grunt.config('bwr.version');

      if (!pkgName) {
        grunt.fatal('Missing name in package.json file.');
      }

      if (!bwrName) {
        grunt.fatal('Missing name in bower.json file.');
      }

      if (pkgName !== bwrName) {
        grunt.fatal('Names mismatch in package.json and bower.json files.');
      }

      if (!pkgVersion) {
        grunt.fatal('Missing version in package.json file.');
      }

      if (!bwrVersion) {
        grunt.fatal('Missing version in bower.json file.');
      }

      if (pkgVersion !== bwrVersion) {
        grunt.fatal('Versions mismatch in package.json and bower.json files.');
      }

      grunt.log.writeln('Package meta-data ok.');
    }
  );
};