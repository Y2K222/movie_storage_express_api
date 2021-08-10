const mongojs   = require('mongojs');
const express   = require('express');
const crypto    = require('crypto');

const router = express.Router();
const auth   = require('../auth');
const db     = mongojs('movie_storage');

// Get all admins and editors
router.get('/', auth.ensureAdmin(), (req, res) => {
    db.admins.find({}, (err, data) => {
        if(err) res.status(500).json(err) // Internal server erroe
        else if(!data) res.status(404)    // Not found
        else res.status(200).json(data)   // Status OK
    });
});

// Get one admin
router.get('/get_one/:id', auth.ensureAdmin(), (req, res) => {
    let admin_id = req.params.id;
    req.checkParams('id', 'Invalid user id').isMongoId();
    let validation_errors = req.validationErrors();
    if(validation_errors) res.status(400).json(validation_errors)
  
    db.admins.findOne({_id: mongojs.ObjectId(admin_id)}, (err, data) => {
        if(err) res.status(500).json(err);
        else if(!data) res.status(404);
        res.status(200).json(data);
    });
});

// Add new admin
router.post('/', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkBody('full_name', 'Invalid Full Name').notEmpty();
    req.checkBody('email', 'Invalid Email').isEmail();
    req.checkBody('password', 'Invalid Password').isLength(6);
    req.checkBody('role', 'Invalid Role').isInt();

    let validation_errors = req.validationErrors();
    if(validation_errors) { res.status(400).json(validation_errors); return false; }

    // Hash password
    let hash_password = crypto.createHash('sha1').update(req.body.password).digest('hex');

    let new_admin = {
        email     : req.body.email,
        role      : req.body.role,
        full_name : req.body.full_name,
        password  : hash_password,
        createdAt : new Date()
    }
    // Insert new user
    db.admins.insert(new_admin, (err, data) => {
        err ? res.status(500).json(err) : res.status(200).json({'msg': 'New admin created ', 'admin': data})
    });
});

// Update admin info
router.put('/:id', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkParams('id', 'Invalid admin id').isMongoId();
    req.checkBody('full_name', 'Invalid Full Name').notEmpty();
    req.checkBody('email', 'Invalid Email').isEmail();

    let validation_errors = req.validationErrors();
    if(validation_errors) { res.status(400).json(validation_errors); return false; }

    let updated_admin = {
        full_name: req.body.full_name,
        email    : req.body.email
    }

    // Update
    db.admins.update(
        {_id: mongojs.ObjectId(req.params.id)},
        {$set: updated_admin},
        {multi: false},
        (err, data) => {
            if(err) res.status(500).json(err);
            else if(!data) res.status(404);
            res.status(200).json({'msg': 'Admin updated', 'admin': data});
        }
    )

});

// Change password
router.patch('/password/:id', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkParams('id', 'Invalid admin id').isMongoId();
    req.checkBody('password', 'Invalid Password').notEmpty();
    let validation_errors = req.validationErrors();
    if(validation_errors) { res.status(400).json(validation_errors); return false; }

    // Hash password
    let hash_password = crypto.createHash('sha1').update(req.body.password).digest('hex');
    let updated_password = { password : hash_password };

    // Update the user
    db.admins.update(
        {_id: mongojs.ObjectId(req.params.id)},
        {$set: updated_password},
        {multi: false},
        (err, data) => {
            if(err) res.status(500).json(err);
            else if(!data) res.status(404);
            res.status(200).json({'msg': 'Password updated', 'admin': data});
        }
    )
});

// Change role
router.patch('/role/:id', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkParams('id', 'Invalid admin id').isMongoId();
    req.checkBody('role', 'Invalid Role').isInt();
    let validation_errors = req.validationErrors();
    if(validation_errors) { res.status(400).json(validation_errors); return false; }

    // Update the user
    let updated_role = { role: req.body.role };
    db.admins.update(
        {_id: mongojs.ObjectId(req.params.id)},
        {$set: updated_role},
        {multi: false},
        (err, data) => {
            if(err) res.status(500).json(err);
            else if(!data) res.status(404);
            res.status(200).json({'msg': 'Role updated', 'admin': data});
        }
    )

});

// Delete admin
router.delete('/:id', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkParams('id', 'Invalid admin id').isMongoId();
    let validation_errors = req.validationErrors();
    if(validation_errors) { res.status(400).json(validation_errors); return false; }

    // Delete admin
    db.admins.remove(
        {_id: mongojs.ObjectId(req.params.id)},
        (err, data) => {
            if(err) res.status(500).json(err);
            else if(!data) res.status(404);
            res.status(200).json({'msg': 'Admin deleted !'});
        }
    )

});

// verify that user is logged in
router.get('/verify', auth.ensureAuth(), (req, res) => {
    res.status(200).json(req.user);
});

// Login admin
router.post('/login', auth.login(), (req, res) => {
    req.user ? res.status(200).json(req.user) : res.sendStatus(401);
});

// Logout admin
router.delete('/account/logout', (req, res) => {
    req.session.destroy();
    res.status(200).json({'msg': 'Logged out'});
});

module.exports = router;
