import '../index.html';  // required for hot-loading for changes in index.html
import wavesUI from 'waves-ui';

class Tracks {
  constructor() {
    // function bindings
    this.readSingleFile = this.readSingleFile.bind(this);
    this.increaseTrackNum = this.increaseTrackNum.bind(this);
    this.decreaseTrackNum = this.decreaseTrackNum.bind(this);


    this.trackIndex = 0;
    this.container = document.getElementById('track-container');
    this.tracks = [];
  }

  createTrack() {
    const elemString = `
      <div class="row align-items-center" id="track${this.trackIndex}"
      data-trackid="${this.trackIndex}">
        <div class="col">
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-secondary">Play</button>
            <button type="button" class="btn btn-secondary">Pause</button>
            <button type="button" class="btn btn-secondary">Stop</button>
          </div>
          <input type="file" id="fileinput${this.trackIndex}"
          data-trackid="${this.trackIndex}"/>
        </div>
      </div>
      `;

    // append to the tracks container
    this.container.insertAdjacentHTML('beforeend', elemString);
    const createdTrack = document.getElementById(`track${this.trackIndex}`);

    // maintain the data as Tracks variable
    this.tracks.push(createdTrack);
    const fileInput = document.getElementById(`fileinput${this.trackIndex}`);
    // add listener to the file input button
    fileInput.addEventListener('change', this.readSingleFile, false);

    // this is how you access 'data-attribute'
    console.log(createdTrack.dataset.trackid);

    // increase track number
    this.increaseTrackNum();
  }

  increaseTrackNum() {
    this.trackIndex++;
  }

  decreaseTrackNum() {
    this.trackIndex--;
  }

  readSingleFile(e) {
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
      this.drawWave(contents, audioCtx);
    };

    reader.readAsArrayBuffer(file);
  }

  drawWave(fileArrayBuffer, audioCtx) {
    audioCtx.decodeAudioData(fileArrayBuffer, buffer => {
      var $track = document.querySelector('#track0');
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
}


const tracks = new Tracks();
tracks.createTrack();

export default Tracks;
