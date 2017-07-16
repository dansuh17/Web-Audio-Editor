import '../index.html';  // required for hot-loading for changes in index.html
import Tracks from 'tracks';
import SampleTrackLoader from 'sampletracks';

// TODO: what does Symbol.iterator do???
// setup for using for-of loop for queried dom elements
NodeList.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];


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
              <button type="button" class="btn btn-secondary">
                Cut
              </button>
              <button type="button" class="btn btn-secondary">
                Paste
              </button>
              <button type="button" class="btn btn-secondary">
                Play All
              </button>
              <button type="button" class="btn btn-secondary">
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
  }
}


const container = document.getElementById('track-container');

const tracks = new Tracks(container);
const toolbox = new Toolbox(container, tracks);
const sampleTrackLoader = new SampleTrackLoader(tracks);
