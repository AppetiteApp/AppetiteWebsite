/* global angular*/
/* global firebase*/
var myApp = angular.module('myApp', ['ngRoute', 'ngDialog']);

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

myApp.controller('navController', navController);





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
    
    $scope.sendEmail = function(){
        $scope.user.sendEmailVerification().then(function(){
           console.log("email sent"); 
        }, function(err){
            console.log(err);
        });
    };



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

myApp.controller('MainCtrl', function ($scope, ngDialog) {
	$scope.openContactForm = function() {
		ngDialog.openConfirm({template: 'loginbutton.ejs',
			scope: $scope //Pass the scope object if you need to access in the template
		}).then(
			function(value) {
				//You need to implement the saveForm() method which should return a promise object
				$scope.saveForm().then(
					function(success) {
						ngDialog.open({template: '<div class="ngdialog-message"> \
						  Your enquiry has been sent. We will get back to you shortly.</div>',
							plain: 'true'
						});
					},
					function(error) {
						ngDialog.open({template: '<div class="ngdialog-message"> \
						  An error occurred while sending your enquiry. Please try again.</div>',
							plain: 'true'
						});
					}
				);
			},
			function(value) {
				//Cancel or do nothing
			}
		);
	};
});

        //just a bunch of stuff from stackoverflow
         myApp.directive('fileModel', ['$parse', function ($parse) {
            return {
               restrict: 'A',
               link: function(scope, element, attrs) {
                  var model = $parse(attrs.fileModel);
                  var modelSetter = model.assign;
                  
                  element.bind('change', function(){
                     scope.$apply(function(){
                        modelSetter(scope, element[0].files[0]);
                     });
                  });
               }
            };
         }]);
      
         myApp.service('fileUpload', ['$http', function ($http) {
            var ref = firebase.storage().ref();
             
            this.uploadFileToUrl = function(file){
                var uploadTask = ref.child('ProfileImages').child(file.name).put(file);
                uploadTask.on('state_changed', function(snapshot){
                    // Observe state change events such as progress, pause, and resume
                    // See below for more detail
                }, function(error) {
                    // Handle unsuccessful uploads
                }, function() {
                    // Handle successful uploads on complete
                    // For instance, get the download URL: https://firebasestorage.googleapis.com/...
                    var downloadURL = uploadTask.snapshot.downloadURL;
                    console.log(downloadURL);
                }); 
            };
         }]);
      
         myApp.controller('myCtrl', ['$scope', 'fileUpload', function($scope, fileUpload){
            $scope.uploadFile = function(){
               var file = $scope.myFile;
               
               console.log('file is ' );
               console.dir(file);
               
               var uploadUrl = "/api/profileImg";
               fileUpload.uploadFileToUrl(file, uploadUrl);
            };
         }]);
