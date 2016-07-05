/* global angular*/
/* global firebase*/
/* global google*/
var myApp = angular.module('myApp', ['ngRoute']);

myApp.config(['$routeProvider', function($routeProvider){

//testing to see if this works
$routeProvider

  .when('/buydish', {
    templateUrl: '/buydish',
    controller: 'buydishController'
  })
  .when('/', {
    templateUrl: '/home',
    controller: 'homeController'
  })
  .when('/submitdish', {
    templateUrl: '/submitdish'
  })
  .when('/account', {
      templateUrl: '/account',
      controller: 'accountController'
  })
  .when('/browse', {
      templateUrl: '/browse',
      controller: 'browseController'
  })
  .when('/newdish', {
      templateUrl: '/newdish',
      controller: 'newDishController'
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

myApp.controller('homeController', function($scope, $log, userService, $location) {
    $scope.user = {};
    $log.log("Connected");

    //function for logging in, once successfully logged in, redirect to /browse
    $scope.login = function(user) {

        $log.log("login with email: " + user.email);
        
        firebase.auth().signInWithEmailAndPassword(user.email, user.password).catch(function(error) {
            // for some reason, stuff in here is not running, but the rest of the code is
            var errorCode = error.code;
            var errorMessage = error.message;
            $log.log(errorCode + ": " + errorMessage);
            // ...
        });
        
        $log.log(firebase.auth().currentUser);
        $location.path("/browse");

    };
    
    //after successfully creating a new user: create node in users/, and redirect to /account to fill more info
    $scope.signup = function(user){
        console.log("signup");
        
        firebase.auth().createUserWithEmailAndPassword(user.email, user.password).catch(function(error) {
  		// Handle Errors here. omg why isn't this code running...
  		    var errorCode = error.code;
  		    var errorMessage = error.message;
  		    console.log(errorCode + ": " + errorMessage);
  		    $log.log("callback after creating user");
	    });
	    
	    
	    //if there is a new user created, then go and create a node in the realtime database
  	    //if need be, can go and add firstname, lastname, etc
	    var userid = firebase.auth().currentUser.uid;
            firebase.database().ref('users/' + userid).set({
                email: user.email 
            });
        $location.path('/account');
            
	
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
myApp.controller('accountController', function($scope, $log, $location, $http, userService){
    var firebaseUser = firebase.auth().currentUser;
    $scope.user = firebaseUser;
    
    //if no one is logged in, then redirect to the login page
    if (!firebase.auth().currentUser) {
        $location.path('/login');
        return;
    }
    $log.log(firebaseUser.uid);
    firebase.database().ref('users/' + $scope.user.uid).once('value', function(snapshot){
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


//for submitting a dish, if not logged in, then go to home page
myApp.controller('newDishController', function($scope, $log, $http, $location){
    $scope.dish = {};
    
    //submits a dish
    //on success, clear stuff and show div that says submitSuccess and go to manage
    //on fail, show div that warns that submission failed
    $scope.submit = function(dish){
        if (!firebase.auth().currentUser){
            $location.path('/');
            return;
        }
        var uid = firebase.auth().currentUser.uid;
        $http.post('/newdish', {
            dishName    : dish.dishName,
            location    : dish.location,
            uid         : uid,
            description : dish.description,
            price       : dish.price,
            time        : dish.time,
            portions    : dish.portions || 1
        })
        .then(function(res){
            $log.log(res);
            if (res.data === "success") {
                $scope.submitSuccess = true;
                dish.dishName = "";
                dish.location = "";
                dish.description = "";
                dish.price = "";
                dish.time = "";
                dish.portions = "";
            }
        }, function(err){
            console.log(err);
            $scope.error = "Failed to load data, please refresh page";
        });
    };
    
     
});


myApp.controller('browseController', function($scope, $log, $location, $window){
    
    //if user isn't logged in, then go to home
    //ask for a promise here, or use $cookie
    if(!firebase.auth().currentUser) {
        $location.path('/');
        return;
    }
    $log.log("hiii");
    
    $scope.dishes = [];
    
            	
    firebase.database().ref('dish/').orderByChild("dataAdded").once("value", function(snapshot){
        var allDishes = snapshot.val();
        $log.info(allDishes);
        for (var key in allDishes){
            if (!allDishes[key]["deleted"]){
                $scope.$apply(function(){
                    $scope.dishes.unshift({
                        dishName    : allDishes[key]["dishName"],
                        description : allDishes[key]["description"],
                        latlong     : {
                                        lat : allDishes[key]["lat"],
                                        long: allDishes [key]["long"]
                                      },
                        phone       : allDishes[key]["phone"],
                        price       : allDishes[key]["price"],
                        quantity    : allDishes[key]["quantity"],
                        time        : allDishes[key]["time"],
                        address     : allDishes[key]["location"],
                        owner       : allDishes[key]["owner"]
                    });                     
                });
            }  
        }
    });
    
        //initialize map
    var mapDiv = document.getElementById('map');
    $window.map = new google.maps.Map(mapDiv, {
            center: {lat: 45.5017, lng: -73.5673},
            zoom: 13,
            streetViewControl: false,
            mapTypeControl: false
        });
    
    // var markers = [];    
    // $scope.dishes.forEach(function(dish){
    //     var marker =
    //     markers.push(marker);
    // });
    // var marker = new google.maps.Marker({
    //     position: {lat: , lng: },
    //     map: $window.map,
    //     title: allDishes[key]["dishName"]
    // });

    
    
});

// myApp.controller('mapController', function($scope, $window){
//     var mapDiv = document.getElementById('map');
//     $window.map = new google.maps.Map(mapDiv, {
//             center: {lat: 45.5017, lng: -73.5673},
//             zoom: 13,
//             streetViewControl: false,
//             mapTypeControl: false
//         });
    
    
    
//     var marker = new google.maps.Marker({
//         position: {lat:45.5054445, lng:-73.5789828},
//         map: $window.map,
//         title: 'Hello World!'
//     });

// });