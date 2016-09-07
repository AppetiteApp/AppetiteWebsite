//this will be the parent controller, with things like uid, verifications, etc
//user
var parentController = ['$timeout', '$scope', 'sessionService', 'timeService', '$http', function($timeout, $scope, sessionService, timeService, $http) {
    $scope.parentController = {
        dish: {}
    };
    $scope.parentController.newUser = false;
    $scope.parentController.signupUser;
    $scope.parentController.hasSession = false;





    $scope.parentController.signout = sessionService.signout;


    //if the person is logged in, get that person's info
    firebase.auth().onAuthStateChanged(function(user) {
        if (user && !$scope.parentController.hasSession){
            if (!$scope.parentController.hasSession){
                firebase.auth().currentUser.getToken(true).then(function(token) {
                console.log(token);
                startSession(token);
                // Send token to your backend via HTTPS
                // ...
            }).catch(function(error) {
                console.log(error);
            });
            }
        }


        if (user) {


            //put info about user into scope
            $timeout(function() {
                $scope.parentController.user = {
                    uid             : user.uid,
                    emailVerified   : user.emailVerified,
                    email           : user.email
                };
                $scope.parentController.uid = user.uid;
            });


            //retrieve person's info, autoreferesh if anything changes
            firebase.database().ref('users/' + user.uid).on('value', function(snapshot){
                //check for null/undefined
                if (snapshot.val()){
                    //store things in the parentController, an error for location if it's not filled out

                    $scope.parentController.user = snapshot.val();
                    $scope.emailVerified = user.emailVerified;
                    $scope.parentController.number = snapshot.val().number;
                    $scope.parentController.dish.location = {
                        name: snapshot.val().location,
                        lat: snapshot.val().lat,
                        lng: snapshot.val().lng,
                        error: undefined
                    };

                    if (!snapshot.val().lng){
                        $scope.parentController.dish.location.error = "Please fill out your address before posting a dish!";
                    }

                    $scope.parentController.user.firstName  = snapshot.val().firstName;
                    $scope.parentController.user.lastName  = snapshot.val().lastName;
                    $scope.parentController.user.photoUrl   = snapshot.val().photoUrl;
                    $scope.parentController.user.phone      = snapshot.val().phone;
                }

            }); //end fetch user data from firebase

        }else if (!user){
            $timeout(function() {
                $scope.parentController.user = undefined;
                $scope.parentController.uid = undefined;
                $scope.parentController.number = undefined;


            });
            $http.post('/api/signout', {}).then(function(res){
            }, function(err){console.log(err)});
        }
    }); //end auth function

    var startSession = function(token){
        $http.post('/api/customTokenAuth', {token: token}).then(function(res){
          console.log(res);
            if (res.data==="success"){
                $scope.parentController.hasSession = true;
                //document.location.reload(true);
            } else if (res.data ==="cookie-in-place"){
                $scope.parentController.hasSession = true;

            }
        }, function(err){
            console.log(err);
        });
    };

       $scope.$watch('parentController.user', function(newValue, oldValue){
        if (newValue){
            if(newValue.currentlyCooking){
                //for each, go to firebase & fetch data
                var meals = [];
                var timeNow = new Date();
                newValue.currentlyCooking.forEach(function(mealKey){

                    firebase.database().ref('/dish/' + mealKey).on("value", function(snapshot){
                        if (snapshot.val()){
                            console.log(snapshot.val());
                            if (snapshot.val().ownerid === newValue.uid){
                                var dish = snapshot.val();
                                dish.key = mealKey;

                                var pickupTime = new Date(snapshot.val().time.pickupTime);
                                var orderBy = new Date(snapshot.val().orderBy);



                                if (orderBy.getTime() >= timeNow.getTime()){
                                    dish.editable = true;
                                } else {
                                    dish.editable = false;
                                }

                                dish.time.pickupTimeFormatted = timeService.formatDate(pickupTime) + " " + timeService.formatAPMP(pickupTime);


                                dish.orderByFormatted = timeService.formatDate(orderBy) + " " + timeService.formatAPMP(orderBy);

                                dish.time.pickupTime = pickupTime;


                                dish.orderBy = orderBy;

                                if (snapshot.val().purchases){
                                    dish.purchases = snapshot.val().purchases;

                                } else {
                                    dish.purchases = undefined;
                                }

                                meals.push(dish);
                            }
                        }
                        $timeout(function() {
                            $scope.parentController.currentlyCooking = meals;
                        });
                    }); //end firebase fetch data

                });

            } else {
                $scope.parentController.currentlyCooking = undefined;
            }

            if(newValue.activeMeals){
                var activeMeals = {};
                for (var mealKey in newValue.activeMeals){
                    var data = newValue.activeMeals[mealKey];
                    firebase.database().ref('/dish/' + mealKey).on("value", function(snapshot){
                        if (snapshot.val()){
                            var pickupTime = new Date(snapshot.val().time.pickupTime);
                            var orderByTime = new Date(snapshot.val().orderBy);
                            data.price = snapshot.val().price;
                            data.ownerPic = snapshot.val().ownerPic;
                            data.owner = snapshot.val().owner;
                            data.dishName = snapshot.val().dishName;
                            data.description = snapshot.val().description;
                            data.key = mealKey;
                            data.formattedPickupTime = timeService.formatDate(pickupTime) + " " + timeService.formatAPMP(pickupTime);
                            data.formattedOrderByTime = timeService.formatDate(orderByTime) + " " + timeService.formatAPMP(orderByTime);
                            data.address = snapshot.val().location;
                            if (!data.purchases){
                                data.order = 0;
                            } else {
                                data.order = Object.keys(data.purchases).length;
                            }
                            
                            activeMeals[data.key] = data;
                        }

                    });
                    console.log(mealKey);
                }
                $timeout(function() {
                    $scope.parentController.activeMeals = activeMeals;
                });
            } else {
                $scope.parentController.activeMeals = undefined;
            }

        } else {
            $scope.parentController.activeMeals = undefined;
            $scope.parentController.currentlyCooking = undefined;
        }

    });

    $scope.parentController.pickedUp = function(dish){
        if ($scope.parentController.uid){
            $http.post('/api/pickedUp', {
                dishid: dish.key
            }).then(function(res){
                console.log(res);
                if (res.data === 'success'){
                    $timeout(function() {
                        dish.pickedUp = true;
                    });

                }
            }, function(err){
                console.log(err);
            });
        }
    };

    $scope.parentController.submitChefReview = function(meal){
        if (meal.review.rating){
            var rating = parseInt(meal.review.rating, 10);
            if (rating > 0 && rating <= 5){
                var reviewObj = {
                    rating: rating
                };

                reviewObj.dishid = meal.key;
                if (meal.review.review) reviewObj.review = meal.review.review;

                $http.post('/api/reviewChef', reviewObj).then(function(res) {
                    if (res.data=="success"){
                        $timeout(function(){
                            meal.systemMessage = "Thank you for reviewing " + meal.ownerName + "!";
                            meal.reviewedChef = true;
                        });
                        $timeout(function(){
                            meal.systemMessage = undefined;
                        }, 10000);
                    }
                }, function(err){
                    console.log(err);
                });
            } // end if rating in range
        }
    };

}];
