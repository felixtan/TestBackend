var app            = require('express')();
var mongoose       = require('mongoose');
var uriUtil        = require('mongodb-uri');
var Q              = require('q');
var bodyParser     = require('body-parser');
var multiparty     = require('multiparty');
var bcrypt         = require('bcrypt');
var logger         = require('morgan');
const log          = require('npmlog');
var passport       = require('passport');
var GoogleStrategy = require('passport-google').Strategy;
var session        = require('express-session');
var cookieParser   = require('cookie-parser');
var MongoStore     = require('connect-mongo')(session);
var config         = require('./config.js');
var User           = require('./models/user.js');
var Item           = require('./models/item.js');
var Seller         = require('./models/seller.js');
var Activity       = require('./models/activity.js');

port = process.env.PORT || 3000;
ip = process.env.IP;
mode = app.settings.env;

/**
  DB Connection

  For rationale for this configuration, go to:
  http://blog.mongolab.com/2014/04/mongodb-driver-mongoose/#Properly_configure_application_error_handling
*/
var options = {
  server: {
    socketOptions: {
      keepAlive: 1,
      connectTimeoutMS: 30000
    }
  },
  replset: {
    socketOptions: {
      keepAlive: 1,
      connectTimeoutMS : 30000
    }
  }
};

var mongooseUri = uriUtil.formatMongoose(config.db.mongodb);
mongoose.connect(mongooseUri, options);
var connection = mongoose.connection;

// Refer to the following article for Mongoose connection best practices
// http://theholmesoffice.com/mongoose-connection-best-practice/
// Upon successful connection
connection
  .once('open', function() {
    log.info('Connection to ' + connection.name + ' established');

    // Connection to test-db is an async operation so we wait for the connection to open before starting up the express server
    app.listen(port, function() {
      log.info('Listening on port ' + port + ' in ' + mode + ' mode.');
    });
  })
  // Upon disconnection from test-db
  .on('disconnected', function() {
    log.info('Connection to ' + connection.name + ' closed');
    // TODO: log reason for db disconnection?
  })
  // DB connection error handling
  .on('error', function(err) {
    log.error('MongoDB', err.message);
  });

// Upon ^C termination of the app
process.on('SIGINT', function() {
  connection.close(function() {
    log.info('Connection to ' + connection.name + ' closed through app termination');
    process.exit(0);
  });
});

// MIDDLEWARE
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'trulyrandom',
  cooke: { maxAge: 60000 },
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({
    mongooseConnection: mongoose.connection
  })
}));
app.use(passport.initialize());
app.use(passport.session());

// Session data management
passport.serializeUser(function(user, done) {
  done(null, user.identifier);
});
passport.deserializeUser(function(id, done) {
  done(null, { identifier: id });
});

passport.use(new GoogleStrategy({
    returnURL: 'http://localhost:3000/auth/google/return',
    realm: 'http://localhost:3000/'
  },

  /**
    profile: will contain user profile information provided by Google
  */
  function(identifier, profile, done) {
    profile = {
      identifier: identifier
    };
    log.info('profile:\n', profile);
    return done(null, profile);
  }
));

// ROUTES
app.get('/', function(req, res) {
  res.send('Awesome landing page')
});
app.get('/api', function(req, res) {
  res.send('Awesome API is operational');
});
app.get('/login', function(req, res) {
  res.send('Awesome login page');
});
app.get('/logout', function(req, res) {
  res.send('You are now logged out. Thanks for using our awesome app!');
});
app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/return',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
);
app.get('/auth/logout', function(req, res) {
  req.logout();
  res.redirect('/logout');
});

// USERS API /////////////////////////////////////////////

// This might eventually belong in middleware stack
// function validUserEmail(email) {
//   var valid = false;
//   query = User.where({ email: req.body.email });
//   User.findOne(query, function(err, user) {
//     if(!user) valid = true;
//   });
//   return valid;
// }

// GET/READ ALL USERS
app.get('/api/users', function(req, res) {
  return User.find(function(err, users) {
    if(!err) {
      return res.send(users);
    } else {
      res.statusCode = 500;
      console.log('Internal error(%d): %s.', res.statusCode, err.message);
      return res.send({ error: 'Server error.' });
    }
  });
});

