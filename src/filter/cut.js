import BufferCreator from './util/bufferCreator.js';
import Copier from './copy.js';

export default class Cut {
    constructor() {

    };

    static giveEffect(selectedTrackBuffer, startPositionInBuffer, endPositionInBuffer, params) {
        Copier.giveEffect(selectedTrackBuffer, startPositionInBuffer, endPositionInBuffer, params);

        let waveList = params["waveList"];
        let wavesurfer = params["wavesurfer"];
        let copyBuffer = waveList.copyBuffer;

        let newLength, newBuffer;
        newLength = selectedTrackBuffer.length - copyBuffer.length;
        newBuffer = BufferCreator.createBuffer(wavesurfer.backend.ac, selectedTrackBuffer, newLength);
        BufferCreator.copyBuffer(selectedTrackBuffer, 0, startPositionInBuffer, newBuffer, 0);
        BufferCreator.copyBuffer(selectedTrackBuffer, endPositionInBuffer, selectedTrackBuffer.length, newBuffer, startPositionInBuffer);

        wavesurfer.loadDecodedBuffer(newBuffer);
    }
}