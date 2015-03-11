var mongoose = require('mongoose');
var Image = require('./image.js');
var Schema = mongoose.Schema;

// TODO: lines 1-15 are identical in each model file... is there a way to outsource the code and make this more efficient?

var User = new Schema({
  email: {
    type: String,
    required: true
  },
  firstName: {
      type: String,
      required: true
  },
  lastName: {
    type: String,
    required: true
  },
  avatar: [Image],
  dateCreated: Date,
  lastUpdated: Date
});

module.exports = mongoose.model('User', User);