var webpack = require('webpack');
var path = require('path');
var saveLicense = require('uglify-save-license');

module.exports = {
  entry: {
    app: './src/js/app.ts'
  },
  output: {
    path: path.join(__dirname, 'node_modules'),
    filename: 'bundle.js'
  },
  resolve: {
    modules: [path.join(__dirname, 'node_modules')],
    extensions: ['.ts', '.webpack.js', '.web.js', '.js']
  },
  module: {
    rules: [{
      test: /\.ts$/,
      use: ['ts-loader']
    },{
      test: /\.js$/,
      use: 'babel-loader',
      exclude: /node_modules/
    }]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      output: {
        comments: saveLicense
      }
    })
  ],
  devtool: 'source-map'
}
