import Shifter from './util/smbPitchShift.js';
import BufferCreator from './util/bufferCreator.js';

export default class Speed {
    constructor() {

    };

    /*  Speed filter is a combination of pitch filter and extra processing.
        If we want to play a region 2x faster, the region should be pitched down 2x (Apply shifter with value 1/2).
        Then the region is played 2x faster, causing the region pitched up (so that pitch returns to the original) and achieve speed change. */
    static giveEffect(selectedTrackBuffer, startPositionInBuffer, endPositionInBuffer, params) {
        let speedRatio = params["speed"];
        let wavesurfer = params["wavesurfer"];

        for (var channelNumber = 0; channelNumber < selectedTrackBuffer.numberOfChannels; channelNumber++) {
            var channelData = selectedTrackBuffer.getChannelData(channelNumber).slice(startPositionInBuffer, endPositionInBuffer);
            var originalChannelData = selectedTrackBuffer.getChannelData(channelNumber);
            Shifter.shift(1.0/speedRatio, selectedTrackBuffer.sampleRate, channelData, function() {
                for (var i=0; i<endPositionInBuffer - startPositionInBuffer; i++) {
                    originalChannelData[i + startPositionInBuffer] = channelData[i];
                }
            });
        }

        /* Create new buffer to store final result */
        var decreasedLength = parseInt((endPositionInBuffer - startPositionInBuffer) * (1.0 - (1.0 / speedRatio))); // This value may be negative.
        var newBufferLength = selectedTrackBuffer.length - decreasedLength;
        var newBuffer = BufferCreator.createBuffer(wavesurfer.backend.ac, selectedTrackBuffer, newBufferLength);

        var newStartPosition = startPositionInBuffer;
        var newEndPosition = endPositionInBuffer - decreasedLength;

        /* Copy unchanged regions */
        BufferCreator.copyBuffer(selectedTrackBuffer, 0, startPositionInBuffer, newBuffer, 0);
        BufferCreator.copyBuffer(selectedTrackBuffer, endPositionInBuffer, selectedTrackBuffer.length, newBuffer, newEndPosition);

        /* Process interpolation region */
        for (var channelNumber = 0; channelNumber < selectedTrackBuffer.numberOfChannels; channelNumber++) {
            var channelData = newBuffer.getChannelData(channelNumber);
            var originalChannelData = selectedTrackBuffer.getChannelData(channelNumber);

            var k = 0;
            for (var i = 0; i < newEndPosition - newStartPosition; i++) {
                /* Find minimum index (k) in original buffer that the modified index (k / speedRatio) exceeds current index (i). */
                while (k / speedRatio < i) k++;

                /* Calculate interpolated value between original[k-1] and original[k]. (newStartPosition is offset) */
                var b = k / speedRatio;
                var a = (k - 1) / speedRatio;
                /* r is interpolation ratio
                If r = 1, interpolated value is totally determined by original[k].
                If r = 0, it is opposite (totally determined by original[k-1]). */
                var r = (i - a) / (b - a);
                /* Based on interpolation ratio, calculate interpolated value between original[k] and original[k-1].
                This will be a value in newBuffer[i].
                newStartPosition is offset. */
                var interpolatedValue = originalChannelData[k - 1 + newStartPosition] * (1 - r) + originalChannelData[k + newStartPosition] * r;
                channelData[i + newStartPosition] = interpolatedValue;
            }
        }

        /* Load new buffer into wavesurfer */
        wavesurfer.loadDecodedBuffer(newBuffer);
    }}