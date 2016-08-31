var regexService = function(){
    this.onlyIntsRegex    = /^[0-9]+$/;
    this.phoneRegex       = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    this.usernameRegex    = /^[a-zA-Z0-9]+$/;
    this.passwordRegex    = /^[a-zA-Z0-9:.?!@#$%^&*\-=_+\'\";<>,\/]+$/;
    this.individualNameRegex = /^[\w\d]+$/i;
    this.commentRegex     = /^[\w\d\s.,:;"'-=_+!@#$%^&*0-9 ]+$/i;
    this.mealRegex        = /^[\w\d.,:;"'-=_+!@#$%^&*0-9 ]+$/i;
    this.addressRegex        = /^[\w\d.,:;"'-=_+!@#$%^&*0-9 ]+$/i;
    this.latLngRegex      = /^-?[0-9]{1,3}\.?[0-9]{0,}$/;
    this.priceRegex       = /^\$?[0-9]+\.?[0-9]{0,}$/;
    this.emailRegex       = /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
};

var sessionService = function(){
    var self = this;
    self.currentUser;
    
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            self.currentUser = user;

            
        } else {
            //$log.log("onAuthStateChanged: no user");
            $route.reload();
            $location.path('/login');
            self.currentUser = undefined;
            
        }
    });
    
    
    self.signout = function(){
        firebase.auth().signOut().then(function(){
            self.currentUser = undefined;
            $http.post('/api/signout', {}).then(function(res){
                if (res.data === "success"){
                    $scope.parentController.serverCookie = 0;
                    document.location.reload(true);
                }
            }, function(err){
                console.log(err);
            });
            //console.log("signed out!");
        }, function(err){
            //console.log(err);
        });
    };
};

var timeService = function(){
    var self = this;
    
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    //input a date and get it's hour/minutes, in am/pm time
    self.formatAPMP = function(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var strTime = hours + ':' + minutes + ampm;
        return strTime;
    };
    
    self.formatDate = function(date){
        //console.log("Got function to format date!");
        var todayDate = new Date();
        var testDate = new Date(date.toString());
        
        var timeString;
        if (testDate.setHours(0,0,0,0) == todayDate.setHours(0,0,0,0)){
            timeString = "Today ";
        } else if(date.getFullYear() === todayDate.getFullYear()) {
            timeString = monthNames[date.getMonth()] + " " + date.getDate() + " ";
        } else {
            timeString = date.getFullYear() + ' ' + monthNames[date.getMonth()] + ' ' + date.getDate() + ' ';
        }
        //console.log(timeString);
        return timeString;
    };
    
};