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
                $scope.warnings.unshift({
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
                //do this in server
                
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
            
            //go and fetch meals
            if (snapshot.val().mealsMade){
                snapshot.val().mealsMade.forEach(function(mealId){
                    firebase.database().ref('dish/' + mealId).once('value', function(snapshot){
                        $timeout(function(){
                            $scope.user.dishes[mealId] = snapshot.val();
                            $scope.user.dishes[mealId].key = mealId;
                        });
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
    
    $scope.$watch('user.location', function(newValue, oldValue){
        $scope.user.changed = true; 
    });
    
    //posts stuff to backend to edit profile
    $scope.editProfile = function(user){
        //watch the stuff in the profile, on change, push them to updateObject and send that when user clicks the save edits button
        var updateObject = {
            uid     :  $scope.user.uid,
            description: user.description,
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
        //dish.time
        
        var time = {
            year: dish.time.year || Date().getFullYear(),
            month: dish.time.month || Date().getMonth(),
            day: dish.time.day || Date().getDate(),
            startHour: dish.time.startHour,
            endHour: dish.time.endHour
        };
        
        
        //extract num from price
        $http.post('/api/dish/edit', {
            uid         : $scope.user.uid,
            key         : dish.key,
            delete      : dish.delete,
            dishName    : dish.dishName,
            location    : dish.location,
            description : $scope.user.description,
            price       : dish.price,
            time        : time,
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
            console.log("changed dishes");
            console.log($scope.dishes);
        });
    });
    
    
    //create a dish object and put the user's info into it
    $scope.dish = {
        warnings: [],
        errors  : [],
        time    : {
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            day: new Date().getDate()
        }
    };
    firebase.database().ref('users/' + firebase.auth().currentUser.uid).once('value', function(snapshot){
        //if user has phone num, then use that as the dish's phone num
        //else, error and cannot submit dish
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
            $scope.user.location = snapshot.val().location;
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
            $scope.dish.location = {
                name: result.formatted_address,
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng
            }; 
            $scope.locationCustom = false;
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
            time        : dish.time,
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
    };
    
    
    $scope.signout = sessionService.signout;
    

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
    
    var storageRef = firebase.storage().ref();
    // var ProfileUrlRef = storageRef.child('defaultProfiles/');
    // $scope.uploadPhoto = function(){
    //     console.log($scope.file);
    //     console.log($scope.file.type);
    //     var uploadTask = ProfileUrlRef.child("chefhat1.png").put($scope.file, {contentType: $scope.file.type});
    //     uploadTask.on('state_changed', null, function(err){
    //         console.log("upload failed", err);
    //     }, function(){
    //         console.log('Uploaded', uploadTask.snapshot.totalBytes, 'bytes.');
    //         console.log(uploadTask.snapshot.metadata);
    //     });
    // };
    $scope.test1 = 'http://cliparts.co/cliparts/8cx/Kk7/8cxKk7Xji.png';
    var test1Ref = storageRef.child('default/chefhat1.png');
    test1Ref.getDownloadURL().then(function(url){
        $timeout(function() {
           $scope.test1 = url; 
        });
        
    }, function(err){
       console.log(err);
    });
    

     
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