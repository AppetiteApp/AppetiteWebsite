var urlList = ['/browse', '/home', '/', '/account', '/history', '/newdish', '/terms', '/aboutus'];

var serverLogging = function(req, res, next){
    if ((req.method==="GET" && urlList.indexOf(req.url) !== -1) || req.method==="POST"){
        console.log(req.method, req.url);
    } 
	next();
};

module.exports = {
    serverLogging: serverLogging,
};
