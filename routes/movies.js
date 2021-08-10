const mongojs   = require('mongojs');
const express   = require('express');

const router = express.Router();
const auth   = require('../auth');
const db     = mongojs('movie_storage');

// Get one movie
router.get('/get_one/:id', (req, res) => {
    req.checkParams('id', 'Invalid movie Id').isMongoId();
    let validation_errors = req.validationErrors();
    if(validation_errors) { res.status(400).json(validation_errors); return false; }

    db.movies.findOne({_id: mongojs.ObjectId(req.params.id)}, (err, data) => {
        if(err) res.status(500).json(err);
        else if(!data) res.status(404);
        res.status(200).json(data);
    });
});

// Get ramdom contents
router.get('/get_random/:count', (req, res) => {
    req.checkParams('count', 'Invalid count').isInt();
    let validation_errors = req.validationErrors();
    if(validation_errors) { res.status(400).json(validation_errors); return false; }
    // TODO: check here
    db.movies.aggregate(
        [ { $sample: { size: 6 } } ],
        (err, data) => {
            if(err) res.status(500).json(err);
            else if(!data) res.status(404);
            res.status(200).json(data);
        }
    )
});

// Get with category, limit
router.get('/get_category/:category/:limit', (req, res) => {
    // Validation
    req.checkParams('category', 'Invalid category').notEmpty();
    req.checkParams('limit', 'Invalid limit').notEmpty();
    if(validation_errors) { res.status(400).json(validation_errors); return false; }

    db.movies.find({category: {$regex: /req.params.category$/}}).limit(req.params.limit, (err, data) => {
        if(err) res.status(500).json(err);
        else if(!data) res.status(404);
        res.status(200).json(data);
    })
});

// Get total numbers of movies and sereis
router.get('/get/total', (req, res) => {
    db.movies.aggregate({
        "$count": "count"
    }, (err, data) => {
        if(err) res.status(500).json(err)
        else if(!data) res.status(404)
        res.status(200).json(data[0])
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
        if(err) res.status(500).json(err)
        else if(!data) res.status(404)
        res.status(200).json(data[0])
    })
})

// Get total number of series only
router.get('/get/total/series', (req, res)=> {
    db.movies.aggregate([
        {
            "$match": { series: true }
        },
        {
            "$count": "count"
        }
    ], (err, data)=> {
        if(err) res.status(500).json(err)
        else if(!data) res.status(404)
        res.status(200).json(data[0])
    })
})

// Get alll with start and end
router.post('/limit', (req, res) => {
    // Validation
    req.checkBody('skip', 'Invalid Skip').isInt();
    req.checkBody('limit', 'Invalid Limit').isInt();
    let validation_errors = req.validationErrors();
    if(validation_errors) res.status(400).json(validation_errors)
    db.movies.aggregate([
        { "$facet": {
                "total_data" : [
                    { "$match": {} },
                    { "$skip": req.body.skip },
                    { "$limit": req.body.limit },
                    { "$sort": { createdAt: -1 } }
                ]
            }
        }
    ], (err, data) => {
        if(err) res.status(500).json(err);
        else if(!data) res.status(404);
        res.status(200).json(data[0]);
    })
})

