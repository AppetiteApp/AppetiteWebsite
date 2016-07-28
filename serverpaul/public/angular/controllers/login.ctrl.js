var loginController = function($scope, $log, $location, regexService, $route, $timeout, sessionService, $http) {
    $scope.user = {};
    $scope.warnings = [];
    
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            $route.reload();
            $location.path("/");
            $scope.currentUser = user;
            $scope.warnings.push({
                errorType: "user",
                errorMessage: "Already logged in with " + user.email
            });
        } else {
            $log.log("onAuthStateChanged: no user");
        }
    });
    
    $scope.$watch('user.password', function(newValue, oldValue){
        if (newValue.keyCode == 13) $scope.login($scope.user);
    });
    
    //user can submit signup form by typing ENTER into the confim password box, but only if the two passwords match
    $scope.$watch('user.confirmpassword', function(newValue, oldValue){
        if (oldValue.keyCode == 13 && $scope.user.signuppassword === $scope.user.confirmpassword) {
            $scope.signup($scope.user);
            
        }
    });

    
    //function for logging in, once successfully logged in, redirect to browse page ('/')
    $scope.login = function(user) {
        firebase.auth().signInWithEmailAndPassword(user.email, user.password).then(
        function(){
            $route.reload();
            $location.path("/");
        },function(error) {
            $scope.warnings.unshift({
                errorType   : "login",
                errorMessage: error.message
            });
        });
    };
    
    //after successfully creating a new user: create node in users/, and redirect to /account to fill more info
    $scope.signup = function(user){
        console.log("signup");
        
        //TODO: control: can only signup with @mail.mcgill.ca
        
        firebase.auth().createUserWithEmailAndPassword(user.signupemail, user.signuppassword).then(
            function(){
                firebase.auth().currentUser.sendEmailVerification();
                var user = {
                    uid : firebase.auth().currentUser.uid,
                    email: firebase.auth().currentUser.email,
                    firstName: $scope.user.firstName,
                    lastName: $scope.user.lastName,
                    phone: $scope.user.phone
                };
                
                console.log(user);
                
                //server-side code: assigns email, uid, and random profile pic
                $http.post('/api/newaccount', user)
                .then(function(res){
                    console.log(res.data);
                },
                function(err){
                    console.log(err);
                });
                
                $log.log(firebase.auth().currentUser);
                $route.reload();
                $location.path('/account');
            },
            function(error) {
        // Handle Errors here. omg why isn't this code running...
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log(errorCode + ": " + errorMessage);
            $scope.warnings.unshift({
                errorType   : "signup",
                errorMessage: error.message
            });
        });
      
    };

};