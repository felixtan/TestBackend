var mongoose = require('mongoose');
var config   = require('../config.js');

var Schema = mongoose.Schema;

// TODO: lines 1-15 are identical in each model file... is there a way to outsource the code and make this more efficient?

var Item = new Schema({
  sellerId: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  imgs: [{
    img: {
      height: String,
      width: String,
      src: {
        type: String,
        required: true
      }
    }
  }],
  desc: String,
  title: String
});

module.exports = mongoose.model('Item', Item);