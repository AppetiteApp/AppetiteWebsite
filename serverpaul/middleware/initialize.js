module.exports = function(app){
    var serverLogging = function(req, res, next){
	    console.log(req.method, req.url);
	    next();
    };
};