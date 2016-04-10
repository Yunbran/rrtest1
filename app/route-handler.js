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
var bcrypt = require('bcryptjs');
var nconf = require('nconf');
nconf.env()
     .file({ file: 'config.json'});
var tableName = nconf.get("TABLE_NAME");
var partitionKey = nconf.get("PARTITION_KEY");
var accountName = nconf.get("STORAGE_NAME");
var accountKey = nconf.get("STORAGE_KEY");
var blobSvc = azure.createBlobService(accountName, accountKey), tableName, partitionKey;
var multiparty = require('multiparty');
var stripe = require("stripe")('sk_test_xFjxzY53cPUz7ZzTXygItGcp');



exports.getProfile = function(req, res) {
  
  User.findOne({ username: req.user.username })
              .populate('songs') // populates mongoose user song table with songdata
              .populate('favorite')
              .populate('upvoted') 
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
                var token = jwt.sign(profile, secret, { expiresInDays: 7 });


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
      // console.log("upvoteSong activated");
      var name = req.body.name;
      var userObj = req.user;
      // console.log(req.body);
      console.log(req.user + "has upvoted song: " + name);

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
      // console.log(hasAlreadyRated);
      if(hasAlreadyRated)
      {
        //console.log("activated");
        res.send("Song has already been voted by User");
      }
      else {
     console.log(req.user.station);
     // console.log(songs[0]);

      var relevantTag = retrieveRelevantTagFromSong(songs[0] , req.user.station);

     if(relevantTag === undefined){
      var relevantTag = retrieveRelevantTagFromSong(songs[0] , 'all');
      
      }
      console.log(relevantTag);
      relevantTag['upvotes'] = relevantTag['upvotes'] + 1;
      songs[0].upvotes = songs[0].upvotes + 1;
      console.log("relevantTag: " + relevantTag);

      songs[0].upvoteList.push(req.user.id);
      songs[0].ratedList.push(req.user.id);
      console.log(songs[0]);


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
    // console.log("downvoteSong activated");
    console.log(req.user + "has upvoted song: " + name);
    
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
     console.log(req.user.station);
     // console.log(songs[0]);

      var relevantTag = retrieveRelevantTagFromSong(songs[0] , req.user.station);
      if(relevantTag === undefined){
      var relevantTag = retrieveRelevantTagFromSong(songs[0] , 'all');
      }

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

 exports.favoriteSong = function(req, res) {
      // console.log("favoriteSong activated");
      var name = req.body.name;
      var userObj = req.user;
      var song = req.body;
                    
      console.log(name + ' favorited song: ' + song);
             
              User.findOne({ username: req.user.username }) 
              .exec(function (err, user) {
                user.favorite.push(song._id);
                user.save(function(){
                  res.json("Successfully favorited song!");
                });
              })

    
}

 exports.unfavoriteSong = function(req, res) {
      // console.log("unfavoriteSong activated");
      var name = req.body.name;
      var userObj = req.user;
      var song = req.body;
                    
      console.log(name + ' unfavorited song: ' + song);
             
              User.findOne({ username: req.user.username }) 
              .exec(function (err, user) {
                
                  user.favorite = _.filter( user.favorite,function(item) {
                        return item != song._id;
                   });

                user.save(function(){
                  res.json("Successfully unfavorited song!");
                });
              })

    
}
 exports.claimSong = function(req, res){
        // console.log("claimSong activated");
      var songToBeClaimed = req.body.songToBeClaimed;
      var unhashedClaimCode = req.body.unhashedClaimCode;
      var userObj = req.user;

      console.log(userObj.name + ' claimed song: ' + songToBeClaimed);

   Song.find({_id : req.body.songToBeClaimed._id}, function (err, songs) {
      if(err) {
        res.send(err);
      }
       // console.log("triggered");
      if(songs[0] === undefined) {
       res.send("Song does not exist");
      } else {
        //START OF CLAIM OPERATIONS
                console.log("bool " + unhashedClaimCode);
                console.log('as ' + songs[0].claimHash)
        var bool = bcrypt.compareSync(unhashedClaimCode, songs[0].claimHash);

        if(bool){
          if(songs[0].creator == "anonymous"){

           User.findOne({ username: req.user.username }) 
              .exec(function (err, user) {
                user.songs.push(songToBeClaimed._id);
                user.save(function(){
                  songs[0].creatorID = user._id;
                  songs[0].creator = user.username;
                  songs[0].save(function(){
                  res.json("Successfully claimed song!");
                    
                  });
                });
              })
          }
        } else {
          res.send("Song cannot be claimed. Please Upload again.");
        }
      }
 });
             
 

 }

exports.uploadSong = function(req, res) {
        // console.log(req.headers);
        // console.log(req.user);
         

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
                  res.status(300).end('The name of the file exists on your account.');
                  var exists = true;
                  break;
                 }

                 //if user.song[i].filepath exists then end the call
                 if(user.songs[i].filepath === songname) {
                  var exists = true;                  
                  res.status(300).end('The filepath of the file exists on your account.');
                  break;
                 }

                };
if(exists){

}
else {


        // This pipes the data into the writeStream file path.
        // the file path is put into the username folder
        // var writeStream = fs.createWriteStream('./public/media/sound/' + username + '/' +  filepath);
        


        // req.pipe(writeStream);




        //AZURE STORAGE START 


        blobSvc.createContainerIfNotExists(username, {publicAccessLevel : 'blob'}, function(error, result, response){
          if(!error){
            console.log(username + " container created or exists");
          }
        });

        //azure storage end

       var size = 0;
      
      var form = new multiparty.Form();
      form.parse(req);
       //tells server what happens when, streaming data onto server
     
form.on('part', function(part) {
  // You *must* act on the part by reading it
  // NOTE: if you want to ignore it, just call "part.resume()"

  if (!part.filename) {
    // filename is not defined when this is a field and not a file
    console.log('got field named ' + part.name);
    // ignore field's content
    part.resume();
  }

  if (part.filename) {
    // filename is defined when this is a file
    // count++;
    console.log('got file named ');
    console.log(part.filename);
    console.log(part.byteCount);

    var filename = part.filename;
    var size = part.byteCount;
    blobSvc.createBlockBlobFromStream(username, filename, part, size, function (error) {
          if (error) {
              res.send(' Blob create: error ');
          }
      });

    // ignore file's content here
    part.resume();
  } else {
   form.handlePart(part);
    }

  part.on('error', function(err) {
    res.send('error in uploading');
  });

    size += part.length;
  
   console.log('Got chunk: ' + part.length + ' total: ' + size);


});
      //end of streaming data onto server
      form.on('close', function () {


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
                tagarray.unshift('all');

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
                var filepath = songname;

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
//ASYNC OPERATIONS


                          //For each tag in newSong tags we will fire off a new async call.
                          for(var i = 0; i < newSong.tags.length;i++)
                          {
                        
                          console.log(newSong.tags[i]['tagname']);

                          var passIntoAsync = newSong.tags[i]['tagname']; 
                          console.log( passIntoAsync );
                    
                       function asyncTagOperations(tagNameAsync, newSong, creatorID, creator){
                             
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
                            var songRankArr = [];
                            
                            var createdTagAt = new Date();
                             console.log(creatorID);
                             console.log(creator);
                            var newTag = new Tag({
                                    name: tagname,
                                    creatorID: creatorID,
                                    creator: creator,
                                    views: 0,
                                    group: "genre",
                                    createdAt: createdTagAt,
                                    songs: tempSongArr,
                                    songRankings: songRankArr
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
                         res.json({songObj: newSong});

                      }
                    });


     });


  });        
      

   form.on('error', function(e) {
        console.log("ERROR ERROR: " + e.message);
        res.end(e.message);
    });

}
//Brace for end of user query
 }); 
  
