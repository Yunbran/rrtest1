app.factory('authInterceptor', function ($rootScope, $q, $window, User) {
  return {
    request: function (config) {
      config.headers = config.headers || {};
      if (User.authToken) {
        config.headers.Authorization = 'Bearer ' + User.authToken;
      }
      //console.log(User);
      return config;
    },
    response: function (response) {
      if (response.status === 401) {
        // handle the case where the user is not authenticated
      }
      return response || $q.when(response);
    }
  };
});

app.config(function ($httpProvider) {
  $httpProvider.interceptors.push('authInterceptor');
});
  