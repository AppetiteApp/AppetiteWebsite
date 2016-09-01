
module.exports = function(app){
        app.get('*', function(req, res, next) {
    //http://docs.aws.amazon.com/ElasticLoadBalancing/latest/DeveloperGuide/TerminologyandKeyConcepts.html#x-forwarded-proto
        if (req.get('x-forwarded-proto') != "https") {
            res.set('x-forwarded-proto', 'https');
            res.redirect('https://' + req.get('host') + req.url);
        } else {
            next();     
        }
    });
    
    
};