//Brace for end of route
}

//editSongs
exports.editSong = function(req, res) {
      
        console.log(req.body);
        console.log(req.user);
      
      var idOfSong = req.body._id;
      var userObj = req.user;
      //console.log(req.body);
      var editChangesObj = req.body;
                        

   Song.find({_id : idOfSong}, function (err, songs) {
      if(err) {
        res.send(err);
      }
       // console.log("triggered");
      if(songs[0] === undefined) {
      
       res.send("Song does not exist");
      
      } else {
     // START OF EDITING OPERATIONS
     if(userObj.id != songs[0].creatorID) {
      res.send("Permission to edit song denied. (ID does not match)");
     } else if(songs[0].creator === 'anonymous') {
      res.send("Permission to edit song denied. (anonymous songs cant be edited)");
     } else{
                        // name: songname,
                        // creatorID: creatorID,
                        // creator: creator,
                        // views: views,
                        // upvotes: upvotes,
                        // downvotes: downvotes,
                        // tags: tagObjArr,
                        // description: description,
                        // createdAt: createdAt,
                        // filepath: filepath
        if(editChangesObj.name != undefined){
         songs[0].name = editChangesObj.name;         
        }

         if(editChangesObj.description != undefined){
         songs[0].description = editChangesObj.description;         
        }

         if(editChangesObj.tags.length  > 0){
         var tagsToBeAdded = [];
         var tagsToBeRemoved = [];
         var tagsUnchanged = [];
         var tagsFromDB = songs[0].tags;
         var editChangesObjArr = editChangesObj.tags;
         var databaseTagsConvertedToStrArr = [];  
         var editTagsConvertedToStrArr = [];    


        for(var i = 0; i < tagsFromDB.length; i ++) {
           if(tagsFromDB[i]['tagname']){
            databaseTagsConvertedToStrArr.push(tagsFromDB[i]['tagname'].toLowerCase());
           }
            
          }   
        for(var i = 0; i < editChangesObj.tags.length; i ++) {
          
            if(editChangesObj.tags[i]['name']) {
              editTagsConvertedToStrArr.push(editChangesObj.tags[i]['name'].toLowerCase());
             }
          }   
       editTagsConvertedToStrArr.unshift('all');
       editTagsConvertedToStrArr = _.uniq(editTagsConvertedToStrArr);
       databaseTagsConvertedToStrArr = _.uniq(databaseTagsConvertedToStrArr);
      
          console.log('databaseTagsConvertedToStrArr: ' + databaseTagsConvertedToStrArr);
          console.log('editTagsConvertedToStrArr: ' + editTagsConvertedToStrArr);

       tagsToBeAdded = _.difference(editTagsConvertedToStrArr, databaseTagsConvertedToStrArr);
       tagsToBeRemoved = _.difference(databaseTagsConvertedToStrArr, editTagsConvertedToStrArr);

         console.log('tagsToBeAdded: ' + tagsToBeAdded);
         console.log('tagsToBeRemoved: ' + tagsToBeRemoved);
          
          if(tagsToBeAdded.length > 5) {
            tagsToBeAdded = tagsToBeAdded.slice(0,5);
          }

//duplicate check
          // var duplicateHashMap = {};
          // var duplicateArr = [];
          // for(var i = 0; i < tagsFromDB.length; i ++) {
          //   if(duplicateHashMap[tagsFromDB[i].tagname] = tagsFromDB[i].tagname){
          //     duplicateArr.push(tagsFromDB[i].tagname);
          //   }
          //   duplicateHashMap[tagsFromDB[i].tagname] = tagsFromDB[i].tagname;
          // } 
//end duplicate check
 
               var tagObjArr = songs[0].tags;

                for(var tagKey in tagsToBeAdded)
                {
                    var tempObj = {
                      tagname: tagsToBeAdded[tagKey],
                      views: 0,
                      upvotes: 0,
                      downvotes: 0
                    }
                    tagObjArr.push(tempObj);
                }

                if(tagsToBeRemoved.length > 0){
                  for(var tagKey in tagsToBeRemoved){
                    
                    for(var i = 0; i < tagObjArr.length; i++){
                      if(tagObjArr[i].tagname == tagsToBeRemoved[tagKey]){
                        tagObjArr.splice(i,1);
                        i--;
                      }
                    }
                
                  }
                }

             }

         songs[0].save(function(err, newSong) {
            if (err) {
               res.send(err); 
            } else {

              if(tagsToBeAdded){
                if(tagsToBeAdded.length > 0) {
                  addTagsToSong(newSong, tagsToBeAdded, songs[0].creatorID, songs[0].creator);
                }  
              }

         if(tagsToBeRemoved){
                if(tagsToBeRemoved.length > 0) {
             removeSongFromTags(newSong, tagsToBeRemoved);
                              }  
              }

              res.json(newSong);
       
          }
        });

          
      
     }
      
     }

   }
 );

// End of EditSong Brace

}





