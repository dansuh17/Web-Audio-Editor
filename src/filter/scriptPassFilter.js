import BufferCreator from './util/bufferCreator.js';

/* This is legacy code for noise reduction using scriptProcessor, it is not used any more abandoned because of low quality
 * But left here for reference.
 */
export default class ScriptPassFilter {
    constructor() {

    };

    static giveEffect(selectedTrackBuffer, startPositionInBuffer, endPositionInBuffer, params) {
        let regionLengthInBuffer = endPositionInBuffer - startPositionInBuffer;
        let waveList = params["waveList"];
        let wavesurfer = params["wavesurfer"];

        let audioCtx = wavesurfer.backend.ac;
        let source = audioCtx.createBufferSource();

        let scriptNode = audioCtx.createScriptProcessor(4096, selectedTrackBuffer.numberOfChannels,  selectedTrackBuffer.numberOfChannels);
        let regionBuffer = BufferCreator.createBuffer(wavesurfer.backend.ac, selectedTrackBuffer, regionLengthInBuffer);
        BufferCreator.copyBuffer(selectedTrackBuffer, startPositionInBuffer, endPositionInBuffer, regionBuffer, 0);
        source.buffer = regionBuffer;

        let recBuffer = [];
        let recLength = 0;

        for (let channel = 0; channel < selectedTrackBuffer.numberOfChannels; channel++) {
            recBuffer[channel] = [];
        }

        let isRecording = false;
        // Give the node a function to process audio events

        let filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 10000;


        scriptNode.onaudioprocess = function(audioProcessingEvent) {
            if (!isRecording) {
                return;
            }
            // The input buffer is the song we loaded earlier
            let inputBuffer = audioProcessingEvent.inputBuffer;
            let resultBuffer =[];
            // Loop through the output channels (in this case there is only one)
            for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
                resultBuffer.push(inputBuffer.getChannelData(channel));
            }
            for (var channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
                recBuffer[channel].push(resultBuffer[channel]);
            }
            recLength += resultBuffer[0].length;
            if (recLength >= regionBuffer.getChannelData(0).length) {
                isRecording = false;

                let outputBuffer = [];
                for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
                    outputBuffer.push(LowPassNoiseReduction.mergeBuffers(recBuffer[channel], recLength));
                }
                for (var channelNumber = 0; channelNumber < selectedTrackBuffer.numberOfChannels; channelNumber++){
                    let channelData = selectedTrackBuffer.getChannelData(channelNumber);
                    let outData = outputBuffer[channelNumber];
                    for (var cursor = startPositionInBuffer; cursor < endPositionInBuffer; cursor++){
                        channelData[cursor] = outData[cursor - startPositionInBuffer];
                    }
                }
                source.stop();
                source.disconnect();
                filter.disconnect();
                scriptNode.onaudioprocess = null;
                wavesurfer.drawer.fireEvent("redraw");
            }
        };

        source.connect(filter);
        filter.connect(scriptNode);
        scriptNode.connect(audioCtx.destination);
        source.start();
        isRecording = true;
    }

    static mergeBuffers(recBuffers, recLength) {
        let result = new Float32Array(recLength);
        let offset = 0;
        console.log("merge!");
        for (let i = 0; i < recBuffers.length; i++) {
            console.log(recBuffers[i]);
            result.set(recBuffers[i], offset);
            offset += recBuffers[i].length;
        }
        return result;
    }
}