import $ from 'jquery';
import 'dist/css/bootstrap.css';
import 'dist/css/bootstrap-toggle.css';
import 'dist/js/bootstrap.min.js';
import 'dist/js/bootstrap-toggle.min.js';
import 'css/index.css';

import WaveList from 'waveList/waveList.js';
import WaveListModifier from 'waveList/waveListModifier.js';
import AudioLibrary from './library/audioLibrary.js';
import WorkspaceLibrary from './library/workspaceLibrary.js';


$(document).ready(function() {
    console.log("create 1 hae");
    let waveList = WaveList.create({container: "#waveList"});
    let audioLibrary = AudioLibrary.create({});
    let workspaceLibrary =WorkspaceLibrary.create({});
    let waveListModifier = WaveListModifier.create(waveList, audioLibrary, workspaceLibrary);

    let workspaceId = $("#waveContent").attr("data-workspaceId");
    if (workspaceId != "") {
        workspaceLibrary.requestLoad(workspaceId, waveList, audioLibrary);
    } else {
        /* Test codes for dev, should be erased in production
        waveList.addWaveForm(0);
        waveList.waveformId++;
        waveList.wavesurfers[0].load("/tracks/Inuyasha_dalmyo.mp3");
        //waveList.wavesurfers[0].destroyPlugin('timeline');
        waveList.addWaveForm(1);
        waveList.waveformId++;
        waveList.wavesurfers[1].load("/tracks/lady_brown.mp3");
        */
    }

    $(".disable-function").click(function(){
        WaveList.alertWithSnackbar("Please login first");
    });
});