// GET/READ A SPECIFIC USER
app.get('/api/users/:id', function(req, res) {
  return User.findById(req.params.id, function(err, user) {
    if(!user) {
      res.statusCode = 404;
      return res.send({ error: 'User not found.' });
    }

    if(!err) {
      return res.send({ status: 'User found.', user: user});
    } else {
      res.statusCode = 500;
      console.log('Internal error(%d): %s.', res.statusCode, err.message);
      return res.send({ error: 'Server error.' });
    }
  });
});

// POST/CREATE A NEW USER
app.post('/api/users', function(req, res) {
  var query = User.where({ email: req.body.email });
  query.findOne(function(err, user) {
    if(user) {
      res.statusCode = 409;
      return res.send({ errpr: 'User with the email already exists.'});
    }

    if(!user) {
      var newUser = new User({
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        dateCreated: (new Date()).toUTCString()
      });

      newUser.save(function(err) {
        if(!err) {
          res.statusCode = 201;
          return res.send({ status: 'User ' + newUser.firstName + ' ' + newUser.lastName + ' was added.', user: newUser });
        } else {
            res.statusCode = 500;
            return res.send({ error: 'Server error.' });
            console.log('Internal error(%d): %s.', res.statusCode, err.message);
        }
      });
    }
  });
});

// PUT/UPDATE A USER
app.put('/api/users/:id', function(req, res) {
  return User.findById(req.params.id, function(err, user) {
    if(!user) {
      res.statusCode = 404;
      return res.send({ error: 'User not found.' });
    }

    user.email = req.body.email;
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.lastUpdated = (new Date()).toUTCString();

    return user.save(function(err) {
      if(!err) {
        return res.send({ user: user });
      } else {
        if(err.name == 'ValidationError') {
          res.statusCode = 400;
          res.send({ error: 'Bad Request.'});
        } else {
          res.statusCode = 500;
          res.send({ error: 'Server error.' });
        }
        console.log('Internal error(%d): %s.', res.statusCode, err.message);
      }
    });
  });
});

// DELETE A USER
app.delete('/api/users/:id', function(req, res) {
  return User.findById(req.params.id, function(err, user) {
    if(!user) {
      res.statusCode = 404;
      return res.send({ error: 'User not found' });
    }

    return user.remove(function(err) {
      if(!err) {
        return res.send({ status: 'User deleted.' });
      } else {
        res.statusCode = 500;
        console.log('Internal error(%d): %s.', res.statusCode, err.message);
        return res.send({ error: 'Server error.'});
      }
    });
  });
});

//////////////////////////////////////////////////////////

// ITEMS API /////////////////////////////////////////////

// GET all items
app.get('/api/items', function(req, res) {
    return Item.find(function(err, items) {
    if(!err) {
      return res.send(items);
    } else {
      res.statusCode = 500;
      console.log('Internal error(%d): %s.', res.statusCode, err.message);
      return res.send({ error: 'Internal Server Error' });
    }
  });
});

// GET an item
app.get('/api/items/:id', function(req, res) {
  return Item.findById(req.params.id, function(err, item) {
    if(!item) {
      res.statusCode = 404;
      return res.send({ error: 'Item not found' });
    }

    if(!err) {
      return res.send({ status: 'Item found', item: item});
    } else {
      res.statusCode = 500;
      console.log('Internal error(%d): %s.', res.statusCode, err.message);
      return res.send({ error: 'Internal Server Error' });
    }
  });
});

// CREATE an item
app.post('/api/items', function(req, res) {
  var newItem = new Item({
    sellerId: req.body.sellerId,
    price: req.body.price,
    desc: req.body.desc,
    title: req.body.title,
    height: req.body.height,
    width: req.body.width
    // TODO: add imgs
    // http://markdawson.tumblr.com/post/18359176420/asynchronous-file-uploading-using-express-and
  });

  newItem.save(function(err) {
    if(!err) {
      res.statusCode = 201;
      return res.send({ status: 'Item added', item: newItem });
    } else {
      if(err.name == 'ValidationError') {
        res.statusCode = 400;
        res.send({ error: 'Bad Request' });
      } else {
        res.statusCode = 500;
        res.send({ error: 'Internal Server Error' });
      }
    }
  });
});

