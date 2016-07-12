var myApp = angular.module('myApp', ['ngRoute']);

myApp.config(['$routeProvider', function($routeProvider){

$routeProvider

  .when('/login', {
    templateUrl: 'views/login.html'
  })
  .when('/home', {
    templateUrl: 'views/home.html'
  })
  .when('/buydish', {
    templateUrl: 'views/buydish.html'
  })
  .when('/signup', {
    templateUrl: 'views/signup.html'
  })
  .when('/submitdish', {
    templateUrl: 'views/submitdish.html'
  })
  .when('/profile', {
    templateUrl: 'views/profile.html'
  })
  .otherwise({
    redirectTo: '/login'
  });

}]);
