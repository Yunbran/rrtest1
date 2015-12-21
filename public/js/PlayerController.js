app.controller('PlayerController', function($scope, $http, $modal, $log, $window, $timeout, $stateParams, $state, $window, $timeout, ngAudio, FileUploader, basket, localStorageService, stripe, User) {

//START OF INSTANTIATION--------------------------------------------------
 
 //instantiates the variables inside PlayerController 
 //displaySongs is populated with getStation()
 $scope.displaySongs = ['should','not', 'work', 'yet'];
 //displayTags is populated with getTags();
 //$scope.displayTags = ['should','not', 'work', 'yet'];
 $scope.currentStation = null;
 $scope.isStationPlaying = false;
 $scope.currentStationData = {};
 $scope.customSongArray = [];
 $scope.percentageArray = [];
 $scope.historyArray = [];
 $scope.tagArray = [];
 $scope.hasUploaded = false;
 $scope.subMessageArray =[{msg: "where the best music always rises to the top"},{msg: "you decide the breakout songs of tomorrow"},{msg: "your music could be the hit of the century!"},{msg: "Upload below!"},{msg: "Choose a Station Tag!"}]
 $scope.profileLetter = '';
 $scope.animationSwitchX = false; 
 $scope.currentHistoryIndex = 0;
 $scope.historyMode = 'history';

 $scope.skipDisabled = false;

 $scope.animationSwitchMainLabel = false; 
 $scope.hiddenTags = [];
 $scope.uploadMessage = "";
 $scope.uploadFeedbackMessage = "";
 //currentSong is the song that is loaded by ngAudio
 $scope.currentSong = {name:''};
 $scope.nextSong = '';
 //optimization variables!
 $scope.ratedSongTableObj = {};
//formData used for post requests to the server
           $scope.formData = {
           songTag : '',
           currentSong : '',
           search: {
            tag: '', 
            name: ''
          }
          
          };
 // console.log( getLocalStorage("token"));
 // console.log( getLocalStorage("data"));

 User.authToken = getLocalStorage("token");
 User.storedData = getLocalStorage("data");
 
 if(getLocalStorage("data") === null){
  var objectToStore = {
    claimCodeMap: {}
  }
   setLocalStorage("data" , objectToStore);
   User.storedData = getLocalStorage("data");
 }

//logic Train STARTS HERE
 
//if the window has an authToken go ahead and get the Profile  
  if(User.authToken && User.authToken !== 'undefined') {
    getUser();
  } 
  else {
      updatePage();
      
  }
  
  if($stateParams["songId"]){
    var tempPostObj = {};

    tempPostObj["id"] = $stateParams["songId"];

     $http.post("/getSongById", tempPostObj)
      .success(function(response) {
      console.log(response);
      console.log($stateParams["songId"]);
      if(response["_id"] === $stateParams["songId"])
      {
      $scope.currentStation = "all";
      $scope.activateAndPlaySong(response);

      $scope.currentSong.rated = true;

    console.log($scope.currentSong.rated, "rated");
      $scope.isStationPlaying = true;

      }
    });
  }  
//logic Train ENDS HERE

//END OF INSTANTIATION-------------------------------------------------

 //Test function. DEV Function only
 $scope.check = function () {

    // console.log(getLocalStorage("token"));
    // console.log(User.authToken);
    // console.log($scope.userProfile);
    // console.log($scope.shareURL);
    // uploadURLSwitch();

    // console.log($scope.demoTagArrays);
console.log($scope.message);
// $scope.screenVar +=5;

// $scope.screenModifier = $scope.screenVar + "%";
        // $http.post("/stripeEnd", {adminCode: "snake"})
        //   .success(function(response) {
        //     console.log(response);
        //   });

   // $http.get("/deleteDatabase")
   //      .success(function(response) {
   //        console.log(response);
   //   $http.post("/createAdmins", {adminCode: "snake"})
   //        .success(function(response) {
   //          console.log(response);
   //        });
   //      });

 }

// $scope.goToPayment = function () {
//     basket["userProfile"] = $scope.userProfile;
//     console.log(basket["userProfile"] );
//     console.log(basket);
//     stopSong();
//     $state.go('payment');
//  }

$scope.payment = {
  card:{
    number: undefined,
    cvc: undefined,
    exp_month: undefined,
    exp_year: undefined
  }
}
  $scope.charge = function () {
$scope.payment.plan = "premium";
    console.log("Asdasd", $scope.payment.card);

    var chargeResponse = stripe.card.createToken($scope.payment.card)
      .then(function (response) {
        console.log('token created for card ending in ', response.card.last4);
        var payment = angular.copy($scope.payment);
        payment.card = void 0;
        payment.token = response.id;
        return $http.post('/api/chargePremium', payment);
      })
      .then(function (payment) {
        console.log('successfully submitted payment for $', payment.amount);
      })
      .catch(function (err) {
        if (err.type && /^Stripe/.test(err.type)) {
          console.log('Stripe error: ', err.message);
        }
        else {
          console.log('Other error occurred, possibly with your API', err.message);
        }
      });
  console.log(chargeResponse);
  };


  $scope.DESTROY = function () {
     $http.get("/deleteDatabase")
        .success(function(response) {
          console.log("Database deleted");
        });
 }


//helper function to attach a callback onto a function.
//returns a function that will apply the added function after the initial function triggers.
function callbackDecorator(func, addedFunc) {
  if(typeof func === "function")
  {

  return function() {
    var result = func.apply(this, arguments)
    if(addedFunc){
     addedFunc();
    }
    return result;
   }

  } else {
    return func;
  }

} 

//Simple event listener function.
 var mixEvents = function(obj) {
  obj.events = {}
  obj.on = function(action, callback) {
    obj.events[action] = obj.events[action] || [];
    obj.events[action].push(callback); 
  };
  obj.trigger = function(action)
  {
    try{
    var args = Array.prototype.slice.call(arguments);
   
    for(var a = 0; a < args.length;a++)
    {
      for(var i = 0; i < obj.events[args[a]].length;i++)
     {
      obj.events[args[a]][i]();
     }
  
  }
 }
 catch(err){
  console.log("EventListener Trigger does not exist: " + err);
 }

 }
  return obj;
};

 $scope.mainEventListener = mixEvents({});

 $scope.mainEventListener.on("songEnd", function(){
    console.log("Works");
 });

//Updates $scope.displaySongs and $scope.displayTags by requesting to the server
function updatePage(){
      getStation();
      getTags();

};

function setLocalStorage(key, val) {
   return localStorageService.set(key, val);
  }

function getLocalStorage(key) {
   return localStorageService.get(key);
  }

function getUserProfile(){
       
       $http.get("api/getProfile")
        .success(function(response) {
          $scope.userProfile = response;
          User.profile = $scope.userProfile;
          console.log($scope.userProfile)
          $scope.profileLetter = $scope.userProfile.username.substring(0,1).toUpperCase();
          uploadURLSwitch();
          //console.log($scope.userProfile);
          //populates hash Table with the array;
          for(var i = 0;i < $scope.userProfile.upvoted.length; i++){
            $scope.ratedSongTableObj[$scope.userProfile.upvoted[i]] = $scope.userProfile.upvoted[i];
          }  

          for(var i = 0;i < $scope.userProfile.downvoted.length; i++){
            $scope.ratedSongTableObj[$scope.userProfile.downvoted[i]] = $scope.userProfile.downvoted[i];
          } 
      updatePage();
        })
        .error(function(){

        });
}

function getUser(){
    $http({url: '/api/getUser', method: 'GET'})
    .success(function (data, status, headers, config) {
      $scope.user = data;
     // console.log($scope.user);

     // $scope.currentStation = $scope.user.station;
        getUserProfile();
    })
    .error(function (data, status, headers, config) {
      updatePage();
    }); 

}

//GETS SONGS FROM SERVER AND LISTS THEM --safe to delete
// function getSongs(){

//    $http.get("/getSongs")
//     .success(function(response) {
//       // console.log(response);
//         $scope.displaySongs = response;
     
//       $scope.sound = ngAudio.load($scope.displaySongs[0].filepath);
      
//     });

//   }
    $scope.currentSongUpvotePerc = 0;
    $scope.stacked = [];
    $scope.stackLikeBar = function() {
    
    $scope.stacked = [];
    var total = $scope.currentSong.upvotes + $scope.currentSong.downvotes;
     // console.log($scope.currentSong);
     // console.log($scope.currentSong['upvotes']);
     // console.log(($scope.currentSong['upvotes']/total) * 100);
     // console.log(($scope.currentSong['downvotes'].downvotes/total) * 100);


     var currentSongUpvoteNum = $scope.currentSong.upvotes;
     var currentSongDownvoteNum = $scope.currentSong.downvotes;

     var currentSongUpvoteCalc = (($scope.currentSong.upvotes/total) * 100);
     var currentSongDownvoteCalc = (($scope.currentSong.downvotes/total) * 100);

    if((currentSongUpvoteNum + currentSongDownvoteNum) === 0) {

    $scope.stacked.push({
          value: 100,
          type: 'info'
        });

    }
    else {
    
    if(!isNaN(currentSongUpvoteCalc) && currentSongUpvoteCalc !=0)
    {

        $scope.stacked.push({
          value: currentSongUpvoteCalc,
          type: 'success'
        });
      
    }


    if(!isNaN(currentSongDownvoteCalc) && currentSongUpvoteCalc !=0)
    {
        $scope.stacked.push({
          value: currentSongDownvoteCalc,
          type: 'danger'
        });

    }
  
      $scope.currentSongUpvotePerc = currentSongUpvoteCalc;
         // console.log(currentSongUpvoteCalc);
  }
}
//GETS TAGS FROM SERVER AND LISTS THEM

 function getTags(){

  $http.get("/getTags")
  .success(function(response) {
   $scope.tagArray = response;
   basket['currentTags'] = response;
   // console.log(response);
     //$scope.displayTags = [];
     // $scope.tagArray = [{name: "Rock"}, {name: "Pop"}, {name: "Rap"}, {name: "Classical"}, {name: "Electronic"}, {name: "CRAP"}, {name: "dasdasfas"}, {name: "Casdasdad"}, {name: "ERGERG"}];
    
     $scope.tagIndexStart = 0;
     $scope.tagIndexEnd = 5;
   // $scope.displayTagsLeft = $scope.tagArray.slice(($scope.tagArray.length - 5), ($scope.tagArray.length));
   // $scope.displayTags = $scope.tagArray.slice(0, 5);
   // $scope.displayTagsRight = $scope.tagArray.slice(5, 10);
   // $scope.demoTagArrays.push($scope.displayTagsLeft);
   // $scope.demoTagArrays.push($scope.displayTags);
   // $scope.demoTagArrays.push($scope.displayTagsRight);

   //quickfix for random bug
   if($scope.demoTagArrays === undefined){

   $scope.demoTagArrays = [];
   
  for(var lengthCounter = 0; lengthCounter <  $scope.tagArray.length; lengthCounter+=5){
    var tempLoopArray = $scope.tagArray.slice($scope.tagIndexStart, $scope.tagIndexEnd);
    $scope.tagIndexStart = $scope.tagIndexStart + 5;
    $scope.tagIndexEnd = $scope.tagIndexEnd + 5;
    if($scope.tagIndexEnd > $scope.tagArray.length){
      $scope.tagIndexEnd = $scope.tagArray.length;
    }

    if(tempLoopArray.length < 5) {
      while(tempLoopArray.length < 5)
      tempLoopArray.push({name:"N/A"});
    }
    $scope.demoTagArrays.push(tempLoopArray);
  }
}
//move these into a call back later
  $scope.activateStation($scope.tagArray[0]);
//repos are for the searchbar
   $scope.repos = loadAll(); 
  });

}

//GETS TAGS FROM SERVER AND LISTS THEM
 function getStation(callback){
  $scope.playMessage = '';
  if($scope.user){
    var currentStationObj = {
    name: $scope.currentStation
    };

    $http.post("/api/getTagByName", currentStationObj)
    .success(function(response) {
      $scope.currentStationData = response.stationData;

      User.authToken = response.token;
      //setLocalStorage("token", response.token);
      //console.log(response.token);
      setLocalStorage("token", response.token);
      //console.log($window.sessionStorage.token );
      if(callback)
      callback();
    });

  } else {
  var currentStationObj = {
    name: $scope.currentStation
  };

    $http.post("/getTagByName", currentStationObj)
    .success(function(response) {
      $scope.currentStationData = response;
      // console.log($scope.currentStationData);
        
      if(callback)
      callback();
    });
  } 




}

  //The station algorithm needs to only run once every station call.
  //It takes the list of songs already rated from the user and compares it to the list
  //Then excises the songs already rated in profile from the playlist.
  //Lastly, it picks the nextSong to play.

   function runStationAlgorithm(){
    console.log("runStationAlgorithm");
    $scope.percentageArray = calculatePercentage();
    $scope.nextSong = pickNextSong($scope.customSongArray, $scope.percentageArray);

  }


   function calculatePercentage(){
    // console.log("calculatePercentage Ran");
    var songArray = $scope.currentStationData.songs;
    var percentageArray = [];
    $scope.customSongArray = [];

    //console.log(songArray);
    for(var i = 0; i < songArray.length;i++){
      //relevantTagData retrieves the right tag from the tag array inside the Song Object
      if(!$scope.ratedSongTableObj[songArray[i]._id]){

        if($scope.currentStation === "all")
        {
           var weightNumber = ((songArray[i]['upvotes'] + 3) - songArray[i]['downvotes']);
         
          if(weightNumber < 1){
            weightNumber = 0;
          }

          percentageArray.push(weightNumber);
          $scope.customSongArray.push(songArray[i]);
        
        } else {
      var relevantTagData = retrieveRelevantTagFromSong(songArray[i],$scope.currentStation);
     
      var weightNumber = ((relevantTagData['upvotes'] + 3) - relevantTagData['downvotes']);
      //console.log(weightNumber);
      if(weightNumber < 1){
        weightNumber = 0;
      }
      percentageArray.push(weightNumber);
    
      $scope.customSongArray.push(songArray[i]);
        }
      
      } 
      

    }
    
    return percentageArray;
  }

  function pickNextSong(songArr, percentageArr)
  {
    //console.log("pickNextSong");
    try{
    var nextSong = chance.weighted(songArr, percentageArr);
    console.log(nextSong);
    return nextSong;
    }
    catch(err){
       //console.log(err);
       $scope.playMessage = "You have rated every song in this station!"
       if($scope.sound)
       $scope.sound.pause();
       return undefined;
    }
  
  }
 


 function stopSong(){

     if($scope.sound) {
       $scope.sound.pause();
     }
  }

  function activateNextSong()
  {
    //console.log("activateNextSong");
    $scope.currentHistoryIndex = 0;
    $scope.activateSong($scope.nextSong);
  }

  function playNextSong()
  {
    //console.log("playNextSong");
    $scope.playSong($scope.nextSong);
  }

  
  function activateAndPlayNextSong()
  {
     //console.log("activateAndPlayNextSong");
     $scope.playMessage = ""
    $scope.activateSong($scope.nextSong);
    $scope.playSong($scope.nextSong);

  }


   function resetPlayer(){
     $scope.currentStation = null;
     $scope.isStationPlaying = false;
     $scope.currentStationData = {};
     $scope.customSongArray = [];
     $scope.percentageArray = [];
     $scope.tagArray = [];
     $scope.currentSong = {name:''};
     $scope.nextSong = ''; 

  }

 $scope.resetStation = function(){

        window.location.reload();
 //      if($scope.sound) {
 //    $scope.sound.stop();  
 //    }

 //   $scope.currentStation = null;
 // $scope.isStationPlaying = false;
 //      $scope.currentStationData = {};
 //     $scope.customSongArray = [];
 //     $scope.percentageArray = [];
 //          $scope.currentSong = {name:''};
 //     $scope.nextSong = ''; 
 }

 $scope.changeHistoryMode = function(type){
  $scope.historyMode = type;
 }

  function uploadURLSwitch(){
          if($scope.userProfile) {
            $scope.uploader.url = "/api/uploadSong";
            } else {
            $scope.uploader.url = "/uploadTempSong";
            }
  }
 function retrieveRelevantTagFromSong(song, targetTagName)
 {
  
  return _.find(song.tags, function(item){ return item.tagname == targetTagName; });
     
 }
$scope.rateCheck = function(){
  if($scope.ratedSongTableObj[$scope.currentSong._id]) {
    $scope.currentSong.rated = true;
    $scope.activateTagAnimation();
    $scope.animationSwitchX = true;
  } else {
    $scope.currentSong.rated  = false;
    $scope.animationSwitchX = false;
  }

    // console.log($scope.currentSong.rated, "rated");
}

 $scope.setHiddenTags = function(){
     // console.log($scope.currentSong);
     $scope.hiddenTags = [];
  for(var i = 0; i < $scope.currentSong.tags.length; i++)
    {
      if($scope.currentSong.tags[i].tagname != $scope.currentStation)
      $scope.hiddenTags.push($scope.currentSong.tags[i]);
    }
  }

$scope.activateAndPlaySong = function(song, index){
    // console.log(index);
    $scope.currentHistoryIndex = index;
    // animationSwitchX = false;
    console.log(song);


    $scope.activateSong(song);
    $scope.playSong();
 };


$scope.songEndsInGenerator = function(){
console.log("songEndsInGenerator");
$scope.nextSong = pickNextSong($scope.customSongArray,$scope.percentageArray);
if($scope.nextSong) {
activateAndPlayNextSong()
} else {

}
  
}
//Activates the UPLOADER to upload everything in the queue
//IF the user is not logged in, show the signup window
$scope.uploadAll = function()
{
  if($scope.user){
    uploader.uploadAll();
  } else {
   $scope.openSignupModal('lg');
  }
}

//Scope functions below
  $scope.activateSong = function(song){
    if($scope.sound)
    {
    $scope.sound.stop();  
    }
    console.log('activateSong() activated.');
    console.log('songPath ' + song.filepath);


  	$scope.sound = ngAudio.load(song.filepath);

    $scope.shareURL =  "http://localhost:8000/#/s/" + $scope.currentSong._id;

    //callback Decorator calls the function after the song ends ($sound.progress === 1)
    $scope.sound.endSong = callbackDecorator($scope.sound.endSong, 
      function(){
        // console.log("triggered");
        $scope.sound.pause();
        $scope.sound.setProgress(0.99999999999999999999999);
        if($scope.isStationPlaying) {
        $scope.songEndsInGenerator();          
        }
      
      });

    //$scope.sound.trigger("test");
    // $scope.currentSong = null;
    if($scope.currentSong != song) {
    $scope.historyArray.unshift(song);
    if (!$scope.stationHistoryHotfix){
           $scope.currentHistoryIndex = $scope.currentHistoryIndex+1;
        };
      if($scope.historyArray.length > 15)
      {
        $scope.historyArray.pop(song);
      }
    }
    $scope.stationHistoryHotfix = false;
    
    $scope.currentSong = song;

    //functions for the generator
    $scope.rateCheck();
    $scope.stackLikeBar();
    $scope.setHiddenTags();

  }
 
  $scope.activateTagAnimation = function(){
     console.log("activateTagAnimation timeout Triggered");
             $timeout(function(){
        console.log("activateTagAnimation executed");
          $scope.animationSwitchX =true;
          
      }, 200);

  }
  $scope.playSong = function(){

    $scope.sound.play();
  };

    //fix this behavior one day without the hotfix
    $scope.stationHistoryHotfix = false;

    $scope.activateStation = function(tag){
      console.log(tag);
    if(tag.tagname) {
      $scope.currentStation = tag.tagname;
    } else {
      $scope.currentStation = tag.name;
    }
      //cb means Callback
      var cb = function(){
        runStationAlgorithm();
       
        if($scope.nextSong)
        {
        activateNextSong();
        playNextSong(); 
        $scope.animationSwitchMainLabel = true;
        } 
      }


      $scope.stationHistoryHotfix = true;
      $scope.animationSwitchMainLabel =false;
      getStation(cb);

         $timeout(function(){
        $scope.isStationPlaying = true;
        /*??????????????????????????????????????????????????????????????????????????????????????????????*/
           if($scope.sound) //REEEEEEEMOOOOOOVE
       $scope.sound.pause();
     /*REMOVE TOP*/
      }, 30);
  }

  $scope.skipSong = function(){
    $scope.songEndsInGenerator();
  };

  $scope.upvoteSong = function(song){
    console.log('upvoteSong() activated.');
    console.log('currentSong')
    console.log($scope.currentSong);

   var indexOfSong =  _.findIndex($scope.customSongArray, function(item) {
      return item._id === $scope.currentSong._id;
    });

    console.log(indexOfSong);

    //sets the song percentage chance of showing up again as 0.
   
    if(indexOfSong > -1) 
    $scope.percentageArray[indexOfSong] = 0; 
    
    $scope.ratedSongTableObj[$scope.currentSong._id] = $scope.currentSong._id;
    $scope.currentSong.upvotes +=1;
    console.log($scope.customSongArray);
    console.log($scope.percentageArray);
    // $scope.recentlyVotedSongs[$scope.currentSong] = 'up';
    $scope.currentSong.rating = "up";
    $scope.rateCheck();
    // historyCycle();
   $http.post("/api/upvoteSong", $scope.currentSong)
   .success(function(response) {
     console.log(response);


    //updatePage();
  });

  }
  $scope.downvoteSong = function(song){
    console.log('downvoteSong() activated.');
    console.log($scope.currentSong);

         var indexOfSong =  _.findIndex($scope.customSongArray, function(item) {
      return item._id === $scope.currentSong._id;
    });
    console.log($scope.customSongArray);

   console.log(indexOfSong);

  if(indexOfSong > -1)
    $scope.percentageArray[indexOfSong] = 0; 
  
    $scope.ratedSongTableObj[$scope.currentSong._id] = $scope.currentSong._id;
    $scope.currentSong.rated = true;
    // $scope.recentlyVotedSongs[$scope.currentSong] = 'down';
    $scope.currentSong.rating = "down";
    // console.log($scope.currentSong.rated, "rated");
    $scope.currentSong.downvotes += 1;
    console.log($scope.customSongArray);
    console.log($scope.percentageArray);
    $scope.rateCheck();
    // historyCycle();
     $http.post("/api/downvoteSong", $scope.currentSong)
   .success(function(response) {
     console.log(response);
  
     //updatePage();
  });

  }
  


    $scope.favoriteSong = function(){
     $http.post("/api/favoriteSong", $scope.currentSong)
   .success(function(response) {
     console.log(response);
     //updatePage();
  });

  };
 


 $scope.clickUpload = function(){
  console.log("triggered");
  //    $timeout(function() {
  //   angular.element($('#hiddenUploadButton')).triggerHandler('click');
  // }, 100);

    angular.element($('#hiddenUploadButton')).click();
  // console.log(angular.element($('#hiddenUploadButton')).text());
 }

//TEST STUFF BELOW
        var uploader = $scope.uploader = new FileUploader({
            url: '/uploadTempSong',
            queueLimit: 1   
        });
     
      uploadURLSwitch();
      $scope.songMessage = "";
      
      uploader.filters.push({
          name: 'formatFilter',
          fn: function(item) {
            if(item.type === "audio/mp3"){
              return true;
            }
            else
            {
              $scope.uploadFeedbackMessage = "Mp3 files only!";
              return false;
            }
          }
      });


      uploader.filters.push({     name: 'sizeFilter',     fn: function(item) {
      if(item.size <= 10000000 && item.size > 0){   return true; } else {
      $scope.uploadFeedbackMessage  = "Maximum of 10 MB per file!";   return
      false; }     } });

//lengthFilter not working
      uploader.filters.push({
          name: 'lengthFilter',
          fn: function(item) {
            if( this.queue.length < this.queueLimit){
              return true;
            }
            else
            {
              $scope.uploadFeedbackMessage  = "Maximum of 1 file!";
              return false;
            }
          }
      });


        //HELPER FUNCTIONS

        //returns date from mongo id
        var dateFromObjectId = function (objectId) {
          return new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
        };

        // CALLBACKS

        uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
            console.info('onWhenAddingFileFailed', item, filter, options);
            $scope.uploadMessage = "An unexpected error has occurred. Please try again later.";
        };
        uploader.onAfterAddingFile = function(fileItem) {
            console.info('onAfterAddingFile', fileItem);
        };
        uploader.onAfterAddingAll = function(addedFileItems) {
            console.info('onAfterAddingAll', addedFileItems);
           uploader.uploadAll();
        };
        uploader.onBeforeUploadItem = function(item) {
            console.info('onBeforeUploadItem', item);
              
            
            console.log(item.headers['tagArray']);
           // console.log(item.headers);  
           var tempTagArray = [];

            for(var tagKey in item.headers['tagArray']){
                tempTagArray.push(item.headers['tagArray'][tagKey].tag);
            }


            item.headers['tagArray'] = JSON.stringify(tempTagArray);
            item.headers['filepath'] = item._file.name;
            item.headers['authorization'] = 'Bearer ' + User.authToken;
            console.log(item.headers);
        };
        uploader.onProgressItem = function(fileItem, progress) {
            console.info('onProgressItem', fileItem, progress);
        };
        uploader.onProgressAll = function(progress) {
            console.info('onProgressAll', progress);
        };
        uploader.onSuccessItem = function(fileItem, response, status, headers) {
            console.info('onSuccessItem', fileItem, response, status, headers);
            // fileItem.tempURL = "http://risingtest.azurewebistes.com/#/s/553572a83c77568410615037" + response._id;
            //resetPlayer();

            // $scope.hasUploaded = true;
            // $scope.currentSong = response["songObj"];
            // $scope.currentStation = "upload";
            // $scope.activateAndPlaySong($scope.currentSong);
            // $scope.uploadMessage = "Success!";
            // $scope.isStationPlaying = false;
            //$timeout(function(){
            // }, 400);
            
            // DEV URL = http://localhost:8000/#/s/
            // REAL URL = http://radiorise.com/#/s/
            
             getUserProfile();
             basket['uploadedSong'] = response["songObj"];
             console.log(response["unhashedClaimCode"]);

            User.storedData['claimCodeMap'][basket['uploadedSong']._id] = response["unhashedClaimCode"];

            $scope.openUploadModal('lg');
            $scope.shareURL =  "http://localhost:8000/#/s/" + $scope.currentSong["_id"];
        };
        uploader.onErrorItem = function(fileItem, response, status, headers) {
            console.info('onErrorItem', fileItem, response, status, headers);
            $scope.uploadMessage = response;
            // console.log( $scope.hasUploaded);
        };
        uploader.onCancelItem = function(fileItem, response, status, headers) {
            console.info('onCancelItem', fileItem, response, status, headers);
        };
        uploader.onCompleteItem = function(fileItem, response, status, headers) {
            console.info('onCompleteItem', fileItem, response, status, headers);
        };
        uploader.onCompleteAll = function() {
            console.info('onCompleteAll');
            updatePage();
        };

      //console.info('uploader', uploader);

     //End of callbacks for uploader

//Modal login functions here
  $scope.openSignupModal = function (size) {

    var modalInstance = $modal.open({
      templateUrl: './views/modal/signup.html',
      controller: 'ModalController',
      size: size,
      resolve: {
        userProfile:function(){
          return $scope.userProfile;
        },
        items: function () {
          return $scope.items;
        },
        uploader: function () {
          return $scope.uploader;
        }
      }
    });

     modalInstance.result.then(function (modalUserData) {
      $scope.userData = modalUserData;
      console.log(modalUserData);
      $scope.login();
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };
    
    $scope.openLoginModal = function (size) {

    var modalInstance = $modal.open({
      templateUrl: './views/modal/login.html',
      controller: 'ModalController',
      size: size,
      resolve: {
        items: function () {
          return $scope.items;
        }
      }
    });

    modalInstance.result.then(function (modalUserData) {
      $scope.userData = modalUserData;
      $scope.login();
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };

  $scope.openUploadModal = function (size) {

    var modalInstance = $modal.open({
      templateUrl: './views/modal/songform.html',
      controller: 'UploadController',
      size: size,
      backdrop : 'static',
      keyboard: false,
      resolve: {
        userProfile:function(){
          return $scope.userProfile;
        },
        uploader: function () {
          return $scope.uploader;
        }
      }
    });

  

     modalInstance.result.then(function (modalData) {
        //weird glitch where the first func does not work but the second function does
    }, function (modalData) {

      console.log(modalData);
      console.log(User);
      $scope.user = User.profile;
      $log.info('Modal dismissed at: ' + new Date());
    });
  };

$scope.openProfileModal = function (size) {

        if($scope.sound)
       $scope.sound.pause();

    var modalInstance = $modal.open({
      templateUrl: './views/modal/profile.html',
      controller: 'ModalController',
      size: size,
      resolve: {
        userProfile:function(){
          return $scope.userProfile;
        },
        uploader: function () {
          return $scope.uploader;
        }
      }
    });

     modalInstance.result.then(function (modalData) {
        //weird glitch where the first func does not work but the second function does
    }, function (modalData) {
      // console.log(modalData);
      $log.info('Modal dismissed at: ' + new Date());
    });
  };

//end of Modal Functions

  $scope.goToProfile = function () {
    
    basket["userProfile"] = $scope.userProfile;
    console.log(basket["userProfile"] );
    console.log(basket);
    stopSong();
    $state.go('profile');
              }
//Authentication TEST
// $http.get("/api/restricted")
//   .success(function (data, status, headers, config) {
//   console.log(data.name); // Should log 'foo'
// })

//userData used for post requests to the server for logging in and signing up

  $scope.userData = {username: '', password: ''};
  $scope.message = '';


  $scope.login = function () {
    $http
      .post('/authenticate', $scope.userData)
      .success(function (data, status, headers, config) {
        $window.sessionStorage.token = data.token;

        setLocalStorage('token' , data.token);
        User.authToken = data.token;

        console.log("Log in!", data);

        getUser();

        var storageString = 'data.' + $scope.userData.username;

        var storageCheck =  getLocalStorage(storageString);

        console.log(storageCheck);
        if(storageCheck === null){
          var newObjectToBeStored = {username: $scope.userData.username,
                                     password: $scope.userData.password
                                     };
          setLocalStorage(storageString, newObjectToBeStored);
        }

      //  var bull = getLocalStorage(storageString);
      
      })
      .error(function (data, status, headers, config) {
        // Erase the token if the user fails to log in
        delete User.authToken;
        delete User.storedData;
        setLocalStorage('token', undefined);
        console.log("Logged out!");
        $scope.user = undefined;
        // Handle login errors here
        $scope.message = 'Error: Invalid user or password';
      });
  };

 $scope.logout = function () {
        delete User.authToken;
        setLocalStorage('token', undefined);
        $scope.user = undefined;
        uploader.clearQueue();
        uploadURLSwitch();
        window.location.reload();
        console.log("Logged out!");
  };

//LOCAL DATA FUNCTIONS FOR PERMANENT LOG IN.
  // var setLocalData = function(key, value) {  
  //   var dataObjectToBeStored = {};
  //   dataObjectToBeStored[key] = value;
  //   chrome.storage.sync.set(dataObjectToBeStored, function (){});
  // };

  // //getLocalData works sort of like a hash table. Use the key to get the value.
  // //The callback will run on the data that is returned.
  // var getLocalData = function(key, callback) {
  //   chrome.storage.sync.get(key, function (data) { 
  //     console.log('storage get promise has executed' + data[key]);
  //     callback(data[key]);
  //   });
  // };
//END OF LOCAL DATA FUNCTIONS
//Animation function


$scope.$on('fade-normal:enter', function(){
      $scope.animationSwitch = true;
      $scope.$emit('currentStationStart');

     $timeout(function(){$scope.animationSwitch1 = true;

     $timeout(function(){
      $scope.animationSwitch2 = true;
        $timeout(function(){
          //doesn't hit anything yet
      $scope.animationSwitch3 = true;
     },300);
    },300);
 

  },10);


    });



//Angular autocomplete code
    $scope.simulateQuery = false;


    $scope.querySearch   = querySearch;
    $scope.selectedItemChange = selectedItemChange;
    // $scope.searchTextChange   = searchTextChange;

    // ******************************
    // Internal methods
    // ******************************

    /**
     * Search for repos... use $timeout to simulate
     * remote dataservice call.
     */
    function querySearch (query) {
      var results = query ? $scope.repos.filter( createFilterFor(query) ) : $scope.repos,
          deferred;
      if ($scope.simulateQuery) {
        deferred = $q.defer();
        $timeout(function () { deferred.resolve( results ); }, Math.random() * 1000, false);
        return deferred.promise;
      } else {
        return results;
      }
    }

    function searchTextChange(text) {
      $log.info('Text changed to ' + text);

    }

    function selectedItemChange(item) {
      $log.info('Item changed to ' + JSON.stringify(item));
      if(item){
      $scope.activateStation(item);      
      }

    }

    /**
     * Build `components` list of key/value pairs
     */
    function loadAll() {
      var repos = $scope.tagArray;
      console.log($scope.tagArray);
      return repos.map( function (repo) {
        repo.value = repo.name.toLowerCase();
        return repo;
      });
    }

    /**
     * Create filter function for a query string
     */
    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);

      return function filterFn(item) {
        return (item.value.indexOf(lowercaseQuery) === 0);
      };
}
//CSS JQUERY SECTION
 // function circleDesign(){
 //  console.log("circleDesign executed");
 //      angular.element('#bubbleDiv').prepend("<div></div>");
 //      angular.element('#bubbleDiv').prepend("<div></div>");
 //      angular.element('#bubbleDiv').prepend("<div></div>");
 //      angular.element('#bubbleDiv').prepend("<div></div>");
 //      angular.element('#bubbleDiv').prepend("<div></div>");
 //    }

 //    $timeout(function(){
 //    circleDesign();
      
 //    },10);

//CSS END SECTION


});
//end of PlayerController


app.factory('User',function(){

    return {};

});

app.factory('basket', function() {
    var BasketService = {};

    return BasketService;
});

app.directive('introsibs', function() {
    return {
        link: function(scope, element, attrs) {
                element.children('a').addClass('introFix');
        }
    }
});

app.directive('lengthenline', function() {
    return {
        link: function(scope, element, attrs) {

  // element.on('load',function(){console.log('asdff');});  
  // $scope.$on('currentStationStart', function(){
  //         if(scope.currentStation){
  //               element.addClass('playHorizontalAnimation');
  //               console.log("Asd")
  //         }
  //         else{
         
  //         }
     
  //      console.log("Asd")
  //     });
 

        }
    }
});


app.directive('enforceMaxTags', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModelController) {
            var maxTags = attrs.maxTags ? parseInt(attrs.maxTags, '10') : null;
            ngModelController.$validators.checkLength = function(value) { 
                if (value && maxTags && value.length > maxTags) {
                    value.splice(value.length - 1, 1);
                }
                return value;
            };
        }
   };
});

app.directive('resizer', ['$window', function ($window) {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {  
            scope.switchMainSearch = $window.innerWidth > 700 ? true : false;

            scope.switchMainHistory = $window.innerWidth > 1000 ? true : false;
           
            scope.mainPlayHeaderSwitch = $window.innerWidth > 1000 ? true : false;

            angular.element($window).on('resize', function () {
          scope.$apply(function(){
            scope.switchMainSearch = $window.innerWidth > 700 ? true : false;
        
            scope.switchMainHistory = $window.innerWidth > 1000 ? true : false;


            scope.mainPlayHeaderSwitch = $window.innerWidth > 1000 ? true : false;
            // console.log( scope.switchMainSearch);
                })
            });
        }
    }
}]);

