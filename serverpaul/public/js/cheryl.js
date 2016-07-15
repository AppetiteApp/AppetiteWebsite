/* global angular*/
/* global firebase*/
/* global google*/
//var myApp = angular.module('myApp', ['ngRoute']);
var myApp = angular.module('myApp', ['ngRoute']);

myApp.config(['$routeProvider', function($routeProvider){

//testing to see if this works
$routeProvider

  .when('/', {
    templateUrl: '/browse',
    controller: 'browseController'
  })
  .when('/account', {
      templateUrl: '/account',
      controller: 'accountController'
  })
  .when('/login', {
      templateUrl: '/home',
      controller: 'homeController'
  })
  .when('/aboutus', {
      templateUrl: '/aboutus'
  })
  .when('/terms', {
      templateUrl: '/terms'
  })
  .when('/cheryl/test', {
      templateUrl: '/cheryl/test',
      controller: 'testController'
  })
  .otherwise({
    redirectTo: '/'
  });

}]);



//for controlling regex, to be addedS
myApp.service('regexService', function(){
    this.onlyIntsRegex    = /^[0-9]+$/;
    this.phoneRegex       = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
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

myApp.service('sessionService', function(){
    var self = this;
    self.currentUser = firebase.auth().currentUser;
    self.signout = function(){
        firebase.auth().signOut().then(function(){
            self.signOut = true;
            self.currentUser = undefined;
            console.log("signed out!");
        }, function(err){
            console.log(err);
        });
    };
});

//login, signup
myApp.controller('homeController', function($scope, $log, $location, regexService, $route, $timeout) {
    $scope.user = {};
    $log.log("Connected");
    $scope.warnings = [];
    
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            $log.log("onAuthStateChanged: ");
            $log.log(user);
            $scope.currentUser = user;
            $scope.warnings.push({
                errorType: "user",
                errorMessage: "Already logged in with " + user.email
            });
            $route.reload();
            $location.path("/");
        } else {
            $log.log("onAuthStateChanged: no user");
        }
    });
    
    $scope.$watch('user.password', function(newValue, oldValue){
        if (newValue.keyCode == 13) $scope.login($scope.user);
    });
    
    //user can submit signup form by typing ENTER into the confim password box, but only if the two passwords match
    $scope.$watch('user.confirmpassword', function(newValue, oldValue){
        if (oldValue.keyCode == 13 && $scope.user.signuppassword === $scope.user.confirmpassword) {
            $scope.signup($scope.user);
        }
    });
    
    $scope.loginSuccess = false;
    $scope.signupSuccess = false;
    
    //function for logging in, once successfully logged in, redirect to /browse
    $scope.login = function(user) {

        $log.log("login with email: " + user.email);
        
        firebase.auth().signInWithEmailAndPassword(user.email, user.password).then(
        function(){
            $timeout(function(){
                $scope.loginSuccess = true;
            });
                
                $log.log("login function resolved");
                $log.log(firebase.auth().currentUser);
                $route.reload();
                $location.path("/");
            }
            ,function(error) {
                $scope.warnings.push({
                    errorType   : "login",
                    errorMessage: error.message
                });
            });

    };
    
    //after successfully creating a new user: create node in users/, and redirect to /account to fill more info
    $scope.signup = function(user){
        console.log("signup");
        
        //control: can only signup with @mail.mcgill.ca
        
        firebase.auth().createUserWithEmailAndPassword(user.signupemail, user.signuppassword).then(
            function(){
                $timeout(function(){
                    $scope.signupSuccess = true;
                });
                $log.log("signup resolved");
                var user = firebase.auth().currentUser;
                firebase.database().ref('users/' + user.uid).set({
                    email: user.signupemail 
                });
                $log.log(firebase.auth().currentUser);
                $route.reload();
                $location.path('/account');
            },
            function(error) {
        // Handle Errors here. omg why isn't this code running...
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log(errorCode + ": " + errorMessage);
            $scope.warnings.push({
                errorType   : "signup",
                errorMessage: error.message
            });
        });
      
    };

});




