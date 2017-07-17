class Toolbox {
  constructor(container, tracks) {
    this.container = container;
    this.tracks = tracks;
    this.id = 'add-track-btn';

    // function binding
    this.createToolbox = this.createToolbox.bind(this);

    this.createToolbox();
  }

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
                <a class="sampletrack-item" data-value="starcraft" href="#">Starcraft Adjutant</a>
                <br />
                <a class="sampletrack-item" data-value="itsgonnarain" href="#">It's Gonna Rain</a>
                <br />
                <a class="sampletrack-item" data-value="exhale" href="#">Exhale</a>
              </div>
            </div>
            
            <!-- Effects & editing functionalities. -->
            <div class="btn-group" role="group">
              <button type="button" class="btn btn-secondary" id="${this.id}">
                Add Track
              </button>
              <button type="button" class="btn btn-secondary" id="cutBtn">
                Cut
              </button>
              <button type="button" class="btn btn-secondary" id="pasteBtn">
                Paste
              </button>
              <button type="button" class="btn btn-secondary" id="playAllBtn">
                Play All
              </button>
              <button type="button" class="btn btn-secondary" id="pauseAllBtn">
                Pause All
              </button>
              <button type="button" class="btn btn-secondary" id="stopAllBtn">
                Stop All
              </button>
              <button type="button" class="btn btn-secondary" id="lpf">
                Low Pass Filter
              </button>
            </div>
            <!-- mode selection -->
            <div class="btn-group" role="group">
              <button type="button" name="mode" value="zoom" class="btn btn-primary">
                Zoom Mode
              </button>
              <button type="button" name="mode" value="selection" class="btn btn-secondary">
                Selection Mode
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
    for (let elem of modeSelectionRadio) {
      elem.addEventListener('click', () => {
        for (let childElem of modeSelectionRadio) {
          if (childElem !== elem) {
            childElem.className = 'btn btn-secondary';
          } else {
            // activate this button
            childElem.className = 'btn btn-primary';
          }
        }

        // send the Tracks instance the toggle signal
        this.tracks.toggleMode();
      }, false);
    }

    // add low pass filter listener
    const lpFilter = document.getElementById('lpf');
    lpFilter.addEventListener('click', () =>{
      this.tracks.applyLpFilter();
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
  }
}

export default Toolbox;