// Get movies with start and end
router.post('/limit/movies', (req, res) => {
    // Validation
    req.checkBody('skip', 'Invalid Skip').isInt();
    req.checkBody('limit', 'Invalid Limit').isInt();
    let validation_errors = req.validationErrors();
    if(validation_errors) res.status(400).json(validation_errors)
    db.movies.aggregate([
        { "$facet": {
            "total_data" : [
                { "$match": { series: false } },
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

// Get movies with start and end
router.post('/limit/series', (req, res) => {
    // Validation
    req.checkBody('skip', 'Invalid Skip').isInt();
    req.checkBody('limit', 'Invalid Limit').isInt();
    let validation_errors = req.validationErrors();
    if(validation_errors) res.status(400).json(validation_errors)
    db.movies.aggregate([
        { "$facet": {
            "total_data" : [
                { "$match": { series: true } },
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

// Get toprated movies with start and end
router.post('/limit/top_rated', (req, res) => {
    // Validation
    req.checkBody('skip', 'Invalid Skip').isInt();
    req.checkBody('limit', 'Invalid Limit').isInt();
    let validation_errors = req.validationErrors();
    if(validation_errors) res.status(400).json(validation_errors)
    db.movies.aggregate([
        { "$facet": {
            "total_data" : [
                { "$match": { series: false } },
                { "$skip": req.body.skip },
                { "$limit": req.body.limit },
                { "$sort": { rating:  -1} }
            ]
        }}
    ], (err, data) => {
        if(err) res.status(500).json(err);
        else if(!data) res.status(404);
        res.status(200).json(data[0]);
    })
})

// Search movies
router.get('/search/:keyword', (req, res) => {
    // Validation
    req.checkParams('keyword', 'Invalid keyword').notEmpty();
    let validation_errors = req.validationErrors();
    if(validation_errors) {res.status(400).json(validation_errors); return false}

    db.movies.find({$text: {$search: req.params.keyword}}, (err, data) => {
        if(err) res.status(500).json(err);
        else if(!data) res.status(404);
        res.status(200).json(data);
    });
});

// Add new movie
router.post('/', auth.ensureEditor(), (req, res) => {
    // Validation
    req.checkBody('movie_name', 'Invalid Movie Name').notEmpty();
    req.checkBody('release_year', 'Invalid release year').isLength(4);
    req.checkBody('category', 'Invalid Category').notEmpty();
    req.checkBody('country', 'Invalid Country').notEmpty();
    req.checkBody('duration', 'Invalid Duration').notEmpty();
    req.checkBody('rating', 'Invalid Rating').isFloat();
    req.checkBody('movie_language', 'Invalid Language').notEmpty();
    req.checkBody('trailer_link', 'Invalid trailer link').notEmpty();
    req.checkBody('screen_shot_links', 'Invalid Screen shot links').isArray();
    req.checkBody('thumbnails_link', 'Invalid thumbnail link').notEmpty();
    req.checkBody('cover_link', 'Invalid cover link').notEmpty();
    req.checkBody('synopsis', 'Invalid synopsis').notEmpty();
    req.checkBody('download_links', 'Invalid links').isArray();
    req.checkBody('series', 'Invalid series boolean').isBoolean();

    let new_movie = {
        createdAt     : new Date().getTime(),
        // TODO: ADD AUTH AND FIX UNCOMMENT THIS
        // createdBy     : mongojs.ObjectId(req.user._id) || 'No auth',
        // createdByLabel: req.body.user.full_name || 'No auth',
        movie_name    : req.body.movie_name,
        release_year  : req.body.release_year,
        category      : req.body.category,
        country       : req.body.country,
        duration      : req.body.duration,
        rating        : req.body.rating,
        movie_language      : req.body.language,
        trailer_link  : req.body.trailer_link,
        cover_link    : req.body.cover_link,
        synopsis      : req.body.synopsis,
        download_links: req.body.download_links,
        series        : req.body.series,
        screen_shot_links: req.body.screen_shot_links,
        thumbnails_link  : req.body.thumbnails_link,
    }

    // Insert new movie
    db.movies.insert(new_movie, (err, data) => {
        err ? res.status(500).json(err) : res.status(200).json({'msg': 'New movie created ', 'movie': data})
    });
});

// Update movie info
router.put('/data/:id', auth.ensureEditor(), (req, res) => {
    // Validation
    req.checkParams('id', 'Invalid movie id').isMongoId();
    req.checkBody('movie_name', 'Invalid Movie Name').notEmpty();
    req.checkBody('release_year', 'Invalid release year').isLength(4);
    req.checkBody('category', 'Invalid Category').notEmpty();
    req.checkBody('country', 'Invalid Country').notEmpty();
    req.checkBody('duration', 'Invalid Duration').notEmpty();
    req.checkBody('rating', 'Invalid Rating').isFloat();
    req.checkBody('movie_language', 'Invalid Language').notEmpty();
    req.checkBody('synopsis', 'Invalid synopsis').notEmpty();
    req.checkBody('trailer_link', 'Invalid trailer link').notEmpty();
    req.checkBody('screen_shot_links', 'Invalid Screen shot links').isArray();
    req.checkBody('thumbnails_link', 'Invalid thumbnail link').notEmpty();
    req.checkBody('cover_link', 'Invalid cover link').notEmpty();
    req.checkBody('download_links', 'Invalid links').isArray();
    req.checkBody('series', 'Invalid series boolean').isBoolean();

    let updated_info = {
        // createdByLabel: req.body.user.full_name,
        movie_name    : req.body.movie_name,
        release_year  : req.body.release_year,
        category      : req.body.category,
        country       : req.body.country,
        duration      : req.body.duration,
        rating        : req.body.rating,
        movie_language      : req.body.movie_language,
        synopsis      : req.body.synopsis,
        series        : req.body.series,
        trailer_link  : req.body.trailer_link,
        cover_link    : req.body.cover_link,
        download_links: req.body.download_links,
        screen_shot_links: req.body.screen_shot_links,
        thumbnails_link  : req.body.thumbnails_link,
    }

    // Update movie info
    db.movies.update(
        {_id  : mongojs.ObjectId(req.params.id)},
        {$set : updated_info},
        {multi: false},
        (err, data) => {
            if(err) res.status(500).json(err);
            else if(!data) res.status(404);
            res.status(200).json({'msg': 'Movie data updated', 'movie': data});
        }
    )
});

// Delete published movie
router.delete('/:id', auth.ensureEditor(), (req, res) => {
    // Validation
    req.checkParams('id', 'Need a mongo id param').isMongoId()
    let validation_errors = req.validationErrors()
    if(validation_errors) res.status(400).json(validation_errors)

    // Delete 
    db.movies.remove({_id: mongojs.ObjectID(req.params.id)}, (err, data)=> {
        if(err) res.status(500).json(err)
        else if(!data) res.status(404)
        res.status(200).json({'msg': 'Published movie deleted !'})
    })
})

module.exports = router
