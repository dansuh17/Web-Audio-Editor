export default class Volume {
    constructor() {

    };

    static giveEffect(selectedTrackBuffer, startPositionInBuffer, endPositionInBuffer, params) {
        let volumePercentage = params["volume"];
        for (var channelNumber = 0; channelNumber < selectedTrackBuffer.numberOfChannels; channelNumber++){
            var channelData = selectedTrackBuffer.getChannelData(channelNumber);
            for (var cursor = startPositionInBuffer; cursor < endPositionInBuffer; cursor++){
                channelData[cursor] *= volumePercentage;
            }
        }
    }
}