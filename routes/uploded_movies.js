const mongojs = require('mongojs');
const express = require('express');
const auth = require('../auth');
const helper = require('../helper');
const router = express.Router();

// Mongodb
const db = mongojs('movie_storage');

// Get one uploded movie
router.get('/get_one/:id', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkParams('id', 'Invalid uploded_movie id').isMongoId()
    let validation_errors = req.validationErrors()
    if (validation_errors) { res.status(400).json(validation_errors); return false; }

    db.uploded_movies.findOne({ _id: mongojs.ObjectId(req.params.id) }, (err, data) => {
        helper.respondToUser(res, err, data);
    })
})

// Get total numbers of movies
router.get('/get/total', (req, res) => {
    db.uploded_movies.aggregate({
        "$count": "count"
    }, (err, data) => {
        helper.respondToUser(res, err, data);
    })
})

// Get uploded movies with range
router.post('/limit', (req, res) => {
    // Validation
    req.checkBody('skip', 'Invalid Skip').isInt();
    req.checkBody('limit', 'Invalid Limit').isInt();
    let validation_errors = req.validationErrors();
    if (validation_errors) res.status(400).json(validation_errors)
    db.uploded_movies.aggregate([
        {
            "$facet": {
                "total_data": [
                    { "$match": {} },
                    { "$skip": req.body.skip },
                    { "$limit": req.body.limit },
                    { "$sort": { createdAt: -1 } }
                ]
            }
        }
    ], (err, data) => {
        helper.respondToUser(res, err, data);
    })
})

// Get unused movies
router.get('/unused', auth.ensureAdmin(), (req, res) => {
    db.uploded_movies.find(
        { used: false }
        , (err, data) => {
            helper.respondToUser(res, err, data);
        }
    )
})

// Update used status
router.patch('/used/:id', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkParams('id', 'Invalid Id').isMongoId();
    req.checkBody('used', 'Invalid used status').isBoolean();
    let validation_errors = req.validationErrors();
    if (validation_errors) res.status(400).json(validation_errors)
    let updated = {
        used: req.body.used
    }

    db.uploded_movies.update(
        { _id: mongojs.ObjectId(req.params.id) },
        { $set: updated },
        { multi: false },
        (err, data) => {
            helper.respondStatusToUser(res, err, data, { "msg": "Used data updated !" })
        }
    )
})

// Search uploded movie
router.get('/search/:keyword', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkParams('keyword', 'Invalid keyword').notEmpty();
    let validation_errors = req.validationErrors();
    if (validation_errors) { res.status(400).json(validation_errors); return false }

    db.uploded_movies.find({ $text: { $search: req.params.keyword } }, (err, data) => {
        helper.respondToUser(res, err, data);
    })
})

// Add new uploded_movie
router.post('/', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkBody('name', 'Invalid Name').notEmpty()
    req.checkBody('movie_id', 'Invalid Movie Id').notEmpty()
    req.checkBody('file_size', 'Invalid File Size').notEmpty()
    req.checkBody('used', 'Invalid used').isBoolean()
    let validation_errors = req.validationErrors()
    if (validation_errors) res.status(400).json(validation_errors)

    let uploded_movie = req.body;
    // Insert the movie
    db.uploded_movies.insert(uploded_movie, (err, data) => {
        helper.respondStatusToUser(res, err, data, { "msg": "Movie uploaded !" })
    });
})

// Delete uploded movie
router.delete('/:id', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkParams('id', 'Need a id param').notEmpty()
    let validation_errors = req.validationErrors()
    if (validation_errors) res.status(400).json(validation_errors)
    // Delete uploded movie
    db.uploded_movies.remove({ _id: mongojs.ObjectId(req.params.id) }, (err, data) => {
        helper.respondStatusToUser(res, err, data, { "msg": "Uploaded movie deleted !" })
    })
})

module.exports = router