const { google } = require('googleapis')
const credentials = require('../keys/credentials.json')
const Promise = require('core-js-pure/features/promise')

const scopes = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file']

const getToken = async function() {
    return new Promise((resolve, reject)=> {
        new google.auth.JWT(credentials.client_email, null, credentials.private_key, scopes).authorize().then(token => {
            resolve(token);
        }).catch(err => {
            reject(err);
        })
    })
}

module.exports = {getToken}