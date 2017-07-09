export default class WaveListModifier {
  constructor(waveList, audioLibrary, workspaceLibrary) {
    this.waveList = waveList;
    this.workspaceId = null;
  }

  static create(waveList, audioLibrary, workspaceLibrary) {
    const waveListModifier = new WaveListModifier(waveList, audioLibrary, workspaceLibrary);
    return waveListModifier.init();
  }

  init() {
    this.bindGeneralButtons();
    // this.bindLibraryButtons();
    return this;
  }

  bindGeneralButtons() {
    $('#play')
      .unbind('click')
      .click(function() {
        for (let i = 0; i < this.waveList.wavesurfers.length; i++) {
          this.waveList.wavesurfers[i].play();
        }
      }.bind(this));

    $('#pause')
      .unbind('click')
      .click(function() {
        for (let i = 0; i < this.waveList.wavesurfers.length; i++) {
          this.waveList.wavesurfers[i].pause();
        }
      }.bind(this));

    $('#stop')
      .unbind('click')
      .click(function() {
        for (let i = 0; i < this.waveList.wavesurfers.length; i++) {
          this.waveList.wavesurfers[i].stop();
        }
      }.bind(this));
  }
}