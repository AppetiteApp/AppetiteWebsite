var browseController = function($scope, $log, $location, $http, $timeout, regexService, sessionService, timeService){

    $scope.signout = sessionService.signout;

    $scope.dishes = [];
    $scope.markers = [];
    var timeNow = new Date();

    firebase.database().ref('dish/').orderByChild('time/startTime').on('value', function(snapshot){
        var dishes = [];

        console.log($scope.parentController);

        //get dishes in ordered array
        snapshot.forEach(function(child){
            var endTime = new Date(child.val().time.endTime);

            if (!child.val().archived && endTime.getTime() >= timeNow.getTime()){
                var dish = child.val();
                dish.key = child.key;
                var startTime = new Date(dish.time.startTime);
                dish.ownerName = dish.owner;
                dish.popupMessage = "dummy message brought to you by Cheryl!";
                
                //format time
                if (startTime.getTime() > timeNow.getTime()){
                    dish.time = timeService.formatDate(startTime) + " " + timeService.formatAPMP(startTime);
                } else {
                    dish.time = "Pick up until " + timeService.formatAPMP(endTime);
                }



                //if dish is my dish, set owner = 'me'
                //else, give dish default of 'order' unless is in active meals
                if ($scope.parentController.uid){
                    console.log($scope.parentController.uid);

                    //set dish.status according to whether or not it's in activeMeals
                    var activeMeals = $scope.parentController.activeMeals;
                    var orderBy = new Date(child.val().orderBy);
                    if (dish.ownerid === $scope.parentController.uid){
                        dish.ownerName = "me";
                        dish.status = "manage";
                    } else if (!$scope.parentController.activeMeals && orderBy.getTime() - timeNow.getTime() >= 0){
                        dish.status = 'order';
                    }else if ($scope.parentController.activeMeals  && orderBy.getTime() - timeNow.getTime() >= 0) {
                        if (!$scope.parentController.activeMeals[dish.key]){
                            dish.status = "order";
                        } else {
                            dish.status = "ordered";
                        }
                    }
                } //end if $scope.parentController.uid
                dishes.push(dish);
            }
        }); //end forEach iteration of snapshot

        $timeout(function() {
            $scope.dishes = dishes;
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
            console.log("logged in!");
            
            $scope.dishes.forEach(function(dish){
                dish.ownerName = dish.owner;
                var orderBy = new Date(dish.orderBy);
                if (dish.ownerid === $scope.parentController.uid){
                    dish.ownerName = "me";
                    dish.status = "manage";
                } else if (!$scope.parentController.activeMeals && orderBy.getTime() - timeNow.getTime() >= 0){
                    dish.status = 'order';
                    console.log("dish.status is " + dish.status );
                }else if ($scope.parentController.activeMeals  && orderBy.getTime() - timeNow.getTime() >= 0) {
                    if (!$scope.parentController.activeMeals[dish.key]){
                        dish.status = "order";
                    } else {
                        dish.status = "ordered";
                    }
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
            dish.popupMessage = dish.dishName + " by " + dish.owner + "You've already ordered this dish. Please pickup at " + dish.time + " at " + dish.location + '.';
        }
        
        
    };
};
