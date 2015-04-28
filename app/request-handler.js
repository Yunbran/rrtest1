//request-handler.js is for helper functions running in unprotected routes
var express = require('express');
//db is the exported mongo database
var db = require('./database/db');
//User is the exported mongoose schema for users.
var User = require('./database/models/user.model');
var Tag = require('./database/models/tag.model');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var secret = "it's a secret to everybody";
var fs = require('fs');

//Signup User creates and stores a user mongoose document
exports.createUser = function(req, res) {
  console.log(req.body);

  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;
  var createdAt = new Date();
  var type = "basic";
console.log("createUser ran");

  //check  length of username
  if(username.length < 3 || username.length > 13) {
    res.status(300).send("Username must be between 3 and 13 characters.");
  } else {

    var newUser = new User({
          username: username,
          password: password,
          email: email,
          type: type,
          createdAt: createdAt,
          songs: [],
          upvoted: [],
          downvoted:[],
          favorite: []
        });
  //newUser.save saves the document and then redirects to root.
  //It's extremely important to run the save function.
  //without it there will be no change recorded in the database.
   newUser.save(function(err, newUser) {
      if (err) {
         console.log('errored out: ', err);    
         res.status(400).json(err); 
      } else {
         console.log('successfully put user into database');
         res.end('Successfully signed up!');
      }
    });
  }

};

exports.findSong = function(name){
 console.log("findSong ran");
//Song.find searches the mongo database for the Song model.
//It retrieves an array of 'Songs' that match the object query in the first parameter
//The Songs array is used in the callback function.
//Songs[0] is used because we know Songnames are unique.
//There will only ever be one object in the Songs array with a Songname query at index 0.
    Song.find({'name': name},function (err, songs) {
            if (err) return console.error(err);
           
            console.log(songs[0]);
          });


};

exports.findUser = function(name){
 console.log("findUser ran: " + name);
//Song.find searches the mongo database for the Song model.
//It retrieves an array of 'Songs' that match the object query in the first parameter
//The Songs array is used in the callback function.
//Songs[0] is used because we know Songnames are unique.
//There will only ever be one object in the Songs array with a Songname query at index 0.
    User.find({'username': name},function (err, users) {
            if (err) return console.error(err);
           
            console.log(users[0]);
          });


};
exports.deleteSongLists = function(){
 User.find({},function (err, users) {
            if (err) return console.error(err);

              for(var i = 0; i < users.length;i++)
              { 
                var optimizationFlag = false;
                if(users[i].songs.length > 0)
                {
                  optimizationFlag = true;
                }

                if(optimizationFlag == true)
                {
                    users[i].songs = [];
                    users[i].save(function(err, user) {
                      if (err) {
                         console.log('errored out: ', err);     
                      } else {
                         console.log('deleted songs from ' + user.username);
                      }
                   });
                }

              }
            console.log("successfully wiped all users song list");
          });
};

exports.deleteAllSongs = function(){
Song.remove({},function (err) {
        if (err) return console.error(err);
        console.log("successfully deleted songs");
        deleteSongLists();
});
}

exports.deleteAllUsers = function(){
User.remove({},function (err) {
        if (err) return console.error(err);
        console.log("successfully deleted users");
});
}

// createUser();
// createSong('Brandon');
// findSong('linkin parks grand song');
// deleteAllSongs();
// deleteAllUsers();
// console.log(db.collections);
exports.deleteDatabase = function(){

db.collections['users'].drop( function(err) {
    console.log('collection dropped');
});
db.collections['songs'].drop( function(err) {
    console.log('collection dropped');
});
db.collections['tags'].drop( function(err) {
    console.log('collection dropped');
});
}
exports.listDatabase = function(){

  User.find({},function (err, users) {
            if (err) return console.error(err);
           
            console.log(users);
          });

   Song.find({},function (err, songs) {
            if (err) return console.error(err);
           
            console.log(songs);
          });

      Tag.find({},function (err, tags) {
            if (err) return console.error(err);
           
            console.log(tags);
          });
  
}

exports.listUsers = function(){

  User.find({},function (err, users) {
            if (err) return console.error(err);
           
            console.log(users);
          });
  
}

exports.listSongs = function(){

   Song.find({},function (err, songs) {
            if (err) return console.error(err);
           
            console.log(songs);
          });

  
}

exports.listTags = function(){
   Tag.find({},function (err, tags) {
            if (err) return console.error(err);
           
            console.log(tags);
          });
  
}

exports.getSongs = function(req,res){
    Song.find({},function (err, songs) {
        if(err) {
          res.send(err);
        }
        res.json(songs);
     });
  
}
exports.getTags = function(req, res) {
  Tag.find({},function (err, tags) {
      if(err) {
        res.send(err);
      }
      res.json(tags);
   });
}
exports.getUsers = function(req, res) {


  User.find({},function (err, users) {
      if(err) {
        res.send(err);
      }
      res.json(users);
   });
}

exports.getStation = function(req, res) {

  var tagName = req.body.name;
  //console.log(tagName);
Tag.findOne({ name: tagName })
              .populate('songs') // populates mongoose user song table with songdata
              .exec(function (err, tag) {
                if (err) return handleError(err);
              
                res.json(tag);

              });
}

exports.getTagByName = function(req, res) {

  var tagName = req.body.name;
Tag.findOne({ name: tagName })
              .populate('songs') // populates mongoose user song table with songdata
              .exec(function (err, tag) {
                if (err) return handleError(err);
      
                res.json(tag);

              });
}

exports.getTagsByGroup = function(req, res) {

  var groupName = req.body.name;
  console.log(groupName);
Tag.findOne({ group: groupName })
              .populate('songs') // populates mongoose user song table with songdata
              .exec(function (err, tag) {
                if (err) return handleError(err);
              
                res.json(tag);

              });
}


//Deletes folder and everything inside of it
  exports.deleteFolderRecursive = function(path) {
    var files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                exports.deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};


exports.authenticate =  function (req, res) {
  //TODO validate req.body.username and req.body.password
  //if is invalid, return 401
  // if (!(req.body.username === 'john.doe' && req.body.password === 'foobar')) {
  //   res.status(401).send('Wrong user or password');
  //   return;
  // }
  console.log("Authenticate ran");
  var username = req.body.username.toLowerCase();
  var password = req.body.password;

      User.find({'username': username},function (err, users) {
            
            if (err) {
              res.status(401).send('User does not exist');
              return;

                       } else if(users[0] === undefined){
               res.status(401).send('User does not exist');
              return;
            }


            console.log(users[0]);

            if(users[0].password === password){

              var profile = {
                username: users[0].username,
                type: users[0].type,
                id: users[0]._id,
                station: "all"
              };

              // We are sending the profile inside the token
              var token = jwt.sign(profile, secret, { expiresInMinutes: 60*5 });

              res.json({ token: token });


            }

          });

};



  //   Song.find({},function (err, songs) {
  //           if (err) return console.error(err);
  //    for(var i = 0; i < songs.length; i++){
  //    $scope.displaySongs.push(songs[i]); 
  // }
  //   });

