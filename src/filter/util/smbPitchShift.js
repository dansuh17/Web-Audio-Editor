/****************************************************************************
*
* NAME: smbPitchShift.cpp
* VERSION: 1.2
* HOME URL: http://blogs.zynaptiq.com/bernsee
* KNOWN BUGS: none
*
* SYNOPSIS: Routine for doing pitch shifting while maintaining
* duration using the Short Time Fourier Transform.
*
* DESCRIPTION: The routine takes a pitchShift factor value which is between 0.5
* (one octave down) and 2. (one octave up). A value of exactly 1 does not change
* the pitch. numSampsToProcess tells the routine how many samples in indata[0...
* numSampsToProcess-1] should be pitch shifted and moved to outdata[0 ...
* numSampsToProcess-1]. The two buffers can be identical (ie. it can process the
* data in-place). fftFrameSize defines the FFT frame size used for the
* processing. Typical values are 1024, 2048 and 4096. It may be any value <=
* MAX_FRAME_LENGTH but it MUST be a power of 2. osamp is the STFT
* oversampling factor which also determines the overlap between adjacent STFT
* frames. It should at least be 4 for moderate scaling ratios. A value of 32 is
* recommended for best quality. sampleRate takes the sample rate for the signal 
* in unit Hz, ie. 44100 for 44.1 kHz audio. The data passed to the routine in 
* indata[] should be in the range [-1.0, 1.0), which is also the output range 
* for the data, make sure you scale the data accordingly (for 16bit signed integers
* you would have to divide (and multiply) by 32768). 
*
* COPYRIGHT 1999-2015 Stephan M. Bernsee <s.bernsee [AT] zynaptiq [DOT] com>
*
*                       The Wide Open License (WOL)
*
* Permission to use, copy, modify, distribute and sell this software and its
* documentation for any purpose is hereby granted without fee, provided that
* the above copyright notice and this license appear in all source copies. 
* THIS SOFTWARE IS PROVIDED "AS IS" WITHOUT EXPRESS OR IMPLIED WARRANTY OF
* ANY KIND. See http://www.dspguru.com/wol.htm for more information.
*
*****************************************************************************/ 

export default class PitchShifter {

    constructor() {

    };

    static smbFft(fftBuffer, fftFrameSize, sign)
    /* 
        FFT routine, (C)1996 S.M.Bernsee. Sign = -1 is FFT, 1 is iFFT (inverse)
        Fills fftBuffer[0...2*fftFrameSize-1] with the Fourier transform of the
        time domain data in fftBuffer[0...2*fftFrameSize-1]. The FFT array takes
        and returns the cosine and sine parts in an interleaved manner, ie.
        fftBuffer[0] = cosPart[0], fftBuffer[1] = sinPart[0], asf. fftFrameSize
        must be a power of 2. It expects a complex input signal (see footnote 2),
        ie. when working with 'common' audio signals our input signal has to be
        passed as {in[0],0.,in[1],0.,in[2],0.,...} asf. In that case, the transform
        of the frequencies of interest is in fftBuffer[0...fftFrameSize].
    */
    {

        var wr, wi, arg, temp;
        var tr, ti, ur, ui, p1r, p1i, p2r, p2i;
        var i, bitm, j, le, le2, k;

        for (i = 2; i < 2*fftFrameSize-2; i += 2) {
            for (bitm = 2, j = 0; bitm < 2*fftFrameSize; bitm <<= 1) {
                if (i & bitm) j++;
                j <<= 1;
            }
            if (i < j) {
                temp = fftBuffer[i];
                fftBuffer[i] = fftBuffer[j];
                fftBuffer[j] = temp;
                temp = fftBuffer[i+1];
                fftBuffer[i+1] = fftBuffer[j+1];
                fftBuffer[j+1] = temp;
            }
        }
        for (k = 0, le = 2; k < parseInt(Math.log(fftFrameSize)/Math.log(2.0)+0.5); k++) {
            le <<= 1;
            le2 = le>>1;
            ur = 1.0;
            ui = 0.0;
            arg = Math.PI / (le2>>1);
            wr = Math.cos(arg);
            wi = sign*Math.sin(arg);
            for (j = 0; j < le2; j += 2) {
                for (i = j; i < 2*fftFrameSize; i += le) {
                    p1r = fftBuffer[i];
                    p1i = fftBuffer[i+1];
                    p2r = fftBuffer[i+le2];
                    p2i = fftBuffer[i+le2+1];
                    tr = p2r * ur - p2i * ui;
                    ti = p2r * ui + p2i * ur;
                    fftBuffer[i+le2] = p1r - tr; 
                    fftBuffer[i+le2+1] = p1i - ti;
                    fftBuffer[i] += tr; 
                    fftBuffer[i+1] += ti;
                }
                tr = ur*wr - ui*wi;
                ui = ur*wi + ui*wr;
                ur = tr;
            }
        }
    };

