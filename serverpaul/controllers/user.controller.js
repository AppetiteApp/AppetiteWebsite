var globals = require('../configs/globals');

module.exports = function(app) {

	//edit a user's account
	//check if the a valid change is in req.body, if yes then update
	app.post('/api/account/edit', function(req, res, next){
		console.log(req.body);
		//if frontend didn't send uid, return error
		if (!req.body.uid) {
			res.send({
				errorType: "uid",
				errorMessage: "No uid sent"
			});
			return;
		}
		
		var update = {};
		var errors = [];
		
		if (!req.body.zip && !req.body.lat && !req.body.lng && !req.body.phone && !req.body.location && !req.body.firstName && !req.body.lastName && !req.body.description) {
			res.send({
				errorType: 'content',
				errorMessage: "There's nothing to change"
			});
			return;
		}
		
		if (req.body.description) {
		    update.description = req.body.description;
		}
		
		//need to add a zipRegex	
		if (req.body.zip) {
			update.zip = req.body.zip;
		}
		
		if (req.body.firstName) {
			if (!globals.individualNameRegex.test(req.body.fistName)){
				errors.push({
					errorType: "firstName",
					errorMessage: "Invalid characters in fist name"
				});
			} else {
				update.firstName = req.body.firstName;
			}
		}
		
		if (req.body.lastName) {
			if (!globals.individualNameRegex.test(req.body.lastName)){
				errors.push({
					errorType: "lastName",
					errorMessage: "Invalid characters in last name"
				});
			} else {
				update.lastName = req.body.lastName;
			}
		}
		
		//if there is lat and lng in the update object, 
			//check regex, then either push an error or an update
		//if not lat/lng present, do nothing
		if (req.body.lat & req.body.lng) {
			if (!globals.latLngRegex.test(req.body.lat) || !globals.latLngRegex.test(req.body.lng)){
				errors.push({
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
				errors.push({
					errorType: "phone",
					errorMessage: "Invalid characters in phone"
				});
			} else {
				update.phone = req.body.phone;
			}	
		}
		
		//address updates
		if (req.body.location) {
			//if (!globals.addressRegex.test(req.body.location)){
			//	errors.push({
			//		errorType: "location",
			//		errorMessage: "Invalid characters in location"
			//	});
			//} else {
				update.location = req.body.location;
			//}	
		}
		console.log("updates");
		console.log(update);
		
		//updates stuff and sends info regarding success and errors in to browser
		if (errors.length == 0 ) {
			global.userRef.child(req.body.uid).update(update);
			res.send({
				status: 200,
				message: "Successfully updated profile"
			});
		} else if (update){
			global.userRef.child(req.body.uid).update(update);
			res.send({
				status: 201,
				message: "Update unsuccessful",
				errors: errors
			});
		} else {
			res.send({
				status: 500,
				message: "Server error",
				error: errors
			});
		}
		
	});

	app.post('/api/newaccount', function(req, res, next){
        console.log("Creating new user with email", req.body.email, "at", Date());
        var photos = ["https://firebasestorage.googleapis.com/v0/b/angular-project-31b5c.appspot.com/o/default%2Fchefhat2.jpg?alt=media&token=c2f11652-534e-408b-9bad-b3b16b18132a", "https://firebasestorage.googleapis.com/v0/b/angular-project-31b5c.appspot.com/o/default%2Fchefhat3.jpg?alt=media&token=17ebcf03-93e9-4659-97f8-de8fc723d793", "https://firebasestorage.googleapis.com/v0/b/angular-project-31b5c.appspot.com/o/default%2Fchefhat4.jpg?alt=media&token=241c91ae-fc59-4cc3-bcd9-a19ec11b2247"];
        var randInt = Math.floor(Math.random(3));
        console.log(randInt);
        var photoUrl = photos[randInt];
        
        global.userRef.child(req.body.uid).set({
            uid: req.body.uid,
            email: req.body.email,
            photoUrl: photoUrl,
            firstName: "Please Enter Name"
        });
        
	});
	
};