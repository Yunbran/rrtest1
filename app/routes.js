var path = require('path');
var express = require('express');
var app = require('../server.js');
var User = require('./database/models/user.model.js');
var Tag = require('./database/models/tag.model.js');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
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
var handler = require('./route-handler')

module.exports = function(app) {

  var router = express.Router();

   //appends /api to all urls below
   app.use('/api', router);


   router.route('/getProfile')
    .get(handler.getProfile);

   router.route('/getTagByName')
    .post(handler.getTagByName);

   router.route('/upvoteSong')
    .post(handler.upvoteSong);

   router.route('/downvoteSong')
    .post(handler.downvoteSong);

   router.route('/favoriteSong')
    .post(handler.favoriteSong);

   router.route('/uploadSong')
    .post(handler.uploadSong);
   
   router.route('/editSong')
    .post(handler.editSong);

   router.route('/getUser')
    .get(handler.getUser);

  //needs to be documented   
   router.route('/claimSong')
    .post(handler.claimSong);



};
