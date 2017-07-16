/**
 * Wrapper class for Web Audio API's AudioSourceNode.
 * Additional functionalities such as play, stop, pause are implemented.
 */
class AudioSourceWrapper {
  constructor(params) {
    this.id = params.trackIndex;
    this.audioCtx = params.audioCtx;
    this.buffer = params.buffer;
    this.source = params.source;
    this.cursorLayer = params.cursorLayer;
    this.startedAt = 0;
    this.pausedAt = 0;
    this.updatingCursor = false;
    this.isPlaying = false;
    this.destination = this.audioCtx.destination;
    this.filter = null;

    // methods binding to this
    this.pause = this.pause.bind(this);
    this.updateCursor = this.updateCursor.bind(this);
  }

  applyLpFilter() {
    // define the filter
    const biquadFilter = this.audioCtx.createBiquadFilter();
    biquadFilter.type = 'lowshelf';
    biquadFilter.frequency.value = 1000;
    biquadFilter.gain.value = 25;

    // connect the filter into the pipeline
    this.filter = biquadFilter;
    biquadFilter.connect(this.audioCtx.destination);
  }

  disconnectFilter() {
    this.filter.disconnect();
    this.source.connect(this.audioCtx.destination);
    this.filter = null;
  }

  updateCursor() {
    this.cursorLayer.currentPosition = this.getCurrentTime();
    this.cursorLayer.update();

    window.requestAnimationFrame(this.updateCursor);
  }

  play() {
    const newSource = this.audioCtx.createBufferSource();
    newSource.buffer = this.buffer;

    // connect the source either directly to speaker or the filter
    if (this.filter !== null) {
      newSource.connect(this.filter);
    } else {
      newSource.connect(this.audioCtx.destination);
    }

    // start from paused position (which will be 0 if newly created)
    this.source = newSource;
    this.source.start(0, this.pausedAt);
    this.startedAt = this.audioCtx.currentTime - this.pausedAt;
    this.pausedAt = 0;
    this.isPlaying = true;

    // start updating playback cursor if it has not started yet
    if (!this.updatingCursor) {
      this.updateCursor();
      this.updatingCursor = true;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source.stop();
      this.source = null;
    }

    this.pausedAt = 0;
    this.startedAt = 0;
    this.isPlaying = false;
  }

  pause() {
    const elapsed = this.audioCtx.currentTime - this.startedAt;
    this.stop();
    this.pausedAt = elapsed;
  }

  getCurrentTime() {
    if (this.pausedAt !== 0) {
      return this.pausedAt;
    } else if (this.startedAt !== 0 || this.isPlaying) {
      return this.audioCtx.currentTime - this.startedAt;
    } else {
      return 0;
    }
  }
}

export default AudioSourceWrapper;