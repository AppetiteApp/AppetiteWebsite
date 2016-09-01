var cfg = require('../configs/config.json');
var stripe = require('stripe')(cfg.stripeTestPlatformSecretKey);


stripe.createNewStripeAccountWithUid = function(uid){
    if (uid){
        global.sensitiveUserRef.child(uid).once('value').then(function(snapshot){
            var user = {};
            if (snapshot.val()) {
                user = snapshot.val();
                //if user already has a stripe account, return 0
                if (user.stripe){
                    return 0;
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
                user.stripe = account;
                global.sensitiveUserRef.child(uid).set(user);
                return user.stripe;
            });
            
        }, function(err){return 0;});
    }
};

module.exports = function(){
    return stripe;
}