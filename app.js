'use strict';

const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const webpack = require('webpack');
const session = require('express-session');
const mongoose = require('mongoose');
const formidable = require('formidable');

const User = require('./models/user');
const controller = require('./controllers/appController');

const app = express();

// path for view files
const VIEWPATH = path.resolve(__dirname, './views/');

// create the uploads folder to save user-uploaded audio
if (!fs.existsSync(path.resolve(__dirname, './uploads'))) {
  fs.mkdirSync(path.resolve(__dirname, './uploads'));
}

/*** DATABASE SETUP ***/
// determine host depending on environment
let DB_HOST = 'localhost';
let MONGOPORT = 38128;
let MONGO_COLLECTION = 'webaudio';

if (process.env.NODE_ENV === 'production') {
  DB_HOST = 'mongo';
  MONGOPORT = 27017;
}

if (process.env.NODE_ENV === 'test') {
  MONGO_COLLECTION = 'webuaudio-test';
}

let MONGO_URI = `mongodb://${DB_HOST}:${MONGOPORT}/${MONGO_COLLECTION}`;

// connect to database
mongoose.connect(MONGO_URI);
const db = mongoose.connection;
db.once('open', () => { console.log('Database connected.'); });
db.on('error', console.log.bind(console, 'connection error:'));

// body parsers & cookie parser middlewares
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
app.get('/', controller.getRoot);

// sign-in page
app.get('/signin', controller.signIn);

// sign-up page
app.get('/signup', controller.signUp);

// sign-in request
app.post('/post/signin', controller.postSignIn);

// signup request
app.post('/post/signup', controller.postSignUp);

// logout request
app.get('/logout', controller.logOut);

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

// receive file upload
app.post('/upload', (req, res) => {
  // needs a session being maintained (logged in)
  if (!req.session.name) {
    res.status(420).send('Session information unavailable!');
  }

  const form = new formidable.IncomingForm();
  form.uploadDir = path.resolve(__dirname, './uploads');
  form.type = true;  // keep the extension for the file being saved

  form.addListener('end', () => {
    console.log(`File upload completed: ${req.session.id}`);
    res.end();
  });

  // done reading file
  form.addListener('file', (name, file) => {
    res.status(200);
  });

  // set error
  form.addListener('error', (err) => {
    console.error(err);
    res.status(420);
  });

  // parse information about the file that has been received
  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error(err);
      return;
    }

    // save the file information in the database
    const info = {
      username: fields.username,
      audioInfo: {
        audiotitle: files.file.name,
        url: files.file.path,
      },
    };

    // add the uploaded audio's information to the user's library
    User.addAudioInfoToLibrary(info, (err, userDoc) => {
      if (err) {
        console.error(err);
      }
    });
  });
});

// request library information
app.get('/library/:username', (req, res) => {
  const username = req.params.username;
  if (username === 'undefined') {
    res.status(420).send('Must be logged in!');
    return;
  }

  // find the user information and its library
  User.findOneByUsername(username, (err, userDoc) => {
    if (err) res.status(420).end();

    if (userDoc) {
      res.json(userDoc.library);  // send the json data
    } else {
      res.status(420).send('No user information found.');
    }
  });
});

// return the audio upon user request on library-stored audio
app.get('/useraudio/:username/:url', (req, res) => {
  const username = req.params.username;
  const url = req.params.url;
  if (username === 'null') {
    res.status(420).send('The user is not logged in! (how does this happen?)');
    return;
  }

  console.log(url);
  const readStream = fs.createReadStream(url);
  readStream.pipe(res);

  readStream.on('end', () => {
    console.log('Sending library file completed : ' + url);
  });
});

// not found message
app.use(controller.notFound);

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
const server = app.listen(port, () => {
  console.log('Server listening on: ' + port);
});

// export the server for testing
module.exports = server;
