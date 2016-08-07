var browseController = function($scope, $log, $location, $http, $timeout, $route, regexService, sessionService, timeService){
    $scope.signout = sessionService.signout;

    //if user isn't logged in, then go to home
    //haha this assignment thing is synchronous
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            $timeout(function() {
                $scope.user = user;
            });
            
        }else{
            $timeout(function(){
                $scope.user = undefined;
            });
        }
    });

    //dishes and markers are arrays
    //user is an object
    $scope.dishes = [];
    $scope.markers = [];

    //dishes ordering by date Added, PROBABLY SWITCH TO ORDERING BY PICKUP TIME
    //firebase.database().ref('dish/').orderByChild("dateUpdated").once("value", function(snapshot){
    firebase.database().ref('dish/').orderByChild('time/startTime').on("value", function(snapshot){
        //$log.info(allDishes);
        var dishes = [];
        var allDishes = [];
        //console.log(snapshot.val());
        snapshot.forEach(function(child) {
            //console.log(child.key);
            var dish = child.val();
            dish.key = child.key;
            //console.log(dish);
            allDishes.push(dish);
        });



        //iterate through all the dishes and put the ones that aren't owned by current owner in the scope
        allDishes.forEach(function(dish){
            if (dish["active"]){
                console.log(dish.dishName);
                //prettify time
                //console.log(dish.time);
                var time= {};
                var startDate = new Date(dish.time.startTime);
                var endDate = new Date(dish.time.endTime);

                var date = timeService.formatDate(startDate);
                console.debug(date);

                time.timeString = date + " " + timeService.formatAPMP(startDate) + " to " + timeService.formatAPMP(endDate);

                //console.log(time.timeString);
                //console.log(dish.ownerPic);
                if ($scope.user){
                    if (dish["ownerid"] === $scope.user.uid){
                        dish.owner = "me";
                    }
                }
                
                dish.location = dish.location.split(',')[0];
                //console.log(dish.key);

                dishes.push({
                    key         : dish["key"],
                    dishName    : dish["dishName"],
                    description : dish["description"],
                    price       : dish["price"],
                    quantity    : dish["quantity"],
                    location    : dish["location"],
                    owner       : dish["owner"],
                    phone       : dish["phone"],
                    ownerPic    : dish["ownerPic"],
                    time        : time.timeString,
                    showDetails : false
                });
                //console.log(dishes);
            } //end if
        }); // end forEach loop

        //put dishes to the scope
        $timeout(function(){
            $scope.dishes = dishes;
        });
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
