var funcs = require('../configs/global_functions');

module.exports.createAndSaveUser = function(req, res, next){
	var resp = {};
	if (!funcs.isUndef(req.body.lname) && !funcs.isUndef(req.body.fname) && !funcs.isUndef(req.body.email) &&
		!funcs.isUndef(req.body.phone)){
		funcs.createUser(req.body, req, res);
	} else {
		resp.error = "Invalid use of API";
		resp.code = 400;
		res.send(resp);
		res.end();
	}
};