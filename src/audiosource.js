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

  /**
   * Apply low-pass filter to the entire audio source.
   */
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

  /**
   * Disconnects the filter from the destination.
   */
  disconnectFilter() {
    this.filter.disconnect();
    this.source.connect(this.audioCtx.destination);
    this.filter = null;
  }

  /**
   * Update the cursor's position according to current playback time.
   */
  updateCursor() {
    this.cursorLayer.currentPosition = this.getCurrentTime();
    this.cursorLayer.update();

    window.requestAnimationFrame(this.updateCursor);
  }

  /**
   * Play the source buffer. Web Audio API forces to create new AudioBufferSource
   * for every playback. Once it begins playing, it cannot be played again,
   * although stop() can be called multiple times.
   */
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

  /**
   * Disconnects the source from whatever it is connected to.
   */
  disconnectSource() {
    if (this.source) {
      this.source.disconnect();
    }
  }

  /**
   * Cut out portion of the buffer specified by 'data.'
   * @param data contains information about the segment
   * @returns {AudioBuffer} the new audio buffer
   */
  cut(data) {
    // cut out the selected data!
    const start = data.start;  // in seconds!
    const duration = data.duration;

    const buffer = this.buffer;
    const originalFrames = buffer.length;
    const numChannels = this.buffer.numberOfChannels;

    // calculate buffer info
    const sampleRate = this.audioCtx.sampleRate;
    const startFrame = Math.floor(start * sampleRate);
    const durationInFrames = Math.floor(duration * sampleRate);
    const afterFrameCount = Math.floor(originalFrames - durationInFrames);

    const newBuffer = this.audioCtx.createBuffer(numChannels, afterFrameCount, sampleRate);

    // copy contents into the new buffer
    for (let channel = 0; channel < numChannels; channel++) {
      const oldBufferChannelData = buffer.getChannelData(channel);
      const nowBuffer = newBuffer.getChannelData(channel);

      for (let i = 0; i < afterFrameCount; i++) {
        if (i < startFrame) {
          nowBuffer[i] = oldBufferChannelData[i];
        } else {
          nowBuffer[i] = oldBufferChannelData[i + durationInFrames];
        }
      }
    }

    // allocate new buffer
    this.disconnectSource();
    this.buffer = newBuffer;
    return newBuffer;
  }

  /**
   * Leave the selection and discard everywhere else.
   * @param data selected segment data
   * @returns {AudioBuffer} the new audio buffer created
   */
  leave(data) {
    // cut out the selected data!
    const start = data.start;  // in seconds!
    const duration = data.duration;

    const buffer = this.buffer;
    const numChannels = this.buffer.numberOfChannels;

    // calculate buffer info
    const sampleRate = this.audioCtx.sampleRate;
    const startFrame = Math.floor(start * sampleRate);
    const durationInFrames = Math.floor(duration * sampleRate);

    const newBuffer = this.audioCtx.createBuffer(numChannels, durationInFrames, sampleRate);

    // copy contents into the new buffer
    for (let channel = 0; channel < numChannels; channel++) {
      const oldBufferChannelData = buffer.getChannelData(channel);
      const nowBuffer = newBuffer.getChannelData(channel);

      for (let i = startFrame; i < durationInFrames + startFrame; i++) {
        nowBuffer[i - startFrame] = oldBufferChannelData[i];
      }
    }

    // allocate new buffer
    this.buffer = newBuffer;
    this.disconnectSource();
    return newBuffer;
  }

  /**
   * Stop the source from playing and retreat the cursor to 0.
   */
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

  /**
   * Pause the source.
   */
  pause() {
    let elapsed = this.audioCtx.currentTime - this.startedAt;

    const buffer = this.buffer;
    const numFrames = buffer.length;
    console.log(numFrames);
    console.log(elapsed);

    if ((numFrames / this.audioCtx.sampleRate) < elapsed) {
      elapsed = 0;
    }

    this.stop();
    this.pausedAt = elapsed;
  }

  /**
   * Returns the current playback time
   * @returns {Number} current time
   */
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