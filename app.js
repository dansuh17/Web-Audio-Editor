'use strict';

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// body parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'html');

// set distribution path
app.use('/dist', express.static('dist'));

// send index.html
app.get('/', (req, res, next) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

// not found message
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// start listening
const port = (process.env.PORT || 3000);
app.listen(port);
console.log('Server listening on: ' + port);
