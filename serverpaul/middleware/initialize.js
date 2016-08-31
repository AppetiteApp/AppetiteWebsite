var urlList = ['/browse', '/home', '/', '/account', '/history', '/newdish', '/terms', '/aboutus'];

var serverLogging = function(req, res, next){
    if (urlList.indexOf(req.url) !== -1){
        console.log(req.method, req.url);    
    }
	next();
};

module.exports = {
    serverLogging: serverLogging,
};
