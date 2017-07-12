import '../index.html';  // required for hot-loading for changes in index.html
import wavesUI from 'waves-ui';


const fileinput = document.getElementById('file-input');
fileinput.addEventListener('change', readSingleFile, false);


function readSingleFile(e) {
  const file = e.target.files[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();

  // create audio context - later will desireably become global singleton
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  reader.onload = e => {
    const contents = e.target.result;
    drawWave(contents, audioCtx);
  };

  reader.readAsArrayBuffer(file);
}


function drawWave(fileArrayBuffer, audioCtx) {
  audioCtx.decodeAudioData(fileArrayBuffer, buffer => {
    var $track = document.querySelector('#track-1');
    var width = $track.getBoundingClientRect().width;
    var height = 200;
    var duration = buffer.duration;
    // define the numbr of pixels per seconds the timeline should display
    var pixelsPerSecond = width / duration;
    // create a timeline
    var timeline = new wavesUI.core.Timeline(pixelsPerSecond, width);
    // create a new track into the `track-1` element and give it a id ('main')
    timeline.createTrack($track, height, 'main');

    // create the layer
    var waveformLayer = new wavesUI.helpers.WaveformLayer(buffer, {
      height: height
    });

    // insert the layer inside the 'main' track
    timeline.addLayer(waveformLayer, 'main');
  });
}


function component() {
  var element = document.createElement('div');
  element.innerHTML = 'Hello World';
  return element;
}

document.body.appendChild(component());
