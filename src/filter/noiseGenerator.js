export default class noiseGenerator {
    constructor() {

    };

    static giveEffect(selectedTrackBuffer, startPositionInBuffer, endPositionInBuffer, params) {
        let regionLengthInBuffer = endPositionInBuffer - startPositionInBuffer;
        for (var channelNumber = 0; channelNumber < selectedTrackBuffer.numberOfChannels; channelNumber++){
            var channelData = selectedTrackBuffer.getChannelData(channelNumber);
            for (var cursor = startPositionInBuffer; cursor < endPositionInBuffer; cursor++){
                channelData[cursor] += Math.random() * 2 - 1;
            }
        }
    }
}/**
 * Created by harrykim on 2017. 6. 2..
 */
