app.controller('PlayerController', function($scope, $http, $modal, $log, $window,$location, $timeout, $stateParams, $state, $window, ngAudio, basket, localStorageService, stripe, User) {

//START OF INSTANTIATION--------------------------------------------------
  $scope.azureStorageName = 'https://practicespace.blob.core.windows.net';

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
 $scope.allUsersArray = [];

 $scope.hasUploaded = false;
 $scope.subMessageArray =[{msg: "where the best music always rises to the top"},{msg: "you decide the breakout songs of tomorrow"},{msg: "your music could be the hit of the century!"},{msg: "Upload below!"},{msg: "Choose a Station Tag!"}]
 
 $scope.profileLetter = '';
 $scope.animationSwitchX = false; 
 $scope.currentHistoryIndex = 0;
 $scope.historyMode = 'history';
 $scope.stationMode = 'main';
 $scope.imageSourceArray = [];
 $scope.imageSourceArray.push('./media/pic/1_2.png');
 $scope.imageSourceArray.push('./media/pic/2_2.png');
 $scope.imageSourceArray.push('./media/pic/3animation.png');
 $scope.upvoteAnimationFrame = false;
 $scope.playerUpvoteInfoImageDisplay = true;

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
 $scope.favoritedSongTableObj = {};

//formData used for post requests to the server
           $scope.formData = {
           songTag : '',
           currentSong : '',
           search: {
            tag: '', 
            name: ''
          }
          
          };


 if($stateParams['stationName']) {
 $scope.firstVisit = false;
  } else {
 $scope.firstVisit = true;
 }


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

//logic Train STARTS HERE put some code here into init
 
//if the window has an authToken go ahead and get the Profile  
 $timeout(function() {

  if(User.authToken && User.authToken !== 'undefined') {

    getUser();

    // var storedCredentials = getLocalStorage('loginCredentials');
    // console.log(storedCredentials)
    // if(storedCredentials){
      // $scope.login(storedCredentials);
    // }

  } 
  else {
    initStation(); 
  }

 }, 10);

   
// go back to userProfile later to put in initStation
   function initStation(){
    

  //for SearchBar
    var afterUpdateCallBack = function()
    { 
       var afterGettingUsersArrayCallBack = function(){
        $scope.repos = loadAll(); 
      
       }
     
        //THIS EXISTS FOR SHARED STATIONs
        if($stateParams["stationName"]){
          console.log($stateParams["stationName"]);
           $scope.activateStation({name: $stateParams["stationName"]}, true);

       }else{

      $scope.activateStation({name:'all'});
       }
       

      getAllUsers(afterGettingUsersArrayCallBack);
    }

    getTags(afterUpdateCallBack);   

   }

   function initialize() {


   }

  
//THIS SNIPPET EXISTS FOR SHARING SONGS 
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

    console.log($scope.stationMode); 
    // console.log( $scope.firstVisit );


        // $http.post("/stripeEnd", {adminCode: "snake"})
        //   .success(function(response) {
        //     console.log(response);
        //   });

   $http.get("/deleteDatabase")
        .success(function(response) {
          console.log(response);
     $http.post("/createAdmins", {adminCode: "snake"})
          .success(function(response) {
            console.log(response);
          });
        });

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
function updatePage(callback){
      // getStation();
      getTags();
  if(callback){
    callback();
  }
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

          console.log($scope.userProfile);
          //populates hash Table with the array;
          for(var i = 0;i < $scope.userProfile.upvoted.length; i++){
            $scope.ratedSongTableObj[$scope.userProfile.upvoted[i]._id] = $scope.userProfile.upvoted[i]._id;
            // console.log($scope.userProfile.upvoted[i]._id);
          }  

          for(var i = 0;i < $scope.userProfile.downvoted.length; i++){
            $scope.ratedSongTableObj[$scope.userProfile.downvoted[i]] = $scope.userProfile.downvoted[i];
               // console.log($scope.userProfile.downvoted[i]);
          } 

          //remove this if you want people to rate their own songs
          // for(var i = 0;i < $scope.userProfile.songs.length; i++){
          //   $scope.ratedSongTableObj[$scope.userProfile.songs[i]._id] = $scope.userProfile.songs[i]._id;
          // }

          //Populate favorite hash table
          for(var i = 0;i < $scope.userProfile.favorite.length; i++){
            $scope.favoritedSongTableObj[$scope.userProfile.favorite[i]._id] = $scope.userProfile.favorite[i]._id;
               // console.log($scope.userProfile.downvoted[i]);
          } 

          console.log("OKAY ");
          console.log($scope.ratedSongTableObj);
          if($scope.currentStation)
          {
            getTags();
          } else {
            initStation();
          }

        })
        .error(function(){

        });
}

