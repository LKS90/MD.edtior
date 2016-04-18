var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var mongoose = require('mongoose');
var LocalStrategy = require('passport-local');

var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
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

//============ ROUTES
app.get('/', function(req, res) {
  res.render('pad', defaultContent);
});


app.post('/login', passport.authenticate('local'), function(req, res) {
  res.redirect('/');
});

//============ DEFAULT ERROR OUTPUT
app.use(function (err, req, res, next) {
  var status = err.status || err.statusCode

  if (typeof status !== 'number' || status >= 500) {
    next(err)
    return
  }
  console.log(status + ' ' + err.message)
})

//============ PORT
// listen on port 8080 (for localhost) or the port defined for heroku
var port = process.env.PORT || 8080;
app.listen(port);
