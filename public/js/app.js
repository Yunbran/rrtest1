var app = angular.module('radioApp',
 ['ui.router',
  'ngAudio',
  'angularFileUpload',
  'ngAnimate',
  'ui.bootstrap',
  'LocalStorageModule',
  'ngFx',
  'vAccordion',
  '720kb.socialshare',
  'ngTagsInput',
  'ngMaterial',
  'angular-stripe']);
   

app.config(function($stateProvider, $urlRouterProvider, localStorageServiceProvider){

      // For any unmatched url, send to /home/list
      $urlRouterProvider.otherwise("/home/list")
      
      //Normal access
      $stateProvider
        .state('home', {
            url: "/home",
            templateUrl: "views/home.html",
            controller: 'PlayerController'
        })
        .state('home.list', {
              url: "/list",
              templateUrl: "views/home.list.html"
          })        
        .state('home.about', {
              url: "/about",
              templateUrl: "views/home.about.html"
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
      //sharedSong access
        .state('sharedSong', {
              url: "/s/{songId}",
              templateUrl: "index.html",
              controller: function($state , $stateParams){

                $state.go('sharedSong.home.list', $stateParams)
              }
         })
        .state('sharedSong.home', {
            url: "/home",
            templateUrl: "views/home.html",
            controller: 'PlayerController'
          })
        .state('sharedSong.home.list', {
              url: "/list",
              templateUrl: "views/home.list.html"
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
