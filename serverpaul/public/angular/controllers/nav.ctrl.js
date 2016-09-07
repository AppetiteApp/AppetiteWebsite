var navController = function($scope, $location, $http, $timeout, regexService, sessionService, timeService, $log){
    const QUERYSTRINGBASE = "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDrhD4LOU25zT-2Vu8zSSuL8AnvMn2GEJ0";

    var timeNow = new Date();
    var tomorrow = new Date(timeNow.getTime() + 24*60*60*1000);
    var minNow = 30 * Math.ceil(timeNow.getMinutes() / 30);
    $scope.dish = {
        errors: []
    };
    //watch $scope.parentController.uid, user.uid, user.email, user.emailVerified, dish.location
    $scope.$watch('parentController.uid', function(newValue, oldValue){
        //if $scope.parentController.uid isn't undefined or null, then there is a user logged in
        if (newValue){
            //regarding the submit a dish part
            firebase.database().ref('users/' + newValue).on('value', function(snapshot){
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
                } else {
                    $scope.dish.errors.push({
                        errorType: "userinfo",
                        errorMessage: "User info incomplete: missing location."
                    });
                    console.log("no address");
                }

                //create a dish object and put the user's info into it
                $timeout(function() {
                    $scope.dish = {
                        errors  : $scope.dish.errors,
                        time    : {
                            pickupTime: new Date(timeNow.getFullYear(), timeNow.getMonth(), timeNow.getDate(), timeNow.getHours() + 3, minNow, 0),
                            date: "today"
                        },
                        orderBy : new Date(timeNow.getFullYear(), timeNow.getMonth(), timeNow.getDate(), timeNow.getHours() + 1, minNow, 0)

                    };
                });
            }); //end fetch data from firebase

        }
    });

    //set the year, month, and day of toBeChangedTime to referenceTime's year, month, and day
    var setDate = function(toBeChangedTime, referenceTime){
        toBeChangedTime.setFullYear(referenceTime.getFullYear());
        toBeChangedTime.setMonth(referenceTime.getMonth());
        toBeChangedTime.setDate(referenceTime.getDate());
    };

    $scope.$watch('dish.time', function(newValue, oldValue){
         //if today is chosen, then year/month/date should be today
        //if tomorrow is chosen, then get the year, month, and date of tomorrow and set them to the time object
        if ($scope.dish.time){
            if ($scope.dish.time.date === "today"){
                setDate($scope.dish.time.pickupTime, timeNow);
                setDate($scope.dish.orderBy, timeNow);
            } else if($scope.dish.time.date === "tomorrow"){
                setDate($scope.dish.time.pickupTime, tomorrow);
                setDate($scope.dish.orderBy, tomorrow);
            }    
        }
        
    });


    $scope.$watchGroup(['dish.dishName', 'dish.description', 'dish.phone',  'dish.price', 'dish.time.pickupTime', 'dish.orderBy'], function(newValues, oldValues){
        if ($scope.dish.dishName && regexService.mealRegex.test($scope.dish.dishName) &&
            $scope.dish.description && regexService.commentRegex.test($scope.dish.description) &&
            $scope.dish.price && regexService.priceRegex.test($scope.dish.price) &&
            $scope.dish.orderBy.getTime() <= $scope.dish.time.pickupTime.getTime() &&
            $scope.parentController.dish.location.lat) {
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
        console.log(dish);
        if (!$scope.parentController.uid){
            $location.path('/');
            return;
        }
        var uid = $scope.parentController.uid;
        var data = {
            dishName: dish.dishName,
            uid     : uid,
            description : dish.description,
            price   : dish.price,
            phone   : $scope.parentController.user.phone,
            location: $scope.parentController.dish.location,
            portions: dish.portions || 1,
            ingredients : dish.ingredients || "",
            orderBy : dish.orderBy,
            time    : {
                        pickupTime: dish.time.pickupTime
                      }
        };

        $http.post('/api/newdish', data)
        .then(function(res){
            $log.log(res);
            if (res.data.madeMeal === 200) {
                dish.dishName = "";
                dish.description = "";
                dish.price = "";
                dish.portions = "";
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
        if (newValue){

            if (newValue.keyCode == 13 && $scope.user.signuppassword === $scope.user.confirmpassword) {
                $scope.signup($scope.user);

            }
        }
    });


    //function for logging in, once successfully logged in, redirect to browse page ('/')
    $scope.login = function(user) {
        firebase.auth().signInWithEmailAndPassword(user.email, user.password).then(
        function(){
            //stop displaying the login modal
            var modal = document.getElementById('myModal');
            modal.style.display = "none";
            // firebase.auth().currentUser.getToken(true).then(function(token) {
            //     console.log(token);
            //     startSession(token);
            //     // Send token to your backend via HTTPS
            //     // ...
            // }).catch(function(error) {
            //     console.log(error);
            // });
        },function(error) {
            $timeout(function() {
                $scope.loginError = "Invalid Email or Password";
            });
            $timeout(function(){
                $scope.loginError = undefined;
            }, 10000);
            console.log(error);
        });
    };

    //after successfully creating a new user: create node in users/, and redirect to /account to fill more info
    $scope.signup = function(user){
        console.log("signup");
        $scope.parentController.newUser = true;
        console.log(user);

        firebase.auth().createUserWithEmailAndPassword(user.signupemail, user.signuppassword).then(
            function(userInfo){
                user.uid = userInfo.uid;
                firebase.auth().currentUser.sendEmailVerification();
                $http.post('/api/newaccount', user).then(function(res){
                    if (res.data ==='success' || res.data==="cookie-in-place"){
                        $timeout(function(){
                            $scope.parentController.newUser = false;    
                        });
                        firebase.auth().currentUser.getToken(true).then(function(token) {
                            console.log(token);
                            startSession(token);
                        }).catch(function(error) {
                            console.log(error);
                        });
                        
                    }
                },
                function(err){
                    console.log(err);
                });
            },
            function(error) {
        // Handle Errors here. omg why isn't this code running...
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log(errorCode + ": " + errorMessage);
            $timeout(function(){
                $scope.signupError = error.message;
            });
            $timeout(function() {
                $scope.signupError = undefined;
            }, 10000);
        });

    };
    


};
