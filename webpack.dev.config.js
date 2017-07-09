const path = require('path');
const webpack = require('webpack');

module.exports = {
  context: __dirname,
  entry: {
    index: [
      './src/index.js',
      'webpack/hot/only-dev-server',
      'webpack-dev-server/client?http://0.0.0.0:4000',
    ],
  },
  output: {
    path: '/build',
    filename: '[name].bundle.js',  // uses entry name
    publicPath: '/build/',
  },
  devServer: {
    hot: true,
    publicPath: '/build',
    filename: '[name].bundle.js',
    historyApiFallback: true,
    contentBase: '/public',
    proxy: {
      '*': 'http://localhost:4001',
    },
    stats: {
      assets: false,
      colors: true,
      version: false,
      hash: false,
      timings: false,
      chunks: false,
      chunkModules: false,
    },
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
    modules: [path.resolve(__dirname, './src'), path.resolve(__dirname, './public'), 'node_modules'],
    extensions: ['.js', '.css'],
  },
  devtool: 'cheap-module-eval-source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production'),
      },
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: true,
      },
    }),
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
};
