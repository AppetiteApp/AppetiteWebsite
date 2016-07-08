var globals = require('../configs/globals');

module.exports = function(app) {

	
	//function to submit a dish
	//when user submits a dish via a post request to "/submitdish"
	//set a new dish key & store stuff in the dish/ ref in firebase
	//and push that dish key into an array in that user's mealsMade array
	//check for latlng key in req.body, if there is, store it in the dish; if not, get latlng from user & store in dish
	//TODO: add regex control
	app.post('/newdish', function(req, res, next){

		//console.log(req);
		var data = req.body;
		var error = [];
		var warnings = [];
		var dishObject = {
			date: Date()
		};
		
		if (!data.uid) {
			res.end({
				errorType	: "uid",
				errorMessage: "You didn't send the userid."
			});
			return;
		}
		
		//check if dishName is present and valid
		if (!data.dishName) {
			error.push({
				errorType	: "dishName",
				errorMessage: "No dish name submitted."
			});
		} else if (!globals.dishNameRegex.test(data.dishName)){
			error.push({
				errorType	:"dishName",
				errorMessage: "Invalid characters in dish's name."
			});
		} else {
			dishObject.dishName = data.dishName;
		}
		
		//check if location is present and valid
		if (!data.location) {
			error.push({
				errorType	: "location",
				errorMessage: "You didn't send the location"
			});
		} else if (!globals.addressRegex.test(data.location)){
			error.push({
				errorType	: "location",
				errorMessage: "Invalid characters in location"
			});
		} else {
			dishObject.location = data.location;
		}
		
		//check if description is present and valid
		if (!data.description) {
			warnings.push({
				warningType		: "description",
				warningMessage	: "No description entered"
			});
			dishObject.description = "";
		} else if (!globals.commentRegex.test(data.description)){
			warnings.push({
				warningType		: "description",
				warningMessage	: "Invalid characters in description"
			});
		} else {
			dishObject.description = data.description;
		}
		
		//check if price is present and valid
		if (!data.price) {
			error.push({
				errorType	: "price",
				errorMessage: "No price entered"
			});
		} else if (!globals.priceRegex.test(data.price)){
			error.push({
				errorType	: "price",
				errorMessage: "Invalid characters in price"
			});
		} else {
			dishObject.price = data.price;
		}
		
		//check if time is entered, regex not added yet bc I want to further change the time input
		//into a period of time as well as only store year/month/day/hour/min
		if (!data.time) {
			error.push({
				errorType		: "time",
				errorMessage	: "No time entered"
			});
		} else {
			dishObject.time = data.time;
		}
		
		
		//check if portions is entered, if not, set at 1
		if (!data.portions) {
			warnings.push({
				warningType		: "portion",
				warningMessage	: "No portion entered, default is at 1"
			});
			dishObject.portion = 1;
		} else if (!globals.onlyIntsRegex.test(data.portions)){
			error.push({
				errorType		: "portion",
				errorMessage	: "Invalid characters in prportionice"
			});
		} else {
			dishObject.portion = data.portions;
		}
		
		//check if ingredients are there
		//check regex later cuz I didn't write it yet
		if (!data.ingredients) {
			warnings.push({
				warningType: "ingredients",
				warningMessage: "no ingredients entered"
			});
			dishObject.ingredients = "Please ask cook";
		} else {
			dishObject.ingredients = data.ingredients;
		}
		
		//go and make a new dish under "dish" in db
		var newDishRef = global.dishRef.push();
		var newDishKey = newDishRef.key;
		
		console.log(dishObject);
		newDishRef.set(dishObject);
		
		if(req.body.lng & req.body.lat){
			newDishRef.update ({
				lat: req.body.lat,
				lng: req.body.lng
			});
		} else {
			global.userRef.child(req.body.uid).once('value', function(snapshot){
				if (!snapshot.val().lat || !snapshot.val().lng){
					error.push({
						errorType: "latlng",
						errorMessage: "User doesn't have a lat/lng and user didn't specify a lat/lng with dish"
					});
				} else {
					newDishRef.update({
						lat: snapshot.val().lat,
						lng: snapshot.val().lng
					});
				}	
			});
		}
		
		global.userRef.child(req.body.uid).once("value", function(snapshot){
			console.log(snapshot.val());
			var meals;
			if (!snapshot.val().mealsMade){
				meals = [newDishKey];
			} else {
				meals = snapshot.val().mealsMade;
				meals.push(newDishKey);
			}
			console.log("Meals Made: " + meals);
			global.userRef.child(req.body.uid).update({
				"mealsMade": meals
			});

			// global.dishRef.child(newDishKey).once("value", function(snapshot){
			// 	console.log(snapshot.val().firstName);	
			// });
			
			newDishRef.update({
				"owner": snapshot.val().firstName
			});
			
		});
		res.send({
			error: error,
			warnings: warnings,
			message: "ok"
		});
		
		//update user's mealsMade
	});
	
	
	//to edit a dish....will complete first thing tmr but I'm dozing offf
	       // $http.post('/api/dish/edit', {
        //     key         : dish.key,
        //     delete      : dish.delete,
        //     dishName    : dish.dishName,
        //     address     : dish.address,
        //     uid         : $scope.user.uid,
        //     description : dish.description,
        //     price       : dish.price,
        //     time        : dish.time,
        //     portions    : dish.portions
        // })
	app.post('/api/dish/edit', function(req, res){
		//if no uid sent, return error
		if (!req.body.uid) {
			res.end({
				errorType: "uid",
				errorMessage: "No uid sent"
			});
			return;
		}

		//Promises are bomb, don't get stuck in callback hell!		
		// global.userRef.child(req.body.uid).once("value", function(snapshot){
			
		// });
		
		//if no uid sent, return error
		if (!req.body.key) {
			res.end({
				errorType: "uid",
				errorMessage: "No uid sent"
			});
			return;
		}
		
		if (!req.body.zip & !req.body.lat & !req.body.lng & !req.body.phone & !req.body.address & !req.body.fname 
			& !req.body.lname) {
			res.end({
				errorType: 'content',
				errorMessage: "There's nothing to change"
			});
			return;
		}
		
		var update = {};
		var error = [];
	});
	
	
	
	
	//edit a user's account
	//check if the a valid change is in req.body, if yes then update
	app.post('/api/account/edit', function(req, res, next){

		//if frontend didn't send uid, return error
		if (!req.body.uid) {
			res.end({
				errorType: "uid",
				errorMessage: "No uid sent"
			});
			return;
		}
		
		var update = {};
		var error = [];
		
		if (!req.body.zip & !req.body.lat & !req.body.lng & !req.body.phone & !req.body.address & !req.body.fname 
			& !req.body.lname) {
			res.end({
				errorType: 'content',
				errorMessage: "There's nothing to change"
			});
			return;
		}
		
		//need to add a zipRegex	
		if (req.body.zip) {
			update.zip = req.body.zip;
		}
		
		if (req.body.fname) {
			if (!globals.individualNameRegex.test(req.body.fname)){
				error.push({
					errorType: "fname",
					errorMessage: "invalid characters in fname"
				});
			} else {
				update.firstName = req.body.fname;
			}
		}
		
		if (req.body.lname) {
			if (!globals.individualNameRegex.test(req.body.lname)){
				error.push({
					errorType: "lname",
					errorMessage: "invalid characters in lname"
				});
			} else {
				update.lastName = req.body.lname;
			}
		}
		
		//if there is lat and lng in the update object, 
			//check regex, then either push an error or an update
		//if not lat/lng present, do nothing
		if (req.body.lat & req.body.lng) {
			if (!globals.latLngRegex.test(req.body.lat) || !globals.latLngRegex.test(req.body.lng)){
				error.push({
					errorType: "latlng",
					errorMessage: "Invalid characters in lat/lng"
				});
			}
			update.latlng = {
				lat: req.body.lat,
				lng: req.body.lng
			};
		}
		
		//phone updates
		if (req.body.phone) {
			if (!globals.phoneRegex.test(req.body.phone)){
				error.push({
					errorType: "phone",
					errorMessage: "Invalid characters in phone"
				});
			} else {
				update.phone = req.body.phone;
			}	
		}
		
		//address updates
		if (req.body.address) {
			if (!globals.addressRegex.test(req.body.address)){
				error.push({
					errorType: "address",
					errorMessage: "Invalid characters in address"
				});
			} else {
				update.address = req.body.address;
			}	
		}
		
		//updates stuff and sends info regarding success and errors in to browser
		if (error.length == 0 ) {
			global.userRef.child(req.body.uid).update(update);
			res.send({
				status: 200,
				message: "success"
			});
		} else if (update){
			global.userRef.child(req.body.uid).update(update);
			res.send({
				status: 201,
				message: "partially updated",
				error: error
			});
		} else {
			res.send({
				status: 500,
				message: "invalid user of api",
				error: error
			});
		}
		
	});
};