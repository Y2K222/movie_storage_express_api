const mongojs = require('mongojs');
const express = require('express');
const auth = require('../auth');
const helper = require('../helper');
const router = express.Router();

// Mongodb 
const db = mongojs('movie_storage');

// Get one user
router.get('/:id', auth.ensureAuth(), (req, res) => {
    // Validation
    req.checkParams('id', 'user id should be mongoId').isMongoId();
    let validation_errors = req.validationErrors();
    if (validation_errors) res.status(400).json({ status: 400, message: 'Bad Request' });

    db.users.findOne({ _id: mongojs.ObjectId(req.params.id) }, (err, data) => {
        helper.respondToUser(res, err, data);
    })
});

// Search with user name
router.get('/search/:text', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkParams('text', 'Search text should not be empty').notEmpty();
    let validation_errors = req.validationErrors();
    if (validation_errors) {
        res.status(400).json(validation_errors);
        return false;
    }

    // Execute query
    db.users.find(
        { "$text": req.params.text },
        function (err, data) {
            helper.respondToUser(res, err, data);
        }
    )
});

// Get total number of users
router.get('/get/total', auth.ensureAdmin(), (req, res) => {
    db.users.aggregate(
        { "$count": 'count ' },
        function (err, data) {
            helper.respondToUser(res, err, data);
        }
    );
});

// Get users with skip and limit
router.post('/limit', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkBody('skip', 'Skip shoud be int').notEmpty().isInt();
    req.checkBody('limit', 'Limit should be int').notEmpty().isInt();
    let validation_errors = req.validationErrors();
    if (validation_errors) {
        res.status(400).json(validation_errors);
        return false;
    }

    // Execute the query
    db.users.aggregate({
        "$facet": {
            "totalData": [
                { "$match": {} },
                { "$skip": req.body.skip },
                { "$limit": req.body.limit },
                { "$sort": { createdAt: -1 } }
            ]
        }
    }, function (err, data) {
        helper.respondToUser(res, err, data);
    })
})

// Add new user
router.post('/', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkBody('full_name', 'full_name should not be empty').notEmpty();
    req.checkBody('email', 'email should not be empty').notEmpty().isEmail();
    req.checkBody('password', 'password should not be empty').notEmpty();
    let validation_errors = req.validationErrors();
    if (validation_errors) { res.status(400).json(validation_errors); return false }

    // Modify request body
    req.body.password = helper.hashPassword(req.body.password);
    req.body.subStart = false;
    req.body.subEnd = false;

    // Insert new user
    db.users.insert(req.body, (err, data) => {
        helper.respondStatusToUser(res, err, data, { "msg": "New user created !" });
    });
});

// Update user info
router.put('/:id', auth.ensureAuth(), (req, res) => {
    // Validation
    req.checkBody('full_name', 'full_name should not be empty').notEmpty();
    req.checkBody('email', 'email should not be empty').notEmpty().isEmail();
    let validation_errors = req.validationErrors();
    if (validation_errors) { res.status(400).json(validation_errors); return false }

    // Checking password is in the req body
    if (req.body.password) req.body.password = helper.hashPassword(req.body.password);

    // Update
    db.users.update(
        { _id: mongojs.ObjectId(req.params.id) },
        { $set: req.body },
        { multi: false },
        (err, data) => {
            helper.respondStatusToUser(res, err, data, { 'msg': 'User updated !' });
        }
    );
});

// Update subscription time
router.put('/sub/:id', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkBody('subStart', 'SubStart should not be empty').notEmpty();
    req.checkBody('subEnd', 'SubEnd should not be empty').notEmpty();
    let validation_errors = req.validationErrors();
    if (validation_errors) {
        res.status(400).json(validation_errors);
        return false;
    }

    // Update
    db.users.update(
        { _id: mongojs.ObjectId(req.params.id) },
        { $set: req.body },
        { multi: false },
        (err, data) => {
            helper.respondStatusToUser(res, err, data, { 'msg': 'Subscription updated !' });
        }
    );
});

// Delete subscription
router.delete('/sub/:id', auth.ensureAdmin(), (req, res) => {
    let subObj = {
        subStart: false,
        subEnd: false
    }
    // Update
    db.users.update(
        { _id: mongojs.ObjectId(req.params.id) },
        { $set: subObj },
        { multi: false },
        (err, data) => {
            helper.respondStatusToUser(res, err, data, { 'msg': 'Subscription deleted !' });
        }
    );
});

// Delete user
router.delete('/:id', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkParams('id', 'userid shoud be mongoId').notEmpty().isMongoId();
    let validation_errors = req.validationErrors();
    if (validation_errors) res.status(400).json({ status: 400, message: 'Bad Request' });

    // Delete admin
    db.users.remove(
        { _id: mongojs.ObjectId(req.params.id) },
        (err, data) => {
            helper.respondStatusToUser(res, err, data, { 'msg': 'User deleted !' })
        }
    )
});

// Auth endpoints
// Verify that user is logged in
router.get('/account/verify', auth.ensureAuth(), (req, res) => {
    res.status(200).json(req.user);
});

// Login user
router.post('/login', auth.loginUser(), (req, res) => {
    if (req.user) res.status(200).json(req.user);
    else res.sendStatus(401);
});

// Logout admin
router.delete('/account/logout', (req, res) => {
    req.session.destroy();
    res.status(200).json({ "msg": "Logged out" });
});

module.exports = router;