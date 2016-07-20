/* global angular*/
/* global firebase*/
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
myApp.service('regexService', regexService);
// myApp.service('regexService', function(){
//     this.onlyIntsRegex    = /^[0-9]+$/;
//     this.phoneRegex       = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
//     this.usernameRegex    = /^[a-zA-Z0-9]+$/;
//     this.passwordRegex    = /^[a-zA-Z0-9:.?!@#$%^&*\-=_+\'\";<>,\/]+$/;
//     this.individualNameRegex = /^[\w\d]+$/i;
//     this.commentRegex     = /^[\w\d.,:;"'-=_+!@#$%^&*0-9 ]+$/i;
//     this.mealRegex        = /^[\w\d.,:;"'-=_+!@#$%^&*0-9 ]+$/i;
//     this.addressRegex        = /^[\w\d.,:;"'-=_+!@#$%^&*0-9 ]+$/i;
//     this.latLngRegex      = /^-?[0-9]{1,3}\.?[0-9]{0,}$/;
//     this.priceRegex       = /^\$?[0-9]+\.?[0-9]{0,}$/;
//     this.emailRegex       = /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
// });

//service to manage session: stores: firstname, lastname, email, mealsmade, address
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
myApp.controller('homeController', function($scope, $log, $location, regexService, $route, $timeout, sessionService, $http) {
    $scope.user = {};
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
    
    //function for logging in, once successfully logged in, redirect to browse page ('/')
    $scope.login = function(user) {
        firebase.auth().signInWithEmailAndPassword(user.email, user.password).then(
        function(){
            $route.reload();
            $location.path("/");
            $timeout(function(){
                $scope.loginSuccess = true;
            });
        },function(error) {
            $scope.warnings.unshift({
                errorType   : "login",
                errorMessage: error.message
            });
        });
    };
    
    //after successfully creating a new user: create node in users/, and redirect to /account to fill more info
    $scope.signup = function(user){
        console.log("signup");
        
        //TODO: control: can only signup with @mail.mcgill.ca
        
        firebase.auth().createUserWithEmailAndPassword(user.signupemail, user.signuppassword).then(
            function(){
                $timeout(function(){
                    $scope.signupSuccess = true;
                });
                var user = firebase.auth().currentUser;
                
                //server-side code: assigns email, uid, and random profile pic
                $http.post('/api/newaccount', {
                    uid         : user.uid,
                    email       : user.email
                })
                .then(function(res){
                    console.log(res.data);
                },
                function(err){
                    console.log(err);
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
            $scope.warnings.unshift({
                errorType   : "signup",
                errorMessage: error.message
            });
        });
      
    };

});




//if user is logged in, make ajax request to fetch stuff
myApp.controller('accountController', function($scope, $log, $location, $http, $timeout, $route, sessionService){
    $scope.user = firebase.auth().currentUser;
    const QUERYSTRINGBASE = "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDrhD4LOU25zT-2Vu8zSSuL8AnvMn2GEJ0";
    
    //if no one is logged in, then redirect to the login page
    if (!$scope.user) {
        $route.reload();
        $location.path('/login');
        return;
    }
    
    //getting the user's info and the user's dishes info
    firebase.database().ref('users/' +  $scope.user.uid).once('value', function(snapshot){
        $log.log(snapshot.val());
        $timeout(function(){
            $scope.user.firstName = snapshot.val().firstName;
            $scope.user.lastName  = snapshot.val().lastName;
            $scope.user.phone     = snapshot.val().phone;
            $scope.user.location  = snapshot.val().location;
            $scope.user.description = snapshot.val().description;
            $scope.user.dishes    = {};
            $scope.user.lat = snapshot.val().lat;
            $scope.user.lng = snapshot.val().lng;
            $scope.user.photoUrl = snapshot.val().photoUrl;
            
            //go and fetch meals
            if (snapshot.val().mealsMade){
                snapshot.val().mealsMade.forEach(function(mealId){
                    firebase.database().ref('dish/' + mealId).once('value', function(snapshot){
                        //make the date into a Date object
                        var time = {
                            startTime: new Date(snapshot.val().time.startTime),
                            endTime: new Date(snapshot.val().time.endTime)
                        };
                        
                        $timeout(function(){
                            $scope.user.dishes[mealId] = snapshot.val();
                            $scope.user.dishes[mealId].key = mealId;
                            $scope.user.dishes[mealId].time = time;
                        });
                        
                        console.info(snapshot.val().time);
                  });//end firebase fetch dish info
                });//end foreach meal
                
            }

        }); //end $timeout
    });
    $scope.updateProfile = {};
    $scope.updateProfile.changeAddress = false;
    
    //assign location
    $scope.assignLocation = function(result){
        $timeout(function() {
            $scope.user.location = result.formatted_address;
            $scope.user.lat = result.geometry.location.lat;
            $scope.user.lng = result.geometry.location.lng;
        });
    };
    
    
    //find a new address function
    $scope.submitAddress = function(){
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
    
    
    
    //posts stuff to backend to edit profile
    $scope.editProfile = function(user){
        //watch the stuff in the profile, on change, push them to updateObject and send that when user clicks the save edits button
        var updateObject = {
            uid     :  $scope.user.uid,
            description: user.description,
            phone   : user.phone,
            location: user.location,
            lat: user.lat,
            lng: user.lng,
            firstName: user.firstName,
            lastName: user.lastName
        };
        console.log(updateObject);
        
        
    $http.post('/api/account/edit', updateObject)
        .then(function(res){
            console.log(res);
            //should use a ng-model to let user know success on success, maybe the ng-rules thingy
            if (res.status === 200) {
                $scope.updateProfile.errors = res.data.errors;
                $scope.updateProfile.statusMessage = res.data.message;
            }
            console.log(res.data);
            //revert everything
            if (res.data.status === 200) {
                $scope.user.changed = false;
                $scope.user.updated = true;
            }
        },
        function(err){
           console.log(err); 
        });
    };
    
    
    $scope.editDish = {};
    
    //note: must have these things when injecting
    $scope.editDish = function(dish){
        console.log( $scope.user.uid);
        
        //extract num from price
        $http.post('/api/dish/edit', {
            uid         : $scope.user.uid,
            key         : dish.key,
            delete      : dish.delete,
            dishName    : dish.dishName,
            location    : dish.location,
            description : dish.description,
            price       : dish.price,
            time        : dish.time,
            portions    : dish.portions,
            phone       : $scope.user.phone
        })
        .then(function(res){
            console.log(res.data);
        },
        function(err){
            console.log(err);
        });
    };
    $scope.signout = sessionService.signout;

    
    

});



myApp.controller('browseController', function($scope, $log, $location, $http, $timeout, $route, regexService, sessionService){
    $scope.signout = sessionService.signout;
    
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
        //$log.info(allDishes);
        var dishes = [];
        var allDishes = [];
        //console.log(snapshot.val());
        snapshot.forEach(function(child) {
            //console.log(child.val());
            allDishes.push(child.val());
        });
        
        //iterate through all the dishes and put the ones that aren't owned by current owner in the scope
        allDishes.forEach(function(dish){
            if (dish["active"] && dish["ownerid"] !== currentUser.uid){
                
                //prettify time
                console.log(dish.time);
                    
                dishes.push({
                    dishName    : dish["dishName"],
                    description : dish["description"],
                    price       : dish["price"],
                    quantity    : dish["quantity"],
                    time        : dish["time"],
                    location    : dish["location"],
                    owner       : dish["owner"],
                    phone       : dish["phone"]
                });
                //console.log(dishes);
            } //end if  
        }); // end forEach loop
        
        //put dishes to the scope
        $timeout(function(){
            $scope.dishes = dishes;
            //console.log("changed dishes");
            //console.log($scope.dishes);
        });
    });
    
    var timeNow = new Date();
    //create a dish object and put the user's info into it
    $timeout(function() {
        $scope.dish = {
            warnings: [],
            errors  : [],
            time    : {
                startTime: new Date(timeNow.getFullYear(), timeNow.getMonth(), timeNow.getDate()),
                endTime: new Date(timeNow.getFullYear(), timeNow.getMonth(), timeNow.getDate())
            }
        };        
    });




    //regarding the submit a dish part
    firebase.database().ref('users/' + firebase.auth().currentUser.uid).once('value', function(snapshot){
        //if user has phone num, then use that as the dish's phone num
        //else, error and cannot submit dish
        console.log("users/" + firebase.auth().currentUser.uid);
        console.log(snapshot.val());
        console.log(snapshot.val().phone);
        console.log(snapshot.val().location);
        if (snapshot.val().phone) {
            $scope.dish.phone = snapshot.val().phone;
        } else {
            $scope.dish.warnings.push({
                warningType: "userinfo",
                warningMessage: "User info incomplete: missing phone number."
            });
        }
        
        //if user has valid address & lnglat, then use that as the dish's address & lnglat
        //else, error and cannot submit dish
        if (snapshot.val().location && snapshot.val().lng && snapshot.val().lat) {
            $scope.dish.location = {
                name: snapshot.val().location,
                lat: snapshot.val().lat,
                lng: snapshot.val().lng
            };
        } else {
            $scope.dish.errors.push({
                errorType: "userinfo",
                errorMessage: "User info incomplete: missing location."
            });
            $scope.userinfoIncomplete = true;
        }
        
        
        
    });
    
    
    $scope.submitAddress = function(){
        //format form data
        var formData = {
            region  : "ca",
            address: $scope.searchAddress
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
    
    $scope.assignLocation = function(result){
        $timeout(function() {
            $scope.dish.locationCustom = {
                name: result.formatted_address,
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng
            }; 
        });
    };
    
    
    $scope.$watchGroup(['dish.dishName', 'dish.description', 'dish.phone', 'dish.location', 'dish.price', 'dish.startHour', 'dish.endHour', 'dish.locationCustom','dish.useLocationCustom' ], function(newValues, oldValues, scope){
        if ($scope.dish.dishName && regexService.mealRegex.test($scope.dish.dishName) &&
            $scope.dish.description && regexService.commentRegex.test($scope.dish.description) &&
            $scope.dish.phone && regexService.phoneRegex.test($scope.dish.phone) && 
            $scope.dish.price && regexService.priceRegex.test($scope.dish.price) &&
            (($scope.dish.location.lng && $scope.dish.location.lat && $scope.dish.location.name && !$scope.dish.useLocationCustom) || ($scope.dish.locationCustom && $scope.dish.useLocationCustom))) {
                $timeout(function(){
                    $scope.dish.complete = true;
                });
        } else {
            $scope.dish.complete = false;
        }
            
    });
    
    
    
    //submits a dish
    //on success, clear stuff and show div that says submitSuccess and go to manage
    //on fail, show div that warns that submission failed
    $scope.submitDish = function(dish){
        if (!firebase.auth().currentUser){
            $location.path('/');
            return;
        }
        var uid = firebase.auth().currentUser.uid;
        var data = {
            dishName: dish.dishName,
            uid: uid,
            description: dish.description,
            price: dish.price,
            portions: dish.portions || 1,
            ingredients: dish.ingredients || "",
            time: dish.time
        };
        if ($scope.dish.useLocationCustom) {
            data.location = dish.locationCustom;
        } else {
            data.location = dish.location;
        }
        $http.post('/newdish', data)
        .then(function(res){
            $log.log(res);
            if (res.status === 200) {
                $scope.dish.submitSuccess = true;
                dish.dishName = "";
                dish.description = "";
                dish.price = "";
                dish.starttime = "";
                dish.endtime = "";
                dish.portions = "";
                dish.location = "";
                dish.locationCustom = undefined;
                dish.useLocationCustom = false;
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
    $scope.user = firebase.auth().currentUser;
    $scope.time = {};
    
        //getting the user's info and the user's dishes info
    firebase.database().ref('users/' +  $scope.user.uid).once('value', function(snapshot){
        $log.log(snapshot.val());
            //go and fetch meals
            console.log(snapshot.val().mealsMade);
                    firebase.database().ref('dish/' + snapshot.val().mealsMade[0]).once('value', function(snapshot){
                        //parse the time into an year, month, day, starthour + startmin, endhour + endmin
                        console.log(snapshot.val());
                        console.log(snapshot.val().time);
                        $timeout(function(){
                            $scope.time.start = new Date(snapshot.val().time.startTime);
                            $scope.time.end = new Date(snapshot.val().time.endTime);
                        });
                            

                  });//end firebase fetch dish info


    });
    
    
    
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
    
    $scope.signout = sessionService.signout;
    

    

     
});

myApp.directive("fileread", [function () {
    return {
        scope: {
            fileread: "="
        },
        link: function (scope, element, attributes) {
            element.bind("change", function (changeEvent) {
                var reader = new FileReader();
                reader.onload = function (loadEvent) {
                    scope.$apply(function () {
                        scope.fileread = loadEvent.target.result;
                    });
                }
                reader.readAsDataURL(changeEvent.target.files[0]);
            });
        }
    }
}]);