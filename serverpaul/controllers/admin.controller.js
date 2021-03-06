var globals = require('../configs/globals');

module.exports = function(app) {
    //manually take down meals at the end of the day:
    app.post('/api/admin/inactivate', function(req, res){
        //admin key is to make sure not everyone can 
        if (req.body.adminKey !== "1430B Frontenac") {
            res.send("Invalid resquest");
            return;
        }
        
        //take down meals occuring before yesterday (on the assumption that we do this in the wee hours of the morning)
        global.dishRef.once("value", function(snapshot){
            console.log(snapshot.val());
            var dishes = snapshot.val();
            for (var key in snapshot.val()){
                //console.log(snapshot.val()[key]);
                var timeNow = new Date();
                var dishTime = new Date(dishes[key].time.startTime);
                timeNow.setHours(0, 0, 0, 0);
                dishTime.setHours(0, 0, 0, 0);
                console.log(timeNow.getTime() - dishTime.getTime());
                if (timeNow.getTime() - dishTime.getTime() > 0){
                    console.log(snapshot.val()[key].active);
                    dishes[key].active = false;
                }
                console.log("dish time: " + dishTime.getTime() + "\ntime now: " + timeNow.getTime());
                global.dishRef.child(key).update({
                    active: false
                });
            }
            
            res.send("bo");
            
            
            
            
            
        });
        
    }); //end POST /api/admin/inactivate
    
    //query humans by email
    app.post('/api/admin/queryByEmail', function(req, res){
        //check for admin key
        if (req.body.adminKey !== "1430B Frontenac"){
            res.send("Invalid Request");
            return;
        }
        //check if email is present
        if (!req.body.email){
            res.send("Nothing to query");
            return;
        }
        
        global.userRef.child('users').orderByChild('email').equalTo(req.body.email).once("value", function(snapshot){
            if (snapshot.val()){
                res.send(snapshot.val());
            } else {
                res.send("Invalid query");
            }
        });
    }); //end POST /api/admin/queryByEmail
};