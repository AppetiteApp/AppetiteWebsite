var express     = require('./configs/express');


process.env.PORT = process.env.PORT || 8080;

express().listen(process.env.PORT, function(){
    console.log("running on " + process.env.PORT);
});