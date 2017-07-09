export default class MixAll {
    constructor() {

    };

    static mixDownAllTracks(waveList) {
        if (waveList.wavesurfers.length == 0) {
            return;
        }

        let maxChannels = 1;
        let realMaxTrackLength = 0;

        for (var i = 0; i < waveList.wavesurfers.length; i++) {
            if (waveList.wavesurfers[i].backend.buffer === null) {
                continue;
            }
            let channels = waveList.wavesurfers[i].backend.buffer.numberOfChannels;
            if (channels > maxChannels) {
                maxChannels = channels;
            }
            let trackLength = waveList.wavesurfers[i].backend.getDuration();
            if (trackLength > realMaxTrackLength) {
                realMaxTrackLength = trackLength;
            }
        }

        let audioContext = waveList.wavesurfers[0].backend.ac;
        let sampleRate = waveList.wavesurfers[0].backend.buffer.sampleRate;

        let frameCount = realMaxTrackLength * sampleRate;
        let newBuffer = audioContext.createBuffer(maxChannels, frameCount, sampleRate);

        for (var i = 0; i < maxChannels; i++) {
            let channelBuffers = [];
            let newChannel = newBuffer.getChannelData(i);
            for (var j = 0; j < waveList.wavesurfers.length; j++) {
                if (waveList.wavesurfers[j].backend.buffer === null) {
                    continue;
                }
                channelBuffers.push(waveList.wavesurfers[j].backend.buffer.getChannelData(i));
            }


            for (var j = 0; j < frameCount; j++) {
                let amplitudeSum = 0;
                for (var k = 0; k < channelBuffers.length; k++) {
                    if (j >= channelBuffers[k].length) {
                        continue;
                    }
                    amplitudeSum += channelBuffers[k][j];
                }
                //console.log(amplitudeSum);
                newChannel[j] = amplitudeSum;
            }
        }
        let wavesurfer = waveList.add(waveList.container);
        wavesurfer.loadDecodedBuffer(newBuffer);
    }
}