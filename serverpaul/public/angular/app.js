/* global angular*/
/* global firebase*/
var myApp = angular.module('myApp', ['ngDialog', 'ui.router']);

myApp.config(['$stateProvider','$urlRouterProvider', function($stateProvider, $urlRouterProvider){

//testing to see if this works
$stateProvider
  .state('browse', {
    templateUrl: '/browse',
    controller: 'browseController',
    url: "/browse"
  })
  .state('account', {
      templateUrl: '/account',
      controller: 'accountController',
      url: "/account"
  })
  .state('login', {
      templateUrl: '/home',
      controller: 'homeController',
      url:'/login'
  })
  .state('aboutus', {
      templateUrl: '/aboutus',
      url: "/aboutus"
  })
  .state('terms', {
      templateUrl: '/terms',
      url:'terms'
  })
  .state('cheryl/test', {
      templateUrl: '/cheryl/test',
      controller: 'testController',
      url:'/cheryl/test'
  });
  $urlRouterProvider.otherwise('/browse');

}]);

myApp.run(function($rootScope) {
  $rootScope.$on("$stateChangeError", console.log.bind(console));
});


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

myApp.controller('parentController', parentController);





//testing: right now testing google api
//on the assumption that we're including jquery as of now
myApp.controller('testController', function($scope, $timeout, $http, $log, sessionService, regexService){
    const QUERYSTRINGBASE = "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDrhD4LOU25zT-2Vu8zSSuL8AnvMn2GEJ0";
    $scope.user = firebase.auth().currentUser;
    $scope.time = {};

    $scope.dish = {};


});


        //upload file
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

            this.uploadFileToUrl = function(file, uploadUrl, uid){
                var uploadTask = ref.child('ProfileImages').child(uid).put(file);
                uploadTask.on('state_changed', function(snapshot){
                    // Observe state change events such as progress, pause, and resume

                }, function(error) {
                    // Handle unsuccessful uploads
                }, function() {
                    // Handle successful uploads on complete
                    // For instance, get the download URL: https://firebasestorage.googleapis.com/...
                    var photoUrl = uploadTask.snapshot.downloadURL;

                    console.log(photoUrl);
                    $http.post(uploadUrl, {
                        uid: uid,
                        photoUrl: photoUrl
                    }).then(function(res){
                        console.log(res);
                    }, function(err){
                        console.log(err);
                    });
                });
            };
         }]);

         myApp.controller('profileImgController', ['$scope', 'fileUpload', function($scope, fileUpload){
            $scope.uploadProfile = function(){
               var file = $scope.myFile;

               console.log('file is ' );
               console.dir(file);

               var uploadUrl = "/api/profileImg";
               fileUpload.uploadFileToUrl(file, uploadUrl, $scope.user.uid);
               $scope.showEditProfilePic = false;
            };
         }]);
