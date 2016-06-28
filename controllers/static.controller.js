module.exports = function(app) {
    
    //home page, if there's no session, render the page, send session.hasSession = false
    app.get('/about', function(req, res){
        var resp = {};
        //if (!req.session.inSession) {
            res.render(__dirname + '/../views/about');
        //}
    });
    
    app.get('/advertisements', function(req, res){
        res.render(__dirname + '/../views/advertisement', 
            {meals: 
                [
                    {
                        dish: "Pasta",
                        price: "1000",
                        contact: "514-444-4444",
                        location: "3445 Stanley",
                        description: "Cheryl is testing this template"
                    }    
                    
                ]
            });
    });

    app.get('/index', function(req, res){
        res.render(__dirname + '/../views/signup');
    })
}