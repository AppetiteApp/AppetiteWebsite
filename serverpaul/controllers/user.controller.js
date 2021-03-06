var globals = require('../configs/globals');

module.exports = function(app) {

	//edit a user's account
	//check if the a valid change is in req.body, if yes then update
	app.post('/api/account/edit', function(req, res, next){
		//if no session cookie, return error
		if (!req.session){
            res.send("invalid request");
            return;
        }
		if (!req.session.uid) {
			res.send("invalid request");
			console.log("No session");
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
			update.lat = req.body.lat;
			update.lng = req.body.lng;
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
			global.userRef.child(req.session.uid).update(update);
			res.send({
				status: 200,
				message: "Successfully updated profile"
			});
		} else if (update){
			global.userRef.child(req.session.uid).update(update);
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
        console.log("Creating new user with email", req.body.signupemail, "at", Date());


            var photos = ["https://firebasestorage.googleapis.com/v0/b/angular-project-31b5c.appspot.com/o/default%2Fchefhat2.jpg?alt=media&token=c2f11652-534e-408b-9bad-b3b16b18132a", "https://firebasestorage.googleapis.com/v0/b/angular-project-31b5c.appspot.com/o/default%2Fchefhat3.jpg?alt=media&token=17ebcf03-93e9-4659-97f8-de8fc723d793", "https://firebasestorage.googleapis.com/v0/b/angular-project-31b5c.appspot.com/o/default%2Fchefhat4.jpg?alt=media&token=241c91ae-fc59-4cc3-bcd9-a19ec11b2247"];
        var randInt = Math.floor(Math.random(3));
        //console.log(randInt);
        var photoUrl = photos[randInt];
        global.globalRef.child("number").once("value").then(function(snapshot){
            console.log(snapshot.val());
            var idNum = snapshot.val();
            global.userRef.child(req.body.uid).set({
                uid: req.body.uid,
                email: req.body.signupemail,
                photoUrl: photoUrl,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                phone: req.body.phone,
                location: "Please update your address by clicking the edit icon!",
                number: idNum
            });
            idNum = parseInt(idNum, 10);
            console.log(idNum);
            //generate idNum string
            idNum += 1;
            idNum = idNum.toString();
            console.log(idNum);
            var lenNeeded = 9-idNum.length;
            var finalIdNum = "";
            while (lenNeeded > 0){
                finalIdNum += '0';
                lenNeeded -= 1;
            }
            finalIdNum += idNum;
            console.log("final id: " + finalIdNum);
            global.globalRef.update({
                number: finalIdNum
            });
            res.send("success");
        }, function(err){
            console.log(err);
            res.send("invalid request");
        });





	});

	app.post('/feedback', function(req, res){
	    console.log(req.body);
	    var newCommentRef = global.commentRef.push();
	    var updateObj = {};
	    if (req.body.anonymous === true){
	        updateObj = {
	            message: req.body.message
	        };
	    } else {
	        updateObj = {
	            message: req.body.message,
	        };
	        if (req.session){
	            if (req.session.uid){
	                updateObj.ownerid = req.session.uid;
	            }
	        }
	    }
	    newCommentRef.set(updateObj);
	    res.send({
	        message: "Thank you for your feedback!"
	    });

	});

	app.post('/api/profileImg', function(req, res){
	    console.log(req.body);
	    if (!req.session){
	        res.send('invalid request');
	        return;
	    } else if (!req.session.uid){
	        res.send("invalid request");
	        return;
	    }

	    //update the user's photoUrl
	    global.userRef.child(req.session.uid).update({
	        photoUrl: req.body.photoUrl
	    });

	    //update the user's dishes photoUrl
	    global.userRef.child(req.session.uid).child('currentlyCooking').once("value", function(snapshot){
	        //snapshot.val() is a list of meals that the user has made
	        //NOTE TO SELF: maybe create a local copy of profile pic using
	        console.log(snapshot.val());
	        if (snapshot.val()){
	            var dishes = snapshot.val();
	            dishes.forEach(function(dishKey){
	                global.dishRef.child(dishKey).update({
	                    ownerPic: req.body.photoUrl
	                });
	            });
	        }

	    });
	    res.send("success");
	});


	//upon login, authenticates and starts express-session
	app.post('/api/customTokenAuth', function(req, res){
	    if (!req.body.token){
	        res.send("invalid request");
	        return;
	    }
	    global.firebase.auth().verifyIdToken(req.body.token).then(function(decodedToken) {
            var uid = decodedToken["user_id"];
            console.log(decodedToken);
            console.log("uid: " + uid);

            if (!req.session.uid){
                req.session.uid = uid;
                req.session.emailVerified = decodedToken["email_verified"];
                req.session.email = decodedToken["email"];
                req.session.regenerate(function(err){});
                res.send("success");
            } else if (req.session.uid === uid){
                res.send("cookie-in-place");
								//req.session.regenerate(function(err){});
            }




        }).catch(function(error) {
            // Handle error
        });
	});

	//remove express-session
	app.post('/api/signout', function(req, res) {
	    req.session.destroy(function(err){
	        if (err) {
	            console.log(err);
	            res.send("invalid");
	        } else {
	            res.send("success");
	        }
	        console.log(req.session);
	    });

	});

};
