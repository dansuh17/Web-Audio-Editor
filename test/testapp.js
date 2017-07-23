process.env.NODE_ENV = 'test';

const assert = require('assert');
const it = require('mocha').it;
const describe = require('mocha').describe;
const beforeEach = require('mocha').beforeEach;
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = require('chai').should();
const sinon = require('sinon');
const supertest = require('supertest');
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


describe('Test Express Server', function() {
  beforeEach(function(done) {
    // remove all User data instances for test database before testing
    User.remove({}, (err) => {
      done();
    })
  });

  it('responds to /', (done) => {
    chai.request(server)
      .get('/')
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });

  it('responds to /signin', (done) => {
    chai.request(server)
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
