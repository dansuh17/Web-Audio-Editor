import WaveSurfer from '../wavesurfer/wavesurfer.js';
import TimelinePlugin from '../wavesurfer/plugin/timeline.js';
import RegionPlugin from '../wavesurfer/plugin/regions.js';
import FileDownloader from './fileDownloader.js';


export default class WaveList {
    constructor(params) {
        this.waveformId = 0;
        this.wavesurfers = [];
        this.maxTrackLength = 0;
        this.container =params["container"];

        /* If there is a region in waveformId 1, currentRegionInfo becomes {id: 1, region: regionObject}
         * regionObject.start gives start position, regionObject.end gives end position.
         */
        this.currentRegionInfo = null;
        this.timeline = null;
        this.copyBuffer = null;

    };

    static create(params) {
        const waveList = new WaveList(params);
        return waveList.init();
    };

    init() {
        // this.removeRegionOnOutsideClick(this);
        this.bindAddRowButton(this);
        return this;
    };

    clear() {
        this.waveformId = 0;
        this.wavesurfers = [];
        $(this.container).html("");
        this.currentRegionInfo = null;
        if (this.timeline != null) {
            this.timeline.destroy();
            this.timeline = null;
            $("#waveform-timeline").html("");
        }
        this.copyBuffer = null;
    }

    add(container) {
        const waveformNum = this.waveformId++;

        this.addEmptyRow(container, waveformNum);
        let wavesurfer = this.addWaveForm(waveformNum);
        return wavesurfer;
    }

    addEmptyRow(container, waveformNum) {
        var newRowtag = `
            <div class="row">
                <div class="col-md-2">
                    <div class="row vertical-align-center">
                        <div class="col-md-4">
                            <span class="track-name"> Track${waveformNum} </span>
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
                            <button class="btn btn-sm btn-default btn-block" onclick="document.getElementById('upload${waveformNum}').click();">
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
                </div>
                <div class="col-md-10">
                    <div id="waveRow${waveformNum}">
                    </div>
                </div>
            </div>
        `


        $(container).append(newRowtag);
    }

    addWaveForm(waveformNum) {
        const wsInstance = WaveSurfer.create({
              id: waveformNum,
              container: '#waveRow' + waveformNum,
              waveColor: 'violet',
              progressColor: 'purple',
              cursorWidth: 1,
              plugins: [
              /*
                  TimelinePlugin.create({
                    container: '#waveform-timeline'
                  }),
                  */
                  RegionPlugin.create({
                    dragSelection: true,
                    addFunction: this.addNewRegion.bind(this),
                    color: "rgba(0, 0, 0, 0.5)",
                  })
              ],
              getMaxTrackLengthFunction: this.getMaxTrackLength.bind(this),
              setMaxTrackLengthFunction: this.setMaxTrackLength.bind(this),
              synchronizeProgressFunction: this.synchronizeProgress.bind(this)
          });
        
        this.wavesurfers.push(wsInstance);

        wsInstance.on('ready', function () {
            let length = wsInstance.backend.getDuration();

            if (this.timeline == null) {
                this.timeline = TimelinePlugin.create({
                    container: "#waveform-timeline",
                    timelineClickFunction: this.moveAndPlayAllByTimeline.bind(this)
                }, wsInstance);
            }
            if (length + 20 > this.maxTrackLength) {
                this.maxTrackLength = length + 20;
                this.timeline.render();
                for (var i = 0; i < this.wavesurfers.length; i++) {
                    if (this.wavesurfers[i].backend.buffer !== null) {
                        this.wavesurfers[i].drawer.fireEvent("redraw");
                    }
                }
            }

            wsInstance.setVolume(0.5);

        }.bind(this));

        this.bindLocalButtons(waveformNum, wsInstance);

        /* Load empty buffer */
        let audioContext = wsInstance.backend.ac;
        let emptyBuffer = audioContext.createBuffer(2, 44100 * 30, 44100);
        wsInstance.loadDecodedBuffer(emptyBuffer);

        return wsInstance;
    }

    bindLocalButtons(waveformNum, wsInstance) {
        $("#download" + waveformNum).click(function() {
            FileDownloader.saveToWav(wsInstance.backend.buffer, 0);
        });
        $("#upload" + waveformNum).change(function() {
            wsInstance.loadBlob(this.files[0]);
        });
    }

    addNewRegion(waveformNum, region) {
        if (this.currentRegionInfo != null) {
            this.currentRegionInfo["region"].remove();
        }
        this.currentRegionInfo = {};
        this.currentRegionInfo["id"] = waveformNum;
        this.currentRegionInfo["region"] = region;
    }

    setMaxTrackLength(length) {
        this.maxTrackLength = length;
    }

    getMaxTrackLength() {
        return this.maxTrackLength;
    }

    moveAndPlayAllByTimeline(position) {
        for (var i = 0; i < this.wavesurfers.length; i++) {
            var progress = this.wavesurfers[i].adjustProgress(position);
            //var progress = time / wavesurferList[i].backend.getDuration();
            this.wavesurfers[i].seekTo(progress);
            if (progress < 1) {
                this.wavesurfers[i].play();
            } else {
                this.wavesurfers[i].pause();
            }   
        }
    }

    synchronizeProgress(wsInstance) {
        // Synchronize the movement of wave cursors.
        for (var i = 0; i < this.wavesurfers.length; i++) {
            if (wsInstance == this.wavesurfers[i]) {
                wsInstance.drawer.progress(wsInstance.backend.getPlayedPercents());
                //var progress = time / wavesurferList[i].backend.getDuration();
                //wavesurferList[i].drawer.progress(progress);
            } else {
                this.wavesurfers[i].drawer.updateProgress(wsInstance.drawer.progressWave.offsetWidth);
            }
        }
    }

    removeRegion() {
        if (this.currentRegionInfo != null) {
            this.currentRegionInfo["region"].remove();
            this.currentRegionInfo = null;
        }
    }

    removeRegionOnOutsideClick(waveList) {
        $(document).click(function(event) {
            console.log("Click doc");
            if(!$(event.target).closest('wave').length) {
                console.log("delete region");
                console.log(this.currentRegionInfo);
                this.removeRegion();
            }
        }.bind(this));
    }

    bindAddRowButton(waveList) {
        console.log("bindAddRowButton");
        $("#addRow").on("click", function() {
            this.add(this.container);
        }.bind(this));
    }

    static alertWithSnackbar(message) {
        // Get the snackbar DIV
        let snackbar = $("#snackbar");
        // Add the "show" class to DIV
        snackbar.text(message);
        snackbar.attr("class", "show");

        // After 3 seconds, remove the show class from DIV
        setTimeout(function(){
            snackbar.text("");
            snackbar.attr("class", "");
        }, 3000);
    }
}