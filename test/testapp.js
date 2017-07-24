process.env.NODE_ENV = 'test';

/* eslint-disable global-require */
const assert = require('assert');
const it = require('mocha').it;
const describe = require('mocha').describe;
const before = require('mocha').before;
const chai = require('chai');
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
        audiotitle: 'audiotitle',
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
    };

    res = {
      cookie: () => res,
      status: () => res,
      sendFile: () => res,
      send: () => res,
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
