process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');

/* eslint-disable global-require */
const assert = require('assert');
const it = require('mocha').it;
const describe = require('mocha').describe;
const before = require('mocha').before;
const beforeEach = require('mocha').beforeEach;
const chai = require('chai');
const should = require('chai').should(); // eslint-disable-line no-unused-vars
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const supertest = require('supertest');

const expect = chai.expect;

// required modules
const User = require('../models/user');
const server = require('../app');

require('sinon-mongoose');

chai.use(chaiHttp);


describe('Mongoose User Schema Test', () => {
  const UserMock = sinon.mock(User);

  it('should find a user by author', (done) => {
    UserMock
      .expects('findOne').withArgs({ username: 'username' })
      .resolves('RESULT');

    User.findOneByUsername('username').then((result) => {
      UserMock.verify();
      UserMock.restore();
      assert.equal(result, 'RESULT');
      done();
    });
  });

  it('should add audio information to library', (done) => {
    // sample information to store
    const info = {
      username: 'username',
      audioInfo: {
        audiotitle: 'title',
        url: '/user/somewhere',
      },
    };

    // mock
    UserMock
      .expects('findOneAndUpdate')
      .withArgs({ username: info.username }, { $push: { library: info.audioInfo } })
      .resolves('RESULT');

    // actual test
    User.addAudioInfoToLibrary(info).then((result) => {
      UserMock.verify();
      UserMock.restore();
      assert.equal(result, 'RESULT');
      done();
    });
  });
});


