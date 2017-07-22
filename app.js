'use strict';

const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const webpack = require('webpack');
const session = require('express-session');
const mongoose = require('mongoose');

const User = require('./models/user');

const app = express();

// path for view files
const VIEWPATH = path.resolve(__dirname, './views/');

// create the uploads folder to save user-uploaded audio
if (!fs.existsSync(path.resolve(__dirname, './uploads'))) {
  fs.mkdirSync(path.resolve(__dirname, './uploads'));
}

// database settings
mongoose.connect('mongodb://localhost:38128/webaudio');
const db = mongoose.connection;
db.once('open', () => { console.log('Database connected.'); });
db.on('error', console.error.bind(console, 'connection error:'));


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

  User.findOneByUsername(username, (err, userDoc) => {
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

// receive file upload
const formidable = require('formidable');
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
