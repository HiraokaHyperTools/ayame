var webpack = require('webpack');
var path = require('path');
var saveLicense = require('uglify-save-license');

module.exports = {
  entry: {
    app: './src/js/app.js'
  },
  output: {
    path: path.join(__dirname, 'node_modules'),
    filename: 'bundle.js'
  },
  resolve: {
    modules: [path.join(__dirname, 'node_modules')],
    extensions: ['.webpack.js', '.web.js', '.js']
  },
  module: {
    rules: [{
      test: /\.js$/,
      use: 'babel-loader',
      exclude: /node_modules/
    }]
  },
  optimization: {
    minimize: true
  },
  plugins: [
  ],
  devtool: 'source-map'
}
