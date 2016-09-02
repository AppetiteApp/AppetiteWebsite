var cfg = require('../configs/config.json');
var stripe = require('stripe')(cfg.stripeTestPlatformSecretKey);

stripe.createNewStripeAccountWithUid= function(uid, processAccount){
    if (uid){
        global.sensitiveUserRef.child(uid).once('value').then(function(snapshot){
            var user = {};
            if (snapshot.val()) {
                user = snapshot.val();
                //if user already has a stripe account, return 0
                if (user.stripe){
                    processAccount(0);
                }
            }
            //if user doesn't have a stripe account, create stripe account with country
            //tos acceptance & ip & date
            user.stripe = {};
            stripe.accounts.create({
                country: "CA",
                managed: true
            }, function(err, account){
                if (err) console.log(err);
                console.log(account);
                user.stripe = {};
                user.stripe.id = account.id;
                global.sensitiveUserRef.child(uid).set(user);
                processAccount(account);
            });
            
        }, function(err){return 0;});
    }
};

stripe.getAccountByAccountId = function(accountNum, processAccount){
    stripe.accounts.retrieve(accountNum, function(err, account){
            if (err) {
                console.log(err);
                console.log(err);
                processAccount(0);
            } else {
                processAccount(account);
            }
        });
};


module.exports = stripe;