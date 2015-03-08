var mongoose = require('mongoose');
var config   = require('../config.js');

var Schema = mongoose.Schema;

// TODO: lines 1-15 are identical in each model file... is there a way to outsource the code and make this more efficient?

var User = new Schema({
  fbId: String,
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
  ageRange: Object,
  birthday: String,
  gender: String,
  education: Object,
  interests: Array,
  relationshipStatus: String,
  work: Object,
  hometown: String,
  location: String,
  languages: String,
  dateCreated: String,
  lastUpdated: String

  /*
    NOTES:

    Fields hometown, location, and languages are of type Page in the facebook graph api, indicating they link to a facebook page. Here I represent them as strings.

    Activities not implemented here because it probably needs its own schema.

    dateCreated and lastUpdated should not be exposed in the API
  */
});

module.exports = mongoose.model('User', User);