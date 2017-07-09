import $ from 'jquery';
import 'dist/css/bootstrap.css';
import 'dist/css/bootstrap-toggle.css';
import 'dist/js/bootstrap.min.js';
import 'dist/js/bootstrap-toggle.min.js';
import 'css/index.css';

import WaveList from 'waveList/waveList.js';
import WaveListModifier from 'waveList/waveListModifier.js';


$(document).ready(function() {
    let waveList = WaveList.create({container: "#waveList"});
    let audioLibrary = {};
    let workspaceLibrary = {};
    let waveListModifier = WaveListModifier.create(waveList, audioLibrary, workspaceLibrary);
});
