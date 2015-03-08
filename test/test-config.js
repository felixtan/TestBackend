var expect = require('chai').expect;
var request = require('supertest');
var mongoose = require('mongoose');
var config = require('../config.js');
var app = require('../server.js').app;

module.exports = {
  testConfig: true
}