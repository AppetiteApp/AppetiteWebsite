var User = require('./user.model');

//data: price, portions, cook's uname, mealName, description
var Meal = function(data){
	this.data = data;
	var User = new User
};





//save a meal; also must update user's meals
Meal.prototype.save = function(data){
	//need to get user's data synchronously
	var cook
	var mealRef = global.rootRef.child("meals/" + data.mealId);
	mealRef.set({
		cook: "default",
		cookId: this.data.cookId,
		price: this.data.price,
		portions: {
			left: this.data.all,
			all: this.data.all
		},
		comments: {
			value: "",
			taste: "",
			timing: ""
		},
		location: {
			address: this.data.address || "default", //get user's address or pass it in
			long: this.data.long,
			lat: this.data.lat	
		}
		cook: "cheryl", //get from DB
		cookId: this.data.cookId,
		cookRating: "" //get from DB

	});

}

//find a meal
Meal.prototype.findById = function(id, callback){
	global.rootRef.child('meals').orderByChild('id').equalTo(id).once('value', function(snap){
		callback(snap.val());
	});
};


//find by id and update a meal
//do we delete all records after user chooses to delete a meal
//if we do, then keep the ratings?



//delete a meal



