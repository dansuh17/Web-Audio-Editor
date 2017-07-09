'use strict';

const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const mongoose = require('mongoose');

// routes
const indexRoute = require('./routes/index');

const app = express();

// Connect to MongoDB server on localhost, db name to be changed
// mongoose.connect('mongodb://127.0.0.1:27017/mongodb_tutorial');
// const conn = mongoose.connection;

// view engine setup
// indicates where the view files are located
app.set('views', path.join(__dirname, 'views'));
// sets the ejs engine to render .html files
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// set logger
app.use(logger('dev'));

// body parsers and cookies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['CMPS115TeamFive'],
  maxAge: 3600000,
}));

// indicate the location of static files
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.use('/', indexRoute);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// export express app
module.exports = app;
