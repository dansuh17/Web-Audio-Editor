const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const webpack = require('webpack');
const session = require('express-session');
const mongoose = require('mongoose');
const WebpackDevServer = require('webpack-dev-server');

const webpackConfig = require('./webpack.config');
const controller = require('./controllers/appController');

const app = express();

// create the uploads folder to save user-uploaded audio
if (!fs.existsSync(path.resolve(__dirname, './uploads'))) {
  fs.mkdirSync(path.resolve(__dirname, './uploads'));
}

/** * DATABASE SETUP ** */
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

const MONGO_URI = `mongodb://${DB_HOST}:${MONGOPORT}/${MONGO_COLLECTION}`;

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
app.get('/audio/:trackname', controller.audioReqByTrackName);

// receive file upload
app.post('/upload', controller.upload);

// request library information
app.get('/library/:username', controller.libraryInfo);

// return the audio upon user request on library-stored audio
app.get('/useraudio/:username/:url', controller.getAudioByUrl);

// not found message 404
app.use(controller.notFound);

// run the server on development mode
if (process.env.NODE_ENV === 'development') {
  const devPort = process.env.DEVPORT || 8080;

  const compiler = webpack(webpackConfig);
  const devServer = new WebpackDevServer(compiler, webpackConfig.devServer);

  // start listening
  devServer.listen(devPort, () => {
    console.log(`Dev Server listening on : ${devPort}`);
  });
}

// start listening
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server listening on: ${port}`);
});

// export the server for testing
module.exports = server;
