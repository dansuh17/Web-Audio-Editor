
/* Referred from https://stackoverflow.com/questions/28291582/implementing-a-high-pass-filter-to-an-audio-signal */
export default class LowHighPassFilter {

    constructor(frequency, sampleRate, passType, resonance) {
        /// <summary>
        /// rez amount, from sqrt(2) to ~ 0.1
        /// </summary>
        this.resonance = resonance;
        this.frequency = frequency;
        this.sampleRate = sampleRate;
        this.passType = passType;

        /// <summary>
        /// Array of input values, latest are in front
        /// </summary>
        this.inputHistory = [0, 0, 0];
        /// <summary>
        /// Array of output values, latest are in front
        /// </summary>
        this.outputHistory = [0, 0, 0];

        switch (passType) {
            case "Lowpass":
                this.c = 1 / Math.tan(Math.PI * this.frequency / this.sampleRate);
                this.a1 = 1 / (1 + this.resonance * this.c + this.c * this.c);
                this.a2 = 2 * this.a1;
                this.a3 = this.a1;
                this.b1 = 2 * (1 - this.c * this.c) * this.a1;
                this.b2 = (1 - this.resonance * this.c + this.c * this.c) * this.a1;
                break;
            case "Highpass":
                this.c = Math.tan(Math.PI * this.frequency / this.sampleRate);
                this.a1 = 1 / (1 + this.resonance * this.c + this.c * this.c);
                this.a2 = -2 * this.a1;
                this.a3 = this.a1;
                this.b1 = 2 * (this.c * this.c - 1) * this.a1;
                this.b2 = (1 - this.resonance * this.c + this.c * this.c) * this.a1;
                break;
        }
        console.log(this.c);
        console.log(this.a1);
        console.log(this.a2);
        console.log(this.a3);
        console.log(this.b1);
        console.log(this.b2);


    }


    update(newInput) {
        this.newOutput = this.a1 * newInput + this.a2 * this.inputHistory[0] + this.a3 * this.inputHistory[1] - this.b1 * this.outputHistory[0] - this.b2 * this.outputHistory[1];

        this.inputHistory[1] = this.inputHistory[0];
        this.inputHistory[0] = newInput;

        this.outputHistory[2] = this.outputHistory[1];
        this.outputHistory[1] = this.outputHistory[0];
        this.outputHistory[0] = this.newOutput;
    }


    getValue() {
        return this.outputHistory[0];
    }
}