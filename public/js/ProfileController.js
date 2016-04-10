app.controller('ProfileController', function ($scope, $modal, $stateParams, $interval,$state, $http, $window, $log, $timeout, basket, User, localStorageService, ngAudio) {
  
  $scope.azureStorageName = 'https://practicespace.blob.core.windows.net';

  $scope.userData = {};
  $scope.message = '';
  $scope.tagArray = [];
  $scope.shareURL = '';
  $scope.editMode = false;  
  $scope.moreMode = false; 
  $scope.editChangesObj = {name: '',
    description: ''};
 $scope.profileLetter = '';
 $scope.repos = []; 
$scope.animationSwitch = true;
$scope.isSongSelecting = false;
 $scope.tagsForEditing = [];
$scope.displayStations = [];

 $scope.displayProfile = {};
 User.authToken = getLocalStorage("token");
 console.log(User.authToken );

 initProfilePage();

 function initProfilePage(){
  
   if(User.authToken && User.authToken !== 'undefined'){
    getUser();
    }

    // console.log($stateParams);
    console.log($stateParams["profileName"]);
    
    var profilePageCallBack = function(data){
      $scope.displayProfile = data;
    getStationsByUser($scope.displayProfile.username);
    }

      getTags(getAllUsers);
    getSpecificUser({name: $stateParams["profileName"]}, profilePageCallBack);
    // if(basket["specificProfile"]){
    //   $scope.displayProfile = basket["specificProfile"];
    // } else {
    //   $scope.displayProfile = basket["userProfile"];
    // }
 }

     $timeout(function(){
      var randomStripeElement = angular.element( document.querySelector( '.md-scroll-mask' ) );
      randomStripeElement.remove();
       },50);

 $scope.check = function () {

    console.log($scope.currentSong); 
    // console.log( $scope.firstVisit );
    // console.log($scope.animationSwitch);



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

function getProfile(){
  // Profile Page Variable

      $http.get("api/getProfile")
        .success(function(response) {
          $scope.userProfile = response;
          console.log($scope.userProfile);

          $scope.profileLetter = $scope.userProfile.username.substring(0,1).toUpperCase();
  
        })
        .error(function(){

        });
  

}
function getSpecificUser(specificUserString, callback){

    $http.post("/getUserByName", specificUserString)
    .success(function (data, status, headers, config) {
      
      if(callback) {
      callback(data);  
      }
    
    })
    .error(function (data, status, headers, config) {
      console.log("ERROR IN USER RETRIEVAL");
    }); 

}
function getStationsByUser(nameToBeSearched){
    $http.post("/getTagsCreatedByUser", {name: nameToBeSearched})
          .success(function(response) {
            // console.log(response);
            $scope.displayStations = response;
          });

}

function getUserProfile(){
       
       $http.get("api/getProfile")
        .success(function(response) {
          $scope.userProfile = response;
          User.profile = $scope.userProfile;
          console.log($scope.userProfile)
          $scope.profileLetter = $scope.userProfile.username.substring(0,1).toUpperCase();
        })
        .error(function(){

        });
}

function getUser(){
    $http({url: '/api/getUser', method: 'GET'})
    .success(function (data, status, headers, config) {
      $scope.user = data;
     // console.log($scope.user);
      getUserProfile();
     // $scope.currentStation = $scope.user.station;

    })
    .error(function (data, status, headers, config) {
      console.log("unable to get user");
    }); 

}
  $scope.currentSong = {};
 

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

    // $scope.stacked.push({
    //       value: 100,
    //       type: 'info'
    //     });
      $scope.currentSongUpvotePerc = 100;
    }
    else {
    
    // if(!isNaN(currentSongUpvoteCalc) && currentSongUpvoteCalc !=0)
    // {

    //     $scope.stacked.push({
    //       value: currentSongUpvoteCalc,
    //       type: 'success'
    //     });
      
    // }


    // if(!isNaN(currentSongDownvoteCalc) && currentSongUpvoteCalc !=0)
    // {
    //     $scope.stacked.push({
    //       value: currentSongDownvoteCalc,
    //       type: 'danger'
    //     });

    // }
  
      $scope.currentSongUpvotePerc = Math.round(currentSongUpvoteCalc);
    

     // console.log(currentSongUpvoteCalc);


  }
}


    $scope.resetLikeBar = function() {
  
      $scope.currentSongUpvotePerc = 0;

  
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
      $scope.resetLikeBar();
      $timeout(function(){$scope.stackLikeBar();},100);
      $scope.setEditModeFalse();
      $scope.setMoreModeFalse();
    }

  
  } else {
      $scope.activateAndPlaySong(song); 
            $scope.resetLikeBar();
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

    var azureRetrievalPath = $scope.azureStorageName + "/" + song.creator + "/"+ song.filepath;
    $scope.sound = ngAudio.load(azureRetrievalPath);

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
  console.log($scope.currentSong.tags);

 
//remove duplicates and make object types match
    $scope.tagsForEditing = _.map($scope.currentSong.tags, function(obj){
      return {name: obj.tagname};
    });

 var usedNameHashMap  = [];
 var finalSet = [];

 for(var i =0; i < $scope.tagsForEditing.length; i++){
  console.log($scope.tagsForEditing[i]);
  if(!usedNameHashMap[$scope.tagsForEditing[i].name]){
    usedNameHashMap[$scope.tagsForEditing[i].name] = $scope.tagsForEditing[i].name;
    finalSet.push($scope.tagsForEditing[i]);
  }

 }

$scope.tagsForEditing = finalSet;


 if(song) {


   $scope.editChangesObj = {name: song.name,
    description: song.description,
    tags: $scope.tagsForEditing};
 }

};

 function getTags(callback){

  $http.get("/getTags")
  .success(function(response) {
   $scope.tagArray = response;
       if(callback){
      callback();
     }
  });

}

 $scope.loadTags = function($query){

  // console.log($query);
  // console.log($scope.tagArray);
  var returnArray = $scope.tagArray.filter(function(tag) {
        return tag.name.toLowerCase().indexOf($query.toLowerCase()) != -1;
      });

  returnArray = _.uniq(returnArray);
  console.log(returnArray);
 return returnArray;

}
//GETS USERS FROM DATABASE AND STORES THEM IN LOCAL VAR $scope.allUsersArray
 function getAllUsers(callback){

  $http.get("/getUsers")
  .success(function(response) {
    $scope.allUsersArray = response;
    // console.log(response);
//move these into a call back later
      $scope.repos = loadAll(); 
     if(callback){
      callback();
     }

  });

}


