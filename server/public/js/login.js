angular.module('myApp')

    myApp.controller('loginController', function($scope) {
        $scope.user = {};

        $scope.submitForm = function(user) {
            if (1) {
                console.log("submit");
                firebase.auth().signInWithEmailAndPassword(user.email, user.password).catch(function(error) {
                  // Handle Errors here.
                    alert("Error code " + error.code + "\nError message " + error.message);
                    console.log(firebase.auth().currentUser);
                return;
                });
                //$state.go('home');
                //alert("Your email is: " + user.email + " and password is: " + user.password);
            } else {
                alert("Not valid");
            }
        };
    });