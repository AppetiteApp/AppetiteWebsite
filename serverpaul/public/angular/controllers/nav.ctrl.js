var navController = function($scope, $location, $http, $timeout, $route, regexService, sessionService, timeService){
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            $timeout(function() {
                $scope.user = user;
            });
        
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
        } else {
            $timeout(function(){
                $scope.user = undefined;
            });
            $log.log("onAuthStateChanged: no user");
        }
    });
    const QUERYSTRINGBASE = "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDrhD4LOU25zT-2Vu8zSSuL8AnvMn2GEJ0";
    
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

            } else {
                $log.log(res.status);
                $scope.message = "Failed to submit";
            }
        }, function(err){
            console.log(err);
            $scope.message = "Failed to load data, please refresh page";
        });
    };
    
    
    
};
