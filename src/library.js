import cookieParser from 'cookie';


/**
 * User-defined library.
 * The user can store their own audio files up on the server.
 */
class Library {
  constructor(tracks) {
    // function binding
    this.checkAndDisable = this.checkAndDisable.bind(this);
    this.getLibraryInfo = this.getLibraryInfo.bind(this);
    this.onShown = this.onShown.bind(this);

    this.tracks = tracks; // Tracks instance
    this.username = null;
    this.libraryList = null;

    this.libraryNavBtn = document.getElementById('library-nav-item');
    this.checkAndDisable();
    this.getLibraryInfo();
  }

  /**
   * Check the login status and make the button disabled when not logged in.
   */
  checkAndDisable() {
    const cookies = cookieParser.parse(document.cookie);
    if (cookies.name === 'undefined') {
      this.username = null;
      this.libraryNavBtn.classList.add('disabled');
    } else {
      this.username = cookies.username;
      this.libraryNavBtn.classList.remove('disabled');
    }
  }

  /**
   * Obtain library information from the database.
   */
  getLibraryInfo() {
    if (this.username === null) {
      return;
    }

    // obtain library information from the database
    fetch(`/library/${this.username}`).then(res => res.json()).then((jsonData) => {
      this.libraryList = jsonData; // set it a variable
    }).catch((err) => {
      alert(err);
    });
  }

  /**
   * Attach the library information in the modal.
   */
  onShown() {
    this.getLibraryInfo();
    const listgroup = document.getElementById('library-modal-listgroup');

    // much fater than setting an empty innerHTML
    // https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
    while (listgroup.firstChild) {
      listgroup.removeChild(listgroup.firstChild);
    }

    this.libraryList.forEach((audioObj) => {
      const listElemString = `
        <button type="button" class="list-group-item list-group-item-action"
                data-url="${audioObj.url}" id="librarylist${audioObj.audiotitle}">
          ${audioObj.audiotitle}
        </button>`;

      // actually attach the element to the list
      listgroup.insertAdjacentHTML('beforeend', listElemString);

      // attach an event listener
      listgroup.lastChild.addEventListener('click', (event) => {
        const url = event.target.dataset.url;
        const uriUrl = encodeURIComponent(url);

        fetch(`/useraudio/${this.username}/${uriUrl}`).then(res => res.arrayBuffer()).then((arraybuffer) => {
          this.tracks.createTrackForBuffer(arraybuffer);
        }).catch((err) => {
          console.error(`Failed to load : ${audioObj.audiotitle}`);
          console.error(err);
        });
      }, false);
    });
  }

  /**
   * Append modal code to index.
   */
  createModalElem() {
    // the modal element string
    const elem =
      `<div class="modal fade" id="libraryModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
          
            <!-- header -->
            <div class="modal-header">
              <h5 class="modal-title">My Library</h5>
              <!-- 'X' mark to close -->
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            
            <!-- body -->
            <div class="modal-body">
              <div class="list-group" id="library-modal-listgroup">
                <!-- audio list elements -->
              </div>
            </div>
            
            <!-- footer -->
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>`;

    const modalContainer = document.getElementById('modal');
    modalContainer.insertAdjacentHTML('beforeend', elem);

    // when the modal is shown, display the elements in the library
    this.libraryNavBtn.addEventListener('click', this.onShown, false);
  }
}

export default Library;
