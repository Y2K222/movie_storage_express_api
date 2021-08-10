const { Storage } = require('@google-cloud/storage');
const credentials = require('../keys/credentials.json');
const Promise = require('core-js-pure/features/promise');

const storage = new Storage({credentials});
const storage_host = 'https://storage.cloud.google.com/movies_storage/';

const uploadFile = function(bucket, file, destination) {
    return new Promise((resolve, reject) => {
        storage.bucket(bucket).upload(file, {
            destination
        }).then(file=> {
            console.log("Your file : " + storage_host + file[0].name);
            resolve({uploded_file: storage_host + file[0].name});
        }).catch(err => {
            reject(err);
        })
    });
}

const listFilesInFoler = function(bucket, folder) {
    return new Promise((resolve, reject) => {
        storage.bucket(bucket).getFiles({prefix: folder}, function(err, files) {
            if(err) reject(err);
            resolve(files)
        })
    });
}

const deleteFolder = function(bucket, folder) {
    return new Promise((resolve, reject) => {
        let bucket = storage.bucket(bucket);
        bucket.deleteFiles({prefix: folder}, function(err) {
            if(err) reject(err);
            resolve({msg: `{$folder} deleted`});
        })
    });
}

module.exports = {uploadFile, listFilesInFoler, deleteFolder};