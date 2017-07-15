import wavesUI from 'waves-ui';


class Tracks {
  /**
   * Tracks constructor.
   *
   * @param container the container DOM object
   */
  constructor(container) {
    // function bindings
    this.readSingleFile = this.readSingleFile.bind(this);
    this.increaseTrackNum = this.increaseTrackNum.bind(this);
    this.decreaseTrackNum = this.decreaseTrackNum.bind(this);
    this.play = this.play.bind(this);
    this.stop = this.stop.bind(this);
    this.pause = this.pause.bind(this);

    this.trackIndex = 0;
    this.container = container;
    this.tracks = [];
    this.audioSources = [];
    this.buffers = [];
    this.startedAt = [];
    this.pausedAt = [];

    try {
      // create audio context - later will desireably become global singleton
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    } catch(e) {
      alert('This browser does not support Web Audio API!');
    }
  }

  /**
   * Create a new track. Append to the container.
   *
   * @param container container DOM obj
   */
  createTrack(container) {
    const elemString = `
      <div class="row align-items-center" id="track${this.trackIndex}"
      data-trackid="${this.trackIndex}">
        <div class="col">
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-secondary"
            data-trackid="${this.trackIndex}" id="play${this.trackIndex}">
              Play
            </button>
            <button type="button" class="btn btn-secondary"
            data-trackid="${this.trackIndex}" id="pause${this.trackIndex}">
              Pause
            </button>
            <button type="button" class="btn btn-secondary"
            data-trackid="${this.trackIndex}" id="stop${this.trackIndex}">
              Stop
            </button>
          </div>
          <input type="file" id="fileinput${this.trackIndex}"
          data-trackid="${this.trackIndex}"/>
        </div>
      </div>
      `;

    // append to the tracks container
    container.insertAdjacentHTML('beforeend', elemString);
    const createdTrack = document.getElementById(`track${this.trackIndex}`);

    // maintain the data as Tracks variable
    this.tracks.push(createdTrack);
    const fileInput = document.getElementById(`fileinput${this.trackIndex}`);
    // add listener to the file input button
    fileInput.addEventListener('change', this.readSingleFile, false);

    // define play button
    const playButton = document.getElementById(`play${this.trackIndex}`);
    playButton.addEventListener('click', this.play, false);

    // define stop button
    const stopButton = document.getElementById(`stop${this.trackIndex}`);
    stopButton.addEventListener('click', this.stop, false);

    // define pause button
    const pauseButton = document.getElementById(`pause${this.trackIndex}`);
    pauseButton.addEventListener('click', this.pause, false);

    // increase track number
    this.increaseTrackNum();
  }

  /**
   * Increase track number.
   */
  increaseTrackNum() {
    this.trackIndex++;
  }

  /**
   * Increase track number.
   */
  decreaseTrackNum() {
    this.trackIndex--;
  }

  /**
   * Reads a file when the user uploads an audio file. Then triggers to draw the viz.
   *
   * @param e event
   */
  readSingleFile(e) {
    const file = e.target.files[0];
    const id = e.target.dataset.trackid;  // obtain track id
    if (!file) {
      return;
    }
    const reader = new FileReader();

    // when the load is complete, draw the id
    reader.onload = e => {
      const contents = e.target.result;
      this.drawWave(contents, this.audioCtx, id);
    };

    reader.readAsArrayBuffer(file);
  }

  stop(e) {
    const id = e.target.dataset.trackid;
    this.audioSources[id].stop();

    this.pausedAt[id] = -1;
    this.startedAt[id] = -1;
  }

  pause(e) {
    const id = e.target.dataset.trackid;
    if (this.startedAt[id] === -1) {
      return;
    }

    this.audioSources[id].stop(0);
    // then this will fire 'ended' event on the source node
  }

