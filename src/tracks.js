import wavesUI from 'waves-ui';


class Tracks {
  constructor(container) {
    // function bindings
    this.readSingleFile = this.readSingleFile.bind(this);
    this.increaseTrackNum = this.increaseTrackNum.bind(this);
    this.decreaseTrackNum = this.decreaseTrackNum.bind(this);


    this.trackIndex = 0;
    this.container = container;
    this.tracks = [];
  }

  createTrack(container) {
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
    container.insertAdjacentHTML('beforeend', elemString);
    const createdTrack = document.getElementById(`track${this.trackIndex}`);

    // maintain the data as Tracks variable
    this.tracks.push(createdTrack);
    const fileInput = document.getElementById(`fileinput${this.trackIndex}`);
    // add listener to the file input button
    fileInput.addEventListener('change', this.readSingleFile, false);

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
    const id = e.target.dataset.trackid;  // obtain track id
    if (!file) {
      return;
    }
    const reader = new FileReader();

    // create audio context - later will desireably become global singleton
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();

    // when the load is complete, draw the id
    reader.onload = e => {
      const contents = e.target.result;
      this.drawWave(contents, audioCtx, id);
    };

    reader.readAsArrayBuffer(file);
  }

  drawWave(fileArrayBuffer, audioCtx, trackId) {
    audioCtx.decodeAudioData(fileArrayBuffer, buffer => {
      const $track = document.querySelector(`#track${trackId}`);
      const width = $track.getBoundingClientRect().width;
      const timeAxisHeight = 18;
      const layerHeight = 200;

      const duration = buffer.duration;
      const pixelsPerSecond = width / duration;

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

      track.add(timeAxis);
      track.add(grid);
      track.add(waveformLayer);

      track.render();
      track.update();

      timeline.tracks.render();
      timeline.tracks.update();

      timeline.state = new wavesUI.states.CenteredZoomState(timeline);
    });
  }
}


export default Tracks;
