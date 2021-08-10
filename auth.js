const mongojs  = require('mongojs');
const crypto   = require('crypto');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db = mongojs('movie_storage', ['admins']);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Uses when login
passport.use(new LocalStrategy((username, password, done) => {
    let pwdHash = crypto.createHash('sha1').update(password).digest('hex');
    db.admins.findOne({
      email: username,
      password: pwdHash
    }, (err, data) => {
        err || !data ? done(null, false) : done(null, data);
    });
}));

exports.login = function() {
  return passport.authenticate('local');
}

// Ensure user is authenticated
exports.ensureAuth = function() {
  return function(req, res, next) {
    req.isAuthenticated() ? next() : res.sendStatus(401);
  }
}

// Ensrue user is admin
exports.ensureAdmin = function() {
  return function(req, res, next) {
    req.isAuthenticated() && req.user.role === 0 ? next() : res.sendStatus(401);
  }
}

// Ensure user is editor
exports.ensureEditor = function() {
  return function(req, res, next) {
    req.isAuthenticated() && req.user.role <= 1 ? next() : res.sendStatus(401);
  }
}
