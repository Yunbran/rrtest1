var app = angular.module('radioApp',
 ['ui.router',
  'ui.bootstrap',
  'ngAudio',
  'angularFileUpload',
  'ngAnimate',
  'LocalStorageModule',
  'ngFx',
  'vAccordion',
  '720kb.socialshare',
  'ngTagsInput',
  'ngMaterial',
  'angular-stripe',
  'ngAria',
  'ngMessages',
  'angular-svg-round-progressbar']);
   

app.config(function($stateProvider, $urlRouterProvider, localStorageServiceProvider){

      // For any unmatched url, send to /home/list
      $urlRouterProvider.otherwise("/")
      
      //Normal access
      $stateProvider
        .state('home', {
            url: "/",
            templateUrl: "views/home.html",
            controller: 'PlayerController'
        })
        .state('home.payment', {
              url: "/payment",
              templateUrl: "views/home.payment.html"
          })
        .state('profile', {
            url: "/profile",
            templateUrl: "views/profile.html",
            controller: 'ProfileController'
        })
        //sharedProfile access
        .state('sharedProfile', {
              url: "/profile/{profileName}",
              templateUrl: "views/profile.html",
              controller: 'ProfileController'
         })
    
      //sharedSong access
      //sharedStation access
        .state('sharedStation', {
              url: "/station/{stationName}",
              templateUrl: "views/home.html",
              controller: 'PlayerController'
         })
          //placeholder for other views
        .state('route2', {
            url: "/route2",
            templateUrl: "views/route2.html"
        })
        .state('route2.list', {
              url: "/list",
              templateUrl: "views/route2.list.html",
              controller: function($scope){
                $scope.things = ["A", "Set", "Of", "Things"];
              }
          });

    //configuration for localStorageServiceProvider
    localStorageServiceProvider
    .setPrefix('radioApp')
    .setStorageType('localStorage')
    .setNotify(true, true);

 

    });

app.config(function(stripeProvider){
    stripeProvider.setPublishableKey('pk_test_7cQzshpAnkxtmo0972yRqR4r');
});
