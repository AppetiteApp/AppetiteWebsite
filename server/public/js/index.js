
// var config = {
// 	apiKey: "AIzaSyAFeKB5L3QbetPlLDFhuftMqTUTuUhkKhM",
// 	authDomain: "angular-project-31b5c.firebaseapp.com",
// 	databaseURL: "https://angular-project-31b5c.firebaseio.com",
// 	storageBucket: "angular-project-31b5c.appspot.com",
// };
// firebase.initializeApp(config);


function signup(){
	var email = $('#email').val();
  	var password = $('#password').val();
  	console.log(email + ": " + password);
  	firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
  		// Handle Errors here.
  		var errorCode = error.code;
  		var errorMessage = error.message;
  		console.log(errorCode + ": " + errorMessage);
	});
};

var login = function() {
	firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
	  	// Handle Errors here.
	  	var errorCode = error.code;
	  	var errorMessage = error.message;
	  	// ...
	});
}