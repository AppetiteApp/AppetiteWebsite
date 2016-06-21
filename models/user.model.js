module.exports = {
    createUser : function(data){
        var userRef = global.rootRef.child("users/" + data.body.username);
        userRef.set({
            firstName: data.body.fname || "",
            lastName: data.body.lname || "",
            email: data.body.email,
            phone: data.body.phone,
            cook: data.body.cook || false,
            password: data.body.password,
            rating: [undefined, undefined, undefined], //for value, taste, & timing
            postedMeals: [],
            purchases: []
        });
    },
    
    findByEmail: function(email, callback){
        global.rootRef.child('users').orderByChild('email').equalTo(email).once('value', function(snap) {
            callback(snap.val());
        });
    },
    
    // findByUsername: function(username, callback){
    //     var onValueChange = function(snapshot) {
    //         if (snapshot.val() === null) {
    //             callback(null);
    //         } else {
    //             snapshot.val().username = username;
    //             callback(snapshot.val());
    //         }
    //     };

    //     global.rootRef.child("users/" + username).once("value", onValueChange);
    // },
    
    deleteUserByEmail: function(email, callback){
        global.rootRef.child('users/' + email).remove();
    }
};