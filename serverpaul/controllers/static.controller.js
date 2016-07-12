module.exports = function(app) {

    //when the request url is "/about", render the page in views called 'about.ejs'
    app.get('/about', function(req, res){
        //if (!req.session.inSession) {
            res.render(__dirname + '/../views/about');
        //}
    });

    //when the request url is "/index", render the page in views called 'signup.ejs'
    //this is purely for testing (and for putting all my forms on one page)
    app.get('/index', function(req, res){
        res.render(__dirname + '/../views/signup');
    });

    //when request url is '/browse', render the page in views call browse
    //and pass it an object with all the meals, ordered by dateAdded, somehow fix to make more suitable for Google Maps
    //although right now it's ordered by ascending order of the date...need to fix it
    //also need to fix it for '/browse:num' and limit the number of meals on one page
    app.get('/browse', function(req, res){
	   res.render(__dirname + '/../views/subviews/browse');
    });

    app.get('/login', function(req, res){
        console.log("get login");
        res.render(__dirname + '/../views/subviews/login');
    });

    app.get('/home', function(req, res){
        console.log("got home");
        res.render(__dirname + '/../views/subviews/home');
    });

    app.get('/account', function(req, res){
        res.render(__dirname + '/../views/subviews/profile');
    });

    app.get('/newdish', function(req, res){
        res.render(__dirname + '/../views/subviews/addmeal');
    });

    app.get('/terms', function(req, res){
        res.render(__dirname + '/../views/subviews/terms');
    });

    app.get('/aboutus', function(req, res){
        res.render(__dirname + '/../views/subviews/aboutus');
    });

    app.get('/', function(req, res){
        res.render(__dirname + '/../views/frame');
    });


};
