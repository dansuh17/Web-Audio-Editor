import WaveList from "../waveList/waveList";

export default class Filter {

    constructor(filterFunction, params) {
        this.filterFunction = filterFunction;
        this.params = params;
    };

    static create(filterFunction, params) {
        const filter = new Filter(filterFunction, params);
        return filter.init();
    };

    init() {
        return this;
    };

    applyFilter(regionInfo, wavesurfers, checkOutRegion = true) {
        if (regionInfo != null) {
            console.log(wavesurfers[regionInfo.id].backend.buffer);
            console.log(regionInfo.region.start);
            console.log(regionInfo.region.end);

            let selectedRegion = regionInfo.region;
            let selectedTrackBuffer = wavesurfers[regionInfo.id].backend.buffer;

            let audioLengthInSec = selectedTrackBuffer.duration;
            let startPositionInSec = selectedRegion.start;
            let endPositionInSec = Math.min(selectedRegion.end, audioLengthInSec);

            if (checkOutRegion && startPositionInSec >= audioLengthInSec) {
                WaveList.alertWithSnackbar("Error : Region not selected for operation.");
                // ERROR: User must appropriate region.
                // Region is out of audio range.
            } else {
                let audioLengthInBuffer = selectedTrackBuffer.length;
                let startPositionInBuffer = parseInt(startPositionInSec / audioLengthInSec * audioLengthInBuffer);
                let endPositionInBuffer = parseInt(endPositionInSec / audioLengthInSec * audioLengthInBuffer);

                this.filterFunction(selectedTrackBuffer, startPositionInBuffer, endPositionInBuffer, this.params);
                wavesurfers[regionInfo.id].drawer.fireEvent("redraw");
            }
        }
        else {
            WaveList.alertWithSnackbar("Error : Region not selected for operation.");
            // ERROR: User must specify region.
            // Show error message to user.
        }
    }
}