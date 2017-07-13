import '../index.html';  // required for hot-loading for changes in index.html
import Tracks from 'tracks';

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
        <div class="col">
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
          </div>
        </div>
      </div>
      `;

    this.container.insertAdjacentHTML('beforeend', elemString);

    // if 'Add Track' button is pressed, create a new track.
    const addTrackBtn = document.getElementById(this.id);
    addTrackBtn.addEventListener('click', () => {
      this.tracks.createTrack(this.container);
    }, false);
  }
}


const container = document.getElementById('track-container');

const tracks = new Tracks(container);
toolbox = new Toolbox(container, tracks);
