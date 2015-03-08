// var nconf = require('nconf');

// nconf.argv()
//     .env()
//     .file({ file: './config.json' });

// module.exports  = nconf;

module.exports = {
  "db": {
    "mongodb": "mongodb://admin:admin@ds031581.mongolab.com:31581/test-db"
  },
  "logger": {
    "api": "logs/api.log",
    "exception": "logs/exceptions.log"
  }
}