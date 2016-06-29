module.exports = function(app) {
	
	app.post('/login', function(req, res, next){
		req.session.uid = req.body.uid;
		next();	
	});
	
	//function to submit a dish
	//when user submits a dish via a post request to "/submitdish"
	//set a new dish key & store stuff in the dish/ ref in firebase
	//and push that dish key into an array in that user's mealsMade array
	app.post('/submitdish', function(req, res, next){
		//go and make a new dish under "dish" in db
		var newDishRef = global.dishRef.push();
		var newDishKey = newDishRef.key;
		//console.log(req);
		var data = req.body;
		
		console.log(data);
		newDishRef.set({
			dishName: req.body.dishName,
			location: req.body.location,
			uid: req.body.uid,
			description: req.body.description,
			price: req.body.price || "Please contact cook",
			time: req.body.time || "Please contact cook",
			portions: req.body.portions || 1,
			dateAdded: Date()
		});
		
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
		});
		res.send("success");
		
		//update user's mealsMade
	});
	
	
	//view a person's account
	//if I set a session then it gives back the user's account info, in JSON form
	app.post('/myaccount', function(req, res, next){
		if (req.body.uid){
			global.userRef.child(req.body.uid).once("value", function(snapshot){
				res.JOSN(snapshot.val());
			});	
		} else {
			//redirect to some login page, like amazon does it!
			res.send({
				statusCode: 403,
				errorMessage: "You're not logged in"
			});
		}
		next();
	});
	
	
	//edit a user's account
	//gonna work on this tmr...go sleep now
	app.post('/myaccount/edit', function(req, res, next){
		var resp = [];
		if (!global.individualNameRegex.test(req.body.fname) || !global.individualNameRegex.test(req.body.lname)){
			resp.push({
				errorType: "name",
				errorMessage: "invalid characters in first name or last name"
			});
		}
		
		if (!global.phoneRegex.test(req.body.phone)){
			resp.push({
				errorType: "phone",
				errorMessage: "invalid characters in phone"
			});
		}
		
		if(!global.addressRegex.test(req.body.location)){
			resp.push({
				errorType: "location",
				errorMessage: "invalid characters in location"
			});
		}
		
		if (!req.body.uid){
			resp.push({
				errorType: "user",
				errorMessage: "no user logged in"
			});
		}
		
		if (resp.length === 0) {
			global.userRef.child(req.body.uid).update({
				firstName: req.body.fname,
				lastName: req.body.lname,
				phone: req.body.phone,
				location: req.body.location || ""
			});	
			resp = {
				statusCode: 200,
				errorMessage: "no errors"
			};
		}
		
		res.JSON(resp);
	});
};