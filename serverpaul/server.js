var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var firebase    = require('firebase');
var session     = require('express-session');
var path        = require('path');
var staticController= require('./controllers/static.controller');
var userController  = require('./controllers/user.controller');
var dishController = require('./controllers/dish.controller');

firebase.initializeApp({
  serviceAccount: "./configs/firebase.json",
  databaseURL: "https://angular-project-31b5c.firebaseio.com/"
});

var db = firebase.database();
global.userRef = db.ref("users");
global.dishRef = db.ref("dish");
app.set("view engine", "ejs");

var serverLogging = function(req, res, next){
	console.log(req.method, req.url);
	next();
};

var sess   = {
	name: "ohIkgFh3KKxSS57",
	secret: "eulskdjvbcxnwekfjskzxq389yewqhajsdb",
	cookie: {
		secure: false,
		maxAge: 24*60*60*1000
	},
	resave: true,
    saveUninitialized: false
};

app.use(session(sess));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(serverLogging);
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");

staticController(app);
userController(app);
dishController(app);

process.env.PORT = process.env.PORT || 80;

app.listen(process.env.PORT, function(){
    console.log("running on " + process.env.PORT);
});