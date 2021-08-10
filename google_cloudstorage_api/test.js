const {uploadFile} = require('./index');

uploadFile('movies_storage', '/home/zawhtetaung/Pictures/EvfbTS-WYAY1KVe.jpg', 'Batman/thumbnail_1.jpg').then(()=> {
    console.log("uploded");
}).catch(err => {
    console.log("Error : " + err);
})