//if user is logged in, make ajax request to fetch stuff
myApp.controller('accountController', function($scope, $log, $location, $http, $timeout, $route, sessionService){
    $scope.user = {};
    
    //if no one is logged in, then redirect to the login page
    if (!sessionService.currentUser) {
        $route.reload();
        $location.path('/login');
        return;
    }
    
    //getting the user's info and the user's dishes info
    firebase.database().ref('users/' + sessionService.currentUser.uid).once('value', function(snapshot){
        $log.log(snapshot.val());
        $timeout(function(){
            $scope.user.firstName = snapshot.val().firstName;
            $scope.user.lastName  = snapshot.val().lastName;
            //$scope.user.email = snapshot.val().email;
            $scope.user.phone     = snapshot.val().phone;
            $scope.user.location  = snapshot.val().location;
            $scope.user.dishes    = [];
            
            //go and fetch meals
            if (snapshot.val().mealsMade){
                snapshot.val().mealsMade.forEach(function(mealId){
                    firebase.database().ref('dish/' + mealId).once('value', function(snapshot){
                        snapshot.val().mealId = mealId;
                        var meal = snapshot.val();
                        meal.key = mealId;
                        $timeout(function(){
                            $scope.user.dishes.push(meal);    
                        });
                  });//end firebase fetch dish info
              });//end foreach meal

            }


        }); //end $timeout
    });
    $scope.updateProfile = {};
    
    //posts stuff to backend to edit profile
    $scope.editProfile = function(user){
        //watch the stuff in the profile, on change, push them to updateObject and send that when user clicks the save edits button
        var updateObject = {
            uid     : sessionService.currentUser.uid,
            phone   : user.phone,
            location: user.location,
            firstName: user.firstName,
            lastName: user.lastName
        };
        
        
        $http.post('/api/account/edit', updateObject)
        .then(function(res){
            //should use a ng-model to let user know success on success, maybe the ng-rules thingy
            if (res.status === 200) {
                $scope.updateProfile.errors = res.data.errors;
                $scope.updateProfile.statusMessage = res.data.message;
            }
            console.log(res.data);
        },
        function(err){
           console.log(err); 
        });
    };
    $scope.editDish = {};
    
    //note: must have these things when injecting
    $scope.editDish = function(dish){
        console.log(sessionService.currentUser.uid);
        $http.post('/api/dish/edit', {
            uid         : sessionService.currentUser.uid,
            key         : dish.key,
            delete      : dish.delete,
            dishName    : dish.dishName,
            location    : dish.location,
            description : dish.description,
            price       : dish.price,
            time        : dish.time,
            portions    : dish.portions
        })
        .then(function(res){
            console.log(res.data);
        },
        function(err){
            console.log(err);
        });
    };
    

    
    

});



