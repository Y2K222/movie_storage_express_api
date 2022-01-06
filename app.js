const express = require('express');
const passport = require('passport');
const validator = require('express-validator');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// Express router
const admins  = require('./routes/admins');
const movies  = require('./routes/movies');
const resource = require('./routes/resource');
const uploded_movies = require('./routes/uploded_movies');

const app = express();
app.use(fileUpload());
app.use(require('express-session') ({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      path: '/',
      httpOnly: true,
      secure: false,
      maxAge: null
    }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(validator());
app.use(function(req, res, next) {
    // res.set('Access-Control-Allow-Origin', 'http://moviehomemm.com');
    res.set('Access-Control-Allow-Origin', 'http://localhost:8080');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Origin, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5,Content-Type, Date, X-Api-Version');
    next();
});

app.use('/api/admin', admins);
app.use('/api/movies', movies);
app.use('/api/resource', resource);
app.use('/api/uploded_movies', uploded_movies);
// Error handling middleware
app.use(function(err, req, res, next) {
    res.status(err.status || 500).send(
        {
            status: err.status || 500,
            message: err.message || 'Internal server',
        }
    )
})
app.listen(3000, () => {
    console.log(" < MOVIE STORAGE API > \n Express server is running at port 3000 \n ready to go ! ");
});