var User = function(data) {
    this.data = data;
};

User.createUser = function(data){
    var userRef = global.rootRef.child("users/" + data.uname);
    userRef.set({
        username: data.uname,
        firstName: data.fname || "",
        lastName: data.lname || "",
        email: data.email,
        phone: data.phone,
        cook: data.cook || false,
        password: data.password,
        //rating: [undefined, undefined, undefined], //for value, taste, & timing
        postedMeals: [],
        purchases: []
    });
}
    
User.findByEmail = function(email, callback){
    global.rootRef.child('users').orderByChild('email').equalTo(email).once('value', function(snap) {
        callback(snap.val());
    });
},
    

User.findByUsername = function (username, callback) {

  var onValueChange = function(snapshot) {
    var ret = snapshot.val();
    if(ret === null){
      callback(null);
    }else{
      ret.username = username;
      callback(ret);
    }
  }

  global.rootRef.child("users/"+username).once("value", onValueChange);
}
    
User.deleteUserByEmail = function(uname, callback){
    global.rootRef.child('users/' + uname).remove();
}


module.exports = User;