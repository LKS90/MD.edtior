var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var pg = require('pg');
var LocalStrategy = require('passport-local');

var app = express();
var jsonParser= bodyParser.json();
var urlencodeParser = bodyParser.urlencoded({extended: false});
var conString = "postgres://mdedit:mdeditor@localhost/mdedit";

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

// postgres
pg.connect(conString, function(err, client, done) {
  if(err) {
    return console.error('error fetching client from pool', err);
  }
  client.query('SELECT * FROM user', ['1'], function(err, result) {
    //call `done()` to release the client back to the pool
    done();

    if(err) {
      return console.error('error running query', err);
    }
    console.log(result.rows[0].number);
    //output: 1
  });
});

// passport config
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'pass'
}, (username, password, done) => {
    console.log("Login process: ", username);
    return pg.one("SELECT uid, name, email, role FROM user" +
        "WHERE email=$1 AND password=$2", [username, password])
        .then((result) => {
            return done(null, result);
        })
        .catch((err) => {
            console.log("/login: ", err);
            return done(null, false, {message: "Wrong email or password"});
        });
}));

passport.serializeUser((user, done) => {
    console.log("serialize ", user);
    done(null, user.uid);
});

passport.deserializeUser((id, done) => {
    console.log("deserialize ", id);
    pg.one("SELECT uid, name, email, role FROM user" +
        "WHERE uid = $1", [id])
        .then((user) => {
            done(null, user);
        })
        .catch((err) => {
            done(new Error("User with the id ${id} does not exist."));
        })
});

//============ CUSTOM FUNCTIONS

mergeJsonObject = function(obj1, obj2) {
    var result={};
    for(var key in obj1) result[key]=obj1[key];
    for(var key in obj2) result[key]=obj2[key];
    return result;
};

//============ SETUP
var input = "public/content/default.md";
var output = "public/content/default.json";
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
var defaultContent = require('./public/content/default.json');
var modalLogin = fs.readFileSync("./views/modalLogin.ejs", 'utf8');

//============ EXPRESS
// set the view engine to ejs
app.set('view engine', 'ejs');

//============ ROUTES
app.get('/', function(req, res) {
    content = mergeJsonObject(defaultContent, {login: false, modal: modalLogin});
    res.render('pad', content);
});

app.get('/login', function(req, res) {
    content = mergeJsonObject(defaultContent, {login: true, modal: modalLogin});
    res.render('pad', content);
});

app.post('/login',
    passport.authenticate('local'),
    (req, res) => {
        res.render('pad', {
            login: true,
            modal: "YAY"
        });
  }
);

//============ PORT
// listen on port 8080 (for localhost) or the port defined for heroku
var port = process.env.PORT || 8080;
app.listen(port);