$scope.setEditModeFalse = function(){
 $scope.editMode =  false; 
 $scope.tagsForEditing = [];
 $scope.editChangesObj = {name: '',
description: '',
tags: []};
};

$scope.setMoreMode = function(){
 $scope.moreMode =  !$scope.moreMode; 
};

$scope.setMoreModeFalse = function(){
 $scope.moreMode =  false; 
};

$scope.sendEdits = function (song) {

    console.log($scope.editChangesObj);
    song.tags = $scope.editChangesObj.tags;
    song.name = $scope.editChangesObj.name;
    song.description = $scope.editChangesObj.description;
   $http.post("/api/editSong",song)
        .success(function(response) {
          song.description = response.description;
          song.name = response.name;
          song.tags = response.tags;
          $scope.setEditModeFalse();
          console.log(response);
        });

  };

  $scope.openSignupModal = function (size) {

    var modalInstance = $modal.open({
      templateUrl: './views/modal/signup.html',
      controller: 'SignupController',
      size: size,
      resolve: {
        userProfile:function(){
          return $scope.userProfile;
        },
        items: function () {
          return $scope.items;
        }
      }
    });

     modalInstance.result.then(function (modalUserData) {
      // console.log(modalUserData);
      if(modalUserData){
      $scope.userData = modalUserData;
      $scope.login();  
      }
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
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

 function stopSong(callback){
     if($scope.sound) {
       $scope.sound.pause();
     }

     if(callback){
      callback();
     }
  }

function setLocalStorage(key, val) {
   return localStorageService.set(key, val);
  }

function getLocalStorage(key) {
   return localStorageService.get(key);
  }

  $scope.goToHome = function (specificGenre) {
    console.log(specificGenre)
  if(specificGenre){
    // basket["userProfile"] = $scope.userProfile;
    // basket["specificProfile"] = specificProfile;
    // console.log(basket);
    var cb = function(){
          $timeout(function() {
           $state.go('sharedStation',  {stationName: specificGenre});
          }, 51);
            
   }
    stopSong(cb);
    // console.log(typeof specificProfile);
        
    } else {
          var cb = function(){
              $timeout(function() {
                $state.go('home',{stationName: 'all'});
              }, 51);
            
          }

    stopSong(cb);

    }    
              }
 
 $scope.goToProfile = function (specificProfile) {
    
    // basket["specificProfile"] = undefined;

    if(specificProfile){

    // basket["userProfile"] = $scope.userProfile;
    // basket["specificProfile"] = specificProfile;
    // console.log(basket);
    stopSong();
    // console.log(typeof specificProfile);
    basket["searchResults"] = $scope.repos;
        $timeout(function() {
    $state.go('sharedProfile',  {profileName: specificProfile});
        }, 15);
        
    } else {

    stopSong();
        // console.log(User.profile.username);
        $timeout(function() {
              $state.go('sharedProfile',{profileName: User.profile.username});
        }, 15);

    }   

   }


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
        delete User.profile;
        setLocalStorage('token', undefined);
        console.log("Logged out!");
        $scope.user = undefined;
        // Handle login errors here
        $scope.message = 'Error: Invalid user or password';
      });
  };

 $scope.logout = function () {
        delete User.authToken;
        delete User.profile;
        setLocalStorage('token', undefined);
        $scope.user = undefined;
        $scope.userProfile = undefined;
        window.location.reload();
        console.log("Logged out!");
  };


 function circleDesign(){
  // console.log("circleDesign executed");
  var colorChoices = ['bubbleDarkBlue','bubbleLightBlue', 'bubbleTeal'];
  // var sizeChoices = ['bubbleBig','bubbleMiddle','bubbleSmall'];
  var colorChoiceInt = chance.integer({min: 0, max: colorChoices.length - 1});
  // var sizeChoiceInt = chance.integer({min: 0, max: sizeChoices.length - 1});
  var tempClassName = chance.string({length: 10});
  var xLocation = chance.integer({min: -3, max: 102});
  var transitionTimer = chance.integer({min: 5, max: 40});

  var tempDiv = document.createElement("div");
  tempDiv.className = 'profileBubble ' + colorChoices[colorChoiceInt] + ' ' + tempClassName;

  angular.element(document.getElementsByClassName('bubbleProfileWrapperDiv')).prepend(tempDiv);
     
  angular.element(document.getElementsByClassName(tempClassName)).css('margin-left',xLocation + '%');

  angular.element(document.getElementsByClassName(tempClassName)).css('transition',  'all '+transitionTimer + 's');

   $timeout(function(){
    attachRiseClass(tempClassName, xLocation);
      
    },10);

  $timeout(function(){
    // deleteBubble(tempClassName);
      placeBubbleBack(tempClassName); 
    },((transitionTimer * 1000)));

    }
  
  function attachRiseClass(tempClass, xLocation){
    // console.log(angular.element(document.getElementsByClassName(tempClass)));
     var size  = chance.integer({min: 50, max: 200});

      angular.element(document.getElementsByClassName(tempClass)).css('height',size);
      angular.element(document.getElementsByClassName(tempClass)).css('min-height',size);
      angular.element(document.getElementsByClassName(tempClass)).css('width',size);
      angular.element(document.getElementsByClassName(tempClass)).css('min-width',size);

      angular.element(document.getElementsByClassName(tempClass)).toggleClass('bubbleTopAnimation');

  }
  

  function deleteBubble(tempClass){
          angular.element(document.getElementsByClassName(tempClass)).remove();
  }
 function placeBubbleBack(tempClass){
     angular.element(document.getElementsByClassName(tempClass)).css('transition',  'none');
      angular.element(document.getElementsByClassName(tempClass)).css('margin-top','268px');
     $timeout(function(){
      goBubbleUp(tempClass);
      
    },1000);
 }
  function goBubbleUp(tempClass){
      var transitionTimer = chance.integer({min: 5, max: 40});
  angular.element(document.getElementsByClassName(tempClass)).css('transition',  'all '+transitionTimer + 's');
 angular.element(document.getElementsByClassName(tempClass)).css('margin-top','-13%');
 
  $timeout(function(){
    // deleteBubble(tempClassName);
      placeBubbleBack(tempClass);
    },(transitionTimer * 1000));
 }

  // function recursiveBubbleCreation(){

  //   var timerForNextBubble = chance.integer({min: 500, max: 10000});

  //   circleDesign();
   
  //   $timeout(function(){
  //       recursiveBubbleCreation();
  //   },timerForNextBubble);
  
  // }

    $timeout(function(){
      for(var i = 0; i < 15; i++){
        circleDesign();
      }
    },10);

  $timeout(function(){
      for(var i = 0; i < 5; i++){
        circleDesign();
      }
    },10000);


//Angular autocomplete code. Watch out for the scalability of having userRepo along with Tag Repo
    $scope.simulateQuery = false;


    $scope.querySearch   = querySearch;
    $scope.selectedItemChange = selectedItemChange;
    $scope.searchTextChange   = searchTextChange;

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
      // $log.info('Text changed to ' + text);
      // console.log($scope.repos);
    }

    function selectedItemChange(item) {
      $log.info('Item changed to ' + JSON.stringify(item));
      if(item) {

      if(item.searchType === 'station'){
        $scope.goToHome(item.name);      
      } else if(item.searchType === 'user'){
        
        $scope.goToProfile(item.name);
      } else if(item === undefined){
       $scope.repos = loadAll(); 
      }
        
   } 
        

    }


    /**
     * Build `components` list of key/value pairs
     */
    function loadAll() {

         var repos = $scope.tagArray.concat($scope.allUsersArray);



      return repos.map( function (repo) {
        if(repo.group){
          repo.value = repo.name.toLowerCase();
          repo.searchType = 'station';
        } else if(repo.password){
          repo.name = repo.username.toLowerCase();
          repo.value = repo.name;
          repo.searchType = 'user';
        }
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

});
