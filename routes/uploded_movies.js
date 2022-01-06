const mongojs = require('mongojs')
const express = require('express')
const router = express.Router()
const auth = require('../auth')
const db_name = 'movie_storage'

// Mongodb
const db = mongojs(db_name)

// Get one uploded movie
router.get('/get_one/:id', auth.ensureEditor(), (req, res) => {
    req.checkParams('id', 'Invalid uploded_movie id').isMongoId()
    let validation_errors = req.validationErrors()
    if(validation_errors) { res.status(400).json(validation_errors); return false; }

    db.uploded_movies.findOne({_id: mongojs.ObjectId(req.params.id)}, (err, data) => {
        if(err) next(err)
        else if (!data) {
            res.status(404).json({
                status: 404,
                message: 'Content not found'
            })
        }
        else res.status(200).json(data)
    })
})

// Get total numbers of movies
router.get('/get/total', (req, res) => {
    db.uploded_movies.aggregate({
        "$count": "count"
    }, (err, data) => {
        if(err) next(err)
        else res.status(200).json(data)
    })
})

// Get uploded movies with range
router.post('/limit', (req, res) => {
    // Validation
    req.checkBody('skip', 'Invalid Skip').isInt();
    req.checkBody('limit', 'Invalid Limit').isInt();
    let validation_errors = req.validationErrors();
    if(validation_errors) res.status(400).json(validation_errors)
    db.uploded_movies.aggregate([
        { "$facet": {
            "total_data" : [
                { "$match": {} },
                { "$skip": req.body.skip },
                { "$limit": req.body.limit },
                { "$sort": { createdAt: -1 } }
            ]
        }}
    ], (err, data) => {
        if(err) res.status(500).json(err);
        else if(!data) res.status(404);
        res.status(200).json(data[0]);
    })
})

// Get unused movies
router.get('/unused', auth.ensureEditor(), (req, res) => {
    db.uploded_movies.find(
        {used: false}
        ,(err, data) => {
            if(err) res.status(500).json(err)
            else if(!data) res.status(404)
            res.status(200).json(data)
        }
    )
})

// Update used status
router.patch('/used/:id', auth.ensureEditor(), (req, res) => {
    // Validation
    req.checkParams('id', 'Invalid Id').isMongoId();
    req.checkBody('used', 'Invalid used status').isBoolean();
    let validation_errors = req.validationErrors();
    if(validation_errors) res.status(400).json(validation_errors)
    let updated = {
        used: req.body.used
    }

    db.uploded_movies.update(
        { _id : mongojs.ObjectId(req.params.id)},
        { $set: updated },
        { multi: false },
        (err , data) => {
            if(err) res.status(500).json(err)
            else if(!data) res.status(404)
            res.status(200).json({'msg': 'Updated used status !'})
        }
    )
})

// Search uploded movie
router.get('/search/:keyword', auth.ensureEditor(), (req, res) => {
    // Validation
    req.checkParams('keyword', 'Invalid keyword').notEmpty();
    let validation_errors = req.validationErrors();
    if(validation_errors) {res.status(400).json(validation_errors); return false}

    db.uploded_movies.find({$text: {$search: req.params.keyword}}, (err, data) => {
        if(err) res.status(500).json(err)
        else if(!data) res.status(404)
        res.status(200).json(data)
    })
})

// Add new uploded_movie
router.post('/', auth.ensureEditor(), (req, res) => {
    // Validation
    req.checkBody('name', 'Invalid Name').notEmpty()
    req.checkBody('movie_id', 'Invalid Movie Id').notEmpty()
    req.checkBody('file_size', 'Invalid File Size').notEmpty()
    req.checkBody('used', 'Invalid used').isBoolean()
    let validation_errors = req.validationErrors()
    if(validation_errors) res.status(400).json(validation_errors)
    
    let uploded_movie = req.body;
    // Insert the movie
    db.uploded_movies.insert(uploded_movie, (err, data) => {
        if(err) res.status(500).json(err)
        else res.status(200).json({'msg': 'Uploded movie inserted !'})
    })
})

// Delete uploded movie
router.delete('/:id', auth.ensureEditor(), (req, res) => {
    // Validation
    req.checkParams('id', 'Need a id param').notEmpty()
    let validation_errors = req.validationErrors()
    if(validation_errors) res.status(400).json(validation_errors)
    // Delete uploded movie
    db.uploded_movies.remove({_id: mongojs.ObjectId(req.params.id)}, (err, data) => {
        if(err) res.status(500).json(err)
        else if(!data) res.status(404)
        res.status(200).json({'msg': 'Uploded movie deleted !'})
    })
})

module.exports = router