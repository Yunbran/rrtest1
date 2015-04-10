var app = angular.module('radioApp',
 ['ui.router',
  'ngAudio',
  'angularFileUpload',
  'ui.bootstrap',
  'LocalStorageModule']);
   

app.config(function($stateProvider, $urlRouterProvider, localStorageServiceProvider){

      // For any unmatched url, send to /route1
      $urlRouterProvider.otherwise("/home/list")
      
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