module.exports = function(app){
    //when user requests a meal
    //add to their list of activeMeals
    //set pending to True
    //autoset requestTime
    app.post('/api/requestMeal/:dishId', function(req, res){
    	//if no uid sent, send back err
    	if (!req.body.uid) {
    		res.send({
    			errorType: "uid",
    			errorMessage: "no uid sent"
    		});
    		return;
    	}

    	var dishInfo;
    	var chef = {};
    	global.dishRef.child(req.params.dishId).once("value").then(function(snapshot){
    		//take out the chef's id
    		chef.id = snapshot.val().ownerid;
    		var newPurchaseRequest = {
    			buyerId: req.body.uid,
    			responded: false,
    		};
    		var purchases;
    		if (snapshot.val().purchases){
    			purchases = snapshot.val().purchases;
    			purchases.push(newPurchaseRequest);
    		} else {
    			purchases = [newPurchaseRequest];
    		}
    		global.dishRef.child(req.params.dishId).update({
    			purchases: purchases
    		});
    	}, function(err){
    		console.log(err);
    	});

    	global.userRef.child(req.body.uid).once("value").then(function(snapshot){
    		var activeMeals = [];
    		var requestedMeal = {
    				dishId: req.body.params.dishId,
    				chefId: chef.id,
    				pending: true,
    				requestTme: new Date()
    			};
    		if(!snapshot.val().activeMeals){
    			activeMeals = [requestedMeal];
    		} else {
    			activeMeals = snapshot.val().activeMeals;
    			activeMeals.push(requestedMeal);
    		}
    		//update
    		global.userRef.child(req.body.uid).update({activeMeals: activeMeals});

    	}, function(err){
    		console.log(err);
    	});

    	res.send("ok I'm not done with this");
    });


    //when chef clicks accept or decline
    //change the user's pending to false
    	//if accepted, change confirmed=true, generate confirmationCode
    	//display the phone and the address of chef to user
    	//display phone of buyer to chef, give confirmationCode to buyer & chef

};