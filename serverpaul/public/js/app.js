var myApp = angular.module('myApp', ['ngRoute', 'angularCSS']);

myApp.config(['$routeProvider', function($routeProvider){

//when the angular and the server are connected, the 'templateURL' is basically the "GEt" url.
//testing to see if this works
$routeProvider

  .when('/login', {
    templateUrl: '/login'
  })
  .when('/buydish', {
    templateUrl: '/buydish'
  })
  .when('/', {
    templateUrl: '/home'
  })
  .when('/signup', {
    templateUrl: '/signup'
  })
  .when('/submitdish', {
    templateUrl: '/submitdish'
  })
  .when('/terms', {
      templateUrl: '/terms',
  })
  .otherwise({
    redirectTo: '/'
  });

}]);
