app.controller('ModalController', function ($scope, $http, $modalInstance, $window, $log, uploader) {
  $scope.uploader = uploader;
  $scope.userData = {};
  $scope.message = '';
  $scope.tagArray = [];

  $scope.ok = function () {
    $modalInstance.close($scope.selected.item);
  };

//MODAL FUNCTION FOR LOGIN MODAL
  $scope.login = function () {
    console.log('login activated');
    $modalInstance.close($scope.userData);
  };

      
      
//MODAL FUNCTION FOR SIGNUP MODAL
    $scope.signup = function () {
    
    $scope.message = '';
    console.log('signup() in modal activated.');
    console.log('$scope.userData ' + $scope.userData);

    if($scope.userData.password === $scope.userData.passwordConfirm)
    {    

      $http.post("/createUser", $scope.userData)
     .success(function(response) {
       console.log(response);
      
       $modalInstance.close($scope.userData);
      }).error(function(response){
        console.log(response.errors);
        
          $scope.message = response;
  
  
      });

    } else {
     $scope.message = 'Passwords do not match!';
   }

  };

//MODAL FUNCTION FOR SONG MODAL
    $scope.addTag = function (item) {
    
    $scope.message = '';

    if(item.headers.tagArray === undefined)
    {
      item.headers.tagArray = [];
    }

    if(item.headers.tagArray.length < 5)
    {
         item.headers.tagArray.push({tag: ""});
    }
    else
    {
      $scope.message = "Maximum 5 tags allowed";
    }
 

  };

    $scope.modalUploadAll = function () {

    $modalInstance.dismiss({
      uploader: $scope.uploader,
       uploadBool: true
     });
    }

//MODAL FUNCTION FOR EVERY MODAL
  $scope.cancel = function () {
   
    $modalInstance.dismiss('cancel');

  };
});