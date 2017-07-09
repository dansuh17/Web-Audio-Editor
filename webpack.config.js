const path = require('path');
const webpack = require('webpack');

/**
 * Running 'webpack' in script in `package.json` will automatically pick up this file.
 */
module.exports = {
  context: __dirname,
  entry: {
    index: './src/index.js',
  },
  output: {
    path: path.resolve(__dirname, './public/build'),
    filename: '[name].bundle.js',  // [name] is the entry file name
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel-loader?' + JSON.stringify({
          cacheDirectory: true,
          plugins: ['transform-class-properties', 'add-module-exports'],
          presets: ['es2015', 'stage-0'],
        })],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=100000',
      },
    ],
  },
  resolve: {
    modules: [  // files to be searched when resolving modules
      path.resolve(__dirname, './src'),
      path.resolve(__dirname, './public'),
      'node_modules'
    ],
    // automatically resolve extensions. can omit these extensions in codes
    extensions: ['.js', '.css'],
  },
  devtool: 'cheap-module-source-map',
  plugins: [
    // defines global constant at compile time
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production'),
      },
    }),
    // code uglify
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: true,
      },
    }),
    // no need to 'import' these every time
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
    }),
  ],
};
