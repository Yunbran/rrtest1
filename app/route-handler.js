//route-handler.js is for helper functions running in protected routes in routes.js

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



exports.getProfile = function(req, res) {
  
  User.findOne({ username: req.user.username })
              .populate('songs') // populates mongoose user song table with songdata
              .populate('rated') 
              .exec(function (err, user) {
                if(err) {
                  res.send(err);
                }
                res.json(user);
   });
  
  }

//getTagByName start
  exports.getTagByName = function(req, res) {
    
     var tagName = req.body.name;
     //console.log(tagName);
     Tag.findOne({ name: tagName })
                .populate('songs') // populates mongoose user song table with songdata
                .exec(function (err, tag) {
                  if (err) return handleError(err);
                
                //new Token profile is constructed
                var profile = {
                  username: req.user.username,
                  type: req.user.type,
                  id: req.user.id,
                  station: tagName
                };

                // We are sending the profile inside the token
                var token = jwt.sign(profile, secret, { expiresInMinutes: 60*5 });


                  res.json({token: token,
                            stationData: tag});
                });
  }

//getTagByName end

//Goes inside the tagArray of song to get the tag object that has the same name
  function retrieveRelevantTagFromSong(song, targetTagName)
 {  
  return _.find(song.tags, function(item){ return item.tagname == targetTagName; });   
 }


 exports.upvoteSong = function(req, res) {
      console.log("upvoteSong activated");
      var name = req.body.name;
      var userObj = req.user;
      //console.log(req.body);

   Song.find({name : name}, function (err, songs) {
      if(err) {
        res.send(err);
      }
     if(songs[0] === undefined)
     {
      res.send("Song does not exist");
     }
     else
     {

      var hasAlreadyRated = _.contains(songs[0].ratedList, req.user.id)
      console.log(hasAlreadyRated);
      if(hasAlreadyRated)
      {
        //console.log("activated");
        res.send("Song has already been voted by User");
      }
      else {
     // console.log(req.user.station);
     // console.log(songs[0]);

      var relevantTag = retrieveRelevantTagFromSong(songs[0] , req.user.station);
      relevantTag['upvotes'] = relevantTag['upvotes'] + 1;
      songs[0].upvotes = songs[0].upvotes + 1;
      console.log("relevantTag: " + relevantTag);

      songs[0].upvoteList.push(req.user.id);
      songs[0].ratedList.push(req.user.id);


         songs[0].save(function(err, newSong) {
            if (err) {
               res.send(err); 
            } else {
                    
              console.log('song upvoted');
             
              User.findOne({ username: req.user.username }) 
              .exec(function (err, user) {
                user.upvoted.push(newSong._id);
                user.save();
              })

              res.json(songs);
             }
          });

        
      }
     }

   });
    
}


exports.downvoteSong = function(req, res) {
    console.log("downvoteSong activated");
      var name = req.body.name;
      //console.log(req.body);
   Song.find({name : name},function (err, songs) {
      if(err) {
        res.send(err);
      }
        if(songs[0] === undefined)
     {
      res.send("Song does not exist");
     }
     else
     {

      console.log("SongsArr: " + songs[0].ratedList);

      var hasAlreadyRated = _.contains(songs[0].ratedList, req.user.id)
      console.log(hasAlreadyRated);
      if(hasAlreadyRated)
      {
        console.log("activated");
        res.send("Song has already been voted by User");
      }
      else{
     // console.log(req.user.station);
     // console.log(songs[0]);

      var relevantTag = retrieveRelevantTagFromSong(songs[0] , req.user.station);
      relevantTag['downvotes'] = relevantTag['downvotes'] + 1;
      songs[0].downvotes = songs[0].downvotes + 1;
      console.log("relevantTag: " + relevantTag);

      songs[0].downvoteList.push(req.user.id);
      songs[0].ratedList.push(req.user.id);

         songs[0].save(function(err, newSong) {
            if (err) {
               res.send(err); 
            } else {
                    
              console.log('song downvoted');
              User.findOne({ username: req.user.username }) 
              .exec(function (err, user) {
                user.downvoted.push(newSong._id);
                user.save();
              })

              res.json(songs);
             }
          });

        
      }
  }
   });
    

}

