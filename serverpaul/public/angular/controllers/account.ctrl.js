var accountController = function($scope, $log, $location, $http, $timeout, $route, sessionService){
    $scope.signout = sessionService.signout;
    
    $scope.user = firebase.auth().currentUser;
    const QUERYSTRINGBASE = "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDrhD4LOU25zT-2Vu8zSSuL8AnvMn2GEJ0";

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            $timeout(function() {
                $scope.user = user;
            });
            console.log(user);
                //getting the user's info and the user's dishes info
    firebase.database().ref('users/' +  user.uid).on('value', function(snapshot){
        $log.log(snapshot.val());
        $timeout(function(){
            $scope.user.firstName = snapshot.val().firstName;
            $scope.user.lastName  = snapshot.val().lastName;
            $scope.user.phone     = snapshot.val().phone;
            $scope.user.location  = snapshot.val().location;
            $scope.user.description = snapshot.val().description;
            $scope.user.dishes    = {};
            $scope.user.lat = snapshot.val().lat;
            $scope.user.lng = snapshot.val().lng;
            $scope.user.photoUrl = snapshot.val().photoUrl;

            //go and fetch meals
            if (snapshot.val().mealsMade){
                snapshot.val().mealsMade.forEach(function(mealId){
                    firebase.database().ref('dish/' + mealId).once('value', function(snapshot){
                        //make the date into a Date object
                        var time = {
                            startTime: new Date(snapshot.val().time.startTime),
                            endTime: new Date(snapshot.val().time.endTime)
                        };

                        $timeout(function(){
                            $scope.user.dishes[mealId] = snapshot.val();
                            $scope.user.dishes[mealId].key = mealId;
                            $scope.user.dishes[mealId].time = time;
                        });

                        console.info(snapshot.val().time);
                  });//end firebase fetch dish info
                });//end foreach meal

            }

        }); //end $timeout
    });
        }else {
            
        }
    });
    

    $scope.updateProfile = {};
    $scope.updateProfile.changeAddress = false;

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
            uid     :  $scope.user.uid,
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
            phone       : dish.phone
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
