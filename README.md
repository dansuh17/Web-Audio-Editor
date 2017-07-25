# Web Audio Editor

[Demo](http://13.56.79.76)

This is a web audio editor project where user can edit custom audio files online.
The user is able to cut, paste, leave, and copy
segments of audio data. Also, the user can apply fade-in, fade-out, highpass filter, lowpass filter,
and reverberation to the tracks. The audio effects are implemented using [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API).
The user can also maintain settings through signing up, and upload audio files
to the server for later use.


## Prerequisites

* [mongodb](https://docs.mongodb.com/manual/installation/)
* node.js & npm

## Setup and running

### Development Server Setup

`mongod --port 38128`

`npm install && npm run dev`

### Start Production Server Only

`npm run build && npm run start`

By default the production server listens to port `3000`.

However, you can modify the listening port through port forwarding while `docker run`,
with `-p` option. See `Start Production Cluster`.

### Start Production Cluster

`docker pull kaehops/webaudioeditor`

`docker pull mongo:3.4`

`docker-compose up -d`

This command will read `docker-compose.yml` file for configuration.

## User Guide

Get started by using sample tracks to play with editor functionalities. Clicking an item in `Load Sample Track` will add a sample track to your project.

To upload your own audiofile, click `Add Track` and use `File` button.
This editor supports `mp3`, `wave`, `ogg` files. Other encoding formats are not tested and
performance not guaranteed.

You can `play`, `pause`, `stop` the track separately or for all tracks.

Audio editing features include:

* **Cut**: cuts the selected portion of the waveform. The cut out portion is copied, so
pasting is available afterwards.
* **Copy**: copy the selected wave segment
* **Paste**: paste the copied audio to the desired place.
* **Leave**: leaves only the selected waveform and erase all else

* **Low Pass Filter (LP)**: cuts the higher frequencies from 2000Hz with 12dB/octave roll down.
* **High Pass Filter (HP)**: cuts the lower frequencies below 1500Hz with 12dB/octave roll down.
* **Reverb (rev)**: adds a reverberation effect to the selected track. It uses an impulse response file taken from St. Patrick's Church, Patrington.
* **Fade-in**
* **Fade-out**

Also, you can view the waveform of the track in `Zoom Mode`, where you click on the waveform and
drag up and down.
Selecting a portion of wave for editing is possible in `Selection Mode`, where you can
`cut`, `paste`, and `leave`.

## Development

### Stylecheck

`npm run list`

Or, if `npm run lint-file` is run, the checkstyle results are saved in a file `eslint_result.xml`

The style extends AirBnb style, with minor modifications. See `.eslintrc` for style settings.


### CI

Uses [Jenkins CI server](http://54.183.221.182:8080), and initiates a build for every
webhook triggered by github push.

The integration tests for:
* All unit tests to pass
* Building a docker container from `Dockerfile`
* Pushing the built docker container to [Docker hub](https://hub.docker.com/r/kaehops/webaudioeditor/)
* Passing checkstyle

### Dependencies / Technologies used

**Server Framework**
* [node.js](https://nodejs.org/en/)
* [express](http://expressjs.com) for REST api's
* [webpack2](https://webpack.js.org) for bundling
* [Babel](http://babeljs.io) for ECMAScript version management and transpiling

**Waveform Visualization**
* [waves-ui](https://github.com/wavesjs/waves-ui)

**DB**
* [Mongodb](https://www.mongodb.com) for user authentication and library management

**CSS**
* [Bootstrap 4 (alpha)](https://v4-alpha.getbootstrap.com)

**Integration**
* [AWS EC2](https://aws.amazon.com) for ubuntu webserver container
* [Docker](https://www.docker.com) for microservice builds and deployment
* [Jenkins](https://jenkins.io) for continuous integration master

**Testing**
* [Mocha](https://mochajs.org)
* [Sinon](http://sinonjs.org)
* [Chai](http://chaijs.com)

**ECMAScript Stylecheck**
* [eslint](http://eslint.org)
