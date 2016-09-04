// function makeCode() {
//     var text = "";
//     //var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//     //we may have people manually entering the code, so make it less difficult for them
//     var possible = "0123456789";

//     for( var i=0; i < 5; i++ )
//         text += possible.charAt(Math.floor(Math.random() * possible.length));

//     return text;
// };

module.exports = function(app){
    //when user orders a meal
    //check orderby time and the currect time
    //store the order under dish and under the buyer
    app.post('/api/orderdish', function(req, res){
    	//if no uid sent, send back err
    	if (!req.session){
    	    res.send("invalid request");
    	    console.log("No session");
    	} else if (!req.session.uid || !req.body.dishid) {
    		res.send("invalid request");
    		console.log("No session");
    		return;
    	}

        var errors = [];
        var order = {};
        var dishInfo = {};

        //validate uid; snapshot.val() is null if uid doesn't exist
        global.userRef.child(req.session.uid).once('value').then(function(snapshot){
            
            if (!snapshot.val()){
                errors.push({
                    errorType: 'uid',
                    errorMessage: "invalid uid"
                });
            } else if (snapshot.val().activeMeals){
                if (snapshot.val().activeMeals[req.body.dishid]){
                    errors.push({
                        errorType: "request",
                        errorMessage: "Cannot request the same meal twice"
                    });
                }
            } else if (snapshot.val().currentlyCooking) {
                if (snapshot.val().currentlyCooking.indexOf(req.body.dishid) >=0){
                    errors.push({
                        errorType: "request",
                        errorMessage: "Cannot request your own meals"
                    });
                }
            }
            if (errors.length){
                res.send({
                    errors: errors,
                    message: 'Invalid Request'
                });
                return;
            } //end if-else check for uid
            
            var buyer = {
                name: snapshot.val().firstName + " " + snapshot.val().lastName,
                phone: snapshot.val().phone,
                rating: snapshot.val().buyerRating || undefined
            };
            
            var activeMeals = {};
            if (snapshot.val().activeMeals) activeMeals = snapshot.val().activeMeals;
            
            //validate dishid; snapshot.val() is null if dishid doesn't exist
            global.dishRef.child(req.body.dishid).once('value').then(function(snapshot){
                //dishid must be valid
                errors = [];
                var purchases = {};
                if (!snapshot.val()){
                    errors.push({
                        errorType: 'dishid',
                        errorMessage: 'Invalid dishid'
                    });
                //should not be able to request your own meals
                } else if (snapshot.val().ownerid === req.session.uid){
                    errors.push({
                        errorType: "request",
                        errorMessage: "Cannot request your own meals"
                    });
                }else if (snapshot.val().purchases){
                    var dishPurchases = snapshot.val().purchases;
                    if (dishPurchases[req.body.uid]){
                        errors.push({
                            errorType: "purchase",
                            errorMessage: "Cannot order a meal you've already ordered"
                        });
                    } else {
                        purchases = dishPurchases;
                    }
                }
                
                //should have a max portions, and check that
                
                //if it's later than the orderby time, push err
                var timeNow = new Date();
                var orderBy = new Date(snapshot.val().orderBy);
                if (orderBy.getTime() - timeNow.getTime() < 0){
                    errors.push({
                        errorType: "time",
                        errorMessage: "passed orderby time"
                    });
                }
                if (errors.length){
                    res.send({
                        errors: errors,
                        message: "Invalid Request"
                    });
                    return;
                }
                
                //store dish info? or manipulate dish from here
                //save stuff about the dish
                
                order.buyerid = req.session.uid;
                order.buyerName = buyer.name;
                order.buyerRating = buyer.rating || -1;
                order.buyerPhone = buyer.phone;
                order.requestTime = (new Date())+"";
                
                purchases[req.session.uid] = order;
                
                console.log(purchases);
                
                
                activeMeals[req.body.dishid] = {
                    chefid: snapshot.val().ownerid,
                    chefName: snapshot.val().owner,
                    location: snapshot.val().location,
                    phone   : snapshot.val().phone
                };
                
                global.dishRef.child(req.body.dishid).child("purchases").update(purchases);
                global.userRef.child(req.session.uid).child("activeMeals").update(activeMeals);
                
                res.send("success");
                
                

            
            }, function(err){
                console.log(err);
            }); //end fetch data from firebase for dishid
    
             
            
        }, function(err){
            console.log(err);
        }); //end fetch data from firebase for uid

    });

    
    //call this function to cancel a meal request,
    //calling this function doesn't remove the transaction history
    //creates an object to store information on the request: meal (time of request, chef, owner, etc) and
        // cancellation (who cancelled it and for what reason?)
    // keep a log
    // only buyers can cancel (for now)
    app.post('/api/cancelOrder', function(req, res){
        var errors = [];
        if (!req.session){
            res.send("invalid request");
            console.log("No session");
            return;
        } else if (!req.session.uid || !req.body.personType || !req.body.dishid){
            errors.push({
                errorType: "info",
                errorMessage: "incomplete info"
            });
        } else if (req.body.personType === 'buyer' || req.body.personType === 'chef' || req.body.personType === 'admin'){
            //do nothing
        } else {
            errors.push({
                errorType: 'personType',
                errorMessage: 'invalid type of person'
            });
        }
        
        if (errors.length){
            res.send("invalid request");
            console.log(errors);
            return;
        }
        
        //verify that uid is valid, user has requested said meal, chef have not responded yet
        global.userRef.child(req.session.uid).once("value").then(function(snapshot){
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
                
                    
                } else if(!(snapshot.val().purchases)[req.session.uid]){
                    errors = [{
                        errorType: "dish",
                        errorMessage: "request to purchase meal doesn't exist"
                    }];
                }
                
                //should not be able to cancel after the orderBy date has passed
                var orderBy = new Date(snapshot.val().orderBy);
                var timeNow = new Date();
                var startTime = new Date(snapshot.val().time.startTime);
                
                //should be, if you cancel the order after the orderBy time, then there's some penalization
                if (orderBy.getTime() - timeNow.getTime() < 0 || startTime.getTime() - timeNow.getTime() <= 1000*60*60*2){
                    errors.push({
                        errorType: "time",
                        errorMessage: "cannot cancel order after a certain time"
                    });
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
                    buyerid: req.session.uid,
                    chefid: snapshot.val().ownerid,
                    dish: {
                        dishName: snapshot.val().dishName,
                        description: snapshot.val().description,
                        id: req.body.dishid
                    },
                    personType: req.body.personType
                });
                
                var purchases = {};
                if (snapshot.val().purchases) {
                    purchases = snapshot.val().purchases;
                }
                purchases[req.session.uid] = undefined;
                global.dishRef.child(req.body.dishid).child('purchases').update(purchases);
                global.userRef.child(req.session.uid).child('activeMeals').child(req.body.dishid).remove();
                
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


    //buyer confirms that s/he has picked up the dish
    //buyer's uid, dish's id, chef's name
    app.post('/api/pickedUp', function(req, res){
        if (!req.session){
            res.send("invalid request");
            return;
        } else if (!req.session.uid || !req.body.dishid){
            res.send({
                errors: [{
                    errorType: "api",
                    errorMessage: "invalid user of api"
                }]
            });
            return;
        }
        
        var errors = [];
        
        
        global.userRef.child(req.session.uid).once('value').then(function(snapshot){
            if (!snapshot.val()){
                errors.push({
                    errorType: "database",
                    errorMessage: "invalid use of database"
                });
            } else if (!snapshot.val().activeMeals){
                errors.push({
                    errorType: "database",
                    errorMessage: "invalid use of database"
                });
            } else if (!snapshot.val().activeMeals[req.body.dishid]){
                errors.push({
                    errorType: "database",
                    errorMessage: "invalid use of database"
                });
            } else {
                var requestInfo = snapshot.val().activeMeals[req.body.dishid];
                if (requestInfo.pickedUp){
                    errors.push({
                        errorType: "database",
                        errorMessage: "invalid use of database"
                    });
                }
            }
            if (errors.length){
                res.send({
                    message: "request unsuccessful, invalid use of api"
                });
                return;
            }
            
            //get info from database
            global.dishRef.child(req.body.dishid).once('value').then(function(snapshot){
                var purchases;
                if (!snapshot.val()){
                    errors.push({
                        errorType: "database",
                        errorMessage: "invalid use of database"
                    });
                } else if (!snapshot.val().purchases){
                    errors.push({
                        errorType: "database",
                        errorMessage: "invalid use of database"
                    });
                } else {
                    purchases = snapshot.val().purchases;
                    if (!purchases[req.session.uid]){
                        errors.push({
                            errorType: "database",
                            errorMessage: "invalid use of database"
                        });    
                    } else if (purchases[req.session.uid]["pickedUp"]){
                        errors.push({
                            errorType: "purchase",
                            errorMessage: "already picked up"
                        });
                    }
                }
                if (errors.length){
                    res.send({
                        message: "request unsuccessful, invalid use of api"
                    });
                    console.log(errors);
                    return;
                }
                
                purchases[req.session.uid]["pickedUp"] = true;
                global.dishRef.child(req.body.dishid).update({purchases: purchases});
                
                //checks done, update and save info
                requestInfo.pickedUp = true;
                console.log("requestInfo");
                console.log(requestInfo);
                
                global.userRef.child(req.session.uid).child("activeMeals").child(req.body.dishid).update(requestInfo);
                
                console.log("purchases");
                console.log(purchases);
                
                res.send("success");
                
            }, function(err){
                errors.push({
                    errorType: "database",
                    errorMessage: "invalid use of database"
                });
            }); // end fetch firebase data for dish
        }, function(err){
            errors.push({
                errorType: "database",
                errorMessage: "invalid use of database"
            });
        }); // end fetch firebase data for user
        
    });
};



