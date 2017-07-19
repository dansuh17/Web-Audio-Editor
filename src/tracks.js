import wavesUI from 'waves-ui';
import AudioSourceWrapper from 'audiosource';
import cookieParser from 'cookie';


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
    this.renderWave = this.renderWave.bind(this);
    this.play = this.play.bind(this);
    this.stop = this.stop.bind(this);
    this.pause = this.pause.bind(this);
    this.downloadFile = this.downloadFile.bind(this);
    this.uploadFile = this.uploadFile.bind(this);

    this.trackIndex = 0;
    this.container = container;
    this.tracks = {};
    this.mode = 'zoom';
    this.currentTrackId = 0;

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

    for (let trackId of Object.keys(this.tracks)) {
      const timeline = this.tracks[trackId].timeline;
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
    const segmentLayer = this.tracks[trackid].segmentLayer;
    const segment = segmentLayer.items[0];

    return segmentLayer.getDatumFromItem(segment);
  }

  applyLpFilter() {
    const id = this.currentTrackId;
    this.tracks[id].audioSource.applyLpFilter();
  }

  /**
   * Create a new track. Append to the container.
   *
   * @param container container DOM obj
   */
  createTrack(container) {
    const trackId = this.trackIndex;
    const elemString = `
      <div class="row align-items-center" id="trackbox${trackId}"
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
          <button type="button" class="btn btn-secondary"
          data-trackid="${trackId}" id="download${trackId}">
            Download File
          </button>
          <button type="button" class="btn btn-secondary"
          data-trackid="${trackId}" id="upload${trackId}">
            Upload File
          </button>
        </div>
      </div>
      `;

    // indicate which track the user is now selecting

    container.insertAdjacentHTML('beforeend', elemString);
    const createdTrack = document.getElementById(`trackbox${trackId}`);
    // indicate which track the user is now selecting
    createdTrack.addEventListener('click', () => {
      this.currentTrackId = trackId;
    });

    // maintain the data as Tracks variable
    this.tracks[trackId] = { trackelem: createdTrack };

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

    const downloadFileBtn = document.getElementById(`download${trackId}`);
    downloadFileBtn.addEventListener('click', this.downloadFile, false);

    const uploadFileBtn = document.getElementById(`upload${trackId}`);
    uploadFileBtn.addEventListener('click', this.uploadFile, false);

    // increase track number
    this.increaseTrackNum();

    return trackId;
  }

  /**
   * Upload a file loaded on the track.
   * @param e event node
   */
  uploadFile(e) {
    const id = e.target.dataset.trackid;
    const file = this.tracks[id].file;

    const cookies = cookieParser.parse(document.cookie);
    if (cookies.name === 'undefined') {
      alert('You must login before you can upload files.');
      return;
    }

    // check for file existence
    if (file === undefined || file === null) {
      alert('Cannot upload file');
      return;
    }

    const data = new FormData();
    const filename = window.prompt('Please give a name to the file');
    data.append('file', file, filename);  // provide the filename
    data.append('user', cookies.name);  // send the user name also
    data.append('username', cookies.username);

    const fetchOptions = {
      // no need to set headers for using formidable.
      // https://stackoverflow.com/questions/6884382/node-js-formidable-upload-with-xhr
      credentials: 'include',
      method: 'post',
      body: data,
    };

    fetch('/upload', fetchOptions).then((res) => {
      if (res.ok) {
        alert(`Upload successful: ${filename}`);
      } else {
        throw res.statusMessage;
      }
    }).catch((err) => {
      console.err(err);
      alert(err);
    });
  }

  /**
   * Trigger file download.
   * @param e event node
   */
  downloadFile(e) {
    const id = e.target.dataset.trackid;
    // TODO: download file that the user made changes to!
    const file = this.tracks[id].file;

    if (file === undefined || file === null) {
      alert('Cannot download file.');
      return;
    }

    const pom = document.createElement('a');
    pom.setAttribute('href', URL.createObjectURL(file));
    pom.setAttribute('download', 'sample.mp3');

    // create and attach a click event to the element created - automatically start download
    if (document.createEvent) {
      const event = document.createEvent('MouseEvents');
      event.initEvent('click', true, true);
      pom.dispatchEvent(event);
    } else {
      pom.click();
    }
  }

  /**
   * Cuts out the selected region.
   */
  cutSelection() {
    const id = this.currentTrackId;
    const segmentData = this.getSegmentData(id);
    const newAudioBuffer = this.tracks[id].audioSource.cut(segmentData);
    this.eraseWave(id);
    this.renderWave(newAudioBuffer, this.audioCtx, id);  // draw the track waveform again
  }

  leaveSelection() {
    const id = this.currentTrackId;
    const segmentData = this.getSegmentData(id);
    const newAudioBuffer = this.tracks[id].audioSource.leave(segmentData);
    this.eraseWave(id);
    this.renderWave(newAudioBuffer, this.audioCtx, id);
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
   * @param e event
   */
  readSingleFile(e) {
    const file = e.target.files[0];
    const id = e.target.dataset.trackid;  // obtain track id
    if (!file) {
      return;
    }

    // store the URL
    this.tracks[id].fileUrl = URL.createObjectURL(file);
    this.tracks[id].file = file;
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
    this.tracks[id].audioSource.stop();
  }

  stopAll() {
    for (let trackId of Obj.keys(this.tracks)) {
      this.tracks[trackId].audioSource.stop();
    }
  }

  pauseAll() {
    for (let trackId of Obj.keys(this.tracks)) {
      this.tracks[trackId].audioSource.pause();
    }
  }

  playAll() {
    for (let trackId of Obj.keys(this.tracks)) {
      this.tracks[trackId].audioSource.play();
    }
  }

  /**
   * Wrapper method for AudioSourceWrapper's pause()
   * @param e event node
   */
  pause(e) {
    const id = e.target.dataset.trackid;
    this.tracks[id].audioSource.pause();
  }

  /**
   * Plays the track. Wrapper method for AudioSourceWrapper's play()
   * @param e event node
   */
  play(e) {
    const id = e.target.dataset.trackid;
    this.tracks[id].audioSource.play();
  }

  /**
   * Drawing part of creating a new wave.
   * @param audioBuffer audioBuffer to draw
   * @param audioCtx {AudioContext} audio context
   * @param trackId {number} the track id
   */
  renderWave(audioBuffer, audioCtx, trackId) {
    console.log(audioBuffer);
    const $track = document.querySelector(`#trackbox${trackId}`);
    const width = $track.getBoundingClientRect().width;
    const timeAxisHeight = 18;
    const layerHeight = 200;

    const duration = audioBuffer.duration;
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
    const waveformLayer = new wavesUI.helpers.WaveformLayer(audioBuffer, {
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
    this.tracks[trackId]['segmentLayer'] = segmentLayer;

    // cursor layer
    const cursorLayer = new wavesUI.helpers.CursorLayer({ height: layerHeight });
    cursorLayer.setTimeContext(new wavesUI.core.LayerTimeContext(timeline.timeContext));

    // create an audio source wrapper and collect
    const audioSourceWrapper = new AudioSourceWrapper({
      audioCtx,
      trackIndex: trackId,
      buffer: audioBuffer,
      source: null,
      cursorLayer,
    });
    this.tracks[trackId]['audioSource'] = audioSourceWrapper;

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

    this.tracks[trackId]['timeline'] = timeline;
    timeline.state = new wavesUI.states.CenteredZoomState(timeline);  // initial state set to zoom
  }

  /**
   * Erases the waveform given the id.
   * It essentially removes the 'svg' part that wraps the visualization.
   * @param trackId {number} track identification
   */
  eraseWave(trackId) {
    const trackBox = this.tracks[trackId].trackelem;

    // erase the wave only if there already exists visualized wave
    if (trackBox.lastChild.tagName === 'svg') {
      trackBox.removeChild(trackBox.lastChild);
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
    this.eraseWave(trackId);  // first erase the wave if already exists
    // returns AudioBuffer object as a result of decoding the audio
    audioCtx.decodeAudioData(fileArrayBuffer, buffer => {
      this.renderWave(buffer, audioCtx, trackId);
    });
  }
}


export default Tracks;
