var pkg = require('./package.json');

module.exports = {
  entry: "./src/" + pkg.name + ".js",
  output: {
    path: __dirname,
    filename: pkg.name + ".min.js",
    library: pkg.name, // the 3 next lines need to be removed when we will switch JQP to commonJS
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    loaders: [{
      test: /.*\/src\/.*\.js$/,
      loader: "uglify"
  }]
  }
};