const path = require('path');

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
};
