const mongojs = require('mongojs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const helper = require('./helper');

// Database
const db = mongojs('movie_storage');

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Local strategy for admins
passport.use("adminLocal", new LocalStrategy(function (username, password, done) {
  // Find in admins collection
  db.admins.findOne({
    email: username,
    password: helper.hashPassword(password)
  }, function (err, data) {
    if (err || !data) return done(null, false);
    else return done(null, data);
  })
}));

// Local strategy for users
passport.use("userLocal", new LocalStrategy(function (username, password, done) {
  // Find in users collection
  db.users.findOne({
    email: username,
    password: helper.hashPassword(password)
  }, function (err, data) {
    if (err || !data) return done(null, false);
    else return done(null, data);
  })
}));

module.exports = {
  // For admin login
  loginAdmin() {
    return passport.authenticate("adminLocal");
  },
  // For user login
  loginUser() {
    return passport.authenticate("userLocal");
  },
  // Ensure that admin is logged in
  ensureAdmin() {
    return function (req, res, next) {
      if (req.isAuthenticated() && req.user.role == 0) next();
      else res.sendStatus(401);
    }
  },
  // Ensure that user is logged in
  ensureAuth() {
    return function (req, res, next) {
      if (req.isAuthenticated()) next();
      else res.sendStatus(401);
    }
  }
}

