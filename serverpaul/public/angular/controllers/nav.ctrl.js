var navController = function($scope, $location, $http, $timeout, $route, regexService, sessionService, timeService, $log){

    console.log($scope.parentController);    
    
    const QUERYSTRINGBASE = "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDrhD4LOU25zT-2Vu8zSSuL8AnvMn2GEJ0";
    
    var timeNow = new Date();
    var minNow = 30 * Math.ceil(timeNow.getMinutes() / 30);
    //create a dish object and put the user's info into it
    $timeout(function() {
        $scope.dish = {
            warnings: [],
            errors  : [],
            time    : {
                startTime: new Date(timeNow.getFullYear(), timeNow.getMonth(), timeNow.getDate(), timeNow.getHours(), minNow, 0),
                endTime: new Date(timeNow.getFullYear(), timeNow.getMonth(), timeNow.getDate(), timeNow.getHours() + 6, minNow, 0)
            }
        };
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


    $scope.$watchGroup(['dish.dishName', 'dish.description', 'dish.phone', 'dish.location', 'dish.price', 'dish.startHour', 'dish.endHour', 'dish.locationCustom','dish.useLocationCustom' ], function(newValues, oldValues){
        if ($scope.dish.dishName && regexService.mealRegex.test($scope.dish.dishName) &&
            $scope.dish.description && regexService.commentRegex.test($scope.dish.description) &&
            $scope.dish.phone && regexService.phoneRegex.test($scope.dish.phone) &&
            $scope.dish.price && regexService.priceRegex.test($scope.dish.price) &&
            (($scope.dish.location && !$scope.dish.useLocationCustom) || ($scope.dish.locationCustom && $scope.dish.useLocationCustom))) {
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
            phone: dish.phone,
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
                    
                //close the text box
                var modal = document.getElementById('myModal3');
                modal.style.display = "none";
    
    
            } else {
                $log.log(res.status);
                $scope.message = "Failed to submit";
            }
        }, function(err){
            console.log(err);
            $scope.message = "Failed to load data, please refresh page";
        });
    };
    
        //user can submit signup form by typing ENTER into the confim password box, but only if the two passwords match
    $scope.$watch('user.confirmpassword', function(newValue, oldValue){
        if (oldValue.keyCode == 13 && $scope.user.signuppassword === $scope.user.confirmpassword) {
            $scope.signup($scope.user);
            
        }
    });

    
    //function for logging in, once successfully logged in, redirect to browse page ('/')
    $scope.login = function(user) {
        firebase.auth().signInWithEmailAndPassword(user.email, user.password).then(
        function(){
            //stop displaying the login modal
            var modal = document.getElementById('myModal');
            modal.style.display = "none";
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
                firebase.auth().currentUser.sendEmailVerification();
                var user = {
                    uid : firebase.auth().currentUser.uid,
                    email: firebase.auth().currentUser.email,
                    firstName: $scope.user.firstName,
                    lastName: $scope.user.lastName,
                    phone: $scope.user.phone
                };
                
                console.log(user);
                
                //server-side code: assigns email, uid, and random profile pic
                $http.post('/api/newaccount', user)
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
    
    
};
