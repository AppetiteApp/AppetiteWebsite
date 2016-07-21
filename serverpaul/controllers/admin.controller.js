var globals = require('../configs/globals');

module.exports = function(app) {
    //manually take down meals at the end of the day:
    app.post('/api/admin/inactivate', function(req, res){
        //admin key is to make sure not everyone can 
        if (req.body.adminKey !== "1430B Frontenac") {
            res.send("Invalid resquest");
            return;
        }
        res.send("Hi!");
        
        
        
    });
    
    
};