import LowHighPassFilter from './lowHighpassFilter.js';

export default class NoiseReduction {
    constructor() {

    };

    static giveEffect(selectedTrackBuffer, startPositionInBuffer, endPositionInBuffer, params) {
        console.log("hi");
        let frequency = params["frequency"];
        console.log(frequency);
        let filter = new LowHighPassFilter(frequency, 44100, "Lowpass", 1);
        for (var channelNumber = 0; channelNumber < selectedTrackBuffer.numberOfChannels; channelNumber++){
            var channelData = selectedTrackBuffer.getChannelData(channelNumber);
            for (var cursor = startPositionInBuffer; cursor < endPositionInBuffer; cursor++){
                filter.update(channelData[cursor]);
                channelData[cursor] = filter.getValue();
            }
        }
    }
}