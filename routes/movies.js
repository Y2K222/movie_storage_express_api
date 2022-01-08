const mongojs = require('mongojs');
const express = require('express');
const auth = require('../auth');
const helper = require('../helper');
const router = express.Router();

// Mongodb
const db = mongojs('movie_storage');

// Get one movie
router.get('/get_one/:id', (req, res) => {
    // Validation
    req.checkParams('id', 'movie id should be mongoId').isMongoId();
    let validation_errors = req.validationErrors();
    if (validation_errors) { res.status(400).json(validation_errors); return false; }

    db.movies.findOne({ _id: mongojs.ObjectId(req.params.id) }, (err, data) => {
        helper.respondToUser(res, err, data);
    });
});

// Get ramdom movies
router.get('/get_random/:count', (req, res) => {
    // Validation
    req.checkParams('count', 'Invalid count').isInt();
    let validation_errors = req.validationErrors();
    if (validation_errors) { res.status(400).json(validation_errors); return false; }

    db.movies.aggregate(
        [{ $sample: { size: parseInt(req.params.count) } }],
        (err, data) => {
            helper.respondToUser(res, err, data);
        }
    )
});

// Get with category, limit
// TODO: FIX ERROR HERE
router.get('/get_category/:category/:limit', (req, res) => {
    // Validation
    req.checkParams('category', 'Invalid category').notEmpty();
    req.checkParams('limit', 'Invalid limit').notEmpty();
    let validation_errors = req.validationErrors();
    if (validation_errors) { res.status(400).json(validation_errors); return false; }

    db.movies.find({ category: { $regex: /req.params.category$/ } }).limit(parseInt(req.params.limit), (err, data) => {
        helper.respondToUser(res, err, data);
    });
});

// Get total numbers of movies and sereis
router.get('/get/total', (req, res) => {
    db.movies.aggregate({
        "$count": "count"
    }, (err, data) => {
        helper.respondToUser(res, err, data);
    })
})

// Get total numbers of movies only
router.get('/get/total/movies', (req, res) => {
    db.movies.aggregate([
        {
            "$match": { series: false },
        },
        {
            "$count": "count"
        }
    ], (err, data) => {
        helper.respondToUser(res, err, data);
    })
})

// Get total number of series only
router.get('/get/total/series', (req, res) => {
    db.movies.aggregate([
        {
            "$match": { series: true }
        },
        {
            "$count": "count"
        }
    ], (err, data) => {
        helper.respondToUser(res, err, data);
    })
})

// Get alll with start and end
router.post('/limit', (req, res) => {
    // Validation
    req.checkBody('skip', 'Invalid Skip').isInt();
    req.checkBody('limit', 'Invalid Limit').isInt();
    let validation_errors = req.validationErrors();
    if (validation_errors) res.status(400).json(validation_errors)
    db.movies.aggregate([
        {
            "$facet": {
                "total_data": [
                    { "$match": {} },
                    { "$skip": parseInt(req.body.skip) },
                    { "$limit": parseInt(req.body.limit) },
                    { "$sort": { createdAt: -1 } }
                ]
            }
        }
    ], (err, data) => {
        helper.respondToUser(res, err, data);
    })
})

// Get movies with start and end
router.post('/limit/movies', (req, res) => {
    // Validation
    req.checkBody('skip', 'Invalid Skip').isInt();
    req.checkBody('limit', 'Invalid Limit').isInt();
    let validation_errors = req.validationErrors();
    if (validation_errors) res.status(400).json(validation_errors)
    db.movies.aggregate([
        {
            "$facet": {
                "total_data": [
                    { "$match": { series: false } },
                    { "$skip": parseInt(req.body.skip) },
                    { "$limit": parseInt(req.body.limit) },
                    { "$sort": { createdAt: -1 } }
                ]
            }
        }
    ], (err, data) => {
        helper.respondToUser(res, err, data);
    })
})

// Get movies with start and end
router.post('/limit/series', (req, res) => {
    // Validation
    req.checkBody('skip', 'Invalid Skip').isInt();
    req.checkBody('limit', 'Invalid Limit').isInt();
    let validation_errors = req.validationErrors();
    if (validation_errors) res.status(400).json(validation_errors)
    db.movies.aggregate([
        {
            "$facet": {
                "total_data": [
                    { "$match": { series: true } },
                    { "$skip": parseInt(req.body.skip) },
                    { "$limit": parseInt(req.body.limit) },
                    { "$sort": { createdAt: -1 } }
                ]
            }
        }
    ], (err, data) => {
        helper.respondToUser(res, err, data);
    })
})

