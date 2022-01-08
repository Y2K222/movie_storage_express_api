const mongojs = require('mongojs');
const express = require('express');
const router = express.Router();
const auth = require('../auth');
const helper = require('../helper');

// Mongodb
const db = mongojs("movie_storage");

// Get all admins and editors
router.get('/', auth.ensureAdmin(), (req, res) => {
    db.admins.find((err, data) => {
        helper.respondToUser(res, err, data);
    });
});

// Get one admin
router.get('/get_one/:id', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkParams('id', 'Invalid user id').isMongoId();
    let validation_errors = req.validationErrors();
    if (validation_errors) res.status(400).json({ status: 400, message: 'Bad Request' })

    db.admins.findOne({ _id: mongojs.ObjectId(req.params.id) }, (err, data) => {
        helper.respondToUser(res, err, data);
    });
});

// Add new admin
router.post('/', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkBody('full_name', 'full_name should not be empty').notEmpty();
    req.checkBody('email', 'email should not be empty').notEmpty()
    req.checkBody('password', 'password should not be empty').notEmpty().isLength(6);
    req.checkBody('role', 'role should be int').notEmpty().isInt();
    let validation_errors = req.validationErrors();
    if (validation_errors) res.status(400).json({ status: 400, message: 'Bad Request' })

    // Modify request body
    req.body.password = helper.hashPassword(req.body.password);
    req.body.createdAt = new Date();

    // Insert new Admin
    db.admins.insert(req.body, (err, data) => {
        helper.respondStatusToUser(res, err, data, { "msg": "New admin added" });
    });
});

// Update admin info
router.put('/:id', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkParams('id', 'admin id should be mongoId').notEmpty().isMongoId();
    req.checkBody('full_name', 'full_name should not be empty').notEmpty();
    req.checkBody('email', 'email should not be empty').notEmpty().isEmail();
    let validation_errors = req.validationErrors();
    if (validation_errors) res.status(400).json({ status: 400, message: 'Bad Request' })

    // Update
    db.admins.update(
        { _id: mongojs.ObjectId(req.params.id) },
        { $set: req.body },
        { multi: false },
        (err, data) => {
            helper.respondStatusToUser(res, err, data, { "msg": "Admin data updated !" });
        }
    )
});

// Change admin password
router.patch('/password/:id', auth.ensureAdmin(), (req, res) => {

    // Validation
    req.checkParams('id', 'Invalid admin id').notEmpty().isMongoId();
    req.checkBody('password', 'password should not be empty').notEmpty();
    let validation_errors = req.validationErrors();
    if (validation_errors) res.status(400).json({ status: 400, message: 'Bad Request' })

    // Hash password
    req.body.password = helper.hashPassword(req.body.password);

    // Update the user
    db.admins.update(
        { _id: mongojs.ObjectId(req.params.id) },
        { $set: req.body },
        { multi: false },
        (err, data) => {
            helper.respondStatusToUser(res, err, data, { "msg": "Admin password updated !" });
        }
    )
});

// Change role
router.patch('/role/:id', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkParams('id', 'Invalid admin id').notEmpty().isMongoId();
    req.checkBody('role', 'Invalid Role').notEmpty().isInt();
    let validation_errors = req.validationErrors();
    if (validation_errors) res.status(400).json({ status: 400, message: 'Bad Request' })

    // Modify the request body
    db.admins.update(
        { _id: mongojs.ObjectId(req.params.id) },
        { $set: req.body.role },
        { multi: false },
        (err, data) => {
            helper.respondStatusToUser(res, err, data, { "msg": "Admin role updated !" });
        }
    )
});

// Delete admin
router.delete('/:id', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkParams('id', 'admin id should be mongoId').isMongoId();
    let validation_errors = req.validationErrors();
    if (validation_errors) res.status(400).json({ status: 400, message: 'Bad Request' })

    // Delete admin
    db.admins.remove(
        { _id: mongojs.ObjectId(req.params.id) },
        (err, data) => {
            helper.respondStatusToUser(res, err, data, { "msg": "Admin deleted !" });
        }
    )
});

// verify that admin is logged in
router.get('/verify', auth.ensureAdmin(), (req, res) => {
    res.status(200).json(req.user);
});

// Login admin
router.post('/login', auth.loginAdmin(), (req, res) => {
    req.user ? res.status(200).json(req.user) : res.sendStatus(401);
});

// Logout admin
router.delete('/account/logout', (req, res) => {
    req.session.destroy();
    res.status(200).json({ 'msg': 'Logged out' });
});

module.exports = router;