    static shift(pitchShift, sampleRate, buffer, callback) {
        let fftFrameSize = 1024;
        //let osamp = 32; //Maximum quality
        let osamp = 4;  // Minimum quality
        
        var gInFIFO = Array(8192).fill(0.0);
        var gOutFIFO = Array(8192).fill(0.0);
        var gFFTworksp = Array(16384).fill(0.0);
        var gLastPhase = Array(4097).fill(0.0);
        var gSumPhase = Array(4097).fill(0.0);
        var gOutputAccum = Array(16384).fill(0.0);
        var gAnaFreq = Array(8192).fill(0.0);
        var gAnaMagn = Array(8192).fill(0.0);
        var gSynFreq = Array(8192).fill(0.0);
        var gSynMagn = Array(8192).fill(0.0);
        var gRover = 0;
        var gInit = 0;

        var magn, phase, tmp, windo, real, imag;
        var freqPerBin, expct;
        var i,k, qpd, index, inFifoLatency, stepSize, fftFrameSize2;

        fftFrameSize2 = fftFrameSize/2;
        stepSize = fftFrameSize/osamp;
        freqPerBin = sampleRate/fftFrameSize * 1.0;
        expct = 2.0*Math.PI*stepSize/fftFrameSize;
        inFifoLatency = fftFrameSize-stepSize;
        gRover = inFifoLatency;

        /* main processing loop */
        for (i = 0; i < buffer.length; i++){

            if (i % 100000 == 0) console.log(i);

            /* As long as we have not yet collected enough data just read in */
            gInFIFO[gRover] = buffer[i];
            buffer[i] = gOutFIFO[gRover-inFifoLatency];
            gRover++;

            /* now we have enough data for processing */
            if (gRover >= fftFrameSize) {
                gRover = inFifoLatency;

                /* do windowing and re,im interleave */
                for (k = 0; k < fftFrameSize;k++) {
                    windo = -0.5*Math.cos(2.0*Math.PI*k/fftFrameSize)+0.5;
                    gFFTworksp[2*k] = gInFIFO[k] * windo;
                    gFFTworksp[2*k+1] = 0.0;
                }


                /* ***************** ANALYSIS ******************* */
                /* do transform */
                this.smbFft(gFFTworksp, fftFrameSize, -1);

                /* this is the analysis step */
                for (k = 0; k <= fftFrameSize2; k++) {

                    /* de-interlace FFT buffer */
                    real = gFFTworksp[2*k];
                    imag = gFFTworksp[2*k+1];

                    /* compute magnitude and phase */
                    magn = 2.0*Math.sqrt(real*real + imag*imag);
                    phase = Math.atan2(imag,real);

                    /* compute phase difference */
                    tmp = phase - gLastPhase[k];
                    gLastPhase[k] = phase;

                    /* subtract expected phase difference */
                    tmp -= k*expct;

                    /* map delta phase into +/- Pi interval */
                    qpd = parseInt(tmp/Math.PI, 10);
                    if (qpd >= 0) qpd += qpd&1;
                    else qpd -= qpd&1;
                    tmp -= Math.PI*qpd;

                    /* get deviation from bin frequency from the +/- Pi interval */
                    tmp = osamp*tmp/(2.0*Math.PI);

                    /* compute the k-th partials' true frequency */
                    tmp = k*freqPerBin + tmp*freqPerBin;

                    /* store magnitude and true frequency in analysis arrays */
                    gAnaMagn[k] = magn;
                    gAnaFreq[k] = tmp;

                }

                /* ***************** PROCESSING ******************* */
                /* this does the actual pitch shifting */
                gSynFreq = Array(20000).fill(0.0);
                gSynMagn = Array(20000).fill(0.0);
                for (k = 0; k <= fftFrameSize2; k++) { 
                    index = parseInt(k*pitchShift);
                    if (index <= fftFrameSize2) { 
                        gSynMagn[index] += gAnaMagn[k]; 
                        gSynFreq[index] = gAnaFreq[k] * pitchShift; 
                    } 
                }

                
                /* ***************** SYNTHESIS ******************* */
                /* this is the synthesis step */
                for (k = 0; k <= fftFrameSize2; k++) {

                    /* get magnitude and true frequency from synthesis arrays */
                    magn = gSynMagn[k];
                    tmp = gSynFreq[k];

                    /* subtract bin mid frequency */
                    tmp -= k*freqPerBin;

                    /* get bin deviation from freq deviation */
                    tmp /= freqPerBin;

                    /* take osamp into account */
                    tmp = 2.0*Math.PI*tmp/osamp;

                    /* add the overlap phase advance back in */
                    tmp += k*expct;

                    /* accumulate delta phase to get bin phase */
                    gSumPhase[k] += tmp;
                    phase = gSumPhase[k];

                    /* get real and imag part and re-interleave */
                    gFFTworksp[2*k] = magn*Math.cos(phase);
                    gFFTworksp[2*k+1] = magn*Math.sin(phase);
                }

                /* zero negative frequencies */
                for (k = fftFrameSize+2; k < 2*fftFrameSize; k++) gFFTworksp[k] = 0.0;

                /* do inverse transform */
                this.smbFft(gFFTworksp, fftFrameSize, 1);

                /* do windowing and add to output accumulator */ 
                for(k=0; k < fftFrameSize; k++) {
                    windo = -0.5*Math.cos(2.0*Math.PI*k/fftFrameSize)+0.5;
                    gOutputAccum[k] += 2.0*windo*gFFTworksp[2*k]/(fftFrameSize2*osamp);
                }
                for (k = 0; k < stepSize; k++) gOutFIFO[k] = gOutputAccum[k];

                /* shift accumulator */
                for (k = 0; k < fftFrameSize; k++) gOutputAccum[k] = gOutputAccum[k + stepSize];

                /* move input FIFO */
                for (k = 0; k < inFifoLatency; k++) gInFIFO[k] = gInFIFO[k+stepSize];
            }
        }

        callback();
    };
}