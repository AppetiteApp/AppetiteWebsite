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
                    console.log("has user");
                    //set dish.status according to whether or not it's in activeMeals
                    var activeMeals = $scope.parentController.activeMeals;
                    if (dish.ownerid === $scope.parentController.uid){
                        dish.owner = "me";
                        dish.status = "manage";
                    } else if (!$scope.parentController.activeMeals){
                        dish.status = 'order';
                    }else if ($scope.parentController.activeMeals) {
                        if (!activeMeals[dish.key]){
                            dish.status = "order";
                        } else if (activeMeals[dish.key].pending === true){
                            dish.status = "pending";
                        } else if (activeMeals[dish.key].pending === false){
                            if (activeMeals[dish.key].accept === true){
                                dish.status = "confirmed";
                            } else if (activeMeals[dish.key].accept === false){
                                dish.status = "declined";
                            }
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
        
    });

    //submits a dish
    //on success, clear stuff and show div that says submitSuccess and go to manage
    //on fail, show div that warns that submission failed
    $scope.submitDish = function(dish){
        if (!$scope.user){
            $location.path('/');
            return;
        }
        var uid = $scope.user.uid;
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
                $log.log($scope.error);
                $log.log(res.data);
                $timeout(function(){
                    $scope.error = "";
                    $scope.warnings = "";
                    $scope.message = "";
                }, 10000);

            } else {
                $log.log(res.status);
                $scope.message = "Failed to submit";
                $timeout(function(){
                    $scope.message = "";
                }, 10000);
            }
        }, function(err){
            console.log(err);
            $scope.message = "Failed to load data, please refresh page";
            $timeout(function(){
                $scope.message = "";
            }, 10000);
        });
    };



};
