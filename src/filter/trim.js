import BufferCreator from './util/bufferCreator.js';

export default class Trim {
    constructor() {

    };

    static giveEffect(selectedTrackBuffer, startPositionInBuffer, endPositionInBuffer, params) {
        let regionLengthInBuffer = endPositionInBuffer - startPositionInBuffer;
        let wavesurfer = params["wavesurfer"];
        let buffer = BufferCreator.createBuffer(wavesurfer.backend.ac, selectedTrackBuffer, regionLengthInBuffer);
        BufferCreator.copyBuffer(selectedTrackBuffer, startPositionInBuffer, endPositionInBuffer, buffer, 0);
        wavesurfer.loadDecodedBuffer(buffer);
    }
}
