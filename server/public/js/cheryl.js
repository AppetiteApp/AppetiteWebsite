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
  .when('/aboutus', {
      templateUrl: '/aboutus'
  })
  .when('/terms', {
      templateUrl: '/terms'
  })
  .otherwise({
    redirectTo: '/'
  });

}]);

//stores stuff
myApp.service('userService', function(){
    var self = this;
    
    //stores the uid, email, and other stuff of user when user first gets to page
    self.currentUser;
    if (self.currentUser) {
        
    } else if (!firebase.auth().currentUser) {
         self.currentUser.uid = firebase.auth().currentUser.uid;
        
    }
    
    
    
    // this.getUser = function(){
    //     if (!firebase.auth().currentUser) {
    //         return null;
    //     } else {
            
    //     }
    // };
});

//for controlling regex
myApp.service('regexService', function(){
    this.onlyIntsRegex    = /^[0-9]+$/;
    this.phoneRegex       = /^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/;
    this.usernameRegex    = /^[a-zA-Z0-9]+$/;
    this.passwordRegex    = /^[a-zA-Z0-9:.?!@#$%^&*\-=_+\'\";<>,\/]+$/;
    this.individualNameRegex = /^[\w\d]+$/i;
    this.commentRegex     = /^[\w\d.,:;"'-=_+!@#$%^&*0-9 ]+$/i;
    this.mealRegex        = /^[\w\d.,:;"'-=_+!@#$%^&*0-9 ]+$/i;
    this.addressRegex        = /^[\w\d.,:;"'-=_+!@#$%^&*0-9 ]+$/i;
    this.latLngRegex      = /^-?[0-9]{1,3}\.?[0-9]{0,}$/;
    this.priceRegex       = /^\$?[0-9]+\.?[0-9]{0,}$/;
    this.emailRegex       = /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
});

myApp.controller('homeController', function($scope, $log, $location, regexService) {
    $scope.user = {};
    $log.log("Connected");
    $scope.warnings = {};
    
    //set cookies: if there is uid in cookies.. if not then check if anyone is logged in
    var self = this;
    self.currentUser = firebase.auth().currentUser;
    if (self.currentUser){
        $scope.warnings.existingUser = "You're logged in with " + self.currentUser.email;
    }


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
        // $cookies.put('uid', firebase.auth().currentUser.uid);
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
myApp.controller('accountController', function($scope, $log, $location, $http){
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


myApp.controller('browseController', function($scope, $log, $location){
    
    //if user isn't logged in, then go to home
    //ask for a promise here, or use $cookie
    if(!firebase.auth().currentUser) {
        $location.path('/');
        return;
    }
    

    

    $scope.dishes = [];
    $scope.markers = [];
    

    
            	
    firebase.database().ref('dish/').orderByChild("dataAdded").once("value", function(snapshot){
        var allDishes = snapshot.val();
        $log.info(allDishes);
        for (var key in allDishes){
            if (!allDishes[key]["deleted"] & allDishes[key]["uid"] !== firebase.auth().currentUser.uid){
                
                    $scope.dishes.unshift({
                        dishName    : allDishes[key]["dishName"],
                        description : allDishes[key]["description"],
                        phone       : allDishes[key]["phone"],
                        price       : allDishes[key]["price"],
                        quantity    : allDishes[key]["quantity"],
                        time        : allDishes[key]["time"],
                        address     : allDishes[key]["location"],
                        owner       : allDishes[key]["owner"],
                        key         : key
                    });                     
                
                // var marker = new google.maps.Marker({
                //     position: {
                //         lat: allDishes[key]["lat"],
                //         lng: allDishes[key]["long"]
                //     },
                //     title: allDishes[key]["dishName"]
                // }) ;
                // $scope.$apply(function(){
                //     $scope.markers.push(marker);   
                // });
            } //end if  
        } // end forEach loop
        
        $scope.markers.forEach(function(pin){

                pin.setMap($scope.map); 

        });

        
        
    });
    

    
    

    
    $log.log($scope.dishes);


//should be after loaded... hmmm; ok try to use the ng-model for map        
        // $scope.markers.forEach(function(pin){
        //     $scope.$apply(function(){
        //         pin.setMap($window.map); 
        //     });
        // });

    
    

});


myApp.controller('navbarController', function($scope, $log){
    
});