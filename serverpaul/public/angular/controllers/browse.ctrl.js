var browseController = function($scope, $log, $location, $http, $timeout, regexService, sessionService, timeService){

    $scope.signout = sessionService.signout;

    $scope.dishes = [];
    $scope.markers = [];

    firebase.database().ref('dish/').orderByChild('time/startTime').on('value', function(snapshot){
        var timeNow = new Date();
        var dishes = [];

        console.log($scope.parentController);

        //get dishes in ordered array
        snapshot.forEach(function(child){
            var endTime = new Date(child.val().time.endTime);

            if (!child.val().archived && endTime.getTime() >= timeNow.getTime()){
                var dish = child.val();
                dish.key = child.key;
                var startTime = new Date(dish.time.startTime);

                //format time
                if (startTime.getTime() > timeNow.getTime()){
                    dish.time = timeService.formatDate(startTime) + " " + timeService.formatAPMP(startTime);
                } else {
                    dish.time = "Pick up until " + timeService.formatAPMP(endTime);
                }



                //if dish is my dish, set owner = 'me'
                //else, give dish default of 'order' unless is in active meals
                if ($scope.parentController.uid){

                    //set dish.status according to whether or not it's in activeMeals
                    var activeMeals = $scope.parentController.activeMeals;
                    var orderBy = new Date(child.val().orderBy);
                    if (dish.ownerid === $scope.parentController.uid){
                        dish.owner = "me";
                        dish.status = "manage";
                    } else if (!$scope.parentController.activeMeals && orderBy.getTime() - timeNow.getTime() >= 0){
                        dish.status = 'order';
                    }else if ($scope.parentController.activeMeals  && orderBy.getTime() - timeNow.getTime() >= 0) {
                        if (!activeMeals[dish.key]){
                            dish.status = "order";
                        } else {
                            dish.status = "ordered";
                        }
                    }
                } //end if $scope.parentController.uid
                dishes.push(dish);
                console.log(dishes);
            }
        }); //end forEach iteration of snapshot

        $timeout(function() {
            $scope.dishes = dishes;
        });
    });

    //watch the $scope.parentController.uid
    $scope.$watchGroup(['parentController.uid', 'parentController.user'], function(newValues, oldValues){
        if (!$scope.parentController.uid){
            $scope.loggedIn = false;
        } else {
            $scope.loggedIn = true;

        }
    });

    //depending on orderBy, order the dish
    $scope.order = function(dish){
        console.log(dish);
        if (dish.status === 'manage'){
            console.log("this is your own dish");
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
        }

    };
};
