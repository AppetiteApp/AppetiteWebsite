var funcs = require('../configs/global_functions');

module.exports.createAndSaveUser = function(req, res, next){
	var resp = {};
	if (!funcs.isUndef(req.body.lname) && !funcs.isUndef(req.body.fname) && !funcs.isUndef(req.body.email) &&
		!funcs.isUndef(req.body.phone)){
		funcs.createUser(req.body, req, res);
		next();
	} else {
		resp.error = "Invalid use of API";
		resp.code = 400;
		res.send(resp);
		res.end();
	}
}


module.exports.login = function(req, res, next){
	var resp = {};
	if (!funcs.isUndef(req.body.email) && !funcs.isUndef(req.body.password)) {
		res.send("Update this shit");
		next();
	} else {
		resp.errorMessage = "Email and/or Password cannot be undefined";
		resp.code = 400;
		res.send(resp);
		res.end();
	}
}