const assert = require('assert');
const it = require("mocha").it;
const describe = require("mocha").describe;
const sinon = require('sinon');
const User = require('../models/user');
require('sinon-mongoose');

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
