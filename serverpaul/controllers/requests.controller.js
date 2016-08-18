function makeCode() {
    var text = "";
    //var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    //we may have people manually entering the code, so make it less difficult for them
    var possible = "0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};

module.exports = function(app){
    //when user requests a meal
    //add to their list of activeMeals
    //set pending to True
    //autoset requestTime
    // app.post('/api/requestMeal', function(req, res){
    // 	//if no uid sent, send back err
    // 	if (!req.body.uid || !req.body.dishid) {
    // 		res.send({
    //             errors: [{
    // 			    errorType: "ids",
    // 			    errorMessage: "no uid/dishid sent"
    // 		    }]
    //         });
    // 		return;
    // 	}

    //     var errors = [];
    //     var userRequest = {};
    //     var purchaseRequest = {};

    //     //validate uid; snapshot.val() is null if uid doesn't exist
    //     global.userRef.child(req.body.uid).once('value').then(function(snapshot){
    //         console.log(snapshot.val());
    //         if (!snapshot.val()){
    //             res.send({
    //                 errorType: 'uid',
    //                 errorMessage: "invalid uid"
    //             });
    //             return;
    //         } else if (snapshot.val().activeMeals){
    //             if (snapshot.val().activeMeals[req.body.dishid]){
    //                 res.send({
    //                     errors: [{
    //                         errorType: "request",
    //                         errorMessage: "Cannot request the same meal twice"
    //                     }]
    //                 });
    //                 return;
    //             }
    //         } 

    //         if (snapshot.val().mealsMade){
    //             console.log(snapshot.val().mealsMade);
    //             console.log(snapshot.val().mealsMade.indexOf(req.body.dishid));
    //             if (snapshot.val().mealsMade.indexOf(req.body.dishid) >=0){
    //                 res.send({
    //                     errors: [{
    //                         errorType: "request",
    //                         errorMessage: "Cannot request your own meals"
    //                     }]
    //                 });
    //                 return;
    //             }
    //         }
    //     }, function(err){
    //         console.log(err);
    //     });

    //     //validate dishid; snapshot.val() is null if dishid doesn't exist
    //     global.dishRef.child(req.body.dishid).once('value').then(function(snapshot){
    //         //dishid must be valid
    //         if (!snapshot.val()){
    //             res.send({
    //                 errorType: 'dishid',
    //                 errorMessage: 'Invalid dishid'
    //             });
    //             return;

    //         //should not be able to request your own meals
    //         } else if (snapshot.val().ownerid === req.body.uid){
    //             res.send({
    //                 errors: [{
    //                     errorType: "request",
    //                     errorMessage: "Cannot request your own meals"
    //                 }]
    //             });
    //             return;
    //         }else if (snapshot.val().purchases){
    //             if (snapshot.val().purchases[req.body.uid]){
    //                 res.send({
    //                     errors: [{
    //                         errorType: "request",
    //                         errorMessage: "Cannot request the same meal twice"
    //                     }]
    //                 });
    //                 return;
    //             }
    //         }else {
    //             //store dish info? or manipulate dish from here
    //             //save stuff about the dish
    //             userRequest.chefId = snapshot.val().ownerid;
    //             userRequest.pending = true;
    //             userRequest.requestTime = new Date();
    //             purchaseRequest.pending = true;

    //             var purchases = {};

    //             if (snapshot.val().purchases) purchases = snapshot.val().purchases;
    //             purchases[req.body.uid] = purchaseRequest;
                
    //             global.dishRef.child(req.body.dishid).update({
    //                 purchases: purchases
    //             });

    //             //update user's active meals
    //             global.userRef.child(req.body.uid).once("value").then(function(snapshot){
    //                 var activeMeals = {};

    //                 //if there already exists a list of active meals, put them in array first
    //                 if (snapshot.val().activeMeals) activeMeals = snapshot.val().activeMeals;
    //                 activeMeals[req.body.dishid] = userRequest;
                    
                
    //                 //update
    //                 global.userRef.child(req.body.uid).update({activeMeals: activeMeals});

    //                 res.send({
    //                     message: "success"
    //                 });

    //             }, function(err){
    //                 errors.push({
    //                     errorType: "user",
    //                     errorMessage: err
    //                 });
    //             });
    //         }
    //     }, function(err){
    //         console.log(err);
    //     });
    

    // });


    //when chef clicks accept or decline
    //send back the requestPersonId & accept & uid & dishid
    //change the user's pending to false
    	//if accepted, change confirmed=true, generate confirmationCode
    	//display the phone and the address of chef to user
    	//display phone of buyer to chef, give confirmationCode to buyer & chef
    // app.post('/api/requestResponse', function(req, res){
    //     if (!req.body.uid || !req.body.requestPersonId || !(req.body.accept === true || req.body.accept === false) || !req.body.dishid){
    //         res.send({
    //             errors: [{
    //                 errorType: "info",
    //                 errorMessage: "missing info"
    //             }]
    //         });
    //         return;
    //     }
    //     //test if requestPersonId is valid
    //     global.userRef.child(req.body.requestPersonId).then(function(snapshot){
    //         if (!snapshot.val()){
    //             res.send({
    //                 errors: [{
    //                     errorType: "info",
    //                     errorMessage: "invalid info"
    //                 }]
    //             });
    //             return;
    //         } else if(snapshot.val().activeMeals) {
    //             if (!snapshot.val().activeMeals[req.body.dishid]){
    //                 res.send({
    //                     errors: [{
    //                         errorType: "request",
    //                         errorMessage: "user have not requested this meal"
    //                     }]
    //                 });
    //                 return;
    //             }
    //         } else {
    //             res.send({
    //                 errors: [{
    //                     errorType: "request",
    //                     errorMessage: "user have not requested this meal"
    //                 }]
    //             });
    //             return;
    //         }
            
            
            
    //     }, function(err){
    //       console.log(err); 
    //     });
        
    //     global.dishRef.child(req.body.dishid).once("value").then(function(snapshot){
    //         if (snapshot.val().ownerid !== req.body.uid){
    //             res.send({
    //                 errors: [{
    //                     errorType: "uid",
    //                     errorMessage: "uid not a match"
    //                 }]
    //             });
    //             return;
    //         }
            
    //         if (snapshot.val().purchases){
    //             //try to find a record of 
    //             if (!snapshot.val().purchases[req.body.requestPersonId]){
    //                 res.send({
    //                     errors: [{
    //                         errorType: "request",
    //                         errorMessage: "invalid request: the user haven't requested this meal"
    //                     }]
    //                 });
    //                 return;
    //             } else {
    //                 var requestObj = snapshot.val().purchases[req.body.requestPersonId];
    //                 console.log(requestObj);
    //                 requestObj.pending = false;
    //                 requestObj.confirmed = req.body.accept;
    //                 //if chef accepted, then generate confirmCode & store for both people
    //                 if (req.body.accept){
    //                     var confirmCode = makeCode();
    //                     requestObj.confirmCode = confirmCode;
    //                     console.log("Confirmation code is: " + confirmCode);
    //                 }
    //             }
    //         }

            

    //     }, function(err){
    //         console.log(err);
    //     });


    // }); //end function POST /api/accept
    
    app.post('/api/orderDish', function(req, res){
        
    }); //end POST /api/orderDish
    
    //call this function to cancel a meal request,
    //calling this function doesn't remove the transaction history
    //creates an object to store information on the request: meal (time of request, chef, owner, etc) and
        // cancellation (who cancelled it and for what reason?)
    // keep a log
    // only buyers can cancel (for now)
    app.post('/api/cancelRequest', function(req, res){
        if (!req.body.uid || !req.body.personType || !req.body.dishid){
            res.send({
                errors: [{
                    errorType: "info",
                    errorMessage: "missing info"
                }]
            });
        }
        
        //verify that uid is valid, user has requested said meal, chef have not responded yet
        global.userRef.child(req.body.uid).once("value").then(function(snapshot){
            var errors = [];
            if (!snapshot.val()) {
                errors = [{
                    errorType: "uid",
                    errorMessage: "uid invalid"
                }];
            } else if (!snapshot.val().activeMeals) {
                errors = [{
                    errorType: "dish",
                    errorMessage: "no active meals pending confirmation"
                }];
            } else if (!snapshot.val().activeMeals[req.body.dishid]){
                errors = [{
                    errorType: "dish",
                    errorMessage: "invalid dishid"
                }];
            } else if (snapshot.val().activeMeals[req.body.dishid].pending === false){
                errors = [{
                    errorType: "dish",
                    errorMessage: "cannot cancel a meal after the chef responds"
                }];
            }
            if (errors.length){
                res.send({
                    errors: errors
                });
                return;
            }
            
            //verify dishid is valid & user has requested dish
            global.dishRef.child(req.body.dishid).once("value", function(snapshot){
                if (!snapshot.val()) {
                    errors = [{
                        errorType: "dish",
                        errorMessage: "invalid dishid"
                    }];
                } else if (!snapshot.val().purchases){
                    errors = [{
                        errorType: "dish",
                        errorMessage: "request to purchase meal doesn't exist"
                    }];
                } else if(!snapshot.val().purchases[req.body.uid]){
                    errors = [{
                        errorType: "dish",
                        errorMessage: "request to purchase meal doesn't exist"
                    }];
                } else if (snapshot.val().purchases[req.body.uid].pending === false){
                    errors = [{
                        errorType: "cancellation",
                        errorMessage: "unable to find purchase record"
                    }];
                }
                if (errors.length){
                    res.send({
                        errors: errors
                    });
                    return;
                }
                
                var newCancelRef = global.cancelRef.push();
                newCancelRef.set({
                    date: new Date(),
                    buyerid: req.body.uid,
                    chefid: snapshot.val().ownerid,
                    dish: {
                        dishName: snapshot.val().dishName,
                        description: snapshot.val().description,
                        id: snapshot.key
                    },
                    personType: req.body.personType,
                    requestDate: snapshot.val().purchases[req.body.buyerid].requestTime
                });
                
                
                global.dishRef.child(req.body.dishid).child('purchases').child(req.body.uid).remove();
                global.dishRef.child(req.body.dishid).child('purchases').child(req.body.uid).set({
                    cancelled: new Date()
                });
                global.userRef.child(req.body.uid).child('activeMeals').child(req.body.dishid).remove();
                global.userRef.child(req.body.uid).child('activeMeals').child(req.body.dishid).update({
                    canceled: new Date()
                });
                
                res.send({
                    message: "success"
                });
                
                
            }, function(err){
                res.send({
                    errors: [{
                        errorType: "firebase error",
                        errorMessage: err
                    }]
                });
                return;
            });
            
            
        }, function(err){
            res.send({
                errors: [{
                    errorType: "firebase",
                    errorMessage: err
                }]
            });
            return;
        });
    }); //end function POST /api/cancelMeal

};



