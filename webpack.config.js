module.exports = {
  entry: "./src/mem.js",
  output: {
    path: __dirname,
    filename: "mem.min.js",
    library: 'mem',
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