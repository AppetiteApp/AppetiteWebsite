var User = require('../models/user.model');
var Global = require('./globals');

module.exports.isUndef = function(value){
	return value === null || value === undefined;
}

module.exports.createUser = function(data, req, res) {
	var resp = {};
	resp.errors = [];

	if (!Global.usernameRegex.test(data.uname)){
		resp.errors.push({
			errorType: "uname",
			errorMessage: "Invalid characters in Username"
		})
	}

	User.findByUsername(data.uname, function(result){
		if (result != null) {
			resp.errors.push({
				errorType: "uname",
				errorMessage: "Username already taken"
			})
		}
	});

	//make sure email is in right syntax
	if (!Global.emailRegex.test(data.email)){
		resp.errors.push({
			errorType: "email",
			errorMessage: "Invalid characters in Email"
		});
	}

	//make sure email isn't already taken
	// User.findByEmail(data.email, function(result){
	// 	if (result != null) {
	// 		resp.errors.push({
	// 			errorType: "email",
	// 			errorMessage: "Email already taken"
	// 		});
	// 	}
	// });

	//make sure name is in right syntax
	if (!Global.individualNameRegex.test(data.fname)){
		resp.errors.push({
			errorType: "name",
			errorMessage: "Invalid characters in first name"
		});
	}

	if (!Global.individualNameRegex.test(data.lname)){
		resp.errors.push({
			errorType: "name",
			errorMessage: "Invalid characters in last name"
		});
	}

	if (!Global.passwordRegex.test(data.password)){
		resp.errors.push({
			errorType: "password",
			errorMessage: "Invalid characters in password"
		});
	}

	//only supports North American numbers
	if (!Global.phoneRegex.test(data.phone)){
		resp.errors.push({
			errorType: "phone",
			errorMessage: "Invalid characters in phone, we only support North American numbers right now"
		})
	}

	if (resp.errors.length === 0) {
		//resp.errors = undefined;

		var newUser = User(data);
		User.createUser(data);
		resp.success = true;
		res.send(resp);
	} else {
		resp.code = 400;
		resp.errorMessage = "Failed to create new user";
		res.send(resp);
		res.end();
	}
}

