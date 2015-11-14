//request-handler.js is for helper functions running in unprotected routes
var express = require('express');
//db is the exported mongo database
var db = require('./database/db');
//User is the exported mongoose schema for users.
var User = require('./database/models/user.model');
var Tag = require('./database/models/tag.model');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var azure = require('azure-storage');
var secret = "it's a secret to everybody";
var fs = require('fs');
var chance = require('chance').Chance();
var bcrypt = require('bcryptjs');

var _ = require('lodash');
var nconf = require('nconf');

nconf.env()
     .file({ file: 'config.json'});
var tableName = nconf.get("TABLE_NAME");
var partitionKey = nconf.get("PARTITION_KEY");
var accountName = nconf.get("STORAGE_NAME");
var accountKey = nconf.get("STORAGE_KEY");
var blobSvc = azure.createBlobService(accountName, accountKey), tableName, partitionKey;



//Signup User creates and stores a user mongoose document
exports.createUser = function(req, res) {
  console.log(req.body);

  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;
  var createdAt = new Date();
  var type = "basic";

      var hashedPassword = bcrypt.hashSync(password);


      //Test Purpose only, free to delete
      console.log("hashedPassword string: " + hashedPassword);

console.log("createUser ran");

  //check  length of username
  if(username === "anonymous") {
    res.status(300).send("Username is unavailable.");
  } else if(username.length < 3 || username.length > 13) {
    res.status(300).send("Username must be between 3 and 13 characters.");
  } else {

    var newUser = new User({
          username: username,
          password: hashedPassword,
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
                if (err) {
                   res.send(err);
                  }
              
                res.json(tag);

              });
}

exports.getTagByName = function(req, res) {

  var tagName = req.body.name;
Tag.findOne({ name: tagName })
              .populate('songs') // populates mongoose user song table with songdata
              .exec(function (err, tag) {
                if (err) { res.send(err); }

                res.json(tag);

              });
}

exports.getTagsByGroup = function(req, res) {

  var groupName = req.body.name;
  console.log(groupName);
Tag.findOne({ group: groupName })
              .populate('songs') // populates mongoose user song table with songdata
              .exec(function (err, tag) {
                if (err) { res.send(err); }
                
                res.json(tag);

              });
}

exports.getSongById = function(req, res) {

  var idToBeSearched = req.body.id;
  
  Song.findOne({ _id: idToBeSearched }) // populates mongoose user song table with songdata
              .exec(function (err, song) {
               if (err) { res.send(err); }
              
              console.log("song found");
                res.json(song);

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


            var isPasswordHashCorrect = bcrypt.compareSync(password, users[0].password);
            console.log(users[0]);
            
           
            if(isPasswordHashCorrect){

              var profile = {
                username: users[0].username,
                type: users[0].type,
                id: users[0]._id,
                station: "all"
              };

              // We are sending the profile inside the token
              var token = jwt.sign(profile, secret, { expiresInMinutes: 60*5 });

              res.json({ token: token });


            } else {
            res.json("Password is Incorrect");
            }

          });

};

exports.uploadTempSong = function(req, res) {
        // console.log(req.headers);
        // console.log(req.user);
        // console.log(req.headers);
        

        //When instantiated, filepath is always the filename: Ex. "song.mp3"
        var filepath = req.headers.filepath;
        
        var username = 'anonymous';

            if (!fs.existsSync('./public/media/sound/')){
                fs.mkdirSync('./public/media/sound/');
            }
            else{ 
            }

        //dir is the directory in which we store the mp3
        var dir = './public/media/sound/anonymous';

        //if the username folder does not exist, the code snippet below will make one.
            
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
                  console.log(dir +" made!");
            }
            else
            {
                console.log(dir +" not made!");
            }
          
        //if the songname is blank or undefined, it is set as the filename 
          if(req.headers.songname == '' || undefined || null) {
            var songname = req.headers.filepath;
          } else {
            var songname = req.headers.songname;
          }

          //query the database to find the user that uploaded song
          //this is to check if a song has been uploaded or not
          User.findOne({ username: username })
              .populate('songs') // populates mongoose user song table with songdata
              .exec(function (err, user) {
                if (err) return handleError(err);
                
                var counterForSameFileName = 0;

                var counterForSamePathName = 0;
                //cycles through the song array to check if the name or filepath exists.
                for (var i = 0; i < user.songs.length ; i++) {
               
                 //if user.song[i].name exists then end the call
                 if( user.songs[i].name === songname){
                  counterForSameFileName++;
                 }
                 //if user.song[i].filepath exists then end the call
                 if(user.songs[i].filepath === './media/sound/' + username + '/' +  filepath) {
                  counterForSamePathName++;
                 }
                };

                  if(counterForSamePathName > 0) {
                 filepath = '('+ counterForSamePathName + ')' + filepath ;
                 var extraParens = true;
                  }
        // This pipes the data into the writeStream file path.
        // the file path is put into the username folder
        var writeStream = fs.createWriteStream('./public/media/sound/' + username + '/' +  filepath);
        req.pipe(writeStream);

        console.log(filepath);

        console.log('./public/media/sound/' + username + '/' +  filepath);
        //AZURE STORAGE START 


        blobSvc.createContainerIfNotExists(username, {publicAccessLevel : 'blob'}, function(error, result, response){
          if(!error){
            console.log(username + " container created or exists");
          }
        });

        //azure storage end

       var size = 0;

       //tells server what happens when, streaming data onto server
      req.on('data', function (data) {
          size += data.length;
        
         //console.log('Got chunk: ' + data.length + ' total: ' + size);

            // blobSvc.createBlockBlobFromStream(username, songname, data, size, function (error) {
            //     if (error) {
            //         res.send(' Blob create: error ');
            //     }
            // });
      
      });

      //end of streaming data onto server
      req.on('end', function () {


          // console.log("total size = " + size);

          //Since this is tempupload use anonymous as username
          var username = 'anonymous';
          
          //query the username in order to add song to the username table
          User.find({'username': username},function (err, users) {
              if (err) return console.error(err);
            

                //console.log(req.headers);
                var username = 'anonymous';
                var tagarray = JSON.parse(req.headers.tagarray);
                var filepath = req.headers.filepath;
                var description = req.headers.description;
                //name is name of song that is assigned from the request
                var songname = req.headers.songname;


               
                //if songname is undefined then set it to the filepath
                if(songname == undefined || songname == 'undefined' || songname == '' || songname == null) {

                  var songname = req.headers.filepath;

                } else {
                
                  var songname = req.headers.songname;
                  songname = songname.trim();
                
                }

                //anonymous songs will not be put into tags
                tagarray = [];

                console.log(tagarray);
                console.log("User " + username +" found");
                console.log("User will now be put into test Song.");

                //Schema creation for song
                var creatorID = users[0]._id;
                var creator = users[0].username;
                var views = 0;
                var upvotes = 0;
                var downvotes = 0;
                var description = description;
                var createdAt = new Date();
                var filepath = './media/sound/' + username + '/' +  filepath;

                //Creates a string of characters 24 long. 
                var unhashedClaimString = chance.string({length: 24});
                //Hashes the string of characters
                var hashedClaimString = bcrypt.hashSync(unhashedClaimString);


               //Test Purpose only, free to delete
                // console.log("unhashed claim string: " + unhashedClaimString);

                // console.log("hashed string: " + hashedClaimString);
                var bool = bcrypt.compareSync(unhashedClaimString, hashedClaimString);

                //test purpose only, free to delete
                // console.log("bool" + bool);


                //tagObjArr will create objects for each tag and put it into tagObjArr
                var tagObjArr = [];


                console.log("createSong ran");
                //fill out Song Schema
                var newSong = new Song({
                        name: songname,
                        creatorID: creatorID,
                        creator: creator,
                        views: views,
                        upvotes: upvotes,
                        downvotes: downvotes,
                        tags: tagObjArr,
                        description: description,
                        createdAt: createdAt,
                        filepath: filepath,
                        claimHash: hashedClaimString 
                      });
                
                //when newSong saves it will run the tag query and insert the song into the right tags


                newSong.save(function(err, newSong) {
                  if (err) {
                     console.log('errored out: ', err);     
                  } else {
                          users[0].songs.push(newSong);

                         users[0].save(function(err, user) {
                            if (err) {
                               console.log('errored out: ', err);
                            } else {
                               console.log('successfully put song into anonymous');
                            }
                          });

                        
                         console.log('successfully put song into database');
                         
                         res.json({songObj: newSong, unhashedClaimCode: unhashedClaimString});

                      }
                    });


     });


  });        
      
    req.on('error', function(e) {
        console.log("ERROR ERROR: " + e.message);
        res.status(300).end(e.message);
    });

//Brace for end of user query
 }); 


//Brace for end of route
}










  //   Song.find({},function (err, songs) {
  //           if (err) return console.error(err);
  //    for(var i = 0; i < songs.length; i++){
  //    $scope.displaySongs.push(songs[i]); 
  // }
  //   });

function generateUser(username, password, email, adminCode) {
  

  var username = username;
  var password = password;
  var email = email;
  var createdAt = new Date();
  
  var secretAdminCode = nconf.get("adminCode");
  if(adminCode === secretAdminCode) {
  var type = "admin";
  }
  else {
    var type = "basic";
  }

  console.log("generateUser ran");

  //check  length of username
  if(username.length < 3 || username.length > 13) {
    return false;
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
         return false;
      } else {
         console.log('successfully put user into database');
        return true;
      }
    });
  

  }
}
exports.createAdmins = function(req, res) {

  var adminCode = req.body.adminCode;


  var anonymousPassword = nconf.get("anonymousPassword");
  //username, password, email, adminCode
  generateUser("anonymous", anonymousPassword, "anonymous@radioRise.com", adminCode);
  res.end("CreateAdmins has been called");
};