//ASYNC OPERATIONS
function addTagsToSong(newSong, tagsToBeAdded, creatorID, creator){
  console.log('addTagsToSong has activated');
                       function TagOperations(tagName, newSong){
                             
                            Tag.find({'name': tagName},function (err, tags) {
                          if (err) return console.error(err);
                            //console.log( tagName + " inside tag");
                          //if the tag was not found in the tag collection, it will create one
                           if(tags[0] == undefined || null)
                           {
                            //tempSongArr generated for pushing song ID into the tag collection
                            var tempSongArr = [];

                            tempSongArr.push(newSong._id);
                            
                            var tagname =  tagName;
                            var songRankArr = [];
                            
                            var createdTagAt = new Date();
                             console.log(creatorID);
                             console.log(creator);
                            var newTag = new Tag({
                                    name: tagname,
                                    creatorID: creatorID,
                                    creator: creator,
                                    views: 0,
                                    group: "genre",
                                    createdAt: createdTagAt,
                                    songs: tempSongArr,
                                    songRankings: songRankArr
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

               //if tagarray is greater than 5 they cheated and it'll be cut down to five
                if(tagsToBeAdded.length > 5)
                  {
                    tagsToBeAdded = tagsToBeAdded.slice(0,5);
                  }


                //The values in tag array will be lowercased
                tagsToBeAdded = _.map(tagsToBeAdded , function(item){
                   return item.toLowerCase();
                  });

                //tagsToBeAdded will be removed of duplicates
                tagsToBeAdded = _.uniq(tagsToBeAdded);

                //tagsToBeAdded will be removed of undefined or empty strings.
                tagsToBeAdded = _.filter(tagsToBeAdded, function(item){
                  if(item === undefined || item === '' ||item === null || item === 'undefined')
                  {
                    return false;
                  }
                  else
                  {
                    return true;
                  }
                });

                          //For each tag in newSong tags we will fire off a new async call.
                          for(var i = 0; i < tagsToBeAdded.length;i++)
                          {
                                console.log(tagsToBeAdded[i]);

                          var passIntoAsync = tagsToBeAdded[i]; 
                         // console.log( passIntoAsync );                    
                         TagOperations(passIntoAsync,newSong); //We pass our tagname into our closure.
                         }
  
}

function removeSongFromTags(songToBeRemoved, tagsToBeRemovedFrom){
  console.log('removeSongFromTags  has activated');

                for(var i = 0; i < tagsToBeRemovedFrom.length; i++){

                   Tag.find({'name': tagsToBeRemovedFrom[i]},function (err, tags) {
                          if (err) return console.error(err);
                        
                        console.log(tags);
                          //if the tag was not found in the tag collection, it will do nothing
                           if(tags[0] == undefined || null) {


                           }
                           else
                           {
                            // console.log("triggered");
                            console.log(tags[0].songs);
                            console.log( songToBeRemoved._id)
                            var indexOfSong = _.findIndex(tags[0].songs, function(subject){
                              return songToBeRemoved._id.equals(subject);
                            });
                            console.log(tags[0].songs);
                            console.log(indexOfSong);
                            tags[0].songs.splice(indexOfSong,1);
                            
                            tags[0].save(function(err , tag){
                                if (err) {
                                 console.log('errored out: ', err);
                              } else {
                                 console.log('successfully deleted song from tag');
                              } 
                            });

                           }
                     });
                }
  
}


exports.chargePremium = function (req, res) {
  console.log(req.user);
  var stripeToken = req.body.token;
  var servicePlan = req.body.plan;

if(servicePlan) {

  stripe.customers.create({
    source: stripeToken,
    plan: servicePlan,
    email: req.user.email
  }, function(err, customer) {
        if (err) {
        // The card has been declined
      console.log(err);

      res.json("failed");
      } else {
     
     User.findOne({ username: req.user.username }) 
    .exec(function (err, user) {
      user.stripeId = customer.id;
      user.type = "premium";
      user.save(function(){
        console.log("Successfully saved ID and upgraded to Premium!");
      // console.log(customer);
      res.json(customer.id);
      });
    })

      }
  });

} else {

  stripe.customers.create({
    source: stripeToken,
    description: req.user.email
  }).then(function(customer) {
    return stripe.charges.create({
      amount: 1200, 
      currency: "usd",
      customer: customer.id
    });
  }).then(function(charge) {
    console.log(charge);
      User.findOne({ username: req.user.username }) 
    .exec(function (err, user) {
      user.stripeId = charge.id;
      user.type = "premium";
      user.save(function(){
         console.log("Successfully saved ID and upgraded to Premium!");
    res.json(charge);
      });
    })

  });

}






}


exports.getUser = function (req, res) {
  console.log('user ' + req.user.username + ' is calling /api/restricted');
  // console.log(req.headers);
  res.json(req.user);
}

