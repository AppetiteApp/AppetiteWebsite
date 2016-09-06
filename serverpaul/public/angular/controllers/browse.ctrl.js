var browseController = function($scope, $log, $location, $http, $timeout, regexService, sessionService, timeService){

    $scope.signout = sessionService.signout;
    $scope.myMeals = [];
    $scope.orderedMeals = [];
    $scope.dishes = [];
    $scope.markers = [];
    var timeNow = new Date();

    firebase.database().ref('dish/').orderByChild('time/pickupTime').on('value', function(snapshot){
        var dishes = [];
        var myMeals = [];
        var orderedMeals = [];

        console.log($scope.parentController);

        //get dishes in ordered array
        snapshot.forEach(function(child){
            var pickupTime = new Date(child.val().time.pickupTime);

            //will put 'deleted' dishes under an archived list
            if (pickupTime.getTime() - 1000*60*60*3>= timeNow.getTime()){
                var dish = child.val();
                
                console.log(dish);
                
                dish.key = child.key;
                dish.ownerName = dish.owner;
                dish.popupMessage = "dummy message brought to you by Cheryl!";
                
                //format time
                
                dish.time = timeService.formatDate(pickupTime) + " ~ " + timeService.formatAPMP(pickupTime);
                //set dish.status according to whether or not it's in activeMeals
                var orderBy = new Date(dish.orderBy);
                dish.orderByTime = timeService.formatDate(orderBy) + " " + timeService.formatAPMP(orderBy);



                //if dish is my dish, set owner = 'me'
                //else, give dish default of 'order' unless is in active meals
                if ($scope.parentController.uid){
                    console.log($scope.parentController.uid);

                    
                    console.log(dish.dishName);
                    console.log(orderBy);
                    console.log(timeNow);
                    
                    
                    if (dish.ownerid === $scope.parentController.uid){
                        dish.ownerName = "me";
                        dish.status = "manage";
                        myMeals.push(dish);
                    } else if (!$scope.parentController.activeMeals && orderBy.getTime() >= timeNow.getTime()){
                        dish.status = 'order';
                        dishes.push(dish);
                    }else if ($scope.parentController.activeMeals  && orderBy.getTime() >= timeNow.getTime()) {
                        if (!$scope.parentController.activeMeals[dish.key]){
                            dish.status = "order";
                            dishes.push(dish);
                        } else {
                            dish.status = "ordered";
                            orderedMeals.push(dish);
                        }
                    }
                } //end if $scope.parentController.uid
                
            }
        }); //end forEach iteration of snapshot

        $timeout(function() {
            $scope.dishes = dishes;
            $scope.myMeals = myMeals;
            $scope.orderedMeals = orderedMeals;
        });
        
    });

    //watch the $scope.parentController.uid
    $scope.$watchGroup(['parentController.uid', 'parentController.user'], function(newValues, oldValues){
        if (!$scope.parentController.uid){
            $timeout(function(){
                $scope.dishes.forEach(function(dish){
                    dish.ownerName = dish.owner;
                });    
            });
        } else {
            
            
            $scope.dishes.forEach(function(dish){
                dish.ownerName = dish.owner;
                var orderBy = new Date(dish.orderBy);
                if (dish.ownerid === $scope.parentController.uid){
                    dish.ownerName = "me";
                    dish.status = "manage";
                } else if ($scope.parentController.activeMeals && orderBy.getTime() - timeNow.getTime() >= 0){
                    if ($scope.parentController.activeMeals[dish.key]){
                        dish.status = "ordered";
                    }
                } else {
                    dish.status = "order";
                }
            });

        }
    });
    
    //watch dish.status 

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
    
    $scope.$watch('parentController.currentlyCooking', function(newValue, oldValue){
        if (newValue){
            console.log(newValue);    
        }
        
    });
};
