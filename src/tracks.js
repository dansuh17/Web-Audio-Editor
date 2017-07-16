import wavesUI from 'waves-ui';
import AudioSourceWrapper from 'audiosource';


class Tracks {
  /**
   * Tracks constructor.
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
    this.timelines = [];
    this.segmentLayers = [];
    this.mode = 'zoom';

    try {
      // create audio context - later will desireably become global singleton
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    } catch(e) {
      alert('This browser does not support Web Audio API!');
    }
  }

  /**
   * Toggle between zoom and selection modes.
   */
  toggleMode() {
    this.mode = this.mode === 'zoom' ? 'selection' : 'zoom';

    for (let timeline of this.timelines) {
      if (this.mode === 'zoom') {
        timeline.state = new wavesUI.states.CenteredZoomState(timeline);
      } else if (this.mode === 'selection') {
        timeline.state = new wavesUI.states.SimpleEditionState(timeline);
      } else {
        throw 'Invalid Mode for Tracks';
      }
    }
  }

  /**
   * Retrieves the data of selected segment of the track.
   * Contains duration and start time.
   *
   * @param trackid track ID
   * @returns {Object} data for the segment
   */
  getSegmentData(trackid) {
    const segmentLayer = this.segmentLayers[trackid];
    const segment = segmentLayer.items[0];

    return segmentLayer.getDatumFromItem(segment);
  }

  applyLpFilter() {
    const id = this.currentTrackId;
    this.audioSources[id].applyLpFilter();
  }

  /**
   * Create a new track. Append to the container.
   *
   * @param container container DOM obj
   */
  createTrack(container) {
    const trackId = this.trackIndex;
    const elemString = `
      <div class="row align-items-center" id="track${trackId}"
      data-trackid="${trackId}">
        <div class="col">
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-secondary"
            data-trackid="${trackId}" id="play${trackId}">
              Play
            </button>
            <button type="button" class="btn btn-secondary"
            data-trackid="${trackId}" id="pause${trackId}">
              Pause
            </button>
            <button type="button" class="btn btn-secondary"
            data-trackid="${trackId}" id="stop${trackId}">
              Stop
            </button>
          </div>
          <br />
          <label class="btn btn-info">
            <input type="file" id="fileinput${trackId}"
            data-trackid="${trackId}"/>
          </label>
        </div>
      </div>
      `;

    // indicate which track the user is now selecting

    container.insertAdjacentHTML('beforeend', elemString);
    const createdTrack = document.getElementById(`track${trackId}`);
    // indicate which track the user is now selecting
    createdTrack.addEventListener('click', () => {
      this.currentTrackId = trackId;
    });

    // maintain the data as Tracks variable
    this.tracks.push(createdTrack);

    const fileInput = document.getElementById(`fileinput${trackId}`);
    // add listener to the file input button
    fileInput.addEventListener('change', this.readSingleFile, false);

    // define play button
    const playButton = document.getElementById(`play${trackId}`);
    playButton.addEventListener('click', this.play, false);

    // define stop button
    const stopButton = document.getElementById(`stop${trackId}`);
    stopButton.addEventListener('click', this.stop, false);

    // define pause button
    const pauseButton = document.getElementById(`pause${trackId}`);
    pauseButton.addEventListener('click', this.pause, false);

    // increase track number
    this.increaseTrackNum();

    return trackId;
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

  /**
   * Create a new track provided a buffer.
   */
  createTrackForBuffer(arrayBuffer) {
    const trackId = this.createTrack(this.container);
    this.drawWave(arrayBuffer, this.audioCtx, trackId);
  }

  /**
   * Wrapper method for AudioSourceWrapper's stop()
   * @param e event node
   */
  stop(e) {
    const id = e.target.dataset.trackid;
    this.audioSources[id].stop();
  }

  stopAll() {
    for (let source of this.audioSources) {
      source.stop();
    }
  }

  pauseAll() {
    for (let source of this.audioSources) {
      source.pause();
    }
  }

  playAll() {
    for (let source of this.audioSources) {
      source.play();
    }
  }

  /**
   * Wrapper method for AudioSourceWrapper's pause()
   * @param e event node
   */
  pause(e) {
    const id = e.target.dataset.trackid;
    this.audioSources[id].pause();
  }

  /**
   * Plays the track. Wrapper method for AudioSourceWrapper's play()
   * @param e event node
   */
  play(e) {
    const id = e.target.dataset.trackid;
    this.audioSources[id].play();
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

      // // bpm grid axis
      // const grid = new wavesUI.axis.AxisLayer(wavesUI.axis.gridAxisGenerator(138, '4/4'), {
      //   height: layerHeight,
      //   top: timeAxisHeight
      // });
      //
      // // create grids
      // grid.setTimeContext(timeline.timeContext);
      // grid.configureShape(wavesUI.shapes.Ticks, {}, { color: 'green' });

      // waveform layer
      const waveformLayer = new wavesUI.helpers.WaveformLayer(buffer, {
        height: layerHeight,
        top: timeAxisHeight
      });

      waveformLayer.setTimeContext(new wavesUI.core.LayerTimeContext(timeline.timeContext));

      // segment layer
      const segmentData = [{
        start: 1,
        duration: 2,
        color: 'orange',
        text: 'selection',
      }];
      const segmentLayer = new wavesUI.core.Layer('collection', segmentData, {
        height: layerHeight,
      });
      segmentLayer.setTimeContext(new wavesUI.core.LayerTimeContext(timeline.timeContext));
      segmentLayer.configureShape(wavesUI.shapes.AnnotatedSegment, {
        x: function(d, v) {
          if (v !== undefined) { d.start = v; }
          return d.start;
        },
        width: function(d, v) {
          if (v !== undefined) { d.duration = v; }
          return d.duration;
        }
      });
      segmentLayer.setBehavior(new wavesUI.behaviors.SegmentBehavior());
      this.segmentLayers.push(segmentLayer);

      // cursor layer
      const cursorLayer = new wavesUI.helpers.CursorLayer({ height: layerHeight });
      cursorLayer.setTimeContext(new wavesUI.core.LayerTimeContext(timeline.timeContext));

      // create an audio source wrapper and collect
      const audioSourceWrapper = new AudioSourceWrapper({
        audioCtx,
        trackIndex: trackId,
        buffer,
        source: null,
        cursorLayer,
      });
      this.audioSources.push(audioSourceWrapper);

      // add layers to tracks
      track.add(cursorLayer);
      track.add(timeAxis);
      // track.add(grid);
      track.add(waveformLayer);
      track.add(segmentLayer);

      track.render();
      track.update();

      timeline.tracks.render();
      timeline.tracks.update();

      this.timelines.push(timeline);
      timeline.state = new wavesUI.states.CenteredZoomState(timeline);  // initial state set to zoom
    });
  }
}


export default Tracks;
