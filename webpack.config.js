const path = require('path');
const webpack = require('webpack');

const DIST_PATH = path.resolve(__dirname, 'dist');

module.exports = {
  context: __dirname,  // working directory
  entry: {
    index: './src/index.js',
  },
  output: {
    filename: '[name].bundle.js',  // [name] is the entry key
    path: DIST_PATH,  // output path
    publicPath: '/public/',  // location of static files that would be requested
  },
  devtool: 'cheap-eval-source-map',
  devServer: {
    port: 8080,
    hot: true,  // tell the dev server to use HMR
    overlay: {
      warnings: true,
      errors: true,
    },
    publicPath: '/dist',  // contents from webpack served from HERE
  },
  resolve: {
    extensions: [".js"],
  },
  module: {
    loaders: [
      {
        test: /\.html$/,
        loader: 'html-loader',
      },
      {
        test: /\.(jpg|mp3)$/,
        loader: 'file-loader',
      },
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()  // Enable HMR
  ],
};
