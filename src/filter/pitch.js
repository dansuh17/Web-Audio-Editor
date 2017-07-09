import Shifter from './util/smbPitchShift.js';

export default class Pitch {
    constructor() {

    };

    static giveEffect(selectedTrackBuffer, startPositionInBuffer, endPositionInBuffer, params) {
        let pitchKeyChange = params["pitch"];
        let singleKeyChange = Math.pow(2.0, 1.0/12);
        let pitchRatio = Math.pow(singleKeyChange, pitchKeyChange);
        for (var channelNumber = 0; channelNumber < selectedTrackBuffer.numberOfChannels; channelNumber++){
            var channelData = selectedTrackBuffer.getChannelData(channelNumber).slice(startPositionInBuffer, endPositionInBuffer);
            var originalChannelData = selectedTrackBuffer.getChannelData(channelNumber);
            Shifter.shift(pitchRatio, selectedTrackBuffer.sampleRate, channelData, function() {
                for (var i=0; i<endPositionInBuffer - startPositionInBuffer; i++) {
                    originalChannelData[i + startPositionInBuffer] = channelData[i];
                }
            });
        }
    }}