import WaveSurfer from '../wavesurfer/wavesurfer';
import RegionPlugin from '../wavesurfer/plugin/regions';

export default class WaveList {
  constructor(params) {
    this.waveformId = 0;
    this.wavesurfers = [];
    this.maxTrackLength = 0;
    this.currentRegionInfo = null;
    this.timeline = null;
    this.container = params['container'];
  }

  static create(params) {
    const waveList = new WaveList(params);
    return waveList.init();
  }

  init() {
    this.bindAddRowButton(this);
    return this;
  }

  getMaxTrackLength() {
    return this.maxTrackLength;
  }

  bindAddRowButton() {
    $('#addRow').on('click', () => {
      this.add(this.container);
    });
  }

  bindLocalButtons(waveformNum, wsInstance) {
    $('#upload' + waveformNum).change(function() {
      wsInstance.loadBlob(this.files[0]);
    });
  }

  addNewRegion(waveformNum, region) {
    if (this.currentRegionInfo !== null) {
      this.currentRegionInfo['region'].remove();
    }

    this.currentRegionInfo = {};
    this.currentRegionInfo['id'] = waveformNum;
    this.currentRegionInfo['region'] = region;
  }

  add(container) {
    const waveformNum = this.waveformId++;

    this.addEmptyRow(container, waveformNum);
    return this.addWaveForm(waveformNum);
  }

  addEmptyRow(container, waveformNum) {
    const newRowtag = `
      <div class="row">
        <div class="col-md-2">
          <div class="row vertical-align-center">
            <div class="col-md-4">
              <span class="track-name"> Track${waveformNum} </span>
            </div>
            <div class="col-md-4">
              <input id="mute${waveformNum}" type="checkbox" checked data-toggle="toggle"
              data-on="ON" data-off="OFF" data-size="small">
            </div>
          </div>
          <div class="row vertical-align-center">
            <div class="col-md-2">
              <span class="glyphicon glyphicon-volume-up"></span>
            </div>
            <div class="col-md-10">
              <input type="range" id="volume${waveformNum}" min="0" max="100" value="50"/>
            </div>
          </div>
          <div class="row">
            <div class="col-md-6 padding-local-button">
              <button class="btn btn-sm btn-default btn-block"
              onclick="document.getElementById('upload${waveformNum}').click();">
                <span class="glyphicon glyphicon-open"></span>
                Upload
              </button>
              <input type="file" style="display:none;" id="upload${waveformNum}" accept = "audio/*"/>
            </div>
            <div class="col-md-6 padding-local-button right">
              <button id="download${waveformNum}" class="btn btn-sm btn-default btn-block">
                <span class="glyphicon glyphicon-download-alt"></span>
                Download
              </button>
            </div>

          </div>
          <div class="row">
            <div class="col-md-6 padding-local-button">
              <button id="library${waveformNum}" type="button" class="btn btn-sm btn-default btn-block" data-index="${waveformNum}" data-toggle="modal" data-target="#libraryModal">
                <span class="glyphicon glyphicon-folder-open"></span>
                Library
              </button>
            </div>
            <div class="col-md-6 padding-local-button right">
              <button id="save${waveformNum}" class="btn btn-sm btn-default btn-block">
                <span class="glyphicon glyphicon-floppy-save"></span>
                Save
              </button>
            </div>
          </div>
        </div>
        <div class="col-md-10">
          <div id="waveRow${waveformNum}">
          </div>
        </div>
      </div>`;


    $(container).append(newRowtag);
    $("#mute" + waveformNum).bootstrapToggle();
  }

  synchronizeProgress(wsInstance) {
    for (let i = 0; i < this.wavesurfers.length; i++) {
      if (wsInstance === this.wavesurfers[i]) {
        wsInstance.drawer.progress(wsInstance.backend.getPlayedPercents());
      } else {
        this.wavesurfers[i].drawer.updateProgress(wsInstance.drawer.progressWave.offsetWidth);
      }
    }
  }

  addWaveForm(waveformNum) {
    const wsInstance = WaveSurfer.create({
      id: waveformNum,
      container: '#waveRow' + waveformNum,
      waveColor: 'violet',
      progressColor: 'purple',
      cursorWidth: 1,
      plugins: [
        RegionPlugin.create({
          dragSelection: true,
          addFunction: this.addNewRegion.bind(this),
          color: 'rgba(0, 0, 0, 0.5)',
        }),
      ],
      getMaxTrackLengthFunction: this.getMaxTrackLength.bind(this),
      synchronizeProgressFunction: this.synchronizeProgress.bind(this),
    });

    // include this wavesurfer into the list
    this.wavesurfers.push(wsInstance);

    wsInstance.on('ready', () => {
      wsInstance.setVolume(0.5);
      wsInstance.play();
    });

    // bind functions for this specific track
    this.bindLocalButtons(waveformNum, wsInstance);

    const audioContext = wsInstance.backend.ac;
    const emptyBuffer = audioContext.createBuffer(2, 44100 * 30, 44100);
    wsInstance.loadDecodedBuffer(emptyBuffer);
    return wsInstance;
  }
}