exports.uploadSong = function(req, res) {
        // console.log(req.headers);
        //console.log(req.user);
        // console.log(req.headers);
        

        //When instantiated, filepath is always the filename: Ex. "song.mp3"
        var filepath = req.headers.filepath;
        
        //username is the username of the user who uploaded the song
        var username = req.user.username;

            if (!fs.existsSync('./public/media/sound')){
                fs.mkdirSync('./public/media/sound/');
               // console.log("./public/media/sound/ made!");
            }
            else
            {
              // console.log("./public/media/sound/ not made!");
            }

        //dir is the directory in which we store the mp3
        var dir = './public/media/sound/' + username;

        //if the username folder does not exist, the code snippet below will make one.
            
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
                  console.log(dir +"made!");
            }
            else
            {
                console.log(dir +"not made!");
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
  
                //cycles through the song array to check if the name or filepath exists.
                for (var i = 0; i < user.songs.length ; i++) {
               
                 //if user.song[i].name exists then end the call
                 if( user.songs[i].name === songname){
                  res.end('The name of the file exists on your account.');
                 }
                 //if user.song[i].filepath exists then end the call
                 if(user.songs[i].filepath === './media/sound/' + username + '/' +  filepath) {
                
                  res.end('The filepath of the file exists on your account.');
                 }

                };

        // This pipes the data into the writeStream file path.
        // the file path is put into the username folder
        var writeStream = fs.createWriteStream('./public/media/sound/' + username + '/' +  filepath);
        req.pipe(writeStream);


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

          //set username from req.headers.username. will subsitute with auth token
          var username = req.user.username;
          
          //query the username in order to add song to the username table
          User.find({'username': username},function (err, users) {
              if (err) return console.error(err);
            

                //console.log(req.headers);
                var username = req.user.username;
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

                //if tagarray is greater than 5 they cheated and it'll be cut down to five
                if(tagarray.length > 5)
                  {
                    tagarray = tagarray.slice(0,5);
                  }

                //The tag array automatically gets the all tag. this possibly makes it 6
                tagarray.push('all');

                //The values in tag array will be lowercased
                tagarray = _.map(tagarray , function(item){
                   return item.toLowerCase();
                  });

                //tagarray will be removed of duplicates
                tagarray = _.uniq(tagarray);

                //tagarray will be removed of undefined or empty strings.
                tagarray = _.filter(tagarray, function(item){
                  if(item === undefined || item === '' ||item === null || item === 'undefined')
                  {
                    return false;
                  }
                  else
                  {
                    return true;
                  }
                });

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

                //tagObjArr will create objects for each tag and put it into tagObjArr
                var tagObjArr = [];

                for(var tagKey in tagarray)
                {
                    var tempObj = {
                      tagname: tagarray[tagKey],
                      views: 0,
                      upvotes: 0,
                      downvotes: 0
                    }
                    tagObjArr.push(tempObj);
                }


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
                        filepath: filepath  
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
                               console.log('successfully put song into user');
                            }
                          });

                          //For each tag in newSong tags we will fire off a new async call.
                          for(var i = 0; i < newSong.tags.length;i++)
                          {
                                console.log(newSong.tags[i]['tagname']);

                          var passIntoAsync = newSong.tags[i]['tagname']; 
                         // console.log( passIntoAsync );
                    
                       function asyncTagOperations(tagNameAsync, newSong){
                             
                            Tag.find({'name': tagNameAsync},function (err, tags) {
                          if (err) return console.error(err);
                            //console.log( tagNameAsync + " inside tag");
                          //if the tag was not found in the tag collection, it will create one
                           if(tags[0] == undefined || null)
                           {
                            //tempSongArr generated for pushing song ID into the tag collection
                            var tempSongArr = [];

                            tempSongArr.push(newSong._id);
                            
                            var tagname =  tagNameAsync;
                            
                            var newTag = new Tag({
                                    name: tagname,
                                    views: 0,
                                    group: "genre",
                                    songs: tempSongArr
                                  });

                            newTag.save(function(err , tag){
                                if (err) {
                                 console.log('errored out: ', err);
                              } else {
                                 console.log('successfully created Tag');
                             }

                          });

                           }
                           else
                           {
                            tags[0].songs.push(newSong._id);
                            tags[0].save(function(err , tag){
                                if (err) {
                                 console.log('errored out: ', err);
                              } else {
                                 console.log('successfully pushed song into tag');
                              } 
                            });

                           }
                     });
                  
                 }

                         asyncTagOperations(passIntoAsync,newSong); //We pass our tagname into our closure.
          

            }
                         console.log('successfully put song into database');
                         res.json(newSong);

                      }
                    });


     });


  });        
      

//Brace for end of user query
 }); 

    req.on('error', function(e) {
        console.log("ERROR ERROR: " + e.message);
        res.end(e.message);
    });

//Brace for end of route
}

exports.getUser = function (req, res) {
  console.log('user ' + req.user.username + ' is calling /api/restricted');
  // console.log(req.headers);
  res.json(req.user);
}