  /**
   * Plays the track.
   *
   * @param e event node
   */
  play(e) {
    const id = e.target.dataset.trackid;
    // the source node should be created again for every play
    this.audioSources[id].disconnect();

    // create a new AudioBufferSource
    const source = this.audioCtx.createBufferSource();
    source.buffer = this.buffers[id];

    // when ended, set the timers all to default values
    source.addEventListener('ended', (e) => {
      // record the 'end' time - whether it is natural ending or paused ending
      this.pausedAt[id] = Date.now() - this.startedAt[id];
    });

    this.audioSources[id] = source;
    source.connect(this.audioCtx.destination);

    // play!
    if (this.pausedAt[id] === -1 || source.buffer.duration <= this.pausedAt[id] / 1000) {
      this.startedAt[id] = Date.now();
      this.audioSources[id].start(0);
    } else {
      this.startedAt[id] = Date.now() - this.pausedAt[id];
      this.audioSources[id].start(0, this.pausedAt[id] / 1000);
    }
  }

  /**
   * Draws the waveform for the uploaded audio file.
   *
   * @param fileArrayBuffer{ArrayBuffer} array buffer for the audio
   * @param audioCtx{AudioContext} audio context
   * @param trackId{int} the track id number
   */
  drawWave(fileArrayBuffer, audioCtx, trackId) {
    // returns AudioBuffer object as a result of decoding the audio
    audioCtx.decodeAudioData(fileArrayBuffer, buffer => {
      // create audio source
      const audioSource = audioCtx.createBufferSource();
      audioSource.buffer = buffer;
      this.buffers.push(buffer);
      this.audioSources.push(audioSource);
      this.startedAt.push(-1);
      this.pausedAt.push(-1);
      this.audioSources[trackId].connect(audioCtx.destination);

      // define track
      const $track = document.querySelector(`#track${trackId}`);
      const width = $track.getBoundingClientRect().width;
      const timeAxisHeight = 18;
      const layerHeight = 200;

      const duration = buffer.duration;
      const pixelsPerSecond = width / duration;

      // create timeline and track
      const timeline = new wavesUI.core.Timeline(pixelsPerSecond, width);
      const track = new wavesUI.core.Track($track, layerHeight + timeAxisHeight);
      timeline.add(track);  // adds the track to the timeline

      // time axis
      const timeAxis = new wavesUI.axis.AxisLayer(wavesUI.axis.timeAxisGenerator(), {
        height: timeAxisHeight
      });

      // Axis layers use `timeline.TimeContext` directly,
      // they don't have their own timeContext
      timeAxis.setTimeContext(timeline.timeContext);
      timeAxis.configureShape(wavesUI.shapes.Ticks, {}, { color: 'steelblue' });

      // bpm axis
      const grid = new wavesUI.axis.AxisLayer(wavesUI.axis.gridAxisGenerator(138, '4/4'), {
        height: layerHeight,
        top: timeAxisHeight
      });

      // create grids
      grid.setTimeContext(timeline.timeContext);
      grid.configureShape(wavesUI.shapes.Ticks, {}, { color: 'green' });

      // waveform layer
      const waveformLayer = new wavesUI.helpers.WaveformLayer(buffer, {
        height: layerHeight,
        top: timeAxisHeight
      });

      waveformLayer.setTimeContext(new wavesUI.core.LayerTimeContext(timeline.timeContext));

      // cursor layer
      const cursorLayer = new wavesUI.helpers.CursorLayer({ height: layerHeight });
      cursorLayer.setTimeContext(new wavesUI.core.LayerTimeContext(timeline.timeContext));

      track.add(cursorLayer);
      track.add(timeAxis);
      track.add(grid);
      track.add(waveformLayer);

      track.render();
      track.update();

      timeline.tracks.render();
      timeline.tracks.update();

      timeline.state = new wavesUI.states.CenteredZoomState(timeline);

      // this is how you update the position of cursorLayer
      (function loop() {
        let currentTime = new Date().getTime() / 1000;
        cursorLayer.currentPosition = currentTime % duration;
        cursorLayer.update();

        requestAnimationFrame(loop);
      }());
    });
  }
}


export default Tracks;
