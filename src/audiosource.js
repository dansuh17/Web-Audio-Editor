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

    // methods binding to this
    this.pause = this.pause.bind(this);
    this.updateCursor = this.updateCursor.bind(this);
  }

  updateCursor() {
    this.cursorLayer.currentPosition = this.getCurrentTime();
    this.cursorLayer.update();

    window.requestAnimationFrame(this.updateCursor);
  }

  play() {
    const newSource = this.audioCtx.createBufferSource();
    newSource.buffer = this.buffer;
    newSource.connect(this.audioCtx.destination);
    this.source = newSource;

    this.source.start(0, this.pausedAt);
    this.startedAt = this.audioCtx.currentTime - this.pausedAt;
    this.pausedAt = 0;
    this.isPlaying = true;

    // start updating cursor if it has not started yet
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