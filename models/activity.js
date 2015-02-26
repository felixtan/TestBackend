var mongoose = require('mongoose');
var config   = require('../config.js');

var Schema = mongoose.Schema;

// TODO: lines 1-15 are identical in each model file... is there a way to outsource the code and make this more efficient?

var Activity = new Schema({
  userId: {
    type: String,
    required: true
  },
  itemId: {
    type: String,
    required: true
  },
  liked: Boolean,
  date: Date
  /*
    NOTES:
  */
});

module.exports = mongoose.model('Activity', Activity);