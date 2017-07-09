import $ from 'jquery';
import WaveList from 'waveList/waveList';
import WaveListModifier from 'waveList/waveListModifier';
import 'dist/css/bootstrap.css';
import 'dist/css/bootstrap-toggle.css';
import 'dist/js/bootstrap.min.js';
import 'dist/js/bootstrap-toggle.min.js';
import 'css/index.css';


$(document).ready(() => {
  const waveList = WaveList.create({container: '#waveList'});
  const audioLibrary = {};
  const workspaceLibrary = {};
  const waveListModifier = WaveListModifier.create(waveList, audioLibrary, workspaceLibrary);
  let workspaceId = $('#waveContent').attr('data-workspaceId');
  // waveList.addWaveForm(0);
  // waveList.waveformId++;
  // waveList.wavesurfers[0].load('/tracks/lady_brown.mp3');
});
