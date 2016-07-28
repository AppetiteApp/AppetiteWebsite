var browseController = function($scope, $log, $location, $http, $timeout, $route, regexService, sessionService, timeService){
    $scope.signout = sessionService.signout;

    //if user isn't logged in, then go to home
    //haha this assignment thing is synchronous
    var currentUser = firebase.auth().currentUser;

    if(!currentUser) {
        $route.reload();
        $location.path('/login');
        return;
    }

    //dishes and markers are arrays
    //user is an object
    $scope.dishes = [];
    $scope.markers = [];
    $scope.user = {};
    const QUERYSTRINGBASE = "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDrhD4LOU25zT-2Vu8zSSuL8AnvMn2GEJ0";


    //dishes ordering by date Added, PROBABLY SWITCH TO ORDERING BY PICKUP TIME
    //firebase.database().ref('dish/').orderByChild("dateUpdated").once("value", function(snapshot){
    firebase.database().ref('dish/').orderByChild('time/startTime').once("value", function(snapshot){
        //$log.info(allDishes);
        var dishes = [];
        var allDishes = [];
        //console.log(snapshot.val());
        snapshot.forEach(function(child) {
            //console.log(child.val());
            allDishes.push(child.val());
        });



        //iterate through all the dishes and put the ones that aren't owned by current owner in the scope
        allDishes.forEach(function(dish){
            if (dish["active"]){

                //prettify time
                //console.log(dish.time);
                var time= {};
                var startDate = new Date(dish.time.startTime);
                var endDate = new Date(dish.time.endTime);

                var date = timeService.formatDate(startDate);
                console.debug(date);

                time.timeString = date + " " + timeService.formatAPMP(startDate) + " to " + timeService.formatAPMP(endDate);

                //console.log(time.timeString);
                console.log(dish.ownerPic);
                
                if (dish["ownerid"] === currentUser.uid){
                    dish.owner = "me";
                }
                
                dish.location = dish.location.split(',')[0];

                dishes.push({
                    dishName    : dish["dishName"],
                    description : dish["description"],
                    price       : dish["price"],
                    quantity    : dish["quantity"],
                    location    : dish["location"],
                    owner       : dish["owner"],
                    phone       : dish["phone"],
                    ownerPic    : dish["ownerPic"],
                    time        : time.timeString
                });
                //console.log(dishes);
            } //end if
        }); // end forEach loop

        //put dishes to the scope
        $timeout(function(){
            $scope.dishes = dishes;
        });
    });

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

    // function that watches startTime and endTime
    // var watchTime = function(startTime, endTime){

    // };

    //regarding the submit a dish part
    firebase.database().ref('users/' + firebase.auth().currentUser.uid).once('value', function(snapshot){
        //if user has phone num, then use that as the dish's phone num
        //else, error and cannot submit dish
        console.log("users/" + firebase.auth().currentUser.uid);
        console.log(snapshot.val());
        console.log(snapshot.val().phone);
        console.log(snapshot.val().location);
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
            $scope.userinfoIncomplete = true;
        }



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


    $scope.$watchGroup(['dish.dishName', 'dish.description', 'dish.phone', 'dish.location', 'dish.price', 'dish.startHour', 'dish.endHour', 'dish.locationCustom','dish.useLocationCustom' ], function(newValues, oldValues, scope){
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
