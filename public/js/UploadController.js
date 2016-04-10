app.controller('UploadController', function ($scope, $http, $modalInstance, $window, $timeout, $log,User, localStorageService, userProfile, ngAudio, FileUploader, basket) {
  
  $scope.azureStorageName = 'https://practicespace.blob.core.windows.net';
  $scope.userData =  {username: '', password: ''};
  $scope.message = '';
  $scope.tagArray = [];
  $scope.tagsSearchArr = basket['currentTags'];
  $scope.shareURL = '';
  $scope.modalMode = 'form';  
  $scope.editChangesObj = {name: '',
description: ''};
  
 console.log(User.authToken);
 console.log(User.profile);

 // getUser();

 $timeout(function(){
    $scope.animationSwitch = true;
    // $scope.activateAndPlaySong($scope.currentSong);
  },100);

function checkMode(){
  if(User.profile){
    $scope.modalMode = 'upload';
  }
}

checkMode();

$scope.resetAndUploadAgain = function(){
    $scope.modalMode = 'upload';
    $scope.uploadMessage = "";
    $scope.uploader.queue = [];
    stopSong();
    $scope.currentSong = undefined;
 $scope.editChangesObj = {name: '',
    description: ''};
}

function getProfile(){
  // Profile Page Variable
  if(basket["userProfile"]) {

  $scope.userProfile = basket['userProfile'];
  User['profile'] = $scope.userProfile;
  console.log(User);
  } else {
      $http.get("api/getProfile")
        .success(function(response) {
          $scope.userProfile = response;
          $scope.editMode = true;
          $scope.editChangesObj.name = $scope.currentSong.name;
          console.log($scope.userProfile);
          User['profile'] = $scope.userProfile;
          $scope.modalMode = 'upload';
          console.log(User);
        })
        .error(function(){

        });
  }
  
}

 $scope.loadTags = function($query){
 return basket['currentTags'].filter(function(tag) {
        return tag.name.toLowerCase().indexOf($query.toLowerCase()) != -1;
      });

}

function getUser(){
    $http({url: '/api/getUser', method: 'GET'})
    .success(function (data, status, headers, config) {
      $scope.user = data;
     // console.log($scope.user);
      getProfile();
     // $scope.currentStation = $scope.user.station;

    })
    .error(function (data, status, headers, config) {
      getProfile();
    }); 

}
  $scope.currentSong = {};
 


//MODAL FUNCTION FOR PROFILE/SONG MODAL
  //   $scope.addTag = function (song) {
    
  //   $scope.message = '';

  //   if(song.tags === undefined)
  //   {
  //     song.tags = [];
  //   }

  //   if(song.tags.length < 5)
  //   {
  //        song.tags.push({tagname: ""});
  //   }
  //   else
  //   {
  //     $scope.message = "Maximum 5 tags allowed";
  //   }
 

  // };

    // $scope.modalUploadAll = function () {

    // $modalInstance.dismiss({
    //   uploader: $scope.uploader,
    //    uploadBool: true
    //  });
    // }

//MODAL FUNCTION FOR EVERY MODAL
  $scope.cancel = function (cancelType) {
   console.log(userProfile);
  
    if($scope.sound){
      $scope.sound.stop();  
    }

    $modalInstance.dismiss(cancelType);

  };

$scope.activateOrPauseSong = function(song){
  if($scope.currentSong == song)
  {
     if(!$scope.sound.paused){
      $scope.sound.stop();  
      $scope.setEditModeFalse();
     }
     else{
      $scope.activateAndPlaySong(song);
    }
  
  } else {
      $scope.activateAndPlaySong(song);    
  }

}
$scope.activateAndPlaySong = function(song){
    $scope.currentSong = song;
    $scope.activateSong(song);
    $scope.playSong();

 };

  $scope.activateSong = function(song){
    if($scope.sound)
    {
    $scope.sound.stop();  
    }
    console.log('activateSong() activated.');
    console.log('songPath ' + song.filepath);

    var azureRetrievalPath = $scope.azureStorageName + "/" + song.creator + "/"+ song.filepath;
    $scope.sound = ngAudio.load(azureRetrievalPath);
    
    console.log($scope.currentSong);
    $scope.shareURL =  "http://localhost:8000/#/s/" + $scope.currentSong._id;
    //callback Decorator calls the function after the song ends ($sound.progress === 1)
    $scope.sound.endSong = callbackDecorator($scope.sound.endSong, 
      function(){
        // console.log("triggered");
        $scope.sound.pause();
        $scope.sound.setProgress(0.99999999999999999999999);
        // if($scope.isStationPlaying) {
        // $scope.songEndsInGenerator();          
        // }
      });

    // $scope.currentSong = null;

    $scope.currentSong = song;

  }


  $scope.playSong = function(){

    $scope.sound.play();
  };


$scope.setEditModeTrue = function(song){
 $scope.editMode =  true; 
 if(song) {
   $scope.editChangesObj = {name: song.name,
    description: song.description};

 }
};
$scope.setEditModeFalse = function(){
 $scope.editMode =  false; 
 $scope.editChangesObj = {name: '',
description: ''};
};

$scope.sendEdits = function (song) {
  console.log("sendEdits");
   $scope.editChangesObj = song;
    console.log($scope.editChangesObj);
   $http.post("/api/editSong", $scope.editChangesObj)
        .success(function(response) {
          song.description = $scope.editChangesObj.description;
          song.name = $scope.editChangesObj.name;
          console.log(response);
          $scope.cancel({success:true});
        }).error(function(response){
        console.log(response.errors);
        
          $scope.editSectionMessage = response;
      });

  };
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
      // claimSong($scope.currentSong);
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

function claimSong(song){


 console.log(User.storedData['claimCodeMap']);

   $scope.claimSongObj = {
    songToBeClaimed: song,
    unhashedClaimCode: User.storedData['claimCodeMap'][song._id]
    }

    console.log($scope.claimSongObj);

   $http.post("/api/claimSong", $scope.claimSongObj)
        .success(function(response) {
          console.log(response);
        });

}

$scope.signup = function () {
    
    $scope.message = '';
    console.log('signup() in modal activated.');
    console.log('$scope.userData ' + $scope.userData);

      $http.post("/createUser", $scope.userData)
     .success(function(response) {
       console.log(response);

       $scope.login();
      }).error(function(response){
        console.log(response.errors);
        
          $scope.message = response;
  
  
      });

   //  if($scope.userData.password === $scope.userData.passwordConfirm)
   //  {    


   //  } else {
   //   $scope.message = 'Passwords do not match!';
   // }

  };

$scope.clickCheck = function(){
  // $scope.uploader.queue.push({progress: 10})
  // console.log($scope.uploader.queue);
}

$scope.clickHiddenUpload = function(){ 
  // console.log("ASD");
   $timeout(function() {
    angular.element($('#hiddenUploadButton')).click();
  }, 10);
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

 function stopSong(){
     if($scope.sound) {
       $scope.sound.pause();
     }
  }

function setLocalStorage(key, val) {
   return localStorageService.set(key, val);
  }

function getLocalStorage(key) {
   return localStorageService.get(key);
  }

 // $scope.activateAndPlaySong(basket['uploadedSong']);
 // $scope.sound.pause();


//TEST STUFF BELOW
        var uploader = $scope.uploader = new FileUploader({
            url: '/api/uploadSong',
            queueLimit: 1   
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
              $scope.uploadFeedbackMessage = "Mp3 files only!";
              return false;
            }
          }
      });

      var sizeLimitInteger = 10000000;
      uploader.filters.push({     name: 'sizeFilter',     fn: function(item) {
      if(item.size <= sizeLimitInteger && item.size > 0){   return true; } else {
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
            if(item.size > sizeLimitInteger){
              $scope.uploadMessage = "Maximum of 10 MB per file!";
            }
            else{
              $scope.uploadMessage = "An Unexpected Error has occured";
            }
            $scope.uploader.queue = [];
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
            
             // getUserProfile();
             basket['uploadedSong'] = response["songObj"];
             // console.log(response["unhashedClaimCode"]);

            //Code Snippet below exists for claiming an anonymous song.
            // User.storedData['claimCodeMap'][basket['uploadedSong']._id] = response["unhashedClaimCode"];
            $scope.modalMode = 'edit';
            // $scope.openUploadModal('lg');
           $scope.activateAndPlaySong(response["songObj"]);
           $scope.shareURL =  "http://localhost:8000/#/s/" + $scope.currentSong["_id"];
           $scope.editChangesObj.name = $scope.currentSong["name"];
           console.log($scope.currentSong["tags"]);
           delete $scope.currentSong["tags"][0];
           $scope.currentSong["tags"][0] = {name:'all'};
        };
        uploader.onErrorItem = function(fileItem, response, status, headers) {
            console.info('onErrorItem', fileItem, response, status, headers);
            $scope.uploadMessage = response + " Please try again.";
            $scope.uploader.queue = [];
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
            // updatePage();
        };

      //console.info('uploader', uploader);






});

