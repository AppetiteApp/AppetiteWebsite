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
            snapshot.val().forEach(function(dish){
                var timeNow = new Date();
                var dishTime = new Date(dish.time.startTime);
                timeNow.setHours(0, 0, 0, 0);
                dishTime.setHours(0, 0, 0, 0);
                if (dishTime.toString() < timeNow.toString()){
                    dish.active = false;
                }
            });
            console.log(snapshot.val());
            
            
            
            
            
        });
        
        
        res.send("Hi!");
        
        
        
    });
    
    
};