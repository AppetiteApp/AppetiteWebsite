/* global angular*/
/* global firebase*/
var myApp = angular.module('myApp', ['ngRoute']);

myApp.config(['$routeProvider', function($routeProvider){

//testing to see if this works
$routeProvider

  .when('/login', {
    templateUrl: '/login',
    controller: 'loginController'
  })
  .when('/buydish', {
    templateUrl: '/buydish',
    controller: 'buydishController'
  })
  .when('/', {
    templateUrl: '/home'
  })
  .when('/signup', {
    templateUrl: '/signup',
    controller: 'signupController'
  })
  .when('/submitdish', {
    templateUrl: '/submitdish'
  })
  .when('/profile', {
      templateUrl: '/profile',
      controller: 'profileController'
  })
  .otherwise({
    redirectTo: '/'
  });

}]);

myApp.service('userService', function(){
    var self = this;
    this.user = firebase.auth().currentUser;
    this.getUser = function(){
        return self.user;
    };
});

myApp.controller('loginController', function($scope, $log, userService) {
    $scope.user = {};
    $log.log("Connected");

    $scope.submitForm = function(user) {

        console.log("submit");
        firebase.auth().signInWithEmailAndPassword(user.email, user.password).catch(function(error) {
            // Handle Errors here.
            userService.user.uid = firebase.auth().uid;
            console.log("Error code " + error.code + "\nError message " + error.message);
            console.log(firebase.auth().currentUser);
        });

    };
    
    $scope.getCurrentUser = function(){
	    var user = firebase.auth().currentUser;
	    $scope.user.uid = user.uid;
	    $scope.user.email = user.email;

	    if (user) {
		    return user;
	    } else {
		    return null;
	    }
};

});




//if user is logged in, make ajax request to fetch stuff
myApp.controller('profileController', function($scope, $log, $location, $http, userService){
    var firebaseUser = firebase.auth().currentUser;
    $scope.user = firebaseUser;
    
    //if no one is logged in, then redirect to the login page
    if (!firebaseUser.uid) {
        $location.path('/login');
        return;
    }
    $log.log(firebaseUser.uid);
    firebase.database().ref('users/' + firebaseUser.uid).once('value', function(snapshot){
        $log.log(snapshot.val());
        $scope.$apply(function(){
          	$scope.user.fname = snapshot.val().firstName;
	        $scope.user.lname = snapshot.val().lastName;
	        $scope.user.email = snapshot.val().email;
	        $scope.user.mealsMade = [];
	        //should go and fetch meals
	        if (snapshot.val().mealsMade){
                snapshot.val().mealsMade.forEach(function(mealId){
	                firebase.database().ref('dish/' + mealId).once('value', function(snapshot){
	                    if (!snapshot.val().deleted){
	                        $scope.$apply(function(){
	                            $scope.user.mealsMade.push(snapshot.val()); 
	                        });
	                    }
	                });
	            });	            
	        }


	        
	        $scope.user.mealsMade = snapshot.val().mealsMade;                
        });
    });
    

});

