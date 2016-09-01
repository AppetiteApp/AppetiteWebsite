var express     = require('express');
var bodyParser  = require('body-parser');
var path        = require('path');
var firebase    = require('firebase');


var httpToHttps = require('../middleware/httpToHttps');
var initialize = require('../middleware/initialize');
var staticController= require('../controllers/static.controller');
var userController  = require('../controllers/user.controller');
var dishController = require('../controllers/dish.controller');
var requestController = require('../controllers/requests.controller');
var adminController = require('../controllers/admin.controller');
var reviewController = require('../controllers/reviews.controller');
var twilio = require('twilio');
var cfg = require('./config.json');



//initialize app
firebase.initializeApp({
    serviceAccount: path.resolve(__dirname, './firebase.json'),
    databaseURL: "https://appetite-8827f.firebaseio.com/"
});

//set variables
    var db = firebase.database();
    global.userRef = db.ref("users");
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
    initialize(app);
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(express.static(path.join(__dirname, '../public')));
    app.set("view engine", "ejs");

    staticController(app);
    userController(app);
    dishController(app);
    adminController(app);
    requestController(app);
    reviewController(app);



    return app;
};
