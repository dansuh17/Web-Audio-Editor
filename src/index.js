import '../index.html';  // required for hot-loading for changes in index.html
import Tracks from 'tracks';
import Toolbox from 'toolbox';
import SampleTrackLoader from 'sampletracks';
import cookieParser from 'cookie';
import Library from 'library';

// TODO: what does Symbol.iterator do???
// setup for using for-of loop for queried dom elements
NodeList.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];

// parse cookie and modify the page accordingly
const cookies = cookieParser.parse(document.cookie);
if (cookies.name !== 'undefined') {
  const signinNav = document.getElementById('signin-nav-item');
  signinNav.innerHTML = cookies.name;
  signinNav.href = '/';
  const signupNav = document.getElementById('signup-nav-item');
  signupNav.innerHTML = 'Logout';
  signupNav.href = '/logout';   // this will directly call logout api to the server
}

const container = document.getElementById('track-container');
const tracks = new Tracks(container);
const toolbox = new Toolbox(container, tracks);
const library = new Library(tracks);
library.createModalElem();
const sampleTrackLoader = new SampleTrackLoader(tracks);
