var app      = require('../../server.js');
var expect   = require('chai').expect;
var request  = require('supertest');
var mongoose = require('mongoose');
var User     = require('../../models/user.js');

describe('User API unit tests', function() {
  describe('Testing the connection to test-db at Mongolab', function() {
    it('Server should connect to test-db', function(done) {
      //console.log(app.db);
      expect(app.db).to.be.an('object');
      expect(app.db.name).to.equal('test-db');
      done();
    });
  });

  describe('CREATE', function() {
    before(function(done) {
      var John, Bob, Jane;
      done();
    });

    it('Should create and save a new user', function(done) {
      John = new User({
        fbId: '123',
        email: 'test@gmail.com',
        firstName: 'John',
        lastName: 'Doe',
        ageRange: {
          low: '18',
          high: '25'
        },
        birthday: '01/01/1966',
        gender: 'male',
        education: {
          highSchool: {
            name: 'podunk high',
            yearStarted: '2000',
            yearGraduated: '2004'
          },
          university: {
            name: 'podunk u',
            major: 'art history',
            yearStarted: '2004',
            yearGraduated: '2008'
          }
        },
        relationshipStatus: 'single'
      });

      John.save(function(err) {
        expect(err).to.be.a('null');
        done();
      });
    });

    it('User must include an email', function(done) {
      Bob = new User({
        email: '',
        firstName: 'Bob',
        lastName: 'Doe'
      });

      Bob.save(function(err) {
        // Server should throw validation error
        // console.log(err);
        expect(err).to.be.an('object');
        expect(err.name).to.equal('ValidationError');
        done();
      });
    });

    it('User must include a firstName', function(done) {
      Jane = new User({
        email: 'johndoe@gmail.com',
        firstName: '',
        lastName: 'Plain'
      });

      Jane.save(function(err) {
        // Server should throw validation error
        // console.log(err);
        expect(err).to.be.an('object');
        expect(err.name).to.equal('ValidationError');
        done();
      });
    });

    after(function(done) {
      John.remove();
      Bob.remove();
      Jane.remove();
      done();
    });
  });

  describe('READ', function() {
    before(function(done) {
      var Gandalf, query;
      Gandalf = new User({
        email: 'olorin@istari.maiar.net',
        firstName: 'Gandalf',
        lastName: 'Grey'
      }).save();
      done();
    });

    it('GET request to /api/users should return statusCode 200', function(done) {
      request('http://localhost:3000')
        .get('/api/users')
        .expect(200, done);
    });

    it('GET request to /api/users/:userid should return statusCode 200', function(done) {
      // first have to get id
      query = User.where({ email: 'olorin@istari.maiar.net' });
      query.findOne(function(err, user) {
        if(err) throw err;
        request('http://localhost:3000')
          .get('/api/users/' + user._id)
          .expect(200, done);
      });
    });

    it('Query a user by email and return that user', function(done) {
      query = User.where({ email: 'olorin@istari.maiar.net' });
      query.findOne(function(err, user) {
        if(err) throw err;
        if(user) {
          expect(user).to.be.an('object');
          expect(user.firstName).to.equal('Gandalf');
          expect(user.lastName).to.equal('Grey');
          // Gandalf.remove();
          // TODO: Why doesn't remove work here?
          done();
        }
      });
    });
  });

  describe('UPDATE', function() {
    before(function(done) {
      var Saruman, query, update;
      Saruman = new User({
        email: 'curumo@istari.maiar.net',
        firstName: 'Saruman',
        lastName: 'White'
      }).save();
      done();
    });

    it('Query a user by email and update its properties', function(done) {
      query = User.where({ email: 'curumo@istari.maiar.net' });
      update = { firstName: 'Curumo', lastName: '' };
      User.findOneAndUpdate(query, update, function(err, user) {
        if(err) throw err;
        // console.log(user);
        expect(user.firstName).to.equal('Curumo');

        request('http://localhost:3000')
          .get('/api/users/' + user._id)
          .expect(200, done);
      });
    });
  });

  describe('DELETE', function() {
    it('Should delete Saruman from the db', function(done) {
      query = User.where({ email: 'curumo@istari.maiar.net' });
      User.findOneAndRemove(query, function(err, user) {
        request('http://localhost:3000')
          .get('/api/users/' + user._id)
          .expect(404, done);
      });
    });

    it('Should delete Gandalf from the db', function(done) {
      query = User.where({ email: 'olorin@istari.maiar.net' });
      User.findOneAndRemove(query, function(err, user) {
        request('http://localhost:3000')
          .get('/api/users/' + user._id)
          .expect(404, done);
      });
    });
  });
});