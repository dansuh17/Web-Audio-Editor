class Toolbox {
  constructor(container, tracks) {
    this.container = container;
    this.tracks = tracks;
    this.id = 'add-track-btn';

    // function binding
    this.createToolbox = this.createToolbox.bind(this);
    this.createToolbox();
  }

  /**
   * Create a toolbox and append at the top of the webpage.
   * The toolbox provides various editing functionalities to the tracks.
   */
  createToolbox() {
    const elemString = `
      <div class="row" id="toolbox">
        <div class="row">
          <div class="col">
            <!-- load sample track -->
            <div class="btn-group" role="group">
              <button id="btnGroupDrop1" type="button" class="btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                Load Sample Track
              </button>
              <div class="dropdown-menu" aria-labelledby="btnGroupDrop1">
                <a class="sampletrack-item" data-value="starcraft" href="#"> Starcraft Adjutant</a>
                <br />
                <a class="sampletrack-item" data-value="itsgonnarain" href="#"> It's Gonna Rain</a>
                <br />
                <a class="sampletrack-item" data-value="exhale" href="#"> Exhale</a>
              </div>
            </div>
            
            <!-- Effects & editing functionalities. -->
            <div class="btn-group" role="group">
              <button type="button" class="btn btn-secondary" id="${this.id}">
                <i class="fa fa-plus"></i> Add Track
              </button>
              <button type="button" class="btn btn-secondary" id="cutBtn">
                <i class="fa fa-scissors"></i> Cut
              </button>
              <button type="button" class="btn btn-secondary" id="copyBtn">
                <i class="fa fa-copy"></i> Copy
              </button>
              <button type="button" class="btn btn-secondary" id="pasteBtn">
                <i class="fa fa-clipboard"></i> Paste
              </button>
              <button type="button" class="btn btn-secondary" id="leaveBtn">
                <i class="fa fa-pencil-square-o"></i> Leave
              </button>
              <button type="button" class="btn btn-secondary" id="playAllBtn">
                <i class="fa fa-play-circle"></i> Play All
              </button>
              <button type="button" class="btn btn-secondary" id="pauseAllBtn">
                <i class="fa fa-pause-circle"></i> Pause All
              </button>
              <button type="button" class="btn btn-secondary" id="stopAllBtn">
                <i class="fa fa-stop-circle"></i> Stop All
              </button>
            </div>
            <div class="btn-group" role="group">
              <button type="button" class="btn btn-secondary" id="nofilter">
                No Filter
              </button>
              <button type="button" class="btn btn-secondary" id="lpf">
                Low Pass Filter
              </button>
              <button type="button" class="btn btn-secondary" id="hpf">
                High Pass Filter
              </button>
              <button type="button" class="btn btn-secondary" id="reverb">
                Reverb
              </button>
              <button type="button" class="btn btn-secondary" id="fadeInBtn">
                Fade In
              </button>
              <button type="button" class="btn btn-secondary" id="fadeOutBtn">
                Fade Out
              </button>
            </div>
            
            <!-- mode selection -->
            <div class="btn-group" role="group">
              <button type="button" name="mode" value="zoom" class="btn btn-primary">
                <i class="fa fa-search-plus"></i> Zoom Mode
              </button>
              <button type="button" name="mode" value="selection" class="btn btn-secondary">
                <i class="fa fa-hand-lizard-o"></i> Selection Mode
              </button>
            </div>
          </div>
        </div>
        <!-- Toggle buttons -->
      </div>
      `;

    // add the toolbox of the web audio editor
    this.container.insertAdjacentHTML('beforeend', elemString);

    // if 'Add Track' button is pressed, create a new track.
    const addTrackBtn = document.getElementById(this.id);
    addTrackBtn.addEventListener('click', () => {
      this.tracks.createTrack(this.container);
    }, false);

    // enable mode toggling
    const modeSelectionRadio = document.getElementsByName('mode');
    modeSelectionRadio.forEach((elem) => {
      elem.addEventListener('click', () => {
        modeSelectionRadio.forEach((childElem) => {
          if (childElem !== elem) {
            childElem.className = 'btn btn-secondary'; // eslint-disable-line no-param-reassign
          } else {
            // activate this button
            childElem.className = 'btn btn-primary'; // eslint-disable-line no-param-reassign
          }
        });

        // send the Tracks instance the toggle signal
        this.tracks.toggleMode();
      }, false);
    });

    // add low pass filter listener
    const lpFilter = document.getElementById('lpf');
    lpFilter.addEventListener('click', () => {
      this.tracks.applyBiquadFilter('lowpass', 1500, 0);
    }, false);

    const hpFilter = document.getElementById('hpf');
    hpFilter.addEventListener('click', () => {
      this.tracks.applyBiquadFilter('highpass', 2000, 0);
    }, false);

    const noFilter = document.getElementById('nofilter');
    noFilter.addEventListener('click', () => {
      this.tracks.disconnectFilter();
    }, false);

    // play / stop / pause all buttons
    const playAllBtn = document.getElementById('playAllBtn');
    playAllBtn.addEventListener('click', () => {
      this.tracks.playAll();
    });

    const stopAllBtn = document.getElementById('stopAllBtn');
    stopAllBtn.addEventListener('click', () => {
      this.tracks.stopAll();
    });

    const pauseAllBtn = document.getElementById('pauseAllBtn');
    pauseAllBtn.addEventListener('click', () => {
      this.tracks.pauseAll();
    });

    // cut selection
    const cutBtn = document.getElementById('cutBtn');
    cutBtn.addEventListener('click', () => {
      this.tracks.cutSelection();
    });

    // leave selection
    const leaveBtn = document.getElementById('leaveBtn');
    leaveBtn.addEventListener('click', () => {
      this.tracks.leaveSelection();
    });

    const pasteBtn = document.getElementById('pasteBtn');
    pasteBtn.addEventListener('click', () => {
      this.tracks.paste();
    });

    const copyBtn = document.getElementById('copyBtn');
    copyBtn.addEventListener('click', () => {
      this.tracks.copySelection();
    });

    const fadeInBtn = document.getElementById('fadeInBtn');
    fadeInBtn.addEventListener('click', () => {
      this.tracks.fadeIn();
    });

    const fadeOutBtn = document.getElementById('fadeOutBtn');
    fadeOutBtn.addEventListener('click', () => {
      this.tracks.fadeOut();
    });

    const reverbBtn = document.getElementById('reverb');
    reverbBtn.addEventListener('click', () => {
      this.tracks.applyReverb();
    });
  }
}

export default Toolbox;
