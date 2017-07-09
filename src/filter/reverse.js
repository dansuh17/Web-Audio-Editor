export default class Reverse {
    constructor() {

    };

    static giveEffect(selectedTrackBuffer, startPositionInBuffer, endPositionInBuffer, params) {
        let regionLengthInBuffer = endPositionInBuffer - startPositionInBuffer;
        for (var channelNumber = 0; channelNumber < selectedTrackBuffer.numberOfChannels; channelNumber++){
            var channelData = selectedTrackBuffer.getChannelData(channelNumber);
            var cloneChannel = channelData.slice();
            for (var cursor = 0; cursor < regionLengthInBuffer; cursor++){
                channelData[startPositionInBuffer + cursor] = cloneChannel[endPositionInBuffer - 1 - cursor];
            }
        }
    }
}