describe('Controller Tests', () => {
  let controller;
  let session;
  let res;

  before(() => {
    // bring up controller
    controller = require('../controllers/appController');

    session = { // fake session
      name: 'dansuh',
      username: 'dansuh@gmail.com',
      destroy: cb => cb(),
    };

    res = {
      cookie: () => res,
      status: () => res,
      sendFile: () => res,
      send: () => res,
      redirect: () => res,
      json: () => res,
      end: () => res,
    };
  });

  it('should contain functions', (done) => {
    expect(controller.getRoot).to.be.a('function');
    expect(controller.signIn).to.be.a('function');
    expect(controller.signUp).to.be.a('function');
    expect(controller.postSignIn).to.be.a('function');
    expect(controller.postSignUp).to.be.a('function');
    expect(controller.logOut).to.be.a('function');
    expect(controller.notFound).to.be.a('function');
    done();
  });

  it('getRoot should send status 200', (done) => {
    const getRoot = sinon.spy(controller, 'getRoot');

    // fake response
    controller.getRoot({ session }, res, {});

    getRoot.restore();
    sinon.assert.calledOnce(getRoot);
    done();
  });

  it('getRoot should call cookie twice', (done) => {
    const cookie = sinon.spy(res, 'cookie');

    controller.getRoot({ session }, res, {});

    cookie.restore();
    sinon.assert.callCount(cookie, 2);
    done();
  });

  it('getRoot should set status to 200', (done) => {
    const status = sinon.spy(res, 'status');

    controller.getRoot({ session }, res, {});

    status.restore();
    assert(status.calledWith(200));
    done();
  });

  it('signIn should get status of 200', (done) => {
    const status = sinon.spy(res, 'status');

    controller.signIn({ session }, res);

    status.restore();
    assert(status.calledWith(200));
    done();
  });

  it('signUp should get status of 200', (done) => {
    const status = sinon.spy(res, 'status');

    controller.signUp({ session }, res);

    status.restore();
    assert(status.calledWith(200));
    done();
  });

  it('postSignIn should return 420 with Incorrect Password for wrong password', (done) => {
    // prepare a stub and a spy
    const send = sinon.spy(res, 'send');
    const findOneByUsernameStub = sinon.stub(User, 'findOneByUsername');
    findOneByUsernameStub.callsFake((username, callback) => {
      callback(null, { name: 'dansuh', password: 'wrong password' });
    });

    // make up a request
    const req = {
      session,
      body: {
        username: 'dansuh@gmail.com',
        password: 'right password',
      },
    };

    // call!
    controller.postSignIn(req, res);

    findOneByUsernameStub.restore();
    send.restore();

    // asserts
    sinon.assert.calledOnce(send);
    assert(send.calledWith('Incorrect password.'));
    done();
  });

  it('redirects to "/" on /logout', (done) => {
    const redirect = sinon.spy(res, 'redirect');

    controller.logOut({ session }, res);
    redirect.restore();

    sinon.assert.calledOnce(redirect);
    done();
  });

  it('destroys the session on logout', (done) => {
    const destroy = sinon.spy(session, 'destroy');

    controller.logOut({ session }, res);

    destroy.restore();
    sinon.assert.callCount(destroy, 1);
    done();
  });

  it('does not call destroy upon logout when session is not continued', (done) => {
    const sess = {
      destroy: cb => cb(),
      // no username!
    };

    const destroy = sinon.spy(sess, 'destroy');

    controller.logOut({ session: sess }, res);
    destroy.restore();

    sinon.assert.callCount(destroy, 0);
    done();
  });

  describe('audioReqByTrackName', () => {
    let getOriginalData;
    let deleteTempFile;
    let TEMP_FILE_NAME;

    beforeEach(() => {
      TEMP_FILE_NAME = 'test_temp_file';

      getOriginalData = filename => fs.readFileSync(
        path.resolve(__dirname, `../public/sample_tracks/${filename}.mp3`));

      deleteTempFile = (filename, done) => {
        fs.stat(filename, () => {
          fs.unlink(filename, (err) => {
            assert(!err);
            done();
          });
        });
      };
    });

    it('sends the file according to the track name requested: exhale', (done) => {
      const audioFilename = 'exhale';
      const req = {
        params: {
          trackname: audioFilename,
        },
      };
      const writeStream = fs.createWriteStream(TEMP_FILE_NAME);

      controller.audioReqByTrackName(req, writeStream);

      writeStream.on('finish', () => {
        const testBuf = fs.readFileSync(TEMP_FILE_NAME);
        const expectedBuf = getOriginalData(audioFilename);

        // compare the contents
        assert(testBuf.toString() === expectedBuf.toString());
        // delete the temporary file and done
        deleteTempFile(TEMP_FILE_NAME, done);
      });
    });

    it('sends the file according to the track name requested: itsgonnarain', (done) => {
      const audioFilename = 'itsgonnarain';
      const req = {
        params: {
          trackname: audioFilename,
        },
      };
      const writeStream = fs.createWriteStream(TEMP_FILE_NAME);

      controller.audioReqByTrackName(req, writeStream);

      writeStream.on('finish', () => {
        const testBuf = fs.readFileSync(TEMP_FILE_NAME);
        const expectedBuf = getOriginalData(audioFilename);

        // compare the contents
        assert(testBuf.toString() === expectedBuf.toString());
        // delete the temporary file and done
        deleteTempFile(TEMP_FILE_NAME, done);
      });
    });

    it('sends the file according to the track name requested: starcraft', (done) => {
      const audioFilename = 'starcraft';
      const req = {
        params: {
          trackname: audioFilename,
        },
      };
      const writeStream = fs.createWriteStream(TEMP_FILE_NAME);

      controller.audioReqByTrackName(req, writeStream);

      writeStream.on('finish', () => {
        const testBuf = fs.readFileSync(TEMP_FILE_NAME);
        const expectedBuf = getOriginalData(audioFilename);

        // compare the contents
        assert(testBuf.toString() === expectedBuf.toString());
        // delete the temporary file and done
        deleteTempFile(TEMP_FILE_NAME, done);
      });
    });
  });

  describe('upload', () => {
    it('fails with no session', (done) => {
      const status = sinon.spy(res, 'status');
      const send = sinon.spy(res, 'send');

      controller.upload({ session: {} }, res);

      status.restore();
      send.restore();

      assert(status.calledWith(420));
      assert(send.calledWith('Session information unavailable!'));
      done();
    });
  });

  describe('libraryInfo', () => {
    it('returns Not Available with no username provided', (done) => {
      const status = sinon.spy(res, 'status');

      controller.libraryInfo({ params: { username: 'undefined' } }, res);

      status.restore();
      assert(status.calledWith(420));
      done();
    });

    it('returns the library contents', (done) => {
      const json = sinon.spy(res, 'json');
      const req = {
        params: {
          username: 'valid',
        },
      };

      const tempUserDoc = {
        name: 'dansuh',
        username: 'valid',
        password: 'password',
        library: [{ audiotitle: 'foo', url: 'path/to/foo' }],
      };

      const findOneByUsernameStub = sinon.stub(User, 'findOneByUsername');
      findOneByUsernameStub.callsFake((username, callback) => {
        callback('Not Error', tempUserDoc);
      });

      controller.libraryInfo(req, res);

      findOneByUsernameStub.restore();

      sinon.assert.calledOnce(json);
      sinon.assert.calledWith(json, sinon.match.array);
      sinon.assert.calledWithMatch(json, tempUserDoc.library);

      done();
    });
  });
});


describe('Test Express Server', () => {
  it('responds to /', (done) => {
    supertest(server)
      .get('/')
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });

  it('responds to /signin', (done) => {
    supertest(server)
      .get('/signin')
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });

  it('responds to /signup', (done) => {
    chai.request(server)
      .get('/signup')
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });

  it('404 unknown', (done) => {
    chai.request(server)
      .get('/blabh')
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
});
