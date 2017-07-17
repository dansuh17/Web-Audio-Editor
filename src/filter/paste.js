import BufferCreator from './util/bufferCreator.js';

export default class Paste {
    constructor() {

    };

    static giveEffect(selectedTrackBuffer, startPositionInBuffer, endPositionInBuffer, params) {
        let waveList = params["waveList"];
        let wavesurfer = params["wavesurfer"];

        let copyBuffer = waveList.copyBuffer;

        let newStartPosition = startPositionInBuffer;
        let newEndPosition = startPositionInBuffer + copyBuffer.length;

        let newLength, newBuffer;

        if (startPositionInBuffer >= selectedTrackBuffer.length) {
            newLength = startPositionInBuffer + copyBuffer.length;
            newBuffer = BufferCreator.createBuffer(wavesurfer.backend.ac, selectedTrackBuffer, newLength);
            BufferCreator.copyBuffer(selectedTrackBuffer, 0, selectedTrackBuffer.length, newBuffer, 0);
            BufferCreator.copyBuffer(copyBuffer, 0, copyBuffer.length, newBuffer, newStartPosition);
        } else {
            newLength = selectedTrackBuffer.length + copyBuffer.length;
            newBuffer = BufferCreator.createBuffer(wavesurfer.backend.ac, selectedTrackBuffer, newLength);
            BufferCreator.copyBuffer(selectedTrackBuffer, 0, startPositionInBuffer, newBuffer, 0);
            BufferCreator.copyBuffer(copyBuffer, 0, copyBuffer.length, newBuffer, newStartPosition);
            BufferCreator.copyBuffer(selectedTrackBuffer, endPositionInBuffer, selectedTrackBuffer.length, newBuffer, newEndPosition);
        }

        wavesurfer.loadDecodedBuffer(newBuffer);
    }
}
