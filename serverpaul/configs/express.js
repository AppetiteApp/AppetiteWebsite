var express     = require('express');
var bodyParser  = require('body-parser');
var path        = require('path');
var firebase    = require('firebase');
var session = require('express-session');


var httpToHttps = require('../middleware/httpToHttps');
var initialize = require('../middleware/initialize');
var staticController= require('../controllers/static.controller');
var userController  = require('../controllers/user.controller');
var dishController = require('../controllers/dish.controller');
var requestController = require('../controllers/requests.controller');
var adminController = require('../controllers/admin.controller');
var reviewController = require('../controllers/reviews.controller');
var stripeController = require('../controllers/stripe.controller');
var twilio = require('twilio');
var cfg = require('./config.json');

var sess   = {
	name: "ohIkgFh3KKxSS57",
	secret: "1430FrontenacIsMyHome",
	cookie: {
		secure: true
	},
	httpOnly: true,
	resave: false,
    saveUninitialized: false
};




//initialize app
firebase.initializeApp({
    serviceAccount: path.resolve(__dirname, './firebase.json'),
    databaseURL: "https://appetite-8827f.firebaseio.com/"
});

//set variables
var db = firebase.database();
global.firebase= firebase;
global.userRef = db.ref("users");
global.sensitiveUserRef = db.ref("sensitiveUsers");
global.dishRef = db.ref("dish");
global.commentRef = db.ref("comments");
global.pastDishRef = db.ref("pastDishes");
global.cancelRef = db.ref("cancellations");
global.buyerReviewRef = db.ref("buyerReviews");
global.chefReviewRef = db.ref("chefReviews");




//TWILIO
var accountSid = cfg.twilioTestAccountSID;
var authToken = cfg.twilioTestAuthToken;

var client = new twilio.RestClient(accountSid, authToken);

// client.messages.create({
//     body: 'Hello from Cheryl',
//     to: '+15145608462',  // Text this number
//     from: '+15005550006' // From a valid Twilio number
// }, function(err, message) {
//     console.log(err);
//     console.log(message);
// });




module.exports = function(){
    var app = express();

    app.set("view engine", "ejs");
    //MIDDLEWARE
    //comment out httpToHttps when using localhost
    httpToHttps(app);
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(initialize.serverLogging);
    app.use(express.static(path.join(__dirname, '../public')));
    app.set("view engine", "ejs");

    //sessions
    app.set('trust proxy', 1);
    app.use(session(sess));


    staticController(app);
    userController(app);
    dishController(app);
    adminController(app);
    requestController(app);
    reviewController(app);
    stripeController(app);


    return app;
};
