const express = require('express');
const router = express.Router();

/* GET home page */
router.get('/', (req, res, next) => {
  let workspaceId = req.body.workspaceId;
  if (typeof workspaceId === 'undefined') {
    workspaceId = '';
  }

  let username = req.session.username;
  let isLoggedIn = true;
  if (typeof username === 'undefined') {
    username = '';
    isLoggedIn = false;
  }

  // pass on variables for ejs templates
  res.render('index', {
    title: 'Web Audio Editor',
    username,
    isLoggedIn,
    workspaceId,
  });
});

module.exports = router;
