var stripe = require('../models/stripe.model');

module.exports = function(app){
    
    //function called to create stripe account
    app.post('/api/createStripeAccount', function(req, res){
        console.log(req.body);
        console.log(req.session);
        if (req.session){
            if (req.session.uid){
                if (!req.session.emailVerified ){
                    res.send("Email not verified");
                } else {
                    console.log("create Stripe account");
                    stripe.createNewStripeAccountWithUid(req.session.uid, function(account){
                        if (account){
                            res.send("success");
                            console.log(account);
                            return;
                        } else {
                            res.send("invalid request");
                            return;
                        }
                    });
                }
            }
        } else {
            var timeNow = new Date();
            console.log("User didn't login and requested to create a stripe account at " + timeNow.toDateString());
            res.send("invalid request");
        }
        

    });
    
    app.post('/api/getMyAccount', function(req, res){
        if (!req.session){
            res.send("invalid request");
            return;
        } else if (!req.session.uid){
            res.send("invalid request");
            return;
        }
        
        console.log("got request");
        if (req.session.uid){
            //find the accountId of the person, if s/he has one, 
            global.sensitiveUserRef.child(req.session.uid).once("value", function(snapshot){
                if (!snapshot.val()) {
                    res.send("invalid request");
                } else if (!snapshot.val().stripe){
                    res.send("invalid request");
                } else if (snapshot.val().stripe.id){
                    //call the getAccountByAccountId function on stripe and pass function to process returned account on it
                    stripe.getAccountByAccountId(req.body.accountNum, function(account){
                        if (account){
                            console.log("got account");
                            console.log(account);
                            res.send(account);
                        } else {
                            console.log("failed to retrieve data from stripe");
                            res.send("invalid request");
                        }    
                    }); //end stripe getAccountByAccountId function
                } else {
                    res.send("invalid request");
                }
                
            });
            
            
            
        }
    });
};