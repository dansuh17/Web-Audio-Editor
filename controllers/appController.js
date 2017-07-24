const path = require('path');
const fs = require('fs');
const formidable = require('formidable');

const User = require('../models/user');

const ROOTPATH = path.resolve(__dirname, '../');
const VIEWPATH = path.resolve(ROOTPATH, './views');

// GET call on root '/'
function getRoot(req, res) {
  const sess = req.session;
  res
    .cookie('name', sess.name, { maxAge: 360000 })
    .cookie('username', sess.username, { maxAge: 360000 })
    .status(200)
    .sendFile(path.resolve(ROOTPATH, 'index.html'));
}

// signin page
function signIn(req, res) {
  res.status(200).sendFile(path.resolve(VIEWPATH, 'signin.html'));
}

// signup page
function signUp(req, res) {
  res.status(200).sendFile(path.resolve(VIEWPATH, 'signup.html'));
}

// signup authentication
function postSignIn(req, res) {
  function checkCredentials(error, userDoc) {
    if (userDoc) {
      if (userDoc.password === req.body.password) { // check for password
        if (userDoc.name) {
          // make sure 'credentials: include' for fetch api!
          req.session.name = userDoc.name;
        } else {
          req.session.name = userDoc.username;
        }
        req.session.username = userDoc.username;
        req.session.save();
        const username = userDoc.username;
        res.status(200).send({ username });
      } else {
        res.status(420).send('Incorrect password.');
      }
    } else {
      res.status(420).send('Username does not exist.');
    }
  }

  const username = req.body.username;
  User.findOneByUsername(username, checkCredentials);
}

// signup database save
function postSignUp(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const name = req.body.name;

  // try to save user information, unless the username already exists
  const user = new User({
    username,
    password,
    name,
  });

  user.save((err, userDoc) => {
    if (err) {
      res.status(420).send('User name already exists!');
    } else {
      res.status(200).send(userDoc.username);
    }
  });
}

// logout
function logOut(req, res) {
  const sess = req.session;
  // if there is a user logged in, destroy the session
  if (sess.username) {
    sess.destroy((err) => {
      if (err) console.error(err);
    });
  }

  res.redirect('/');
}

// request audio file by track name
function audioReqByTrackName(req, res) {
  const trackName = req.params.trackname;
  const starcraftTrack = path.resolve(__dirname, `../public/sample_tracks/${trackName}.mp3`);
  const readStream = fs.createReadStream(starcraftTrack);
  readStream.pipe(res);

  readStream.on('end', () => {
    res.end();
    console.log(`Reading file completed : ${starcraftTrack}`);
  });
}

// upload a user-uploaded file
function upload(req, res) {
  // needs a session being maintained (logged in)
  if (!req.session.name) {
    res.status(420).send('Session information unavailable!');
    return;
  }

  const form = new formidable.IncomingForm();
  form.uploadDir = path.resolve(__dirname, '../uploads');
  form.type = true; // keep the extension for the file being saved

  form.addListener('end', () => {
    console.log(`File upload completed: ${req.session.id}`);
    res.end();
  });

  // done reading file
  form.addListener('file', () => {
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
    User.addAudioInfoToLibrary(info, (error) => {
      if (error) {
        console.error(error);
      }
    });
  });
}

// retrieve library information
function libraryInfo(req, res) {
  const username = req.params.username;
  if (username === 'undefined') {
    res.status(420).send('Must be logged in!');
    return;
  }

  // find the user information and its library
  User.findOneByUsername(username, (err, userDoc) => {
    if (err) res.status(420).end();

    if (userDoc) {
      res.json(userDoc.library); // send the json data
    } else {
      res.status(420).send('No user information found.');
    }
  });
}

// the user retrieves the audio file to the client
// the user can later download it or create a track with it
function getAudioByUrl(req, res) {
  const username = req.params.username;
  const url = req.params.url;
  if (username === 'null') {
    res.status(420).send('The user is not logged in! (how does this happen?)');
    return;
  }

  const readStream = fs.createReadStream(url);
  readStream.pipe(res);

  readStream.on('end', () => {
    console.log(`Sending library file completed : ${url}`);
  });
}

// 404
function notFound(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
}

// export
module.exports = {
  getRoot,
  signIn,
  signUp,
  postSignIn,
  postSignUp,
  logOut,
  notFound,
  audioReqByTrackName,
  upload,
  libraryInfo,
  getAudioByUrl,
};
