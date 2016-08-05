var loginController = function($scope, $log, $location, regexService, $timeout, sessionService, $http) {
    $scope.user = {};
    $scope.warnings = [];

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            $scope.user = user;
        } else {
            $log.log("onAuthStateChanged: no user");
        }
    });

    $scope.$watch('user.password', function(newValue, oldValue){
        if (newValue.keyCode == 13) $scope.login($scope.user);
    });



};
