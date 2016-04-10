var path = require('path');
var express = require('express');
var app = require('../server.js');
var User = require('./database/models/user.model.js');
var Tag = require('./database/models/tag.model.js');
var session = require('express-session');
var mongoStore = require('connect-mongo/es5')(session);
var basicAuth = require('basic-auth');
var mongoose = require('mongoose');
var secret = 'Base-Secret';
var azure = require('azure-storage');
var fs = require('fs');
var _ = require('lodash');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var secret = "it's a secret to everybody";

var nconf = require('nconf');
nconf.env()
     .file({ file: 'config.json'});
var tableName = nconf.get("TABLE_NAME");
var partitionKey = nconf.get("PARTITION_KEY");
var accountName = nconf.get("STORAGE_NAME");
var accountKey = nconf.get("STORAGE_KEY");
var blobSvc = azure.createBlobService(accountName, accountKey), tableName, partitionKey;


//handler has all database methods exported
//check './request-handler' for the methods used below
var handler = require('./request-handler')


module.exports = function(app) {

  var router = express.Router();

//MIDDLEWARE FOR /MEDIA/SOUND/


// blobSvc.createBlockBlobFromLocalFile('mycontainer', 'testpark.mp3', 'testpark.mp3', function(error, result, response){
//   if(!error){
//     // file uploaded
//     console.log("success!");
//   }
// });

// blobSvc.listBlobsSegmented('mycontainer', null, function(error, result, response){
//   if(!error){
//     // result contains the entries
//     console.log(result);
//   }
// });

// blobSvc.getBlobToStream('mycontainer', 'myblob', fs.createWriteStream('testpark.mp3'), function(error, result, response){
//   if(!error) {
//     console.log("success in stream!");
//   }
// });

var containerName = 'mycontainer';
  router.route('/testpark.mp3')
  .get(function(req, res) {
 // console.log('triggered');
    // var fileName = req.params.file;
     var fileName = 'testpark.mp3'
    blobSvc.getBlobProperties(
        containerName,
        fileName,
        function(err, properties, status) {
            if (err) {
                res.send(502, "Error fetching file: %s", err.message);
            } else if (!status.isSuccessful) {
                res.send(404, "The file %s does not exist", fileName);
            } else {
                res.header('Content-Type', properties.contentType);
                blobSvc.createReadStream(containerName, fileName).pipe(res);
            }
        });
});
//AZURE STORAGE END



//INTERCEPTOR FOR MEDIA ROUTE 
///song/:user/:filepath
app.use('TESTINTERCEPTOR/:user/:filepath', function(req, res, next) {
  //console.log('Request URL:', req.originalUrl);
  // console.log(res);
  //res.send(200)
  // console.log(req.param("user"));

  //next();

   console.log(req.params.filepath);
   console.log(req.params.user);

   var containerName = req.params.user;
   var fileName = req.params.filepath;

var fileDestination = './public/media/sound/' + containerName + '/' + fileName
blobSvc.getBlobToStream(containerName, fileName , fs.createWriteStream(fileDestination), function(error, result, response){
  if(!error){
    // blob retrieved
    console.log(result);
    // console.log(response);
  } else {
    console.log(error);
  }
})
    // var fileName = req.params.file;
     // var fileName = 'testpark.mp3'
     
    // blobSvc.getBlobProperties(
    //     containerName,
    //     fileName,
    //     function(err, properties, status) {
    //         if (err) {
    //             res.send(502, "Error fetching file: %s", err.message);
    //         } else if (!status.isSuccessful) {
    //             res.send(404, "The file %s does not exist", fileName);
    //         } else {
    //             res.header('Content-Type', properties.contentType);
    //              res.header('Range', properties.Range);
    //             blobSvc.createReadStream(containerName, fileName).pipe(res);
    //         }
    //     });


next();
});


  app.use('/', router);



};
