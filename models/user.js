const mongoose = require('mongoose');

// create a schema for the user
const Schema = mongoose.Schema;
const userSchema = new Schema({
  username: { type: String, required: true, index: { unique: true } },
  name: { type: String },
  password: { type: String, required: true },
  library: [{
    audiotitle: String,
    url: String,
  }],
});

// find the user information by the username
userSchema.statics.findOneByUsername = function findonebyusername(username, cb) {
  return this.findOne({ username }, cb);
};

// add audio information on user's upload to the user's library
userSchema.statics.addAudioInfoToLibrary = function addaudioinfotolib(info, cb) {
  return this.findOneAndUpdate(
    { username: info.username },
    { $push: { library: info.audioInfo } },
    cb);
};

module.exports = mongoose.model('user', userSchema); // collection name === 'users'