// UPDATE an item
app.put('/api/items/:id', function(req, res) {
  return Item.findById(req.params.id, function(err, item) {
    if(!item) {
      res.statusCode = 404;
      return res.send({ error: 'Item not found' });
    }

    item.sellerId = req.body.sellerId;
    item.price = req.body.price;
    item.desc = req.body.desc;
    item.title = req.body.title;
    item.height = req.body.height;
    item.width = req.body.width;
    // TODO: add imgs

    return item.save(function(err) {
      if(!err) {
        return res.send({ status: 'Item updated', item: item });
      } else {
        if(err.name == 'ValidationError') {
          res.statusCode = 400;
          res.send({ error: 'Bad Request'});
        } else {
          res.statusCode = 500;
          res.send({ error: 'Internal Server Error' });
        }
        console.log('Internal error(%d): %s.', res.statusCode, err.message);
      }
    });
  });
});

// DELETE an item
app.delete('/api/items/:id', function(req, res) {
  return Item.findById(req.params.id, function(err, item) {
    if(!item) {
      res.statusCode = 404;
      return res.send({ error: 'Item not found' });
    }

    return item.remove(function(err) {
      if(!err) {
        return res.send({ status: 'Item deleted' });
      } else {
        res.statusCode = 500;
        console.log('Internal error(%d): %s.', res.statusCode, err.message);
        return res.send({ error: 'Internal Server Error '});
      }
    });
  });
});

//////////////////////////////////////////////////////////

// SELLERS API ///////////////////////////////////////////

// GET/READ ALL SELLERS
app.get('/api/sellers', function(req, res) {
  return Seller.find(function(err, sellers) {
    if(!err) {
      return res.send(sellers);
    } else {
      res.statusCode = 500;
      console.log('Internal error(%d): %s.', res.statusCode, err.message);
      return res.send({ error: 'Internal Server Error' });
    }
  });
});

// GET/READ A SPECIFIC SELLER
app.get('/api/sellers/:id', function(req, res) {
  return Seller.findById(req.params.id, function(err, seller) {
    if(!seller) {
      res.statusCode = 404;
      return res.send({ error: 'Seller not found' });
    }

    if(!err) {
      return res.send({ status: 'Seller found', seller: seller });
    } else {
      res.statusCode = 500;
      console.log('Internal error(%d): %s.', res.statusCode, err.message);
      return res.send({ error: 'Internal Server Error' });
    }
  });
});

// POST/CREATE A SELLER
app.post('/api/sellers', function(req, res) {

  if(req.body.password == '' || typeof req.body.password === 'undefined' || req.body.password === null) {
    return res.send({ error: 'Bad password'});
    // TODO: write function or module for validating password and other credentials... DRY
  }

  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(req.body.password, salt, function(err, hash) {
      var newSeller = new Seller({
        email: req.body.email,
        name: req.body.name,
        password: hash
      });

      newSeller.save(function(err) {
        if(!err) {
          res.statusCode = 201;
          return res.send({ status: 'Seller created' });
        } else {
          if(err.name == 'ValidationError') {
            res.statusCode = 400;
            res.send({ error: 'Bad Request' });
          } else {
            res.statusCode = 500;
            res.send({ error: 'Internal Server Error' });
          }
        }
      });
    });
  });
});

// PUT/UPDATE A SELLER
app.put('/api/sellers/:id', function(req, res) {
  return Seller.findById(req.params.id, function(err, seller) {
    if(!seller) {
      res.statusCode = 404;
      return res.send({ error: 'Seller not found' });
    }

    /**
      NOTES:
      1. There should be a special process for changing a user or seller parameters... think of the process you go through when you want to change a password... maybe this concern is more for the front-end?
      2. Items are not added/updated here because we're first creating a fresh seller account with no items/sales. Items should be added from a different url and api.
    */

    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(req.body.password, salt, function(err, hash) {
        seller.email = req.body.email;
        seller.name = req.body.name;
        seller.password = hash;

        return seller.save(function(err) {
          if(!err) {
            return res.send({ status: 'Seller updated', seller: seller });
          } else {
            if(err.name == 'ValidationError') {
              res.statusCode = 400;
              res.send({ error: 'Bad Request'});
            } else {
              res.statusCode = 500;
              res.send({ error: 'Internal Server Error' });
            }
            console.log('Internal error(%d): %s.', res.statusCode, err.message);
          }
        });
      });
    });
  });
});

