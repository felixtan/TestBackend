var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Image = new Schema({
  url: { type: String },
  created : { type : Date, default : Date.now }
});

module.exports = mongoose.model('Image', Image);