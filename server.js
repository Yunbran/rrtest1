var express = require('express');
var app = express();
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cors = require('cors');
var partials = require('express-partials');
var util = require('util')
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var _ = require('lodash');


var User = require('./app/database/models/user.model');
var Song = require('./app/database/models/song.model');
var db = require('./app/database/db');

var handler = require('./app/request-handler');

var port = process.env.PORT || 8000;

app.use(partials());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(methodOverride('X-HTTP-Method-Override'));


require('./app/mediaRoutes')(app); 


app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, api_key, Authorization");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  next();
});

app.use(express.static(__dirname + '/public'));

//These are server calls that anyone without auth token can access
app.post('/authenticate', handler.authenticate);
app.post('/createUser', handler.createUser);
app.get('/getTags', handler.getTags);
app.get('/getUsers', handler.getUsers);
app.post('/getTagByName', handler.getTagByName);
app.post('/getTagsByGroup', handler.getTagsByGroup);
app.post('/getSongById', handler.getSongById);
app.post("/stripeEnd", handler.postStripeEnd);


//need to be documented below
app.post('/uploadTempSong', handler.uploadTempSong);
//dont forget to document these

// We are protecting all /api routes with JWT
var secret = "it's a secret to everybody";
app.use('/api', expressJwt({secret: secret}));

//configure routes for /api/* at ./app/routes
//everything in /api/ requires an authToken
require('./app/routes')(app); 

/*START OF DEV CODE*/

//DOCUMENTING API BELOW
var docs_handler = express.static(__dirname + '/app/docs/swagger-ui/');
app.get(/docs/, function(req, res, next) {

  if (req.url === '/docs') {
    res.writeHead(302, { 'Location' : req.url + '/' });
    res.end();
    return;
  }
  // take off leading /docs so that connect locates file correctly
  req.url = req.url.substr('/docs'.length);
  return docs_handler(req, res, next);
});

app.get('/getDocs', function(req, res){
  var jt = require('./app/docs/swagger.json');
  res.json(jt);
});

//DOCUMENTING API ABOVE

// app.use('*', function(req,res,next){
// console.log("test middleware");
// console.log(req.headers);
// next();
// });

// Test functions
// handler.listDatabase();
// handler.createUser();
// handler.findUser('findest');
// handler.listSongs();

app.get('/deleteDatabase', function(req,res){
  handler.deleteFolderRecursive("./public/media/sound/");
  handler.deleteDatabase();
  console.log("Data Deleted");
  res.status(200).end("database deleted");
});

app.post('/createAdmins', handler.createAdmins);
/*END OF DEV CODE*/

app.listen(port);
console.log('app listening in on port ', port);
exports = module.exports = app; //expose app

