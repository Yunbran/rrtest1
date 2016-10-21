app.controller('SignupController', function ($scope, $http,  $uibModalInstance,$timeout,  $window, $log, userProfile, ngAudio) {
  

  $scope.azureStorageName = 'https://practicespace.blob.core.windows.net';
  $scope.userData = {};

  $scope.message = '';
  $scope.tagArray = [];
  $scope.shareURL = '';
  $scope.editMode = false;  
  $scope.editChangesObj = {name: '',
description: ''};
  // Profile Page Variable
  $scope.userProfile = userProfile;
  $scope.currentSong = {};
  
  $timeout(function(){
    $scope.animationSwitch = true;
  },100);

 //useless example function
  $scope.ok = function () {
     $uibModalInstance.close($scope.selected.item);
  };

//MODAL FUNCTION FOR LOGIN MODAL
  $scope.login = function () {
    console.log('login activated');
     $uibModalInstance.close($scope.userData);
  };
      
      
//MODAL FUNCTION FOR SIGNUP MODAL
    $scope.signup = function () {
    
    $scope.message = '';
    console.log('signup() in modal activated.');
    console.log('$scope.userData ' + $scope.userData);

      $http.post("/createUser", $scope.userData)
     .success(function(response) {
       console.log(response);
      
        $uibModalInstance.close($scope.userData);
      }).error(function(response){
        console.log(response.errors);
        
          $scope.message = response;
  
  
      });


  };

//MODAL FUNCTION FOR PROFILE/SONG MODAL
    $scope.addTag = function (song) {
    
    $scope.message = '';

    if(song.tags === undefined)
    {
      song.tags = [];
    }

    if(song.tags.length < 5)
    {
         song.tags.push({tagname: ""});
    }
    else
    {
      $scope.message = "Maximum 5 tags allowed";
    }
 

  };

    $scope.modalUploadAll = function () {

     $uibModalInstance.dismiss({
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

     $uibModalInstance.dismiss('cancel');

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
    $scope.shareURL=  "http://localhost:8000/#/s/" + $scope.currentSong._id;
    //callback Decorator calls the function after the song ends ($sound.progress === 1)
    $scope.sound.endSong = callbackDecorator($scope.sound.endSong, 
      function(){
        // console.log("triggered");
        $scope.sound.pause();
        $scope.sound.setProgress(0.99);
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



});