// DELETE A SELLER
app.delete('/api/sellers/:id', function(req, res) {
  return Seller.findById(req.params.id, function(err, seller) {
    if(!seller) {
      res.statusCode = 404;
      return res.send({ error: 'Seller not found' });
    }

    return seller.remove(function(err) {
      if(!err) {
        return res.send({ status: 'Seller deleted' });
      } else {
        res.statusCode = 500;
        console.log('Internal error(%d): %s.', res.statusCode, err.message);
        return res.send({ error: 'Server error.'});
      }
    });
  });
});

//////////////////////////////////////////////////////////

// ACTIVITIES API ////////////////////////////////////////

// GET ALL ACTIVITIES
app.get('/api/activities', function(req, res) {
  return Activity.find(function(err, activities) {
    if(!err) {
      return res.send(activities);
    } else {
      res.statusCode = 500;
      return res.send({ error: 'Internal Server Error' });
    }
  });
});

// GET A SPECIFIC ACTIVITY
app.get('/api/activities/:id', function(req, res) {
  return Activity.findById(req.params.id, function(err, activity) {
    if(!activity) {
      res.statusCode = 404;
      return res.send({ error: 'Activity not found' });
    }

    if(!err) {
      res.statusCode = 200;
      return res.send({ status: 'Activity found', activity: activity });
    } else {
      res.statusCode = 500;
      res.send({ error: 'Internal Server Error' });
    }
  });
});

// CREATE AN ACTIVITY
app.post('/api/activities', function(req, res) {
  var newActivity = new Activity({
    userId: req.body.userId,
    itemId: req.body.itemId,
    liked: req.body.liked
  });

  return newActivity.save(function(err) {
    if(!err) {
      res.statusCode = 201;
      return res.send({ status: 'Activity created' });
    } else {
      if(err.name == 'ValidationError') {
        res.statusCode = 400;
        return res.send({ error: 'Bad Request' });
      } else {
        res.statusCode = 500;
        return res.send({ error: 'Internal Server Error '});
      }
    }
  });
});

// UPDATE AN ACTIVITY
app.put('/api/activities/:id', function(req, res) {
  return Activity.findById(req.params.id, function(err, activity) {
    if(!activity) {
      res.statusCode = 404;
      return res.send({ error: 'Activity not found' });
    }

    activity.userId = req.body.userId;
    activity.itemId = req.body.itemId;
    activity.liked = req.body.liked;

    return activity.save(function(err) {
      if(!err) {
        res.statusCode = 200;
        return res.send({ status: 'Activity updated' });
      } else {
        if(err.name == 'ValidationError') {
          res.statusCode = 400;
          return res.send({ error: 'Bad Request' });
        } else {
          res.statusCode = 500;
          return res.send({ error: 'Internal Server Error' });
        }
      }
    });
  });
});

// DELETE AN ACTIVITY
app.delete('/api/activities/:id', function(req, res) {
  return Activity.findById(req.params.id, function(err, activity) {
    if(!activity) {
      res.statusCode = 404;
      return res.send({ error: 'Activity not found' });
    }

    return Activity.remove(function(err) {
      if(!err) {
        res.statusCode = 200;
        return res.send({ status: 'Activity deleted' });
      } else {
        if(err.name == 'ValidationError') {
          res.statusCode = 400;
          return res.send({ error: 'Bad Request' });
        } else {
          res.statusCode = 500;
          return res.send({ error: 'Internal Server Error' });
        }
      }
    });
  });
});

// For testing
module.exports = {
  db: connection,
  app: app,
  models: {
    User: User
  }
}