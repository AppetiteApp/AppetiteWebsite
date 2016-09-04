var cfg = require('../configs/config.json');
var stripe = require('stripe')(cfg.stripeTestPlatformSecretKey);

stripe.createNewStripeAccount= function(uid, dob, firstName, lastName, tosIp, callback){
    if (uid){
        global.sensitiveUserRef.child(uid).once('value').then(function(snapshot){
            var user = {};
            if (snapshot.val()) {
                user = snapshot.val();
                //if user already has a stripe account, return 0
                if (user.stripe){
                    callback(0);
                }
            }
            //if user doesn't have a stripe account, create stripe account with country
            //tos acceptance & ip & date
            user.stripe = {};
            stripe.accounts.create({
                country: "CA",
                managed: true,
                default_currency: "cad",
                legal_entity: {
                    type: "individual",
                    dob: {
                        day: dob.day,
                        month: dob.month,
                        year: dob.year
                    },
                    first_name: firstName,
                    last_name: lastName
                },
                tos_acceptance: {
                    date: Math.floor(Date.now() / 1000),
                    ip: tosIp
                }
            }, function(err, account){
                if (err) {
                    console.log(err);
                    callback(account);
                }else {
                console.log(account);
                    user.stripe = {};
                    user.stripe.id = account.id;
                    global.sensitiveUserRef.child(uid).set(user);
                    callback(account);
                }
            });
            
        }, function(err){return 0;});
    }
};

//get a managed account from stripe by account id
stripe.getAccountByAccountId = function(accountNum, callback){
    stripe.accounts.retrieve(accountNum, function(err, account){
            if (err) {
                console.log(err);
                console.log(err);
                callback(0);
            } else {
                callback(account);
            }
        });
};

stripe.updateAccountAddress = function(accountNum, callback){
    
};


module.exports = stripe;