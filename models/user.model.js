module.exports = {
    createUser : function(data){
        var userRef = global.rootRef.child("users/" + data.body.username);
        userRef.set({
            firstName: data.body.fname,
            lastName: data.body.lname,
            email: data.body.email,
            password: data.body.password,
            rating: undefined
        });
    },
    
    findByEmail: function(email, callback){
        global.rootRef.child('users').orderByChild('email').equalTo(email).once('value', function(snap) {
            callback(snap.val());
        });
    },
    
    findByUsername: function(username, callback){
        var onValueChange = function(snapshot) {
            if (snapshot.val() === null) {
                callback(null);
            } else {
                snapshot.val().username = username;
                callback(snapshot.val());
            }
        };

        global.rootRef.child("users/" + username).once("value", onValueChange);
    },
    
    deleteUserByUsername: function(username, callback){
        global.rootRef.child('users/' + username).remove();
    }
};