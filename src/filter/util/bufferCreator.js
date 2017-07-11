export default class BufferCopy {
    constructor() {

    };

    /* Referred https://peteris.rocks/blog/wavesurfer-js-copy-audio/ */
    static createBuffer(audioContext, originalBuffer, frameCount) {
        var sampleRate = originalBuffer.sampleRate;
        var channels = originalBuffer.numberOfChannels;
        return audioContext.createBuffer(channels, frameCount, sampleRate);
    }

    static copyBuffer(fromBuffer, fromStart, fromEnd, toBuffer, toStart) {
        var frameCount = (fromEnd - fromStart);
        for (var i = 0; i < fromBuffer.numberOfChannels; i++) {
            var fromChanData = fromBuffer.getChannelData(i)
            var toChanData = toBuffer.getChannelData(i)
            for (var j = 0, f = fromStart, t = toStart; j < frameCount; j++, f++, t++) {
                toChanData[t] = fromChanData[f];
            }
        }
    }
}