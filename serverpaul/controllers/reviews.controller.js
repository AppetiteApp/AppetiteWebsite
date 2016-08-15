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
            
            
        }
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
        var rating = parseInt(req.body.rating);
        if (!rating){
            res.send({
                errors: [{
                    errorType: "rating",
                    errorMessage: "no rating"
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
            } else if (!snapshot.val().activeMeals) {
                res.send({
                    errors: [{
                        errorType: "dish",
                        errorMessage: "user didn't post this dish"
                    }]
                });
                return;
            } else if (snapshot.val().activeMeals.indexOf(req.body.dishid) === -1){
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
                    type: "buyerRating",
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