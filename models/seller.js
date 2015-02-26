var mongoose = require('mongoose');
var config   = require('../config.js');

var Schema = mongoose.Schema;

// TODO: lines 1-15 are identical in each model file... is there a way to outsource the code and make this more efficient?

var Seller = new Schema({
  email: {
    type: String,
    required: true
  },
  items: [{
    item: {
      title: String,
      itemId: String
    }
  }],
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
  /*
    NOTES:

    Our app handles seller accounts while facebook handles user accounts -> need authentication scheme for sellers
  */
});

module.exports = mongoose.model('Seller', Seller);