import FilterPlugin from '../filter/filter.js';
import TrimFilter from '../filter/trim.js';
import FadeInFilter from '../filter/fadeIn.js';
import FadeOutFilter from '../filter/fadeOut.js';
import PitchFilter from '../filter/pitch.js';
import ReverseFilter from '../filter/reverse.js';
import VolumeFilter from '../filter/volume.js';
import SpeedFilter from '../filter/speed.js';
import Copier from '../filter/copy.js';
import Cutter from '../filter/cut.js';
import Paster from '../filter/paste.js';
import NoiseReductionFilter from '../filter/noiseReduction.js';
import NoiseGeneratorFilter from '../filter/noiseGenerator';
import Mixer from './mixer';
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
        this.bindLibraryButtons();
        return this;
    }

    bindLibraryButtons() {
        let modifier = this;
        $('#libraryModal').on('show.bs.modal', function (event) {
            modifier.audioLibrary.requestAudioList(true);
            let button = $(event.relatedTarget); // Button that triggered the modal
            let waveformNum = button.data('index'); // Extract info from data-* attributes
            // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
            // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
            let modal = $(this);
            modal.find('.modal-title').data("index", waveformNum);
            //modal.find('.modal-title').text('Upload file to Track' + waveformNum);
        });

        $('#modal-load').click(function() {
            let waveformNum = $('#libraryModal').find('.modal-title').data("index");
            let id = $('input[name=selected-audio]:checked').val();
            this.audioLibrary.requestBlobAndLoad(id, this.waveList, waveformNum);
        }.bind(this));

        $("#load_workspace").unbind("click");
        $("#load_workspace").click(function() {
            //TODO: bind load workspace button in the editor page if necessary.
        }.bind(this));

        $("#save_workspace").unbind("click");
        $("#save_workspace").click(function() {
            this.leftSaveCall = this.waveList.wavesurfers.length;
            for (let i = 0; i < this.waveList.wavesurfers.length; i++) {
                let wsInstance = this.waveList.wavesurfers[i];
                let params = {};
                params["waveListModifier"] = this;
                params["waveformNum"] = i;
                FileDownloader.saveToWav(wsInstance.backend.buffer, 2, params);
            }
        }.bind(this));
    }

    bindGeneralButtons() {
        $("#play").unbind("click");
        $("#play").click(function() {
            for (var i = 0; i < this.waveList.wavesurfers.length; i++) {
                this.waveList.wavesurfers[i].play();
            }
        }.bind(this));

        $("#pause").unbind("click");
        $("#pause").click(function() {
            for (var i = 0; i < this.waveList.wavesurfers.length; i++) {
                this.waveList.wavesurfers[i].pause();
            }
        }.bind(this));

        $("#stop").unbind("click");
        $("#stop").click(function() {
            for (var i = 0; i < this.waveList.wavesurfers.length; i++) {
                this.waveList.wavesurfers[i].stop();
            }
        }.bind(this));


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

        $("#mix_all").unbind("click");
        $("#mix_all").click(function() {
            Mixer.mixDownAllTracks(this.waveList);
        }.bind(this));

        /* Here are audio filters applied to a specific region */
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

        $("#reverse").unbind("click");
        $("#reverse").click(function() {
            let params = {};
            let filterFunction = ReverseFilter.giveEffect;
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

        $("#reduce_noise").unbind("click");
        $("#reduce_noise").click(function() {
            let reduceFrequency = 500;
            let params = {"frequency": reduceFrequency};
            let filterFunction = NoiseReductionFilter.giveEffect;
            this.showLoadingForFilterFunction(filterFunction, params);
        }.bind(this));

        $("#add_noise").unbind("click");
        $("#add_noise").click(function() {
            let params = {};
            let filterFunction = NoiseGeneratorFilter.giveEffect;
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

    saveWorkspaceCallback() {
        console.log("leftSaveCall: " + this.leftSaveCall);
        if (this.leftSaveCall == 0) {
            let audioIdList = [];
            for (let i = 0; i < this.waveList.wavesurfers.length; i++) {
                let tempId = $("#waveRow" + i).data("tempId");
                console.log(tempId);
                audioIdList.push(tempId);
            }
            let params = {};
            params["waveListModifier"] = this;
            this.workspaceLibrary.requestSave("new_workspace", audioIdList, params);
        }
    }
}