/*global firebase*/
/*global $*/
/*
BTW if the password isn't long and complex enough the signup doesn't work
need to disable the buttons for a bit after they're pressed so user doesn't click on it mutliple times
need to tell user if they successfully signed up or logged in or submitted a dish etc
*/

$( document ).ready(function() {
    //login
    $("#login").submit(function(event){
    	event.preventDefault();
    	login();
    });
    
    //signup
    $("#signup").submit(function(event){
    	event.preventDefault();
    	signup();
    });
    
    //logout
    $("#logout").submit(function(event){
    	event.preventDefault();
    	logout();
    });
    
    $('#update').submit(function(event){
    	event.preventDefault();
    	update();
    });
    
    
    
    //submit a dish
    $("#submit-dish").submit(function(event){
    	event.preventDefault();
    	submitDish();
    });
    
    

    
});

var getCurrentUser = function(){
	var user = firebase.auth().currentUser;

	if (user) {
		return user;
	} else {
		return null;
	}
};




var signup = function(){
	var email = $('#email').val();
  	var password = $('#password').val();

  	console.log(email + ": " + password);
  	
	
  	firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
  		// Handle Errors here.
  		var errorCode = error.code;
  		var errorMessage = error.message;
  		console.log(errorCode + ": " + errorMessage);
  		var userid = firebase.auth().currentUser.uid;
  		$.post('/login', {uid: userid}, function(res){
			console.log("started session");	
		});
	});
	
	

	$('#password').val("");
	$('#email').val("");
};

var update = function(){
	var lastName = $('#lname').val();
  	var firstName = $('#fname').val();
  	var phone = $('#phone').val();
  	if (getCurrentUser()) {
  		firebase.database().ref('users/' + getCurrentUser().uid).set({
  			firstName: firstName,
  			email: getCurrentUser().email,
  			lastName: lastName,
  			phone: phone
  		});
  	} else {
  		console.log("no one logged in");
  	}
  	$('#lname').val("");
  	$('#fname').val("");
  	$('#phone').val("");
};

var login = function() {
	var email = $("#login-email").val();
	var password = $("#login-password").val();
	firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
	  	// Handle Errors here.
	  	var errorCode = error.code;
	  	var errorMessage = error.message;
	  	console.log(errorMessage);
	  	// ...
	});
	$('#login-email').val("");
	$('#login-password').val("");
	$.post('/login', {uid: getCurrentUser().uid}, function(res){
		console.log("started session");	
	});
};

var logout = function(){
	
};

var submitDish = function(){
	var currentUser = firebase.auth().currentUser;
	if (!currentUser) {
		console.log("no one logged in");
	} else {
		//get stuff from form and ajax
		console.log($("#time").val());
		var data = {
			dishName	: $("#dishName").val(),
			location	: $("#location").val(),
			description : $("#description").val(),
			time		: $("#time").val(),
			price		: $("#price").val(),
			uid			: currentUser.uid
		};

		// $.post(url, data, function(res){
		// 	console.log(res);
		// });
		console.log(data);
		console.log(data.toString());
		$.ajax({
			url: "/submitdish",
			type: "POST",
			data: JSON.stringify(data),
			contentType: "application/json",
			dataType: "json",
			success: function(res){
				console.log(res);
			}
		});
	}
};