function getUser(){
    $http({url: '/api/getUser', method: 'GET'})
    .success(function (data, status, headers, config) {
      $scope.user = data;
     // console.log($scope.user);
         User.label = data;
     // $scope.currentStation = $scope.user.station;
        getUserProfile();
    })
    .error(function (data, status, headers, config) {
 
      initStation();
     
   
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

//GETS TAGS FROM SERVER AND LISTS THEM

 function getTags(callback){

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

     if(callback){
      callback();
     }

  });

}

//GETS USERS FROM DATABASE AND STORES THEM IN LOCAL VAR $scope.allUsersArray
 function getAllUsers(callback){

  $http.get("/getUsers")
  .success(function(response) {
    $scope.allUsersArray = response;
    console.log(response);
//move these into a call back later

     if(callback){
      callback();
     }

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

   function runStationAlgorithm(hasRatedEverySong){
    console.log("runStationAlgorithm");
    $scope.percentageArray = calculatePercentage(hasRatedEverySong);
    $scope.nextSong = pickNextSong($scope.customSongArray, $scope.percentageArray);

  //if the $scope.nextSong is undefined for whatever reason(likely all songs have been rated)
  //run the stationAlgorithm with every song rated 
    if($scope.nextSong === undefined){

     runStationAlgorithm(true);
    }
  }


   function calculatePercentage(hasRatedEverySong){
    // console.log("calculatePercentage Ran");
    var songArray = $scope.currentStationData.songs;
    var percentageArray = [];
    $scope.customSongArray = [];

    // console.log(songArray);
    // console.log($scope.currentStation);
    console.log(hasRatedEverySong)
    for(var i = 0; i < songArray.length;i++){
      //relevantTagData retrieves the right tag from the tag array inside the Song Object
   if(hasRatedEverySong != true){
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
      // console.log(weightNumber);
      if(weightNumber < 1){
        weightNumber = 0;
      }
      percentageArray.push(weightNumber);
    
      $scope.customSongArray.push(songArray[i]);
        }
      
      } 
   } else {

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
      // console.log(weightNumber);
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
    // console.log("pickNextSong");
    try{
    var nextSong = chance.weighted(songArr, percentageArr);
    console.log(nextSong);
    return nextSong;
    }
    catch(err){
       // console.log(err);
       $scope.playMessage = "You have rated every song in this station!"
       if($scope.sound)
       $scope.sound.pause();
       return undefined;
    }
  
  }
 


 function stopSong(callback){

     if($scope.sound) {
      if($scope.sound.pause){
       $scope.sound.pause();
      }
     }
     if(callback){
      callback();
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

 $scope.refreshPage = function(){

    $scope.goToHome();
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

//historyArr,  favoriteArr, upvoteArr
$scope.historyMemoryArr = [true, false, false];
$scope.historyIndex = 0;
$scope.favoriteIndex = undefined;
$scope.upvoteIndex = undefined;

 $scope.changeHistoryMode = function(type){
      
   if(type != $scope.historyMode){

    var tempHolder = $scope.currentHistoryIndex;
    
    if( $scope.historyMode === 'history'){
      $scope.historyIndex = $scope.currentHistoryIndex;
      if($scope.currentHistoryIndex > 0){
        // $scope.historyIndex = undefined;
        $scope.favoriteIndex = undefined;
        $scope.upvoteIndex = undefined;
      }
    } else if( $scope.historyMode === 'favorite'){
      $scope.favoriteIndex = $scope.currentHistoryIndex;
      if($scope.currentHistoryIndex > 0){
        $scope.historyIndex = undefined;
        // $scope.favoriteIndex = undefined;
        $scope.upvoteIndex = undefined;
      }
    } else if( $scope.historyMode ==='upvote'){
     $scope.upvoteIndex = $scope.currentHistoryIndex;
        if($scope.currentHistoryIndex > 0){
        $scope.historyIndex = undefined;
        $scope.favoriteIndex = undefined;
        // $scope.upvoteIndex = undefined;
      }

    }

    if( type === 'history'){


        $scope.currentHistoryIndex = $scope.historyIndex;


    } else if( type === 'favorite'){

            $scope.currentHistoryIndex = $scope.favoriteIndex;


    } else if(type ==='upvote'){
     $scope.currentHistoryIndex = $scope.upvoteIndex;


    }



      $scope.historyMode = type;  

      
    }
   
 }
  $scope.changeHistoryIndex = function(num){
      
    if($scope.historyMode === 'history'){

        $scope.historyIndex = num;

    } else if($scope.historyMode === 'favorite'){

        $scope.favoriteIndex = num;

      } else if($scope.historyMode ==='upvote'){

        $scope.upvoteIndex = num;

    }


 }


function changeStationMode(type){
      if(type === 'main'){
        $scope.isStationPlaying = true;

      }
    $scope.stationMode = type;
}

 function retrieveRelevantTagFromSong(song, targetTagName)
 {
  
  return _.find(song.tags, function(item){ return item.tagname == targetTagName; });
     
 }
$scope.rateCheck = function(){
  // console.log("rateCheck")
  // console.log($scope.currentSong);
  // console.log($scope.ratedSongTableObj)
  if($scope.ratedSongTableObj[$scope.currentSong._id]) {
    $scope.currentSong.rated = true;
    $scope.activateTagAnimation();
    $scope.animationSwitchX = true;

     if($scope.favoritedSongTableObj[$scope.currentSong._id]) {
        $scope.currentSong.favorited = true;
      } else {
        $scope.currentSong.favorited = false;
      }

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
    if($scope.firstVisit){
      $scope.firstVisit = false;
    }

    if(index){
    $scope.currentHistoryIndex = index;
    }

    if($scope.historyMode == 'history'){
      changeStationMode('main');
    }
    // animationSwitchX = false;
    console.log(song);


    $scope.activateSong(song);
    $scope.playSong();
 };

$scope.activateAndPlaySongFromDifferentMode = function(song, index){
    
    if($scope.firstVisit){
      $scope.firstVisit = false;
    }

 console.log($scope.historyMode);
 changeStationMode($scope.historyMode);
 console.log(index);
 console.log('$scope.activateAndPlaySongFromDifferentMode ');

   $scope.isStationPlaying = false;
 if(index || index === 0) {
    $scope.currentHistoryIndex = index; 
 }
 
    $scope.activateSong(song , true);
    $scope.historyArray.unshift(song);
    $scope.playSong();
 };

 $scope.songEndsInGenerator = function(){
  console.log("songEndsInGenerator");
  
  $scope.nextSong = pickNextSong($scope.customSongArray,$scope.percentageArray);
  if($scope.nextSong) {
      $scope.activateAndPlaySong($scope.nextSong,0);
  } else {

  }
  
}

$scope.songEndsInHistoryMode = function(){
  // console.log("songEndsInHistoryMode  activated");
  // console.log($scope.historyMode);
   // console.log($scope.isStationPlaying  );
    if($scope.historyMode == 'favorite'){
    // console.log($scope.currentHistoryIndex);
    //   console.log($scope.userProfile.favorite);
    //   console.log($scope.userProfile.favorite.length);
     $scope.currentHistoryIndex += 1;
        
        if($scope.currentHistoryIndex >= $scope.userProfile.favorite.length) {
            $scope.currentHistoryIndex = 0;
            $scope.activateAndPlaySongFromDifferentMode($scope.userProfile.favorite[$scope.currentHistoryIndex],$scope.currentHistoryIndex);
          } else {
              $scope.activateAndPlaySongFromDifferentMode($scope.userProfile.favorite[$scope.currentHistoryIndex], $scope.currentHistoryIndex);
       
          }


    } else if($scope.historyMode == 'upvote') {
      // console.log($scope.currentHistoryIndex);
      // console.log($scope.userProfile.upvoted);
      // console.log($scope.userProfile.upvoted.length);
     $scope.currentHistoryIndex += 1;
        
        if($scope.currentHistoryIndex >= $scope.userProfile.upvoted.length) {
            $scope.currentHistoryIndex = 0;
            $scope.activateAndPlaySongFromDifferentMode($scope.userProfile.upvoted[$scope.currentHistoryIndex],$scope.currentHistoryIndex);
          } else {
              $scope.activateAndPlaySongFromDifferentMode($scope.userProfile.upvoted[$scope.currentHistoryIndex], $scope.currentHistoryIndex);
       
          }

    }

 }

//Activates the UPLOADER to upload everything in the queue
//IF the user is not logged in, show the signup window
// $scope.uploadAll = function()
// {
//   if($scope.user){
//     uploader.uploadAll();
//   } else {
//    $scope.openSignupModal('lg');
//   }
// }

//Scope functions below
  $scope.activateSong = function(song, playFromFavoriteOrUpBool){
    if($scope.sound)
    {
    $scope.sound.stop();  
    }
    console.log('activateSong() activated.');
    console.log('songPath ' + song.filepath);


  	var azureRetrievalPath = $scope.azureStorageName + "/" + song.creator + "/"+ song.filepath;
    $scope.sound = ngAudio.load(azureRetrievalPath);

    $scope.shareURL =  "http://localhost:8000/#/s/" + $scope.currentSong._id;

    //callback Decorator calls the function after the song ends ($sound.progress === 1)
    $scope.sound.endSong = callbackDecorator($scope.sound.endSong, 
      function(){
        // console.log("triggered");
        $scope.sound.pause();
        $scope.sound.setProgress(0.99999999999999999999999);

           if($scope.isStationPlaying) {
            $scope.songEndsInGenerator();          
           } else {
            if($scope.historyMode  == 'upvote' || 'favorite')
            {
             $scope.songEndsInHistoryMode();
            }
           }
      });

    //$scope.sound.trigger("test");
    // $scope.currentSong = null;
    //if playing from station this condition is satisfied
    if(!playFromFavoriteOrUpBool){
        // if($scope.currentSong != song) {
        // }
        $scope.historyArray.unshift(song);
        $scope.currentHistoryIndex = 0;
        // if (!$scope.stationHistoryHotfix){
        //       $scope.currentHistoryIndex = $scope.currentHistoryIndex+1;
        //     };
          if($scope.historyArray.length > 15)
          {
            $scope.historyArray.pop(song);
          }
       $scope.stationHistoryHotfix = false;
    

    } 



    $scope.currentSong = song;
        $scope.rateCheck();
    // console.log($scope.ratedSongTableObj);
    //functions for the generator
   
    $scope.setHiddenTags();


      console.log($scope.stationMode);

    if($scope.stationMode == 'main'){
      if($scope.currentSong.rated) {
      // console.log('TRIGGERED');
      $scope.stackLikeBar();
      } else{
        $scope.resetLikeBar();
        
      }
    }  else {
      $scope.stackLikeBar();
    }
                
   
  }
 
  $scope.activateTagAnimation = function(){
     // console.log("activateTagAnimation timeout Triggered");
     
     $timeout(function(){
        // console.log("activateTagAnimation executed");
          $scope.animationSwitchX =true;
          
      }, 200);

  }
  $scope.playSong = function(){
    $scope.sound.play();
  };
  $scope.playSongFromStation =function(){
      
    $scope.firstVisit = false;

    $scope.sound.play();
  }
    //fix this behavior one day without the hotfix
    $scope.stationHistoryHotfix = false;

    $scope.activateStation = function(tag, visitBool){
      
      //hotfix for firstvisitFlag
      if(visitBool){ $scope.firstVisit = false;}
      console.log(tag);
    if(tag.tagname) {
      $scope.currentStation = tag.tagname;
    } else {
      $scope.currentStation = tag.name;
    }
      //cb means Callback
      var cb = function(){
        runStationAlgorithm();
       
        $scope.isStationPlaying = true;
        if($scope.nextSong)
        {
        stopSong();
        activateNextSong();
        playNextSong(); 
        $scope.animationSwitchMainLabel = true;

           if( $scope.firstVisit) {
           $scope.sound.stop();  
           }
        
        } 
    
      }


      $scope.stationHistoryHotfix = true;
      $scope.animationSwitchMainLabel = false;
      $scope.historyMode = 'history';
      $scope.currentHistoryIndex  = 0;
      changeStationMode('main');

      if(!$scope.firstVisit) 
      {
 
       // $stateParams['stationName'] = $scope.currentStation;
       $state.go("sharedStation",{stationName:$scope.currentStation}, {location: true, notify: false, reload: false});
      }

      getStation(cb);




  }

  $scope.skipSong = function(){
            $scope.sound.setProgress(0.99999999999999999999999);
            if($scope.sound.paused){
              $scope.sound.play();
            }
    // $scope.songEndsInGenerator();
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
     $scope.changeHistoryMode('history');
    $scope.stackLikeBar();
     $scope.userProfile.upvoted.push($scope.currentSong);
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
      $scope.changeHistoryMode('history');
          $scope.stackLikeBar();
     $scope.userProfile.downvoted.push($scope.currentSong);
     $http.post("/api/downvoteSong", $scope.currentSong)
   .success(function(response) {
     console.log(response);
     //updatePage();
  });

  }
  


    $scope.favoriteSong = function(){

      // $scope.userProfile.favorite.push($scope.currentSong);
     $http.post("/api/favoriteSong", $scope.currentSong)
   .success(function(response) {
     console.log(response);
     //updatePage();
     $scope.currentSong.favorited = true;
     $scope.favoritedSongTableObj[$scope.currentSong._id] = $scope.currentSong._id;
     $scope.userProfile.favorite.push($scope.currentSong);
  });

  };
 
    $scope.unfavoriteSong = function(){

     $http.post("/api/unfavoriteSong", $scope.currentSong)
   .success(function(response) {
     console.log(response);
     $scope.currentSong.favorited = false;
     $scope.favoritedSongTableObj[$scope.currentSong._id] = $scope.currentSong._id;
     $scope.userProfile.favorite = _.filter($scope.userProfile.favorite,function(item) {
        return item != $scope.currentSong;
     });

  });

  };

 $scope.clickUpload = function(){
  $scope.openUploadModal();

  //    $timeout(function() {
  //   angular.element($('#hiddenUploadButton')).triggerHandler('click');
  // }, 100);

  // angular.element($('#hiddenUploadButton')).click();
  // console.log(angular.element($('#hiddenUploadButton')).text());
 }


     //End of callbacks for uploader

//Modal login functions here
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
    
  //   $scope.openLoginModal = function (size) {

  //   var modalInstance = $modal.open({
  //     templateUrl: './views/modal/login.html',
  //     controller: 'ModalController',
  //     size: size,
  //     resolve: {
  //       items: function () {
  //         return $scope.items;
  //       }
  //     }
  //   });

  //   modalInstance.result.then(function (modalUserData) {
  //     $scope.userData = modalUserData;
  //     $scope.login();
  //   }, function () {
  //     $log.info('Modal dismissed at: ' + new Date());
  //   });
  // };

  $scope.openUploadModal = function (size) {

    var modalInstance = $modal.open({
      templateUrl: './views/modal/songform.html',
      controller: 'UploadController',
      size: size,
      backdrop : 'static',
      keyboard: false,
      windowClass: 'uploadModal',
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

      console.log(modalData.success);
      console.log(User);
      $scope.user = User.profile;
     
      if(modalData.success = true){
      $scope.goToProfile(User.name);
      }
 


      $log.info('Modal dismissed at: ' + new Date());
    });
  };

// $scope.openProfileModal = function (size) {

//         if($scope.sound)
//        $scope.sound.pause();

//     var modalInstance = $modal.open({
//       templateUrl: './views/modal/profile.html',
//       controller: 'ModalController',
//       size: size,
//       resolve: {
//         userProfile:function(){
//           return $scope.userProfile;
//         },
//         uploader: function () {
//           return $scope.uploader;
//         }
//       }
//     });

//      modalInstance.result.then(function (modalData) {
//         //weird glitch where the first func does not work but the second function does
//     }, function (modalData) {
//       // console.log(modalData);
//       $log.info('Modal dismissed at: ' + new Date());
//     });
//   };

//end of Modal Functions
$scope.goToHome = function () {

       stopSong();
        // console.log(User.profile.username);
        $timeout(function() {
            $state.go('home');
           window.location.reload();
        }, 30);

     
  }

  $scope.goToProfile = function (specificProfile) {
    
    // basket["specificProfile"] = undefined;

    if(specificProfile){

     var cb = function(){
        $timeout(function() {
           $state.go('sharedProfile',  {profileName: specificProfile});

          }, 51);
      }




 
    stopSong(cb);
    
    
    } else {

     var cb = function(){
        $timeout(function() {
              $state.go('sharedProfile',{profileName: User.profile.username});
        }, 51);
      
     }
    stopSong(cb);


    }   

   }


//Authentication TEST
// $http.get("/api/restricted")
//   .success(function (data, status, headers, config) {
//   console.log(data.name); // Should log 'foo'
// })

//userData used for post requests to the server for logging in and signing up

  $scope.userData = {username: '', password: ''};
  $scope.message = '';


  $scope.login = function (credentialsObject) {

    var userDataToAuthenticate = credentialsObject || $scope.userData;
    console.log(userDataToAuthenticate);
    $http
      .post('/authenticate', userDataToAuthenticate)
      .success(function (data, status, headers, config) {
        $window.sessionStorage.token = data.token;

        setLocalStorage('token' , data.token);
        User.authToken = data.token;

        console.log("Log in!", data);

        getUser();

        // var newObjectToBeStored = {username: userDataToAuthenticate.username,
        //                              password: userDataToAuthenticate.password
        //                              };
        // setLocalStorage('loginCredentials', newObjectToBeStored);

        var storageString =  'data.profile.' + userDataToAuthenticate.username;

        var storageCheck =  getLocalStorage(storageString);

        console.log(storageCheck);
        if(storageCheck === null){
          setLocalStorage(storageString, newObjectToBeStored);
        }

      })
      .error(function (data, status, headers, config) {
        // Erase the token if the user fails to log in
        delete User.authToken;
        delete User.storedData;
        delete User.profile;
        setLocalStorage('token', undefined);
        // setLocalStorage('loginCredentials', undefined);
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
        // setLocalStorage('loginCredentials', undefined);
        $scope.user = undefined;
        $scope.userProfile = undefined;
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


      $scope.$emit('currentStationStart');

     $timeout(function(){
      $scope.animationSwitch = true;
      $scope.animationSwitch1 = true;

     $timeout(function(){
      $scope.animationSwitch2 = true;
        $timeout(function(){
          //doesn't hit anything yet
      $scope.animationSwitch3 = true;
     },300);
    },300);
 

  },100);

             // quickFixForAnimation();


function switchAllImages(){
    $timeout(function(){
      // $scope.imageLightIndex = $scope.imageLightIndex+1;
      // if($scope.imageLightIndex > 2){
      //   $scope.imageLightIndex = 0;
      // }
      // console.log( $scope.imageLightIndex);
      //  if($scope.imageSourceArray[0] == './media/pic/1_1.png'){
      //       $scope.imageSourceArray[0] = './media/pic/1_2.png';
      
      // } else if($scope.imageSourceArray[0] == './media/pic/1_2.png'){
      //               $scope.imageSourceArray[0] = './media/pic/1_1.png';
      // }
      //  if($scope.imageSourceArray[1] == './media/pic/2_1.png'){
      //       $scope.imageSourceArray[1] = './media/pic/2_2.png';
      // } else if($scope.imageSourceArray[1] == './media/pic/2_2.png'){
      //               $scope.imageSourceArray[1] = './media/pic/2_1.png';
      // }

      if($scope.upvoteAnimationFrame == false){
        $scope.upvoteAnimationFrame = true;
      } else if($scope.upvoteAnimationFrame == true){
        $scope.upvoteAnimationFrame = false;
      }
      switchAllImages();
      },1000);
}
 switchAllImages();

$scope.$on('fade-normal:enter', function(){
  // console.log("ASdasd");


    });



//Angular autocomplete code. Watch out for the scalability of having userRepo along with Tag Repo
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
      if(item) {
      $log.info('Item changed to ' + JSON.stringify(item));

      if(item.searchType === 'station'){
        $scope.activateStation(item);   
           
      } else if(item.searchType === 'user'){
        
        $scope.goToProfile(item.name);

      } else if(item === undefined){
        $scope.repos = loadAll(); 
      }
        
   } else if(item === null ||undefined || "undefined"){
    console.log('null or undefined');
    $scope.repos = loadAll(); 
   }

    }

    /**
     * Build `components` list of key/value pairs
     */
    function loadAll() {
      var repos = $scope.tagArray.concat($scope.allUsersArray);
      console.log(repos);
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
//CSS JQUERY SECTION
function quickFixForAnimation(){
  if($scope.animationSwitch == false){
     $scope.animationSwitch = true;
      $scope.animationSwitch1 = true;
    
  }
}

//circleDesignt starting area
 function circleDesign(){
  // console.log("circleDesign executed");
  var colorChoices = ['bubbleDarkBlue','bubbleLightBlue', 'bubbleTeal'];
  // var sizeChoices = ['bubbleBig','bubbleMiddle','bubbleSmall'];
  var colorChoiceInt = chance.integer({min: 0, max: colorChoices.length - 1});
  // var sizeChoiceInt = chance.integer({min: 0, max: sizeChoices.length - 1});
  var tempClassName = chance.string({length: 10});
  var xLocation = chance.integer({min: -3, max: 102});
  var yLocation = chance.integer({min: 0, max: 570});
  var transitionTimer = chance.integer({min: 5, max: 40});
  var tempDiv = document.createElement("div");
  tempDiv.className = 'bubble ' + colorChoices[colorChoiceInt] + ' ' + tempClassName;

  angular.element(document.getElementsByClassName('bubbleWrapperDiv')).prepend(tempDiv);
     
  angular.element(document.getElementsByClassName(tempClassName)).css('margin-left',xLocation + '%');
  angular.element(document.getElementsByClassName(tempClassName)).css('margin-top','570px');

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
      angular.element(document.getElementsByClassName(tempClass)).css('margin-top', '-15%');

      // angular.element(document.getElementsByClassName(tempClass)).toggleClass('bubbleTopAnimation');

  }
  

  function deleteBubble(tempClass){
          angular.element(document.getElementsByClassName(tempClass)).remove();
  }
 function placeBubbleBack(tempClass){
     angular.element(document.getElementsByClassName(tempClass)).css('transition',  'none');
      angular.element(document.getElementsByClassName(tempClass)).css('margin-top','540px');
     $timeout(function(){
      goBubbleUp(tempClass);
      
    },100);
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
    },20000);
    $timeout(function() {
      $scope.animationSwitch =  true;
      }, 500);
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

            scope.playerUpvoteInfoImageDisplay = $window.innerWidth > 1150 ? true : false;
            //used to be 1000
            scope.switchMainHistory = $window.innerWidth > 1023? true : false;
           
            scope.mainPlayHeaderSwitch = $window.innerWidth > 1023 ? true : false;

            angular.element($window).on('resize', function () {
          scope.$apply(function(){
            scope.switchMainSearch = $window.innerWidth > 700 ? true : false;
        
           scope.playerUpvoteInfoImageDisplay = $window.innerWidth > 1150 ? true : false;

            scope.switchMainHistory = $window.innerWidth > 1023 ? true : false;

            scope.mainPlayHeaderSwitch = $window.innerWidth > 1023 ? true : false;
            // console.log( scope.switchMainSearch);
                })
            });
        }
    }
}]);

app.directive('toggle', function(){
  return {
    restrict: 'A',
    link: function(scope, element, attrs){
      if (attrs.toggle=="tooltip"){
        $(element).tooltip();
      }
      if (attrs.toggle=="popover"){
        $(element).popover();
      }
    }
  };
})