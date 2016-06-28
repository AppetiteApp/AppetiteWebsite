module.exports = function(app) {
	//function to submit a dish
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
	
	
	//function to browse all dishes, TODO: make pretty and render with frontend
	app.get('/browse', function(req, res, next){
		global.dishRef.orderByChild("dateAdded").once("value", function(snapshot){
			res.send(snapshot.val());	
		});
	});
	
	
	//view a person's account
	app.get('/myaccount', function(req, res, next){
		global.userRef.child(req.body.uid).once("value", function(snapshot){
			res.send(snapshot.val());	
		});
	});
	
	
	//edit a user's account
	app.post('/user/edit', function(req, res, next){
		
	});
};