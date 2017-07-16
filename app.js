'use strict';

const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const webpack = require('webpack');

const app = express();

// body parsers & cookie parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// indicate static file serve directories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// set view engine to pure html
app.set('view engine', 'html');

// send index.html at default GET
app.get('/', (req, res, next) => {
  res  // test cookie
    .cookie('name', 'dansuh', { maxAge: 360000 })  // cookies expire after 360s
    .sendFile(path.resolve(__dirname, 'index.html'));
});

// not found message
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// run the server on development mode
if (process.env.NODE_ENV === 'development') {
  const devPort = process.env.DEVPORT || 8080;

  const webpackDevServer = require('webpack-dev-server');
  const webpackConfig = require('./webpack.config');
  const compiler = webpack(webpackConfig);
  const devServer = new webpackDevServer(compiler, webpackConfig.devServer);

  // start listening
  devServer.listen(devPort, () => {
    console.log('Dev Server listening on : ' + devPort);
  });
}

// start listening
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Server listening on: ' + port);
});
