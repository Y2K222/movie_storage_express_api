const crypto = require('crypto')

module.exports = {
    hashPassword(plainPassword) {
        return crypto.createHash('sha1').update(plainPassword).digest('hex')
    },

    respondToUser(res, err, data) {
        if (err) res.status(500).json(err);
        else if (!data) res.status(404);
        res.status(200).json(data)
    },

    respondStatusToUser(res, err, data, status) {
        if (err) res.status(500).json(err)
        else if (!data) res.status(404);
        res.status(200).json(status)
    },
}