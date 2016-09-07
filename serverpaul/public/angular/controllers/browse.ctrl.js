var browseController = function($scope, $log, $location, $http, $timeout, regexService, sessionService, timeService){

    $scope.signout = sessionService.signout;
    $scope.myMeals = [];
    $scope.orderedMeals = [];
    $scope.dishes = [];
    $scope.mySoldMeals = [];
    $scope.markers = [];
    var timeNow = new Date();

    firebase.database().ref('dish/').orderByChild('time/pickupTime').on('value', function(snapshot){
        var dishes = [];

        //get dishes in ordered array
        snapshot.forEach(function(child){
            var dish = child.val();
            var pickupTime = new Date(dish.time.pickupTime);
            var orderBy = new Date(dish.orderBy);
            
            if (pickupTime.getTime() >= timeNow.getTime() && orderBy.getTime() >= timeNow.getTime()){
                
            
                //format dish's pickup & orderBy time
                dish.time = timeService.formatDate(pickupTime) + " ~ " + timeService.formatAPMP(pickupTime);
                    //set dish.status according to whether or not it's in activeMeals
                    dish.orderByTime = timeService.formatDate(orderBy) + " " + timeService.formatAPMP(orderBy);
                    dish.key = child.key;
                    
                //if dish is my dish, ignore
                //else, give dish default of 'order' unless is in active meals
                console.log(dish);
                console.log($scope.parentController.activeMeals);
                if ($scope.parentController.uid){

                    console.log($scope.parentController.activeMeals);
                    if ($scope.parentController.uid === dish.ownerid){
                        dish.status = "cannot order";
                    } else if ($scope.parentController.activeMeals){
                        if ($scope.parentController.activeMeals[dish.key]){
                            dish.status = 'cannot order';
                        }else {
                            dish.status = 'order';    
                            dishes.push(dish);
                        }
                    }else if ($scope.parentController.pastMeals){
                        if ($scope.parentController.pastMeals[dish.key]){
                            dish.status = 'cannot order';
                        } else {
                            dish.status = 'order';
                            dishes.push(dish);
                        }
                        
                    }{
                        dish.status = 'order';
                        dishes.push(dish);
                    }
                } //end if $scope.parentController.uid
                
            }
        }); //end forEach iteration of snapshot

        $timeout(function() {
            $scope.dishes = dishes;
            console.log($scope.dishes);
        });
        
    });

    //watch the $scope.parentController.uid
    $scope.$watchGroup(['parentController.uid', 'parentController.user'], function(newValues, oldValues){
        if (!$scope.parentController.uid && $scope.dishes){
            $timeout(function(){
                $scope.dishes.forEach(function(dish){
                    dish.ownerName = dish.owner;
                });    
            });
        } else if ($scope.dishes){
            
            
            $scope.dishes.forEach(function(dish){
                dish.ownerName = dish.owner;
                var orderBy = new Date(dish.orderBy);
                
                $timeout(function() {
                    $scope.dishes.forEach(function(dish){
                        if ($scope.parentController.uid === dish.key){
                            dish.status = "manage";
                        } else if (!$scope.parentController.activeMeals && orderBy.getTime() >= timeNow.getTime()){
                            dish.status = 'order';
                        } else if (!$scope.parentController.activeMeals[dish.key] && orderBy.getTime() >= timeNow.getTime()){
                            dish.status = 'order';
                        } else if ($scope.parentController.activeMeals[dish.key] && !$scope.parentController.activeMeals[dish.key].pickedUp){
                            dish.status = 'ordered';
                        }
                    });
                });
                
            });

        } else {
    
            $scope.dishes = undefined;
        }
    });
    
    //watch parentController.activeMeals
    $scope.$watch('parentController', function(newValue, oldValue){
        console.log($scope.parentController.activeMeals);
        if (newValue.activeMeals && $scope.parentController.uid){
            //go through $scope.dishes and remove the ones that the person has ordered
            var activeMealsKeys = Object.keys(newValue.activeMeals);
            $scope.dishes.forEach(function(dish) {
                if (activeMealsKeys.indexOf(dish.key) !== -1){
                    var index = activeMealsKeys.indexOf(dish.key);
                    $timeout(function() {
                        $scope.dishes.remove(index, 1);    
                    });
                    
                }    
            });
        } else {
            
        }
    });

    //depending on orderBy, order the dish
    $scope.order = function(dish){
        console.log(dish);
        if (dish.status === 'manage'){
            console.log("this is your own dish");
            $scope.dish.warningMessage = "Cannot order your own dish!";
            //do something else
        } else if (dish.status === 'order'){
            console.log("let's order this sick dish");
            $http.post('/api/orderdish', {
                dishid: dish.key,
                uid   : $scope.parentController.uid
            })
            .then(function(res){
                console.log(res.data);
            },
            function(err){
                console.log(err);
            });
        } else if (dish.status === 'ordered'){
            $scope.dish.warningMessage = "Cannot order a meal you've already ordered!";
        }

    };
    
    $scope.openModal = function(dish){
        $scope.selection.selectedNode = dish;
        //evaluate who the dish belongs to and whether the dish is purchased by anyone
        
        if (dish.status === 'manage'){
            dish.popupMessage = "This is your dish. -sincerely, from Cheryl";
            if (dish.purchases){
                dish.purchases = JSON.parse(dish.purchases);    
                console.log(dish.purchases);
            }
        } else if (dish.status === 'order') {
            dish.popupMessage = dish.dishName + " by " + dish.owner + ". Pickup at: " + dish.time + ".";
        } else if (dish.status === 'ordered') {
            dish.popupMessage = dish.dishName + " by " + dish.owner + ". Please pickup at " + dish.time + " at " + dish.location + '.';
        }
        
        
    };
    
    $scope.cancelOrder = function(dish){
        if (dish.status === 'ordered'){
            $http.post('/api/cancelOrder', {
                dishid: dish.key,
                uid   : $scope.parentController.uid,
                personType: "buyer"
            })
            .then(function(res){
                console.log(res.data);
            },
            function(err){
                console.log(err);
            });
        }
    };
    
};
