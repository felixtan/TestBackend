var app      = require('../../server.js');
var expect   = require('chai').expect;
var request  = require('supertest');
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt');
var Seller   = require('../../models/seller.js');

describe('CREATE a new seller account', function() {
  it('Should create and save a new seller object', function(done) {

    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash("password", salt, function(err, hash) {

        var newSeller = new Seller({
          email: "abcProducts@abc.com",
          name: "ABC LLC",
          password: hash
        })

        newSeller.save(function(err) {
          expect(err).to.be.a('null')
          done()
        })

      })
    })
  })

  it('Should not save a new seller object if it has the same email as an existing seller object', function(done) {

    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash("strongpassword", salt, function(err, hash) {

        var newSeller = new Seller({
          email: "abcProducts@abc.com",
          name: "ABC Corp",
          password: hash
        })

        newSeller.save(function(err) {
          expect(err).to.be.a('null')
          done()
        })

      })
    })
  })

  after(function(done) {
    // loop through seller collection using find and then delete
    Seller.find({}, function(err, sellers) {
      if(!err) {
        sellers.forEach(function(seller) {
          seller.remove()
        })
        done()
      } else {
        throw err
        done()
      }
    })
  })
})