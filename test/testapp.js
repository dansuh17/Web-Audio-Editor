process.env.NODE_ENV = 'test';

const assert = require('assert');
const it = require('mocha').it;
const describe = require('mocha').describe;
const beforeEach = require('mocha').beforeEach;
const before = require('mocha').before;
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = require('chai').should();
const sinon = require('sinon');
const supertest = require('supertest');

const expect = chai.expect;
const User = require('../models/user');
const server = require('../app');

require('sinon-mongoose');
chai.use(chaiHttp);


describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
});


describe('Mongoose User Schema Test', function() {
  const UserMock = sinon.mock(User);

  it('should find a user by author', function(done) {
    UserMock
      .expects('findOne').withArgs({ username: 'username' })
      .resolves('RESULT');

    User.findOneByUsername('username').then(function (result) {
      UserMock.verify();
      UserMock.restore();
      assert.equal(result, 'RESULT');
      done();
    });
  });

  it('should add audio information to library', function(done) {
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
      .withArgs({ username: info.username}, { $push: { library: info.audioInfo }})
      .resolves('RESULT');

    // actual test
    User.addAudioInfoToLibrary(info).then(function (result) {
      UserMock.verify();
      UserMock.restore();
      assert.equal(result, 'RESULT');
      done();
    });
  });
});


describe('Controller Tests', function() {
  let controller;
  let session;
  let res;

  before(() => {
    // bring up controller
    controller = require('../controllers/appController');
    session = {  // fake session
      name: 'dansuh',
      username: 'dansuh@gmail.com',
    };
    res = {
      cookie: (one, two, three) => res,
      status: (statusNum) => res,
      sendFile: (path) => res,
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
});


describe('Test Express Server', function() {
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
      })
  });

  it('responds to /signup', (done) => {
    "use strict";
    chai.request(server)
      .get('/signup')
      .end((err, res) => {
        res.should.have.status(200);
        done();
      })
  });

  it('404 unknown', function (done) {
    chai.request(server)
      .get('/blabh')
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
});
