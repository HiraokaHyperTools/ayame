var webpack = require('webpack');
var path = require('path');
var saveLicense = require('uglify-save-license');

module.exports = {
  entry: {
    bundle: './src/js/app.ts',
    bootstrap: './src/js/bootstrap.ts'
  },
  output: {
    path: path.join(__dirname, 'node_modules'),
    filename: '[name].js'
  },
  resolve: {
    modules: [path.join(__dirname, 'node_modules')],
    extensions: ['.ts', '.webpack.js', '.web.js', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ['ts-loader']
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: require.resolve('jquery'),
        loader: 'expose-loader',
        options: {
          exposes: ['jQuery', '$']
        }
      }
    ]
  },
  optimization: {
    minimize: true
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    })
  ],
  devtool: 'source-map'
}
