/* global angular*/
/* global firebase*/
var myApp = angular.module('myApp', ['ngRoute']);

myApp.config(['$routeProvider', function($routeProvider){

//testing to see if this works
$routeProvider

  .when('/', {
    templateUrl: '/browse',
    controller: 'browseController'
  })
  .when('/account', {
      templateUrl: '/account',
      controller: 'accountController'
  })
  .when('/login', {
      templateUrl: '/home',
      controller: 'homeController'
  })
  .when('/aboutus', {
      templateUrl: '/aboutus'
  })
  .when('/terms', {
      templateUrl: '/terms'
  })
  .when('/cheryl/test', {
      templateUrl: '/cheryl/test',
      controller: 'testController'
  })
  .otherwise({
    redirectTo: '/'
  });

}]);



//for controlling regex
myApp.service('regexService', regexService);

//service to manage session: stores: firstname, lastname, email, mealsmade, address
myApp.service('sessionService', sessionService);

//formating time
myApp.service('timeService', timeService);

//login, signup
myApp.controller('homeController', loginController);

//if user is logged in, make ajax request to fetch stuff
myApp.controller('accountController', accountController);

myApp.controller('browseController', browseController);

   



//testing: right now testing google api
//on the assumption that we're including jquery as of now
myApp.controller('testController', function($scope, $timeout, $http, $log, sessionService, regexService){
    const QUERYSTRINGBASE = "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDrhD4LOU25zT-2Vu8zSSuL8AnvMn2GEJ0";
    $scope.user = firebase.auth().currentUser;
    $scope.time = {};
    
        //getting the user's info and the user's dishes info
    firebase.database().ref('users/' +  $scope.user.uid).once('value', function(snapshot){
        $log.log(snapshot.val());
            //go and fetch meals
            console.log(snapshot.val().mealsMade);
                    firebase.database().ref('dish/' + snapshot.val().mealsMade[0]).once('value', function(snapshot){
                        //parse the time into an year, month, day, starthour + startmin, endhour + endmin
                        console.log(snapshot.val());
                        console.log(snapshot.val().time);
                        $timeout(function(){
                            $scope.time.start = new Date(snapshot.val().time.startTime);
                            $scope.time.end = new Date(snapshot.val().time.endTime);
                        });
                            

                  });//end firebase fetch dish info


    });
    
    
    
    $scope.dish = {};

    $scope.submitAddress = function(dish){
        //format form data
        var formData = {
            region  : "ca",
            address: $scope.queryAddress
        };
        
        var formDataString = $.param(formData);
        var queryString = QUERYSTRINGBASE + '&' + formDataString;
        $scope.user.queryString = queryString;
        
        console.log("submitaddress" + queryString);
        $http.get(queryString)
        .then(function(res){
            $timeout(function() {
                $scope.results = res.data.results;    
            });
            
        }, function(err){
           $scope.error = err; 
        });
        
    };
    
    $scope.signout = sessionService.signout;
    

    

     
});

myApp.directive("fileread", [function () {
    return {
        scope: {
            fileread: "="
        },
        link: function (scope, element, attributes) {
            element.bind("change", function (changeEvent) {
                var reader = new FileReader();
                reader.onload = function (loadEvent) {
                    scope.$apply(function () {
                        scope.fileread = loadEvent.target.result;
                    });
                }
                reader.readAsDataURL(changeEvent.target.files[0]);
            });
        }
    }
}]);