var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var firebase    = require('firebase');
var path        = require('path');
var cors        = require('cors');
var staticController= require('./controllers/static.controller');
var userController  = require('./controllers/user.controller');
var dishController = require('./controllers/dish.controller');
var requestController = require('./controllers/requests.controller');
var adminController = require('./controllers/admin.controller');
var reviewController = require('./controllers/reviews.controller');
var twilio = require('twilio');
var cfg = require('./configs/config.json');

firebase.initializeApp({
  serviceAccount: "./configs/firebase.json",
  databaseURL: "https://appetite-8827f.firebaseio.com/"
});

var db = firebase.database();
global.userRef = db.ref("users");
global.dishRef = db.ref("dish");
global.commentRef = db.ref("comments");
global.pastDishRef = db.ref("pastDishes");
global.cancelRef = db.ref("cancellations");
global.buyerReviewRef = db.ref("buyerReviews");
global.chefReviewRef = db.ref("chefReviews");
app.set("view engine", "ejs");

var accountSid = cfg.twilioTestAccountSID;
var authToken = cfg.twilioTestAuthToken;   // Your Auth Token from www.twilio.com/console

var client = new twilio.RestClient(accountSid, authToken);

client.messages.create({
    body: 'Hello from Cheryl',
    to: '+15145608462',  // Text this number
    from: '+15005550006' // From a valid Twilio number
}, function(err, message) {
    console.log(err);
    console.log(message);
});

var serverLogging = function(req, res, next){
	console.log(req.method, req.url);
	next();
};


app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(serverLogging);
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");

staticController(app);
userController(app);
dishController(app);
adminController(app);
requestController(app);
reviewController(app);

process.env.PORT = process.env.PORT || 8080;

app.listen(process.env.PORT, function(){
    console.log("running on " + process.env.PORT);
});