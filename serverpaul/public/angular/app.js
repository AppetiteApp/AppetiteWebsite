/* global angular*/
/* global firebase*/
var myApp = angular.module('myApp', ['ngDialog', 'ui.router', 'ngAnimate']);

myApp.config(['$stateProvider','$urlRouterProvider', function($stateProvider, $urlRouterProvider){

//testing to see if this works
$stateProvider
  .state('browse', {
    templateUrl: '/browse',
    controller: 'browseController',
    url: "/browse"
  })
  .state('account', {
      templateUrl: '/account',
      controller: 'accountController',
      url: "/account"
  })
      .state('account.history', {
          templateUrl: '/history',
          controller: 'accountController',
          url:'/account.history'
      })
  .state('login', {
      templateUrl: '/home',
      controller: 'homeController',
      url:'/home'
  })
  .state('aboutus', {
      templateUrl: '/aboutus',
      url: "/aboutus"
  })
  .state('terms', {
      templateUrl: '/terms',
      url:'/terms'
  })
  .state('cheryl/test', {
      templateUrl: '/cheryl/test',
      controller: 'testController',
      url:'/cheryl/test'
  });
  $urlRouterProvider.otherwise('/browse');

}]);

myApp.run(function($rootScope) {
  $rootScope.$on("$stateChangeError", console.log.bind(console));
});


//for controlling regex
myApp.service('regexService', regexService);

//service to manage session: stores: firstname, lastname, email, mealsmade, address
myApp.service('sessionService', sessionService);

//formating time
myApp.service('timeService', timeService);


//if user is logged in, make ajax request to fetch stuff
myApp.controller('accountController', accountController);

myApp.controller('browseController', browseController);

myApp.controller('navController', navController);

myApp.controller('parentController', parentController);





//testing: right now testing google api
//on the assumption that we're including jquery as of now
myApp.controller('testController', function($scope, $timeout, $http, $log, sessionService, regexService){
    
    $scope.logout = sessionService.signout;
    $scope.createStripeAccount = function(){
        $http.post('/api/createStripeAccount', {}).then(function(res){
            console.log(res);
            $timeout(function() {
                $scope.res = res.data;
            });    
        }, function(err){
            if (err) {
                $timeout(function(){
                    $scope.res = "fail";
                });
            }
        });
    };

});

