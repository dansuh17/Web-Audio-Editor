'use strict';

const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const webpack = require('webpack');
const session = require('express-session');
const mongoose = require('mongoose');

const app = express();

// path for view files
const VIEWPATH = path.resolve(__dirname, './views/');


// database settings
mongoose.connect('mongodb://localhost:38128/webaudio');
const db = mongoose.connection;
db.once('open', () => { console.log('Database connected.'); });
db.on('error', console.error.bind(console, 'connection error:'));
const Schema = mongoose.Schema;

// create a schema for the user
const userSchema = new Schema({
  username: { type: String, required: true, index: { unique: true }},
  name: { type: String },
  password: { type: String, required: true },
  library: [{
    audiotitle: String,
    url: String,
  }],
});
const User = mongoose.model('user', userSchema);  // collection name === 'users'


// body parsers & cookie parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// TODO: on session tutorial https://velopert.com/406
app.use(session({
  secret: 'webaudio-secret$$',
  resave: true,
  saveUninitialized: true,
  cookie: {
    httpOnly: false,
    secure: false,
  },
}));

// indicate static file serve directories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// set view engine to pure html
app.set('view engine', 'html');
app.set('views', './views');

// send index.html at default GET
app.get('/', (req, res, next) => {
  const sess = req.session;

  res  // test cookie
    .cookie('name', sess.name, { maxAge: 360000 })  // cookies expire after 360s
    .cookie('username', sess.username, { maxAge: 360000 })  // cookies expire after 360s
    .sendFile(path.resolve(__dirname, 'index.html'));
});

// sign-in page
app.get('/signin', (req, res) => {
  res.sendFile(path.resolve(VIEWPATH, 'signin.html'));
});

// sign-up page
app.get('/signup', (req, res) => {
  res.sendFile(path.resolve(VIEWPATH, 'signup.html'));
});

// sign-in request
app.post('/post/signin', (req, res) => {
  const username = req.body.username;

  User.findOne({ username: username }, 'username name password', (err, userDoc) => {
    if (userDoc) {
      if (userDoc.password === req.body.password) {  // check for password
        if (userDoc.name) {
          // make sure 'credentials: include' for fetch api!
          req.session.name = userDoc.name;
        } else {
          req.session.name = userDoc.username;
        }
        req.session.username = userDoc.username;
        req.session.save();
        res.status(200).send({ username });
      } else {
        res.status(420).send('Incorrect password.');
      }
    } else {
      res.status(420).send('Username does not exist.');
    }
  });
});

// signup request
app.post('/post/signup', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const name = req.body.name;

  // try to save user information, unless the username already exists
  const user = new User({
    username,
    password,
    name
  });
  user.save((err, userDoc) => {
    if (err) {
      res.status(420).send('User name already exists!');
    } else {
      res.sendStatus(200);
    }
  });
});

// logout request
app.get('/logout', (req, res) => {
  const sess = req.session;
  // if there is a user logged in, destroy the session
  if (sess.username) {
    sess.destroy(err => {
      if (err) console.error(err);
    });
  }

  res.redirect('/');
});

// request sample track
app.get('/audio/:trackname', (req, res) => {
  const trackName = req.params.trackname;
  const starcraftTrack = path.resolve(__dirname, `./public/sample_tracks/${trackName}.mp3`);
  const readStream = fs.createReadStream(starcraftTrack);
  readStream.pipe(res);

  readStream.on('end', () => {
    console.log('Reading file completed : ' + starcraftTrack);
  });
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
