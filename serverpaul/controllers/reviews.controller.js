var globals = require('../configs/globals');

var verifyRating = function(number){
    var rating = parseInt(number, 10);
    if (!rating){
        return -1;
    } else if (rating < 0 || rating > 5 ){
        return -1;
    } else {
        return rating;
    }
};

module.exports = function(app){
    
    //endpoint for reviewing a chef, save dishid, dishName & description & date
    //review metrics:
        //ratings: taste, timing, value
        //review: free for all answer
    //review has type 'chef' or 'buyer'
    //store review as a separate object, but link a reference of it to the reviewer & reviewee
    app.post('/api/reviewChef', function(req, res){
        if (!req.body.uid || !req.body.dishid || !req.body.rating || !req.body.chefid){
            res.send({
                errors: [{
                    errorType: "info",
                    errorMessage: "missing info"
                }]
            });
            return;
        }
        if (!req.body.rating.taste || !req.body.rating.value || !req.body.rating.timing){
            //check if the taste, value & timing are ints 
            res.send({
                errors: [{
                    errorType: 'info',
                    errorMessage: 'missing info'
                }]
            });
            return;
        } else {
            
        }
        
        var errors = [];
        //check that reviewer purchased the meal
        global.userRef.child(req.body.uid).once('value').then(function(snapshot){
            if (!snapshot.val()){
                errors.push({
                    errorType: "uid",
                    errorMessage: "invalid uid"
                });
            } else if (!snapshot.val().activeMeals){
                errors.push({
                    errorType: "purchases",
                    errorMessage: "purchase does not exist"
                });
            } else if (!snapshot.val().activeMeals[req.body.dishid] || snapshot.val().activeMeals[req.body.dishid].pending === true){
                errors.push({
                    errorType: "purchases",
                    errorMessage: "purchase doesn't exist or status pending"
                });
            }
            
            //verify ratings are integers between 0 and 5
            if (verifyRating(req.body.rating.taste) === -1 || verifyRating(req.body.rating.value) === -1 || verifyRating(req.body.rating.timing) === -1){
                errors.push({
                    errorType: "rating",
                    errorMessage: "ratings not valid numbers"
                });
            }
            if (req.body.review){
                if (!globals.commentRegex(req.body.review)){
                    errors.push({
                        errorType: 'review',
                        errorMessage: "invalid characters in review"
                    });
                }
            }
            if (errors.length){
                res.send({
                    errors: errors
                });
                return;
            }
            
            var reviewsForChef = [];
            if (snapshot.val().reviewsForChef) reviewsForChef = snapshot.val().reviewsForChef;
            
            //verify dish
            global.dishRef.child(req.body.dishid).once("value").then(function(snapshot){
                if (!snapshot.val()){
                    errors.push({
                        errorType: 'dish',
                        errorMessage: 'invalid dishid'
                    });
                } else if (!snapshot.val().purchases){
                    errors.push({
                        errorType: 'purchases',
                        errorMessage: 'no purchases made under your name'
                    });
                } else if (!snapshot.val().purchases[req.body.uid]){
                    errors.push({
                        errorType: 'purchases',
                        errorMessage: 'no purchases made under your name'
                    });
                } else if (snapshot.val().purchases[req.body.uid].pending === true){
                    errors.push({
                        errorType: 'purchase',
                        errorMessage: 'cannot review meal if request to purchase is pending'
                    });
                }
                if (errors.length){
                    res.send({
                        errors: errors
                    });
                    return;
                }
                var chefid = snapshot.val().ownerid;
                //make rating object and store it
                var rating = {
                    review: req.body.review,
                    value: parseInt(req.body.rating.value, 10),
                    taste: parseInt(req.body.rating.taste, 10),
                    timing: parseInt(req.body.rating.timing, 10),
                    dish: {
                        dishid: req.body.dishid,
                        chefid: req.body.chefid,
                        buyerid: req.body.uid
                    },
                    date: new Date()
                };
                
                var newChefReviewRef = global.chefReviewRef.push();
                var newChefReviewKey = newChefReviewRef.key;
                newChefReviewRef.set(rating);
                
                reviewsForChef.push(newChefReviewKey);
                //save to list of reviews given to chefs
                global.userRef.child(req.body.uid).update({
                    reviewsForChef: reviewsForChef
                });
                
                //save for the chef who's been reviewed
                global.userRef.child(chefid).once("value").then(function(snapshot){
                    if (snapshot.val()){
                        var reviewsAsChef = [];
                        if (snapshot.val().reviewsAsChef) reviewsAsChef = snapshot.val().reviewsAsChef;
                        global.userRef.child(chefid).update({
                            reviewsAsChef: reviewsAsChef
                        });
                        res.send({
                            message: 'Review Submitted! Thank you for your feedback!'
                        });
                        return;
                    }
                }, function(err){
                    res.send({
                        errors: [{
                            errorType: 'firebase',
                            errorMessage: err
                        }]
                    });
                });
                
            }, function(err){
                res.send({
                    errors: [{
                        errorType: 'firebase',
                        errorMessage: err
                    }]
                });
            });
            
        }, function(err){
            res.send({
                errors: [{
                    errorType: 'firebase',
                    errorMessage: err
                }]
            });
        });
    });
    
    //review the buyer
    app.post('/api/reviewBuyer', function(req, res){
        if (!req.body.uid || !req.body.buyerid || !req.body.dishid || !req.body.rating){
            res.send({
                errors: [{
                    errorType: "info",
                    errorMessage: "missing info"
                }]
            });
            return;
        }
        var rating = parseInt(req.body.rating, 10);
        if (!rating){
            res.send({
                errors: [{
                    errorType: "rating",
                    errorMessage: "no rating"
                }]
            });
            return;
        } else if (rating < 0 || rating > 5 || !Number.isInteger(rating)){
            res.send({
                errors: [{
                    errorType: 'rating',
                    errorMessage: 'invalid rating'
                }]
            });
            return;
        }
        
        //verify that owner has cooked dish and the buyer has bought the dish
        global.userRef.child(req.body.uid).once("value").then(function(snapshot){
            //if snapshot.val() isn't null
            if (!snapshot.val()){
                res.send({
                    errors: [{
                        errorType: "uid",
                        errorMessage: "invalid uid"
                    }]
                });
                return;
            } else if (!snapshot.val().mealsMade) {
                res.send({
                    errors: [{
                        errorType: "dish",
                        errorMessage: "user didn't post this dish"
                    }]
                });
                return;
            } else if (snapshot.val().mealsMade.indexOf(req.body.dishid) === -1){
                res.send({
                    errors: [{
                        errorType: "dish",
                        errorMessage: "user didn't post this dish"
                    }]
                });
                return;
            }
            
            var reviewsForBuyer = [];
            if (snapshot.val().reviewsForBuyer) reviewsForBuyer = snapshot.val().reviewsForBuyer;
            
            //verify that buyer bought the dish
            global.dishRef.child(req.body.dishid).once("value").then(function(snapshot){
                if (!snapshot.val()){
                    res.send({
                        errors: [{
                            errorType: "dish",
                            errorMessage: "dish doesn't exist"
                        }]
                    });
                    return;
                } else if (!snapshot.val().purchases) {
                    res.send({
                        errors: [{
                            errorType: "dish",
                            errorMessage: "buyer didn't purchase this dish"
                        }]
                    });
                    return;
                } else if (snapshot.val().purchases.indexOf(req.body.buyerid) !== -1){
                    res.send({
                        errors: [{
                            errorType: "dish",
                            errorMessage: "buyer didn't purchase this dish"
                        }]
                    });
                    return;
                }
                
                //save review to buyerReviews
                var ratingObj = {
                    rating: rating,
                    date: new Date(),
                    dish: {
                        buyer: req.body.buyerid,
                        chef : req.body.uid,
                    }
                   
                };
                if (req.body.review){
                    ratingObj.review = req.body.review;
                }
                var newBuyerReviewRef = global.buyerReviewRef.push();
                var newBuyerReviewKey = newBuyerReviewRef.key;
                newBuyerReviewRef.set(ratingObj);
                
                //store the id for the newBuyerReivewRef to the reviewer & reviewee
                reviewsForBuyer.push(newBuyerReviewKey);
                global.userRef.child(req.body.uid).update({
                    reviewsForBuyer: reviewsForBuyer
                });
                
                
                global.userRef.child(req.body.buyerid).once("value").then(function(snapshot){
                    if (snapshot.val()){
                        var reviewsAsBuyer = [];
                        if (snapshot.val().reviewsAsBuyer) reviewsAsBuyer = snapshot.val().reviewsAsBuyer;
                        reviewsAsBuyer.push(newBuyerReviewKey);
                        global.userRef.child(req.body.buyerid).update({
                            reviewsAsBuyer: reviewsAsBuyer
                        });
                    }    
                }, function(err){
                    res.send(err);
                    return;
                });
                
                
            }, function(err){
                res.send({
                    errors: [{
                        errorType: "firebase",
                        errorMessage: err
                    }]
                });
                return;
            }); //end retrieve data from firebase dishRef
            
        }, function(err){
            res.send({
                errors: [{
                    errorType: "firebase",
                    errorMessage: err
                }]
            });
            return;
        }); //end retrieve data from firebase userRef
    }); //end POST /api/reviewChef
};