myApp.controller('browseController', function($scope, $log, $location, $http, $timeout, $route){
    
    //if user isn't logged in, then go to home
    //haha this assignment thing is synchronous
    var currentUser = firebase.auth().currentUser;
    
    if(!currentUser) {
        $route.reload();
        $location.path('/login');
        return;
    }
    
    //dishes and markers are arrays
    //user is an object
    $scope.dishes = [];
    $scope.markers = [];
    $scope.user = {};
    const QUERYSTRINGBASE = "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDrhD4LOU25zT-2Vu8zSSuL8AnvMn2GEJ0";
    
    
    //dishes ordering by date Added, PROBABLY SWITCH TO ORDERING BY PICKUP TIME
    //firebase.database().ref('dish/').orderByChild("dateUpdated").once("value", function(snapshot){
    firebase.database().ref('dish/').orderByChild('time/startTime').once("value", function(snapshot){
        var allDishes = snapshot.val();
        //$log.info(allDishes);
        var dishes = [];
        console.log(snapshot.val());
        
        //iterate through all the dishes and put the ones that aren't owned by current owner in the scope
        for (var key in allDishes){
            console.log("dish key: " + key + " ; uid of dish: " + allDishes[key]["ownerid"]);
            if (allDishes[key]["active"] && allDishes[key]["ownerid"] !== currentUser.uid){
        //  if (allDishes[key]["active"] && allDishes[key]["ownerid"] !== currentUser.uid && date is today){
                 
                //making a pretty time string
            
                console.log("pushing dish with key: " + key);
                    
                dishes.push({
                    dishName    : allDishes[key]["dishName"],
                    description : allDishes[key]["description"],
                    price       : allDishes[key]["price"],
                    quantity    : allDishes[key]["quantity"],
                    time        : allDishes[key]["time"],
                    location    : allDishes[key]["location"],
                    owner       : allDishes[key]["owner"],
                    key         : key,
                    phone       : allDishes[key]["phone"]
                });
                console.log(dishes);
            } //end if  
        } // end forEach loop
        $timeout(function(){
            $scope.dishes = dishes;
            console.log("changed dishes");
            console.log($scope.dishes);
        });
    });
    
    
    //create a dish object and put the user's info into it
    $scope.dish = {
        warnings: [],
        errors  : []
    };
    firebase.database().ref('users/' + firebase.auth().currentUser.uid).once('value', function(snapshot){
        //if user has phone num, then use that as the dish's phone num
        //else, error and cannot submit dish
        if (snapshot.val().phone) {
            $scope.dish.phone = snapshot.val().phone;
        } else {
            $scope.dish.warnings.push({
                warningType: "userinfo",
                warningMessage: "User info incomplete: missing phone number"
            });
        }
        
        //if user has valid address & lnglat, then use that as the dish's address & lnglat
        //else, error and cannot submit dish
        if (snapshot.val().location && snapshot.val().lng && snapshot.val().lat) {
            $scope.dish.location = snapshot.val().location;
            $scope.dish.lat      = snapshot.val().lat;
            $scope.dish.lng      = snapshot.val().lng;
            $scope.user.location = snapshot.val().location;
        } else {
            $scope.dish.errors.push({
                errorType: "userinfo",
                errorMessage: "User info incomplete: missing location."
            });
        }
        
        
        
    });
    
    $scope.submitAddress = function(user){
        //format form data
        var formData = {
            region  : "ca",
            address: user.location
        };
        
        var formDataString = $.param(formData);
        var queryString = QUERYSTRINGBASE + '&' + formDataString;
        $scope.user.queryString = queryString;
        $http.get(queryString)
        .then(function(res){
            $scope.results = res.data.results;
        }, function(err){
           $scope.error = err; 
        });
        
    };
    
    
    $scope.vm = this;
    $scope.vm.step ="one";
    // $scope.vm.stepTwo = stepTwo;

    $scope.stepTwo=function(){
        $scope.vm.step = "two";
    };
       
       
    $scope.stepThree = function(){
    $scope.vm.step = "three";
    };

    
    //submits a dish
    //on success, clear stuff and show div that says submitSuccess and go to manage
    //on fail, show div that warns that submission failed
    $scope.submitDish = function(dish){
        if (!firebase.auth().currentUser){
            $location.path('/');
            return;
        }
        var uid = firebase.auth().currentUser.uid;
        var date = new Date();
        $http.post('/newdish', {
            dishName    : dish.dishName,
            location    : dish.location,
            uid         : uid,
            description : dish.description,
            price       : dish.price,
            time        : {
                    year    : date.getFullYear(),
                    month   : date.getMonth(),
                    day     : dish.day || date.getDate(),
                    starthour: dish.starthour,
                    endhour : dish.endhour
                },
            portions    : dish.portions || 1,
            ingredients : dish.ingredients || ""
        })
        .then(function(res){
            $log.log(res);
            if (res.status === 200) {
                $scope.dish.submitSuccess = true;
                dish.dishName = "";
                dish.description = "";
                dish.price = "";
                dish.month = "";
                dish.year = "";
                dish.day = "";
                dish.starttime = "";
                dish.endtime = "";
                dish.portions = "";
                dish.phone = "";
                dish.location= "";
                dish.ingredients = "";
                    $scope.error = res.data.error;
                    $scope.warnings = res.data.warnings;
                    $scope.message = res.data.message;    
                $log.log($scope.error);
                $log.log(res.data);
                
            } else {
                $log.log(res.status);
                $scope.message = "Failed to submit";
            }
        }, function(err){
            console.log(err);
            $scope.message = "Failed to load data, please refresh page";
        });
    };
    
});

   



