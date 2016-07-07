var globals = require('../configs/globals');

module.exports = function(app) {

	
	//function to submit a dish
	//when user submits a dish via a post request to "/submitdish"
	//set a new dish key & store stuff in the dish/ ref in firebase
	//and push that dish key into an array in that user's mealsMade array
	//check for latlng key in req.body, if there is, store it in the dish; if not, get latlng from user & store in dish
	//TODO: add regex control
	app.post('/newdish', function(req, res, next){
		//go and make a new dish under "dish" in db
		var newDishRef = global.dishRef.push();
		var newDishKey = newDishRef.key;
		//console.log(req);
		var data = req.body;
		var error = [];
		
		if (!req.body.uid) {
			res.send({
				errorType: "uid",
				errorMessage: "You didn't send the userid"
			});
		}
		
		console.log(data);
		newDishRef.set({
			dishName	: req.body.dishName,
			location	: req.body.location,
			uid			: req.body.uid,
			description	: req.body.description,
			price		: req.body.price || "Please contact cook",
			time		: req.body.time || "Please contact cook",
			portions	: req.body.portions || 1,
			dateAdded	: Date(),
			owner		: "",
			ingredients	: req.body.ingredients || "Please ask cook"
		});
		
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
				"owner": snapshot.val().firstName + "" + snapshot.val().lastName
			});
			
		});
		res.send("success");
		
		//update user's mealsMade
	});
	
	
	
	
	//edit a user's account
	//check if the a valid change is in req.body, if yes then update
	app.post('/api/account/edit', function(req, res, next){

		if (!req.body.uid) {
			res.send({
				errorType: "uid",
				errorMessage: "No uid sent"
			});
		}
		
		var update = {};
		var error = [];
		
		if (!req.body.zip & !req.body.lat & !req.body.lng & !req.body.phone & !req.body.address & !req.body.fname 
			& !req.body.lname) {
			res.send({
				errorType: 'content',
				errorMessage: "There's nothing to change"
			});
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