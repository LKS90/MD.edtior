var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var mongoose = require('mongoose');
var LocalStrategy = require('passport-local');

var app = express();
var jsonParser= bodyParser.json();
var urlencodeParser = bodyParser.urlencoded({extended: false});
app.use(logger('dev'));
app.use(cookieParser());
app.use(require('express-session')({
   secret: 'TEST',
   resave: false,
   saveUninitialized: false 
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));

// passport config
var Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// mongoose
mongoose.connect('mongodb://localhost/passport_local_mongoose');

//============ CUSTOM FUNCTIONS

mergeJsonObject = function(obj1, obj2) {
    var result={};
    for(var key in obj1) result[key]=obj1[key];
    for(var key in obj2) result[key]=obj2[key];
    return result;
};

//============ SETUP
var input = "/content/default.md";
var output = "/content/default.json";
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
var defaultContent = require('/content/default.json')

//============ EXPRESS
// set the view engine to ejs
app.set('view engine', 'ejs');

//============ ROUTES
app.get('/', function(req, res) {
    content = mergeJsonObject(defaultContent, {login: false});
    res.render('pad', content);
});

app.get('/login', function(req, res) {
    content = mergeJsonObject(defaultContent, {login: true});
    res.render('pad', content);
});

app.post('/login', urlencodeParser, function(req, res) {
  passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login'
  })
});

//============ PORT
// listen on port 8080 (for localhost) or the port defined for heroku
var port = process.env.PORT || 8080;
app.listen(port);
