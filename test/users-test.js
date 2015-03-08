var expect = require('chai').expect;
var request = require('supertest');
var mongoose = require('mongoose');
var config = require('../config.js');
var app = require('../server.js').app;
var User = require('../server.js').models.User;

describe('API', function() {
  before(function(done) {
    mongoose.createConnection(config.db.mongodb);
    done();
  });

  describe('User', function() {
    it('should GET /api/users', function(done) {
      request(app)
        .get('/api/users')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if(err) return done(err);
          done();
        });
    });

    it('should POST a new user to /api/users', function(done) {
      var user = {
        email: 'lol@gmail.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      request(app)
        .post('/api/users')
        .send(user)
        .expect(201)
        .end(function(err, res) {
          if(err) return done(err);
          done();
        });
    });

    it('should not POST a new user with the same email', function(done) {
      var user = {
        email: 'lol@gmail.com',
        firstName: 'Jack',
        lastName: 'Black'
      };

      request(app)
        .post('/api/users')
        .send(user)
        .expect(409)
        .end(function(err, res) {
          if(err) return done(err);
          done();
        });
    });

    it('should find a user by email and UPDATE it', function(done) {
      var email = 'yahoo@gmail.com';
      var query = User.where({ email: 'lol@gmail.com' });
      query.findOne(function(err, user) {
        if(err) return done(err);
        if(user) {
          request(app)
            .put('/api/users/' + user._id)
            .send({ email: email })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
              if(err) return done(err);
              expect(res.body.user.email).to.equal('yahoo@gmail.com');
              done();
            });
        }
      });
    });

    it('should find a user by email and DELETE it', function(done) {
      var query = User.where({ email: 'yahoo@gmail.com' });
      query.findOne(function(err, user) {
        if(err) return done(err);
        if(user) {
          request(app)
            .delete('/api/users/' + user._id)
            .expect(200)
            .end(function(err) {
              if(err) return done(err);
              done();
            });
        }
      });
    });
  });

  // Clean-up: close the db connection
  after(function(done) {
    mongoose.disconnect();
    done();
  });
});