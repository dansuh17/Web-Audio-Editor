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
    this.changeVolume = this.changeVolume.bind(this);
    this.changePlayRate = this.changePlayRate.bind(this);
    this.downloadFile = this.downloadFile.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.applyBiquadFilter = this.applyBiquadFilter.bind(this);
    this.applyReverb = this.applyReverb.bind(this);
    Tracks.setModeForTimeline = Tracks.setModeForTimeline.bind(this);

    this.trackIndex = 0;
    this.container = container;
    this.tracks = {};
    this.mode = 'zoom';
    this.currentTrackId = 0;
    this.cutBuffer = null;

    try {
      // create audio context - later will desireably become global singleton
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    } catch (e) {
      alert('This browser does not support Web Audio API!');
    }
  }

  /**
   * Toggle between zoom and selection modes.
   */
  toggleMode() {
    this.mode = (this.mode === 'zoom') ? 'selection' : 'zoom';

    Object.keys(this.tracks).forEach((trackId) => {
      const timeline = this.tracks[trackId].timeline;
      Tracks.setModeForTimeline(timeline, this.mode);
    });
  }

  /**
   * Given the timeline instance, set the view state according to the mode.
   * @param timeline {Timeline} the track's timeline
   * @param mode {String} the mode string
   */
  static setModeForTimeline(timeline, mode) {
    if (mode === 'zoom') {
      // eslint-disable-next-line no-param-reassign
      timeline.state = new wavesUI.states.CenteredZoomState(timeline);
    } else if (mode === 'selection') {
      // eslint-disable-next-line no-param-reassign
      timeline.state = new wavesUI.states.SimpleEditionState(timeline);
    } else {
      throw new function InvalidTrackMode(message) {
        this.message = message;
        this.name = 'Invalid Track Mode Exception';
      }('Invalid Mode for Tracks');
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

  applyBiquadFilter(type, freq, gain) {
    const id = this.currentTrackId;
    this.tracks[id].audioSource.applyBiquadFilter(type, freq, gain);
  }

  fadeIn() {
    const id = this.currentTrackId;
    const newAudioBuffer = this.tracks[id].audioSource.fadeIn();
    this.eraseWave(id);
    this.renderWave(newAudioBuffer, this.audioCtx, id);
  }

  fadeOut() {
    const id = this.currentTrackId;
    const newAudioBuffer = this.tracks[id].audioSource.fadeOut();
    this.eraseWave(id);
    this.renderWave(newAudioBuffer, this.audioCtx, id);
  }

  disconnectFilter() {
    const id = this.currentTrackId;
    this.tracks[id].audioSource.disconnectFilter();
  }

  /**
   * Create a new track. Append to the container.
   *
   * @param container container DOM obj
   */
  createTrack(container) {
    const trackId = this.trackIndex;
    const elemString = `
      <div class="row align-items-center"
      data-trackid="${trackId}">
        <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-secondary"
            data-trackid="${trackId}" id="play${trackId}">
              <i class="fa fa-play" data-trackid="${trackId}"></i>
            </button>
            <button type="button" class="btn btn-secondary"
            data-trackid="${trackId}" id="pause${trackId}">
              <i class="fa fa-pause" data-trackid="${trackId}"></i>
            </button>
            <button type="button" class="btn btn-secondary"
            data-trackid="${trackId}" id="stop${trackId}">
              <i class="fa fa-stop" data-trackid="${trackId}"></i>
            </button>
            <button type="button" class="btn btn-secondary"
            data-trackid="${trackId}" id="download${trackId}">
              <i class="fa fa-download" data-trackid="${trackId}"></i> Download
            </button>
            <button type="button" class="btn btn-secondary"
            data-trackid="${trackId}" id="upload${trackId}">
              <i class="fa fa-upload" data-trackid="${trackId}"></i> Upload
            </button>
          </div>
        </div>
        <div class="col-lg-2 col-md-2 col-sm-12 col-xs-12" data-trackid="${trackId}">
          <div class="row">
            <div class="col-lg-6 col-md-6">
              <div style="margin-bottom: 20px;">
                <input type="range" id="volumeSlider${trackId}" data-trackid="${trackId}"
                       value="50" min="0" max="100" step="1"
                       style="width: 80px; height: auto; transform: rotate(-90deg);"/>
              </div>
              <p>volume</p>
            </div>
            <div class="col-lg-6 col-md-6">
              <div style="margin-bottom: 20px;">
                <input type="range" id="playRate${trackId}" data-trackid="${trackId}"
                       value="1" min="0.25" max="3" step="0.25"
                       style="width: 80px; height: auto; transform: rotate(-90deg);"/>
              </div>
              <p>playrate</p>
            </div>
          </div>
          <!-- file input section: do not show the file input tag, but the button delegates the click -->
          <input type="file" id="fileinput${trackId}" class="form-control-file" style="display: none;"
            data-trackid="${trackId}" />
          <button type="button" class="btn btn-sm btn-secondary"
                  onclick="document.getElementById('fileinput${trackId}').click()">
            <i class="fa fa-file-audio-o"></i> File
          </button>
        </div>
        <div class="col-lg-10 col-md-10 col-sm-12 col-xs-12" id="trackbox${trackId}"
             data-trackid="${trackId}">
          <!-- track waveform visualization goes here -->
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

    const volumeSlider = document.getElementById(`volumeSlider${trackId}`);
    volumeSlider.addEventListener('change', this.changeVolume, false);

    const speedSlider = document.getElementById(`playRate${trackId}`);
    speedSlider.addEventListener('change', this.changePlayRate, false);

    // increase track number
    this.increaseTrackNum();

    return trackId;
  }

  changePlayRate(e) {
    const id = e.target.dataset.trackid;
    const rate = e.target.value;

    this.tracks[id].audioSource.setPlayRate(rate);
  }

  /**
   * Change the volume of the track.
   * @param e event node
   */
  changeVolume(e) {
    const id = e.target.dataset.trackid;
    const volume = e.target.value;

    this.tracks[id].audioSource.setVolume(volume);
  }

  /**
   * Upload a file loaded on the track.
   * @param e event node
   */
  uploadFile(e) {
    const id = e.target.dataset.trackid;
    const file = this.tracks[id].file;

    // check the cookies to see if the user is logged in
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
    if (filename === null || filename === undefined) {
      return;
    }
    data.append('file', file, filename); // provide the filename
    data.append('user', cookies.name); // send the user name also
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
    const result = this.tracks[id].audioSource.cut(segmentData);
    this.cutBuffer = result.cutBuffer;

    this.eraseWave(id);
    this.renderWave(result.newBuffer, this.audioCtx, id); // draw the track waveform again
  }

  /**
   * Leaves the selection and cut out everything else.
   */
  leaveSelection() {
    const id = this.currentTrackId;
    const segmentData = this.getSegmentData(id);
    const newAudioBuffer = this.tracks[id].audioSource.leave(segmentData);
    this.eraseWave(id);
    this.renderWave(newAudioBuffer, this.audioCtx, id);
  }

  /**
   * Copies the selection and save to variable.
   */
  copySelection() {
    const id = this.currentTrackId;
    const segmentData = this.getSegmentData(id);
    this.cutBuffer = this.tracks[id].audioSource.copy(segmentData);
  }

  /**
   * Apply reverb to the track.
   */
  applyReverb() {
    const id = this.currentTrackId;
    this.tracks[id].audioSource.applyReverb();
  }

  /**
   * Paste the cutout buffer to the current selection.
   */
  paste() {
    if (!this.cutBuffer) {
      return;
    }

    const id = this.currentTrackId;
    const segmentData = this.getSegmentData(id);
    const newBuffer = this.tracks[id].audioSource.paste(segmentData, this.cutBuffer);

    if (newBuffer !== null) {
      this.eraseWave(id);
      this.renderWave(newBuffer, this.audioCtx, id);
    }
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
    const id = e.target.dataset.trackid; // obtain track id
    if (!file) {
      return;
    }

    // store the URL
    this.tracks[id].fileUrl = URL.createObjectURL(file);
    this.tracks[id].file = file;
    const reader = new FileReader();

    // when the load is complete, draw the id
    reader.onload = (loadEvent) => {
      const contents = loadEvent.target.result;
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

  stopAll() {
    Object.keys(this.tracks).forEach((trackId) => {
      this.tracks[trackId].audioSource.stop();
    });
  }

  pauseAll() {
    Object.keys(this.tracks).forEach((trackId) => {
      this.tracks[trackId].audioSource.pause();
    });
  }

  playAll() {
    Object.keys(this.tracks).forEach((trackId) => {
      this.tracks[trackId].audioSource.play();
    });
  }

  /**
   * Wrapper method for AudioSourceWrapper's stop()
   * @param e event node
   */
  stop(e) {
    const id = e.target.dataset.trackid;
    this.tracks[id].audioSource.stop();
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
    const $track = document.querySelector(`#trackbox${trackId}`);
    const width = $track.getBoundingClientRect().width;
    const timeAxisHeight = 18;
    const layerHeight = 200;

    const duration = audioBuffer.duration;
    const pixelsPerSecond = width / duration;

    // create timeline and track
    const timeline = new wavesUI.core.Timeline(pixelsPerSecond, width);
    const track = new wavesUI.core.Track($track, layerHeight + timeAxisHeight);
    timeline.add(track); // adds the track to the timeline

    // time axis
    const timeAxis = new wavesUI.axis.AxisLayer(wavesUI.axis.timeAxisGenerator(), {
      height: timeAxisHeight,
    });

    // Axis layers use `timeline.TimeContext` directly,
    // they don't have their own timeContext
    timeAxis.setTimeContext(timeline.timeContext);
    timeAxis.configureShape(wavesUI.shapes.Ticks, {}, { color: 'steelblue' });

    // waveform layer
    const waveformLayer = new wavesUI.helpers.WaveformLayer(audioBuffer, {
      height: layerHeight,
      top: timeAxisHeight,
    });

    waveformLayer.setTimeContext(new wavesUI.core.LayerTimeContext(timeline.timeContext));

    // segment layer
    const segmentData = [{
      start: 1,
      duration: 2,
      color: 'orange',
      text: '', // no label
    }];
    const segmentLayer = new wavesUI.core.Layer('collection', segmentData, {
      height: layerHeight,
    });
    segmentLayer.setTimeContext(new wavesUI.core.LayerTimeContext(timeline.timeContext));
    segmentLayer.configureShape(wavesUI.shapes.AnnotatedSegment, {
      x(d, v) {
        if (v !== undefined) { d.start = v; }
        return d.start;
      },
      width(d, v) {
        if (v !== undefined) { d.duration = v; }
        return d.duration;
      },
    });
    segmentLayer.setBehavior(new wavesUI.behaviors.SegmentBehavior());
    this.tracks[trackId].segmentLayer = segmentLayer;

    // cursor layer
    const cursorLayer = new wavesUI.helpers.CursorLayer({ height: layerHeight });
    cursorLayer.setTimeContext(new wavesUI.core.LayerTimeContext(timeline.timeContext));

    // create an audio source wrapper and collect
    this.tracks[trackId].audioSource = new AudioSourceWrapper({
      audioCtx,
      trackIndex: trackId,
      buffer: audioBuffer,
      source: null,
      cursorLayer,
    });

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

    this.tracks[trackId].timeline = timeline;

    // set the timeline view mode - either 'selection', or 'zoom'
    Tracks.setModeForTimeline(timeline, this.mode);
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
    this.eraseWave(trackId); // first erase the wave if already exists
    // returns AudioBuffer object as a result of decoding the audio
    audioCtx.decodeAudioData(fileArrayBuffer, (buffer) => {
      this.renderWave(buffer, audioCtx, trackId);
    });
  }
}

export default Tracks;
