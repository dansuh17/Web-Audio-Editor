import '../index.html';  // required for hot-loading for changes in index.html
import Tracks from 'tracks';
import Toolbox from 'toolbox';
import SampleTrackLoader from 'sampletracks';

// TODO: what does Symbol.iterator do???
// setup for using for-of loop for queried dom elements
NodeList.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];

const container = document.getElementById('track-container');
const tracks = new Tracks(container);
const toolbox = new Toolbox(container, tracks);
const sampleTrackLoader = new SampleTrackLoader(tracks);
