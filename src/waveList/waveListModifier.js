import FilterPlugin from '../filter/filter.js';
import VolumeFilter from '../filter/volume.js';
import FileDownloader from './fileDownloader.js';
import TrimFilter from '../filter/trim.js';
import FadeInFilter from '../filter/fadeIn.js';
import FadeOutFilter from '../filter/fadeOut.js';
import Copier from '../filter/copy.js';
import Cutter from '../filter/cut.js';
import Paster from '../filter/paste.js';
import SpeedFilter from '../filter/speed.js';
import PitchFilter from '../filter/pitch.js';


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

      $("#mute_on").unbind("click");
      $("#mute_on").click(function() {
          for (var i = 0; i < this.waveList.wavesurfers.length; i++) {
              $("#mute" + i).bootstrapToggle('on')
              this.waveList.wavesurfers[i].setMute(false);
          }
      }.bind(this));

      $("#mute_off").unbind("click");
      $("#mute_off").click(function() {
          for (var i = 0; i < this.waveList.wavesurfers.length; i++) {
              $("#mute" + i).bootstrapToggle('off')
              this.waveList.wavesurfers[i].setMute(true);
          }
      }.bind(this));

      $("#zoom_in").unbind("click");
      $("#zoom_in").click(function() {
          let currentMaxLength = 0;
          for (var i = 0; i < this.waveList.wavesurfers.length; i++) {
              let instanceLength = this.waveList.wavesurfers[i].backend.getDuration();
              if (instanceLength > currentMaxLength) {
                  currentMaxLength = instanceLength;
              }
          }

          if (currentMaxLength < this.waveList.maxTrackLength) {
              let threshold = this.waveList.maxTrackLength - currentMaxLength;
              if (threshold <= 10) {
                  this.waveList.maxTrackLength = currentMaxLength;
              } else {
                  this.waveList.maxTrackLength -= (threshold / 2);
              }
          }

          this.waveList.removeRegion();

          for (var i = 0; i < this.waveList.wavesurfers.length; i++) {
              console.log(this.waveList.wavesurfers[i].backend.buffer);
              if (this.waveList.wavesurfers[i].backend.buffer !== null) {
                  this.waveList.wavesurfers[i].drawer.fireEvent("redraw");
              }
          }
      }.bind(this));

      $("#zoom_out").unbind("click");
      $("#zoom_out").click(function() {
          let currentMaxLength = 0;
          for (var i = 0; i < this.waveList.wavesurfers.length; i++) {
              let instanceLength = this.waveList.wavesurfers[i].backend.getDuration();
              if (instanceLength > currentMaxLength) {
                  currentMaxLength = instanceLength;
              }
          }

          let extension = this.waveList.maxTrackLength / 5;
          this.waveList.maxTrackLength += extension;

          this.waveList.removeRegion();

          for (var i = 0; i < this.waveList.wavesurfers.length; i++) {
              console.log(this.waveList.wavesurfers[i].backend.buffer);
              if (this.waveList.wavesurfers[i].backend.buffer !== null) {
                  this.waveList.wavesurfers[i].drawer.fireEvent("redraw");
              }
          }
      }.bind(this));

      $("#trim").unbind("click");
      $("#trim").click(function() {
          for (var i = 0; i < this.waveList.wavesurfers.length; i++) {
              this.waveList.wavesurfers[i].stop(0);
          }
          let wavesurfer = this.waveList.wavesurfers[this.waveList.currentRegionInfo.id];
          let params = {"wavesurfer": wavesurfer};
          let filterFunction = TrimFilter.giveEffect;
          this.showLoadingForFilterFunction(filterFunction, params);
      }.bind(this));

      $("#copy").unbind("click");
      $("#copy").click(function() {
          for (var i = 0; i < this.waveList.wavesurfers.length; i++) {
              this.waveList.wavesurfers[i].stop(0);
          }
          let wavesurfer = this.waveList.wavesurfers[this.waveList.currentRegionInfo.id];
          let params = {"wavesurfer": wavesurfer, "waveList": this.waveList};
          let filterFunction = Copier.giveEffect;
          this.showLoadingForFilterFunction(filterFunction, params);
      }.bind(this));

      $("#cut").unbind("click");
      $("#cut").click(function() {
          for (var i = 0; i < this.waveList.wavesurfers.length; i++) {
              this.waveList.wavesurfers[i].stop(0);
          }
          let wavesurfer = this.waveList.wavesurfers[this.waveList.currentRegionInfo.id];
          let params = {"wavesurfer": wavesurfer, "waveList": this.waveList};
          let filterFunction = Cutter.giveEffect;
          this.showLoadingForFilterFunction(filterFunction, params);
      }.bind(this));

      $("#paste").unbind("click");
      $("#paste").click(function() {
          for (var i = 0; i < this.waveList.wavesurfers.length; i++) {
              this.waveList.wavesurfers[i].stop(0);
          }
          let wavesurfer = this.waveList.wavesurfers[this.waveList.currentRegionInfo.id];
          let params = {"wavesurfer": wavesurfer, "waveList": this.waveList};
          let filterFunction = Paster.giveEffect;
          this.showLoadingForFilterFunction(filterFunction, params, false);
      }.bind(this));

      $("#fade_in").unbind("click");
      $("#fade_in").click(function() {
          let params = {};
          let filterFunction = FadeInFilter.giveEffect;
          this.showLoadingForFilterFunction(filterFunction, params);
      }.bind(this));

      $("#fade_out").unbind("click");
      $("#fade_out").click(function() {
          let params = {};
          let filterFunction = FadeOutFilter.giveEffect;
          this.showLoadingForFilterFunction(filterFunction, params);
      }.bind(this));

      $("#volume").unbind("click");
      $("#volume").click(function() {
          let volumePercentage = $("#volume-ratio").val() / 100.0;
          let params = {"volume": volumePercentage};
          let filterFunction = VolumeFilter.giveEffect;
          this.showLoadingForFilterFunction(filterFunction, params);
      }.bind(this));

      $("#pitch").unbind("click");
      $("#pitch").click(function() {
          let pitchChangeValue = $("#pitch-key").val();
          let params = {"pitch": pitchChangeValue};
          let filterFunction = PitchFilter.giveEffect;
          this.showLoadingForFilterFunction(filterFunction, params);
      }.bind(this));

      $("#speed").unbind("click");
      $("#speed").click(function() {
          for (var i = 0; i < this.waveList.wavesurfers.length; i++) {
              this.waveList.wavesurfers[i].stop(0);
          }
          let speedChangeValue = $("#speed-ratio").val() / 100.0;
          let wavesurfer = this.waveList.wavesurfers[this.waveList.currentRegionInfo.id];
          let params = {"speed": speedChangeValue, "wavesurfer": wavesurfer};
          let filterFunction = SpeedFilter.giveEffect;
          this.showLoadingForFilterFunction(filterFunction, params);
      }.bind(this));

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