//testing: right now testing google api
//on the assumption that we're including jquery as of now
myApp.controller('testController', function($scope, $timeout, $http, $log, sessionService, regexService){
    const QUERYSTRINGBASE = "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDrhD4LOU25zT-2Vu8zSSuL8AnvMn2GEJ0";
    
    $scope.user = {};
    $scope.user = firebase.auth().currentUser;
    $scope.dish = {};
    $scope.dish.one = false;
    $scope.dish.two = false;
    $scope.dish.three = false;
     
    $scope.submitAddress = function(dish){
        //format form data
        var formData = {
            region  : "ca",
            address: $scope.queryAddress
        };
        
        var formDataString = $.param(formData);
        var queryString = QUERYSTRINGBASE + '&' + formDataString;
        $scope.user.queryString = queryString;
        
        console.log("submitaddress" + queryString);
        $http.get(queryString)
        .then(function(res){
            $scope.results = res.data.results;
        }, function(err){
           $scope.error = err; 
        });
        
    };
    
    //watch stuff and change dish.one , dish.two, and dish.three accordingly
    
    $scope.$watchGroup(['dish.dishName', 'dish.description', 'dish.phone', 'dish.location', 'dish.price', 'dish.startHour', 'dish.endHour' ], function(newValues, oldValues, scope){
        if ($scope.dish.dishName && regexService.mealRegex.test($scope.dish.dishName) &&
            $scope.dish.description && regexService.commentRegex.test($scope.dish.description)) {
                $timeout(function(){
                    $scope.dish.one = true;        
                });
            
        } else {
            $timeout(function(){
                $scope.dish.one = false; 
            });
        }
        
        if ($scope.dish.phone && regexService.phoneRegex.test($scope.dish.phone) && 
            $scope.dish.location) {
                $timeout(function(){
                    $scope.dish.two = true;
                });
        } else {
            $timeout(function(){
                $scope.dish.two = false; 
            });
        }
        
        if ($scope.dish.price && regexService.priceRegex.test($scope.dish.price) &&
            $scope.dish.startHour && $scope.dish.endHour) {
                $timeout(function(){
                    $scope.dish.three = true;
                });
        } else {
            $timeout(function(){
                $scope.dish.three = false; 
            });
        }
            
            
    });
    
    $scope.assignLocation = function(result){
        $timeout(function() {
            $scope.dish.location = {
                name: result.formatted_address,
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng
            }; 
        });
    }
    
    
    $scope.signout = sessionService.signout;
    
    // var storage = firebase.storage();
    // var storageRef = storage.ref();
    // var ProfileUrlRef = storageRef.child('profileImg');
    
    $scope.showPhoto = function(){
        console.log($scope.photo);  
    };
    
    
    //submits a dish
    //on success, clear stuff and show div that says submitSuccess and go to manage
    //on fail, show div that warns that submission failed
    $scope.submitDish = function(dish){
        var uid = firebase.auth().currentUser.uid;
        var date = new Date();
        $http.post('/newdish', {
            dishName    : dish.dishName,
            location    : dish.location,
            uid         : uid,
            description : dish.description,
            price       : dish.price,
            time        : {
                    year    : date.getFullYear(),
                    month   : date.getMonth(),
                    day     : dish.day || date.getDate(),
                    starthour: dish.starthour,
                    endhour : dish.endhour
                },
            portions    : dish.portions || 1,
            ingredients : dish.ingredients || ""
        })
        .then(function(res){
            console.log(res);
            if (res.status === 200) {
                $scope.dish.submitSuccess = true;
                dish.dishName = "";
                dish.description = "";
                dish.price = "";
                dish.month = "";
                dish.year = "";
                dish.day = "";
                dish.starttime = "";
                dish.endtime = "";
                dish.portions = "";
                dish.phone = "";
                dish.location= "";
                dish.ingredients = "";
                    $scope.error = res.data.error;
                    $scope.warnings = res.data.warnings;
                    $scope.message = res.data.message;    
                $log.log($scope.error);
                $log.log(res.data);
                
            } else {
                $log.log(res.status);
                $scope.message = "Failed to submit";
            }
        }, function(err){
            console.log(err);
            $scope.message = "Failed to load data, please refresh page";
        });
    };
    
     
});