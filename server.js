var express = require('express');
var passport = require('passport');
var db = require('mongoose').MongoClient;
var LocalStrategy = require('passport-local');

var app = express();
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

// passport config
var Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// mongoose
mongoose.connect('mongodb://localhost/passport_local_mongoose');

//============ SETUP
var input = "./public/content/default.md";
var output = "./public/content/default.json";
var options = { encoding: 'utf8'};
var fs = require("fs");

var rawInput = fs.readFileSync(input, 'utf8').split(/\r?\n/);
var rawOutput = "{\"content\": [\"";
rawInput.forEach(function(element, i) {
    if (i === (rawInput.length - 1)) {
        rawOutput += element + "\"]}";
    }
    else {
        rawOutput += (element + "\", \"");
    }
}, this);

fs.writeFileSync(output, rawOutput);
var defaultContent = require('./public/content/default.json')

//============ EXPRESS
// set the view engine to ejs
app.set('view engine', 'ejs');

// public folder to store assets
app.use(express.static(__dirname + '/public'));

//============ ROUTES
app.get('/', function(req, res) {
  res.render('pad', defaultContent);
});


//============ PORT
// listen on port 8080 (for localhost) or the port defined for heroku
var port = process.env.PORT || 8080;
app.listen(port);
