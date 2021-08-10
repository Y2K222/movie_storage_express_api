const express = require('express')
const router = express.Router()
const auth = require('../auth')
const { getToken } = require('../cloud_storage/google_drive')

// Get google drive auth token
// TODO : ADD AUTH
router.get('/drive_token', (req, res) => {
    getToken().then(token => {
        res.status(200).json(token)
    }).catch(err => {
        res.status(401).json(err)
    })
})

module.exports = router;