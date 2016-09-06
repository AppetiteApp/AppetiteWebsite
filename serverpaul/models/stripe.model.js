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
                    last_name: lastName,
                    address: {
                        city: "Monteral",
                        country: "CA",
                        line1: "4235 Rue St. Urban",
                        postal_code: "H2W 1V6",
                        state: "Qc"
                    }
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

//to update the legal_entity.address.city, legal_entity.address.line1, legal_entity.address.postal_code, legal_entity.address.state
stripe.updateAccountAddress = function(city, addLine1, addLine2, postal, state, uid, callback){
    //get the stripe account num from firebase 
    global.sensitiveUserRef.child(uid).once("value").then(function(snapshot){
        if (snapshot.val()){
            var updateAddress = {
                legal_entity: {
                    personal_address: {
                        city: city,
                        line1: addLine1,
                        postal_code: postal,
                        state: state
                    }    
                }
            };
            if (addLine2){
                updateAddress.legal_entity.address.line2 = addLine2;
            }
            
            if (snapshot.val().stripe){
                if (snapshot.val().stripe.id){
                    var id = snapshot.val().stripe.id;
                    console.log(id);
                    stripe.accounts.update(id, updateAddress).then(function(account){
                        if (account) {
                            callback(account);
                        } else {
                            callback(0);
                        }
                    }).catch(function(err){
                        console.log(err);
                        callback(0);
                    }); //end stripe update
                } else {callback(0);}
            } else {callback(0);}
        } else {
            callback(0);
        }    
    }, function(err){
        callback(0);
    }); //end retrieve accountNum from firebase with uid
};

stripe.updateStripePersonalId = function(accountid, id, uid, callback){
    var update = {
        legal_entity: {
            personal_id_number: id
        }
    };
    stripe.accounts.update(accountid, update).then(function(account){
        console.log(account);
        if (account){
            callback(account);
        } else {callback(0);}
    }, function(err){
        console.log(err);
        callback(0);    
    });    
};
    

module.exports = stripe;