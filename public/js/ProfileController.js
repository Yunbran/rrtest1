app.controller('ProfileController', function ($scope, $state, $http, $window, $log, $timeout, basket, User, localStorageService, ngAudio) {
  

  $scope.userData = {};
  $scope.message = '';
  $scope.tagArray = [];
  $scope.shareURL = '';
  $scope.editMode = false;  
  $scope.moreMode = false; 
  $scope.editChangesObj = {name: '',
description: ''};

 User.authToken = getLocalStorage("token");
 console.log(User.authToken );
getUser();

$scope.animationSwitch = true;
$scope.isSongSelecting = false;
function getProfile(){
  // Profile Page Variable
  if(basket["userProfile"]) {

  $scope.userProfile = basket['userProfile'];

  } else {
      $http.get("api/getProfile")
        .success(function(response) {
          $scope.userProfile = response;
console.log($scope.userProfile);
        })
        .error(function(){

        });
  }
  
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
 


    $scope.stacked = [];
    $scope.stackLikeBar = function() {
    
    $scope.stacked = [];
    var total = $scope.currentSong.upvotes + $scope.currentSong.downvotes;
     console.log($scope.currentSong);
     console.log($scope.currentSong['upvotes']);
     console.log(($scope.currentSong['upvotes']/total) * 100);
     console.log(($scope.currentSong['downvotes'].downvotes/total) * 100);


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

  

         console.log($scope.stacked);
  }
}

    $scope.modalUploadAll = function () {

    $modalInstance.dismiss({
      uploader: $scope.uploader,
       uploadBool: true
     });
    }

//MODAL FUNCTION FOR EVERY MODAL
  $scope.cancel = function () {
   console.log(userProfile);
  
    if($scope.sound){
      $scope.sound.stop();  
    }

    $modalInstance.dismiss('cancel');

  };



$scope.activateOrPauseSong = function(song){
 

  if($scope.sound)
  {
    if($scope.currentSong == song)
    {
      $scope.sound.stop();  
      $scope.setEditModeFalse();
      $scope.setMoreModeFalse();
      $scope.currentSong = undefined;    
    }
    else{
      $scope.activateAndPlaySong(song);
      $timeout(function(){$scope.stackLikeBar();},100);
      $scope.setEditModeFalse();
      $scope.setMoreModeFalse();
    }

  
  } else {
      $scope.activateAndPlaySong(song); 
      $timeout(function(){$scope.stackLikeBar();},100); 
      $scope.setEditModeFalse();
      $scope.setMoreModeFalse();
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


    $scope.sound = ngAudio.load(song.filepath);
    console.log($scope.currentSong);
    $scope.shareURL=  "http://localhost:8000/#/s/" + $scope.currentSong._id;
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

$scope.setMoreMode = function(){
 $scope.moreMode =  !$scope.moreMode; 
};

$scope.setMoreModeFalse = function(){
 $scope.moreMode =  false; 
};

$scope.sendEdits = function (song) {
   $scope.editChangesObj = song;
    console.log($scope.editChangesObj);
   $http.post("/api/editSong", $scope.editChangesObj)
        .success(function(response) {
          song.description = $scope.editChangesObj.description;
          song.name = $scope.editChangesObj.name;
          $scope.setEditModeFalse();
          console.log(response);
        });

  };


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

  $scope.goToHome = function () {
    console.log("triggered");
    basket["userProfile"] = $scope.userProfile;
    console.log(basket["userProfile"] );
    console.log(basket);
    stopSong();
    $state.go('home.list');
              }

});
