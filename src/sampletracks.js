class SampleTrackLoader {
  constructor(tracks) {
    this.attachListener = this.attachListener.bind(this);

    this.attachListener();
    this.tracksInstance = tracks;
  }

  /**
   * Attach listener to 'Sample Track Loader' button to create new track on click.
   */
  attachListener() {
    const sampleTrackItems = document.getElementsByClassName('sampletrack-item');

    for (let elem of sampleTrackItems) {
      elem.addEventListener('click', () => {
        const audioName = elem.dataset.value;
        this.createSampleTrack(audioName);
      })
    }
  }

  /**
   * Create a new track if user chooses to try a sample track.
   * @param audioName{string} the name of the audiofile to test
   */
  createSampleTrack(audioName) {
    const url = `/audio/${audioName}`;

    // use fetch API to get a stream of audio file data for track creation
    fetch(url).then((res) => {
      return res.arrayBuffer();
    }).then((buffer) => {
      this.tracksInstance.createTrackForBuffer(buffer);
    }).catch((error) => {
      console.error('Failed to load : ' + url);
      console.error(error);
    });
  }
}

export default SampleTrackLoader;
