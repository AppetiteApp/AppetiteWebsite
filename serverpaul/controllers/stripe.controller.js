var stripe = require('../models/stripe.model');

module.exports = function(app){
    
    //function called to create stripe account
    app.post('/api/createStripeAccount', function(req, res){
        if (req.session){
            if (req.session.user){
                if (req.session.user.emailVerified === false){
                    res.send("Email not verified");
                } else {
                    var stripeAccountInfo = stripe.createNewStripeAccountWithUid(req.session.user.uid);
                    if (!stripeAccountInfo){
                        console.log(stripeAccountInfo);
                        res.send("success");
                    } else {
                        console.log("Error in creating new stripe account");
                        res.send("invalid request");
                    }
                }
            }
        } else {
            var timeNow = new Date();
            console.log("User didn't login and requested to create a stripe account at " + timeNow.toDateString());
            res.send("invalid request");
        }
        

    });
};