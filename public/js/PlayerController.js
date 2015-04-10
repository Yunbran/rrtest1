app.controller('PlayerController', function($scope, $http, $modal, $log, $window, ngAudio, FileUploader, localStorageService, User) {

//START OF INSTANTIATION--------------------------------------------------


 //instantiates the variables inside PlayerController 

 //displaySongs is populated with getStation()
 $scope.displaySongs = ['should','not', 'work', 'yet'];
  //displayTags is populated with getTags();
 $scope.displayTags = ['should','not', 'work', 'yet'];

 $scope.currentStation = "all";
 $scope.currentStationData = {};
 $scope.customSongArray = [];
 $scope.percentageArray = [];
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
            tag: '' }
          };
 console.log( getLocalStorage("token"));
 User.authToken = getLocalStorage("token");
  

//if the window has an authToken go ahead and get the Profile  
  if(User.authToken && User.authToken !== 'undefined')
  {
    getUser();
    getProfile();
  } 
  else {
      updatePage();
  }
  

//END OF INSTANTIATION-------------------------------------------------

 //Test function. DEV Function only
 $scope.check = function () {

 // console.log(getLocalStorage("token"));
 // console.log(User.authToken);
    // console.log($scope.percentageArray);
    console.log($scope.currentSong); 

       // $http.get("/https://practicespace.blob.core.windows.net/mycontainer/testpark.mp3")
       //  .success(function(response) {
       //    console.log(response);
       //  });

   //$scope.sound = ngAudio.load("./media/sound/asda/test.mp3");
   //$scope.sound.play();
 }


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

function getProfile(){
       
       $http.get("api/getProfile")
        .success(function(response) {
          $scope.userProfile = response;
          //console.log($scope.userProfile);
          //populates hash Table with the array;
          for(var i = 0;i < $scope.userProfile.upvoted.length; i++){
            $scope.ratedSongTableObj[$scope.userProfile.upvoted[i]] = $scope.userProfile.upvoted[i];
          }  

          for(var i = 0;i < $scope.userProfile.downvoted.length; i++){
            $scope.ratedSongTableObj[$scope.userProfile.downvoted[i]] = $scope.userProfile.downvoted[i];
          } 
      updatePage();
        });
}

function getUser(){
    $http({url: '/api/getUser', method: 'GET'})
    .success(function (data, status, headers, config) {
      $scope.user = data;
    //  console.log($scope.user);

      $scope.currentStation = $scope.user.station;

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
 
  
//GETS TAGS FROM SERVER AND LISTS THEM
 function getTags(){
  $http.get("/getTags")
  .success(function(response) {
    $scope.displayTags = response;
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
      console.log($scope.currentStationData);
      
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

  function activateNextSong()
  {
    //console.log("activateNextSong");
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

 function retrieveRelevantTagFromSong(song, targetTagName)
 {
  
  return _.find(song.tags, function(item){ return item.tagname == targetTagName; });
     
 }
$scope.rateCheck = function(){
  if($scope.ratedSongTableObj[$scope.currentSong._id]) {
  $scope.currentSong.rated = true;
  } else {
  $scope.currentSong.rated  = false;
  }
}

$scope.activateAndPlaySong = function(song){
    //console.log("activateAndPlaySong");
    
    $scope.activateSong(song);

    $scope.playSong();

    $scope.rateCheck();

 };

$scope.songEndsInGenerator = function(){
console.log("songEndsInGenerator");
$scope.nextSong = pickNextSong($scope.customSongArray,$scope.percentageArray);
if($scope.nextSong)
{
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
  }
  else
  {
   $scope.openSignupModal();
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

    //callback Decorator calls the function after the song ends ($sound.progress === 1)
    $scope.sound.endSong = callbackDecorator($scope.sound.endSong, 
      function(){
        // console.log("triggered");
        $scope.sound.pause();
        $scope.sound.setProgress(0.99);
        $scope.songEndsInGenerator();
      });

    //$scope.sound.trigger("test");
    $scope.currentSong = song;

  }

  $scope.playSong = function(){

    $scope.sound.play();
  };

    $scope.activateStation = function(tag){
      $scope.currentStation = tag.name;

      var cb = function(){
        runStationAlgorithm();
       
        if($scope.nextSong)
        {
        activateNextSong();
        playNextSong(); 
        } 

      }

      getStation(cb);
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
    $scope.currentSong.rated = true;
    $scope.currentSong.upvotes +=1;
    console.log($scope.customSongArray);
    console.log($scope.percentageArray);

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
    $scope.currentSong.downvotes += 1;
    console.log($scope.customSongArray);

    console.log($scope.percentageArray);
     $http.post("/api/downvoteSong", $scope.currentSong)
   .success(function(response) {
     console.log(response);
  
     //updatePage();
  });

  }
//TEST STUFF BELOW
        var uploader = $scope.uploader = new FileUploader({
            url: '/api/uploadSong',
            queueLimit: 10   
        });
    
      $scope.songMessage = "";
      
      uploader.filters.push({
          name: 'formatFilter',
          fn: function(item) {
            if(item.type === "audio/mp3"){
              return true;
            }
            else
            {
              $scope.songMessage = "Mp3 files only!";
              return false;
            }
          }
      });

      uploader.filters.push({
          name: 'sizeFilter',
          fn: function(item) {
            if(item.size <= 10000000 && item.size > 0){
              return true;
            }
            else
            {
              $scope.songMessage = "Maximum of 10 MB per file!" + item.size;
              return false;
            }
          }
      });

//lengthFilter not working
      uploader.filters.push({
          name: 'lengthFilter',
          fn: function(item) {
            if( this.queue.length < this.queueLimit){
              return true;
            }
            else
            {
              $scope.songMessage = "Maximum of 10 files!";
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
        };
        uploader.onAfterAddingFile = function(fileItem) {
            console.info('onAfterAddingFile', fileItem);
        };
        uploader.onAfterAddingAll = function(addedFileItems) {
            console.info('onAfterAddingAll', addedFileItems);
            $scope.openSongModal();
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
            fileItem.tempURL = "http://localhost:8000/" + response._id;
           
        };
        uploader.onErrorItem = function(fileItem, response, status, headers) {
            console.info('onErrorItem', fileItem, response, status, headers);
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

  $scope.openSongModal = function (size) {

    var modalInstance = $modal.open({
      templateUrl: './views/modal/songform.html',
      controller: 'ModalController',
      size: size,
      resolve: {
        uploader: function () {
          return $scope.uploader;
        }
      }
    });

  

     modalInstance.result.then(function (modalData) {
        //weird glitch where the first func does not work but the second function does
    }, function (modalData) {
  
      if(modalData.uploadBool === true)
      {
        $scope.uploadAll();
      }

      // console.log(modalData);
      $log.info('Modal dismissed at: ' + new Date());
    });
  };

$scope.openProfileModal = function (size) {

 
    var modalInstance = $modal.open({
      templateUrl: './views/modal/profile.html',
      controller: 'ModalController',
      size: size,
      resolve: {
        profile:function(){
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

        console.log("Logged in!", data);
        getProfile();
        getUser();
      })
      .error(function (data, status, headers, config) {
        // Erase the token if the user fails to log in
        delete User.authToken;
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




});
//end of PlayerController


app.factory('User',function(){

    return {};

});