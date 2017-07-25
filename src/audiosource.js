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
    this.convolver = null;
    this.wetGain = null;
    this.reverbOn = false;

    // methods binding to this
    this.pause = this.pause.bind(this);
    this.updateCursor = this.updateCursor.bind(this);
    this.cut = this.cut.bind(this);
    this.paste = this.paste.bind(this);
    this.setPlayRate = this.setPlayRate.bind(this);
    this.fadeIn = this.fadeIn.bind(this);
    this.fadeOut = this.fadeOut.bind(this);
    this.applyReverb = this.applyReverb.bind(this);
    this.mixDryWet = this.mixDryWet.bind(this);
    this.connectSource = this.connectSource.bind(this);

    // create a gain node
    const gainNode = this.audioCtx.createGain();
    gainNode.gain.value = 0.5;
    gainNode.connect(this.destination);
    this.gainNode = gainNode;

    // this is where the source should be connecting to
    this.sourceConnectPoint = this.gainNode;
    // this is where the filters should be connecting to
    this.filterConnectPoint = this.gainNode;
  }

  /**
   * Apply biquad filter to this audio track.
   * @param type {String} the type of this filter (ex. 'lowpass')
   * @param freq {Number} the frequency in Hz to apply the filter on
   * @param gain {Number} the gain
   */
  applyBiquadFilter(type, freq, gain) {
    let biquadFilter;

    // retrieve the filter
    if (this.filter !== null) {
      biquadFilter = this.filter;
    } else {
      biquadFilter = this.audioCtx.createBiquadFilter();
    }

    // define the filter
    biquadFilter.type = type;
    biquadFilter.frequency.value = freq;
    biquadFilter.gain.value = gain;

    // connect the filter into the pipeline
    if (this.filter === null) {
      this.filter = biquadFilter;
      biquadFilter.connect(this.filterConnectPoint);
      this.sourceConnectPoint = this.filter;
    }

    // apply the differences
    this.pause();
    this.play();
  }

  /**
   * Disconnects the filter from the destination, if filter already exists.
   */
  disconnectFilter() {
    this.pause();

    if (this.filter !== null) {
      this.filter.disconnect();
      this.sourceConnectPoint = this.gainNode;

      this.disconnectSource();
      this.connectSource();

      this.filter = null;
    }

    // mark reverb availability to false
    this.reverbOn = false;

    this.play();
  }

  /**
   * Sets the playback rate of this source.
   * @param rate {Number} desired playback rate
   */
  setPlayRate(rate) {
    this.source.playbackRate.value = rate;
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
   * Mix the dry and wet buses.
   * @param wetVal {Number} the value of wet track in range [0.0, 1.0]
   */
  mixDryWet(wetVal = 0.0) {
    if (this.wetGain === null) {
      return;
    }

    this.wetGain.gain.value = wetVal;
    this.gainNode.gain.value = 1 - wetVal; // dry value
  }

  /**
   * Apply reverb to the track.
   * It uses an impulse response file taken from St. Patrick's Church, Patrington.
   * The wet/dry ration is fixed for demonstration purposes.
   */
  applyReverb() {
    this.pause();
    this.reverbOn = true;

    if (this.convolver === null) {
      // read in impulse file from the server
      fetch('/impulse')
        .then(res => res.arrayBuffer())
        .then((buffer) => {
          this.audioCtx.decodeAudioData(buffer, (audioBuffer) => {
            const convolver = this.audioCtx.createConvolver();
            const wetGain = this.audioCtx.createGain();
            wetGain.gain.value = 0;

            convolver.buffer = audioBuffer;

            // connect the nodes
            convolver.connect(wetGain);
            wetGain.connect(this.destination);

            this.convolver = convolver;
            this.wetGain = wetGain;

            // mix the dry and wet
            this.mixDryWet(0.7);

            // let the apply change
            this.play();
          });
        })
        .catch(err => alert(`Cannot load impulse response file. ${err}`));
    } else {
      this.play();
    }
  }

  /**
   * Connect the source to various nodes depending on availability.
   */
  connectSource() {
    if (this.source !== null) {
      // connect to the connecting point
      this.source.connect(this.sourceConnectPoint);

      // connect also to the wet convolver pipe if it exists
      if (this.reverbOn && (this.convolver !== null)) {
        this.source.connect(this.convolver);
        this.convolver.connect(this.wetGain);
        this.wetGain.connect(this.destination);
      }
    }
  }

  /**
   * Play the source buffer. Web Audio API forces to create new AudioBufferSource
   * for every playback. Once it begins playing, it cannot be played again,
   * although stop() can be called multiple times.
   */
  play() {
    if (this.isPlaying) {
      // the source is already playing
      return;
    }

    const newSource = this.audioCtx.createBufferSource();
    newSource.buffer = this.buffer;
    this.source = newSource;

    // connect the source either directly to speaker or the filter
    this.connectSource();

    // start from paused position (which will be 0 if newly created)
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
   * Fades in - the track's 10% will be faded in with linear increase in amplitude.
   */
  fadeIn() {
    // stop before modifying waveforms
    this.stop();

    const buffer = this.buffer;
    const originalFrames = buffer.length;
    const numChannels = buffer.numberOfChannels;
    const sampleRate = this.audioCtx.sampleRate;

    const fadeEndFrame = Math.floor(originalFrames / 10);

    const newBuffer = this.audioCtx.createBuffer(numChannels, originalFrames, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const oldBufferChannelData = buffer.getChannelData(channel);
      const nowBuffer = newBuffer.getChannelData(channel);

      for (let i = 0; i < originalFrames; i++) {
        if (i < fadeEndFrame) {
          nowBuffer[i] = oldBufferChannelData[i] * (i / fadeEndFrame); // linear fade in
        } else {
          nowBuffer[i] = oldBufferChannelData[i];
        }
      }
    }

    this.buffer = newBuffer;
    return newBuffer;
  }

  /**
   * Fades out - the track's last 10% will be fading out.
   */
  fadeOut() {
    // stop before modifying waveforms
    this.stop();

    const buffer = this.buffer;
    const originalFrames = buffer.length;
    const numChannels = buffer.numberOfChannels;
    const sampleRate = this.audioCtx.sampleRate;

    const fadeStartFrame = Math.floor(originalFrames * 0.9);
    const fadeDurationFrame = originalFrames - fadeStartFrame;

    const newBuffer = this.audioCtx.createBuffer(numChannels, originalFrames, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const oldBufferChannelData = buffer.getChannelData(channel);
      const nowBuffer = newBuffer.getChannelData(channel);

      for (let i = 0; i < originalFrames; i++) {
        if (i >= fadeStartFrame) {
          const elapsedAfterFade = i - fadeStartFrame;
          nowBuffer[i] = oldBufferChannelData[i]
            * ((fadeDurationFrame - elapsedAfterFade) / fadeDurationFrame); // linear fade in
        } else {
          nowBuffer[i] = oldBufferChannelData[i];
        }
      }
    }

    this.buffer = newBuffer;
    return newBuffer;
  }

  /**
   * Cut out portion of the buffer specified by 'data.'
   * @param data contains information about the segment
   * @returns {{newBuffer: *, cutBuffer: *}} the new audio buffer
   */
  cut(data) {
    // stop before modifying waveforms
    this.stop();

    // cut out the selected data!
    const start = data.start; // in seconds!
    const duration = data.duration;

    const buffer = this.buffer;
    const originalFrames = buffer.length;
    const numChannels = this.buffer.numberOfChannels;

    // calculate buffer info
    const sampleRate = this.audioCtx.sampleRate;
    const startFrame = Math.floor(start * sampleRate);
    const durationInFrames = Math.floor(duration * sampleRate);
    const endFrame = startFrame + durationInFrames;
    const afterFrameCount = Math.floor(originalFrames - durationInFrames);

    const newBuffer = this.audioCtx.createBuffer(numChannels, afterFrameCount, sampleRate);
    const cutBuffer = this.audioCtx.createBuffer(numChannels, durationInFrames, sampleRate);

    // copy contents into the new buffer
    for (let channel = 0; channel < numChannels; channel++) {
      const oldBufferChannelData = buffer.getChannelData(channel);
      const nowBuffer = newBuffer.getChannelData(channel);
      const cutBufferChannelData = cutBuffer.getChannelData(channel);

      for (let i = 0; i < originalFrames; i++) {
        if (i < startFrame) {
          nowBuffer[i] = oldBufferChannelData[i];
        } else if (i >= startFrame && i < endFrame) {
          cutBufferChannelData[i - startFrame] = oldBufferChannelData[i]; // save the cut-out data
        } else {
          nowBuffer[i - durationInFrames] = oldBufferChannelData[i];
        }
      }
    }

    // allocate new buffer
    this.buffer = newBuffer;
    return {
      newBuffer,
      cutBuffer,
    };
  }

  /**
   * Paste the cutout buffer on current position (start of selection segment).
   * @param data selected segment data
   * @returns {AudioBuffer} the new audio buffer result
   */
  paste(data, cutBuffer) {
    this.stop(); // stop before modifying the source node

    if (cutBuffer === null) {
      return null; // if nothing is cut and stored before, do nothing.
    }

    const start = data.start;
    const buffer = this.buffer;
    const originalFrames = buffer.length;
    const numChannels = this.buffer.numberOfChannels;
    const sampleRate = this.audioCtx.sampleRate;
    const cutBufferFrames = cutBuffer.length;

    const startFrame = Math.floor(start * sampleRate);
    const pasteEndFrame = Math.floor(startFrame + cutBufferFrames);
    const afterFrames = originalFrames + cutBufferFrames;

    const newBuffer = this.audioCtx.createBuffer(numChannels, afterFrames, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const oldBufferChannelData = buffer.getChannelData(channel);
      const nowBuffer = newBuffer.getChannelData(channel);
      const cutBufferChannelData = cutBuffer.getChannelData(channel);

      for (let i = 0; i < afterFrames; i++) {
        if (i < startFrame) {
          nowBuffer[i] = oldBufferChannelData[i];
        } else if (i >= startFrame && i < pasteEndFrame) {
          nowBuffer[i] = cutBufferChannelData[i - startFrame]; // this is the part where we paste
        } else {
          nowBuffer[i] = oldBufferChannelData[i - cutBufferFrames];
        }
      }
    }

    // allocate the new buffer
    this.buffer = newBuffer;
    return newBuffer;
  }

  /**
   * Sets the volume of the gain node.
   * @param volume {Number} the desired volume [0, 100]
   */
  setVolume(volume) {
    this.gainNode.gain.value = volume / 100;
  }

  /**
   * Copied the selected segment.
   * @param data selected segment data
   * @returns {AudioBuffer}
   */
  copy(data) {
    // stop before modifying
    this.stop();

    // cut out the selected data!
    const start = data.start;
    const duration = data.duration;

    const buffer = this.buffer;
    const numChannels = this.buffer.numberOfChannels;
    const sampleRate = this.audioCtx.sampleRate;

    // calculate buffer info
    const startFrame = Math.floor(start * sampleRate);
    const durationInFrames = Math.floor(duration * sampleRate);
    const endFrame = startFrame + durationInFrames;

    const copiedBuffer = this.audioCtx.createBuffer(numChannels, durationInFrames, sampleRate);

    // copy contents into the new buffer
    for (let channel = 0; channel < numChannels; channel++) {
      const oldBufferChannelData = buffer.getChannelData(channel);
      const copiedBufferChannelData = copiedBuffer.getChannelData(channel);

      for (let i = startFrame; i < endFrame; i++) {
        copiedBufferChannelData[i - startFrame] = oldBufferChannelData[i];
      }
    }

    // allocate new buffer
    return copiedBuffer;
  }

  /**
   * Leave the selection and discard everywhere else.
   * @param data selected segment data
   * @returns {AudioBuffer} the new audio buffer created
   */
  leave(data) {
    this.stop(); // stop before modifying the source node

    // cut out the selected data!
    const start = data.start; // in seconds!
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
    return newBuffer;
  }

  /**
   * Stop the source from playing and retreat the cursor to 0.
   */
  stop() {
    this.disconnectSource();

    if (this.source) {
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
    }
    return 0;
  }
}

export default AudioSourceWrapper;