// Get toprated movies with start and end
router.post('/limit/top_rated', (req, res) => {
    // Validation
    req.checkBody('skip', 'Invalid Skip').isInt();
    req.checkBody('limit', 'Invalid Limit').isInt();
    let validation_errors = req.validationErrors();
    if (validation_errors) res.status(400).json(validation_errors)
    db.movies.aggregate([
        {
            "$facet": {
                "total_data": [
                    { "$match": { series: false } },
                    { "$skip": parseInt(req.body.skip) },
                    { "$limit": parseInt(req.body.limit) },
                    { "$sort": { rating: -1 } }
                ]
            }
        }
    ], (err, data) => {
        helper.respondToUser(res, err, data);
    })
})

// Search movies
router.get('/search/:keyword', (req, res) => {
    // Validation
    req.checkParams('keyword', 'Invalid keyword').notEmpty();
    let validation_errors = req.validationErrors();
    if (validation_errors) { res.status(400).json(validation_errors); return false }

    db.movies.find({ $text: { $search: req.params.keyword } }, (err, data) => {
        helper.respondToUser(res, err, data);
    });
});

// Add new movie
router.post('/', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkBody('movie_name', 'Invalid Movie Name').notEmpty();
    req.checkBody('release_year', 'Invalid release year').isLength(4);
    req.checkBody('category', 'Invalid Category').notEmpty();
    req.checkBody('country', 'Invalid Country').notEmpty();
    req.checkBody('duration', 'Invalid Duration').notEmpty();
    req.checkBody('rating', 'Invalid Rating').isFloat();
    req.checkBody('language', 'Invalid Language').notEmpty();
    req.checkBody('trailer_link', 'Invalid trailer link').notEmpty();
    req.checkBody('screen_shot_links', 'Invalid Screen shot links').isArray();
    req.checkBody('thumbnails_link', 'Invalid thumbnail link').notEmpty();
    req.checkBody('cover_link', 'Invalid cover link').notEmpty();
    req.checkBody('synopsis', 'Invalid synopsis').notEmpty();
    req.checkBody('download_links', 'Invalid links').isArray();
    req.checkBody('series', 'Invalid series boolean').isBoolean();
    req.checkBody('premium', 'Invalid premium value').isBoolean();
    let validation_errors = req.validationErrors();
    if (validation_errors) res.status(400).json(validation_errors)

    // Modify here
    req.body.createdAt = new Date();

    // Insert new movie
    db.movies.insert(req.body, (err, data) => {
        helper.respondStatusToUser(res, err, data, { "msg": "New movie inserted !" });
    });
});

// Update movie info
router.put('/:id', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkBody('movie_name', 'Invalid Movie Name').notEmpty();
    req.checkBody('release_year', 'Invalid release year').isLength(4);
    req.checkBody('category', 'Invalid Category').notEmpty();
    req.checkBody('country', 'Invalid Country').notEmpty();
    req.checkBody('duration', 'Invalid Duration').notEmpty();
    req.checkBody('rating', 'Invalid Rating').isFloat();
    req.checkBody('language', 'Invalid Language').notEmpty();
    req.checkBody('trailer_link', 'Invalid trailer link').notEmpty();
    req.checkBody('screen_shot_links', 'Invalid Screen shot links').isArray();
    req.checkBody('thumbnails_link', 'Invalid thumbnail link').notEmpty();
    req.checkBody('cover_link', 'Invalid cover link').notEmpty();
    req.checkBody('synopsis', 'Invalid synopsis').notEmpty();
    req.checkBody('download_links', 'Invalid links').isArray();
    req.checkBody('series', 'Invalid series boolean').isBoolean();
    req.checkBody('premium', 'Invalid premium value').notEmpty().isBoolean();
    let validation_errors = req.validationErrors();
    if (validation_errors) res.status(400).json(validation_errors)

    // Update movie info
    db.movies.update(
        { _id: mongojs.ObjectId(req.params.id) },
        { $set: req.body },
        { multi: false },
        (err, data) => {
            helper.respondStatusToUser(res, err, data, { "msg": "Movie info updated !" })
        }
    )
});

// Delete published movie
router.delete('/:id', auth.ensureAdmin(), (req, res) => {
    // Validation
    req.checkParams('id', 'Need a mongo id param').isMongoId()
    let validation_errors = req.validationErrors()
    if (validation_errors) res.status(400).json(validation_errors)

    // Delete 
    db.movies.remove({ _id: mongojs.ObjectID(req.params.id) }, (err, data) => {
        helper.respondStatusToUser(res, err, data, { "msg": "Movie deleted !" })
    })
})

module.exports = router
