var accountController = function($scope, $log, $location, $http, $timeout, sessionService, timeService){

    $scope.active = true;
    $scope.active1 = true;

    $scope.signout = sessionService.signout;

    $scope.user = $scope.parentController.user;
    const QUERYSTRINGBASE = "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDrhD4LOU25zT-2Vu8zSSuL8AnvMn2GEJ0";

    $scope.$watch('parentController.user', function(newValue, oldValue){
        if (newValue){
            if (newValue.activeMeals){
                $scope.activeMeals = newValue.activeMeals;
            } else {
                $scope.activeMeals = undefined;
            }
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
                                    dish.purchases = JSON.parse(dish.purchases);
                                    
                                } else {
                                    dish.purchases = undefined;
                                }
                                
                                meals.push(dish);    
                            }
                        }
                        $timeout(function() {
                            $scope.currentlyCooking = meals;
                        });
                    }); //end firebase fetch data
                    
                });
                
            } else {
                $scope.currentlyCooking = undefined;
            }
            
            if(newValue.activeMeals){
                var activeMeals = [];
                for (var mealKey in newValue.activeMeals){
                    var data = newValue.activeMeals[mealKey];
                    firebase.database().ref('/dish/' + mealKey).on("value", function(snapshot){
                        if (snapshot.val()){
                            data.price = snapshot.val().price;
                            data.ownerPic = snapshot.val().ownerPic;
                            data.owner = snapshot.val().owner;
                            data.dishName = snapshot.val().dishName;
                            data.description = snapshot.val().description;
                            data.key = mealKey;
                            activeMeals.push(data);
                        }
                        
                    });
                    console.log(mealKey);
                }
                $timeout(function() {
                    $scope.activeMeals = activeMeals;
                });
            } else {
                $scope.activeMeals = undefined;
            }
            
        } else {
            $scope.activeMeals = undefined;
            $scope.currentlyCooking = undefined;
        }
        
    });
    

    $scope.updateProfile = {};
    $scope.updateProfile.changeAddress = false;
    
    $scope.pickedUp = function(dish, dishid){
        if ($scope.parentController.uid){
            $http.post('/api/pickedUp', {
                uid: $scope.parentController.uid,
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
    
    //for submitting a review for the chef
    $scope.submitChefReview = function(meal){
        if (meal.review.rating){
            var rating = parseInt(meal.review.rating, 10);
            if (rating > 0 && rating <= 5){
                var reviewObj = {
                    rating: rating
                };
                reviewObj.uid = $scope.parentController.uid;
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
    
    //for submitting a review for the buyer
    $scope.submitBuyerReview = function(buyerObj, dishid){
        if (buyerObj.unprocessedReview.rating){
            var rating = parseInt(buyerObj.unprocessedReview.rating, 10);
            if (rating>0 && rating<=5){
                var reviewObj = {rating: rating};
                if (buyerObj.unprocessedReview.review) reviewObj.review = buyerObj.unprocessedReview.review;
                reviewObj.uid = $scope.parentController.uid;
                reviewObj.dishid = dishid;
                reviewObj.buyerid = buyerObj.buyerid;
                
                $http.post('/api/reviewBuyer', reviewObj).then(function(res){
                    console.log(res);
                }, function(err){
                    console.log(err);    
                });
            }
        }
      
        
    };

    //assign location
    $scope.assignLocation = function(result, obj){
        $timeout(function() {
            obj.location = result.formatted_address;
            obj.lat = result.geometry.location.lat;
            obj.lng = result.geometry.location.lng;
        });
    };


    //find a new address function
    $scope.submitAddress = function(queryAddress, obj){
        //format form data
        var formData = {
            region  : "ca",
            address : queryAddress
        };

        var formDataString = $.param(formData);
        var queryString = QUERYSTRINGBASE + '&' + formDataString;
        obj.queryString = queryString;

        console.log("submitaddress" + obj.queryString);
        $http.get(queryString)
        .then(function(res){
            obj.results = res.data.results;
            console.info(obj.results);
        }, function(err){
           obj.error = err;
        });

    };



    //posts stuff to backend to edit profile
    $scope.editProfile = function(user){
        //watch the stuff in the profile, on change, push them to updateObject and send that when user clicks the save edits button
        var updateObject = {
            uid     :  $scope.parentController.user.uid,
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
            lat         : dish.lat,
            lng         : dish.lng,
            description : dish.description,
            price       : dish.price,
            time        : dish.time,
            portions    : dish.portions,
            phone       : dish.phone,
            active      : dish.active
        })
        .then(function(res){
            console.log(res.data);
            dish.message = res.data.message;
            $timeout(function(){
                dish.message = "";
            }, 5000);
        },
        function(err){
            console.log(err);
        });
    };
    $scope.signout = sessionService.signout;

    $scope.submitFeedback = function(){
        $http.post('/feedback', {
            message: $scope.feedback,
            anonymous: $scope.anonymous,
            uid: $scope.user.uid
        }).then(function(res){
            console.log(res);
            $scope.commentMessage = res.data.message;
            $timeout(function(){
                $scope.commentMessage = "";
            }, 10000);
        }, function(err){
            console.log(err);
            $scope.commentMessage = "There was an internal server errror. We are working very hard to resolve this issue";
            $timeout(function(){
                $scope.commentMessage = "";
            }, 10000);
        });
    };




};
