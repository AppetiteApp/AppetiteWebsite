module.exports = function(app){
    //when user requests a meal
    //add to their list of activeMeals
    //set pending to True
    //autoset requestTime

    //issues: should not be able to request your own meals
            //
    app.post('/api/requestMeal', function(req, res){
    	//if no uid sent, send back err
    	if (!req.body.uid || !req.body.dishid) {
    		res.send({
                errors: [{
    			    errorType: "ids",
    			    errorMessage: "no uid/dishid sent"
    		    }]
            });
    		return;
    	}

        var errors = [];
        var userRequest = {};
        var purchaseRequest = {};

        //validate uid; snapshot.val() is null if uid doesn't exist
        global.userRef.child(req.body.uid).once('value').then(function(snapshot){
            console.log(snapshot.val());
            if (!snapshot.val()){
                res.send({
                    errorType: 'uid',
                    errorMessage: "invalid uid"
                });
                return;
            } else if (snapshot.val().activeMeals){
                if (snapshot.val().activeMeals[req.body.dishid]){
                    res.send({
                        errors: [{
                            errorType: "request",
                            errorMessage: "Cannot request the same meal twice"
                        }]
                    });
                    return;
                }
            }
        }, function(err){
            console.log(err);
        });

        //validate dishid; snapshot.val() is null if dishid doesn't exist
        global.dishRef.child(req.body.dishid).once('value').then(function(snapshot){
            if (!snapshot.val()){
                res.send({
                    errorType: 'dishid',
                    errorMessage: 'invalid dishid'
                });
                return;
            } else if (snapshot.val().purchases){
                if (snapshot.val().purchases[req.body.uid]){
                    res.send({
                        errors: [{
                            errorType: "request",
                            errorMessage: "Cannot request the same meal twice"
                        }]
                    });
                    return;
                }
            }else {
                //store dish info? or manipulate dish from here
                //save stuff about the dish
                userRequest.chefId = snapshot.val().ownerid;
                userRequest.pending = true;
                userRequest.requestTime = new Date();
                purchaseRequest.pending = true;

                var purchases = {};

                if (snapshot.val().purchases) purchases = snapshot.val().purchases;
                purchases[req.body.uid] = purchaseRequest;
                
                global.dishRef.child(req.body.dishid).update({
                    purchases: purchases
                });

                //update user's active meals
                global.userRef.child(req.body.uid).once("value").then(function(snapshot){
                    var activeMeals = {};

                    //if there already exists a list of active meals, put them in array first
                    if (snapshot.val().activeMeals) activeMeals = snapshot.val().activeMeals;
                    activeMeals[req.body.dishid] = userRequest;
                    
                
                    //update
                    global.userRef.child(req.body.uid).update({activeMeals: activeMeals});

                    res.send({
                        message: "success"
                    });

                }, function(err){
                    errors.push({
                        errorType: "user",
                        errorMessage: err
                    });
                });
            }
        }, function(err){
            console.log(err);
        });
    

    });


    //when chef clicks accept or decline
    //change the user's pending to false
    	//if accepted, change confirmed=true, generate confirmationCode
    	//display the phone and the address of chef to user
    	//display phone of buyer to chef, give confirmationCode to buyer & chef







};



