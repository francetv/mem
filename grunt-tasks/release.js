module.exports = function (grunt) {
  grunt.registerTask("release",
    "Release a new version, than commit and push it",
    function(target) {
      target = target || "patch";
      grunt.task.run("check-meta-consistency", "check-git-clean", "default", "clean:cov", "check-coverage", "bump:" + target);
    }
  );
};