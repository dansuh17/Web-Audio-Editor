import FilterPlugin from '../filter/filter.js';
import VolumeFilter from '../filter/volume.js';
import FileDownloader from './fileDownloader.js';


export default class WaveListModifier {
  constructor(waveList, audioLibrary, workspaceLibrary) {
    this.waveList = waveList;
    this.leftSaveCall = 0;
    this.workspaceId = null;
    this.audioLibrary = audioLibrary;
    this.workspaceLibrary = workspaceLibrary;
  }

  static create(waveList, audioLibrary, workspaceLibrary) {
    const waveListModifier = new WaveListModifier(waveList, audioLibrary, workspaceLibrary);
    return waveListModifier.init();
  }

  init() {
    this.bindGeneralButtons();
    return this;
  }

  bindGeneralButtons() {
    $("#play")
      .unbind("click")
      .click(() => {
        for (let i = 0; i < this.waveList.wavesurfers.length; i++) {
          this.waveList.wavesurfers[i].play();
        }
      });

    $("#pause")
      .unbind("click")
      .click(() => {
        for (let i = 0; i < this.waveList.wavesurfers.length; i++) {
          this.waveList.wavesurfers[i].pause();
        }
      });

    $("#stop")
      .unbind("click")
      .click(() => {
        for (let i = 0; i < this.waveList.wavesurfers.length; i++) {
          this.waveList.wavesurfers[i].stop();
        }
      });

    $("#volume")
      .unbind("click")
      .click(() => {
        let volumePercentage = $("#volume-ratio").val() / 100.0;
        let params = {"volume": volumePercentage};
        let filterFunction = VolumeFilter.giveEffect;
        this.showLoadingForFilterFunction(filterFunction, params);
      });
  }

  showLoadingForFilterFunction(filterFunction, params, checkOutRegion = true) {
    $("#loading").show();
    setTimeout(() => {
      let filterPlugin = FilterPlugin.create(filterFunction, params);
      filterPlugin.applyFilter(this.waveList.currentRegionInfo, this.waveList.wavesurfers, checkOutRegion);
      this.waveList.removeRegion();
      $("#loading").hide();
    }, 0);
  }
}