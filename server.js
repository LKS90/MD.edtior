const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const pg = require('pg');
const session = require('express-session');
const uuidV1 = require('uuid/v1');
const config = require('./config.json')
const rand = require('csprng')
const pbkdf2 = require('pbkdf2')

var app = express();
var jsonParser= bodyParser.json();
var urlencodeParser = bodyParser.urlencoded({extended: false});
var conString = "postgres://mdedit:mdeditor@localhost/mdedit";

app.use(logger('dev'));
app.use(cookieParser(config['secretsauce'].substr(0, 64)));
app.use(express.static(__dirname));
app.use(session({
    resave: false,
    saveUninitialized: true,
    genid: function(req) {
        return uuidV1()
    },
    secret: config['secretsauce'].substr(0, 64)
}))

// postgres
const pool = new pg.Pool({
    user: config['db-user'],
    database: config['db-name'],
    password: config['db-password'],
    host: 'localhost',
    port: 5432,
    max: 20,
    idleTimeoutMillis: 30000
});

pool.on('error', function (err, client) {
  // if an error is encountered by a client while it sits idle in the pool
  // the pool itself will emit an error event with both the error and
  // the client which emitted the original error
  // this is a rare occurrence but can happen if there is a network partition
  // between your application and the database, the database restarts, etc.
  // and so you might want to handle it and at least log it out
  console.error('idle client error', err.message, err.stack);
});

registerUserInDB = function(email, secret) {
    pool.connect((err, client, done) => {
        if(err) {
            console.error(err)
            return false;
        }
        var sql = 'INSERT INTO users (email, secret) VALUES ($1::text, $2::text);';
        client.query(sql, [email, secret], function(err) {
            done(err);
            if (err) {
                console.error('error running query', err)
                return false;
            }
        });
    });
    return true;
};

lookupUserInDB = function(email, callback) {
    pool.connect((err, client, done) => {
        if(err) {
            return console.error(err);
        }
        var sql = 'SELECT uid AS uid, email AS email, secret AS secret FROM users WHERE email = $1::text;';
        client.query(sql, [email], function(err, result) {
            done(err);
            if (err) {
                return console.error('error running query', err);
            }
            callback(result.rows);
        });
    });
};

//============ CUSTOM FUNCTIONS

mergeJsonObject = function(obj1, obj2) {
    var result={};
    for(var key in obj1) result[key]=obj1[key];
    for(var key in obj2) result[key]=obj2[key];
    return result;
};

logged_in = function(req) {
    var uid;
    console.log('Cookies: ', req.signedCookies);
    if (req.signedCookies.uid) 
        return true;
    else return false;
}

//============ SETUP
var input = "content/default.md";
var output = "content/default.json";
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
var defaultContent = require('./content/default.json');

//============ EXPRESS
// set the view engine to ejs
app.set('view engine', 'ejs');

//============ ROUTES
app.get('/', (req, res) => {
    var user_logged_in = logged_in(req);
    var email;
    content = mergeJsonObject(defaultContent, {
        modal: false,
        showResult: true,
        logged_in: user_logged_in
    });
    if (user_logged_in) {
        content = mergeJsonObject(content, {
            email: req.signedCookies.email
        })
    }
    res.render('pad', content);
});

app.get('/login', (req, res) => {
    content = mergeJsonObject(defaultContent, {
        modal: "login",
        showResult: true,
        logged_in: logged_in(req)
    });
    res.render('pad', content);
});

app.get('/logout', (req, res) => {
    content = mergeJsonObject(defaultContent, {
        modal: false,
        showResult: true,
        logged_in: false
    });

    if (logged_in(req)) {
        res.clearCookie('email');
        res.clearCookie('uid');
    }

    res.render('pad', content);
});

app.get('/edit', (req, res) => {
    var user_logged_in = logged_in(req);
    content = mergeJsonObject(defaultContent, {
        modal: false,
        showResult: false,
        logged_in: user_logged_in
    });
    if (user_logged_in) {
        content = mergeJsonObject(content, {
            email: req.signedCookies.email
        })
    }
    res.render('pad', content);
});

app.get('/view', (req, res) => {
    var user_logged_in = logged_in(req);
    content = mergeJsonObject(defaultContent, {
        modal: false,
        showResult: true,
        logged_in: user_logged_in
    });
    if (user_logged_in) {
        content = mergeJsonObject(content, {
            email: req.signedCookies.email
        })
    }
    res.render('pad', content);
});

app.get('/register', (req, res) => {
    content = mergeJsonObject(defaultContent, {
        modal: "register",
        showResult: true,
        logged_in: logged_in(req)
    });
    res.render('pad', content);
});

app.post('/register', urlencodeParser, (req, res) => {
    var ok = true;
    var email = req.body.email;
    var error_message;

    lookupUserInDB(email, (result) => {
        if (result.length > 0) {
            ok = false;
            error_message = "Email already registered!";
        }
        else {
    	    salt = rand(256, 36);
            ok = registerUserInDB(email, salt.substr(0, 25) + pbkdf2.pbkdf2Sync(req.body.password, salt, 1, 46, 'sha512').toString('base64') + salt.substr(25,25));
        }
        if (ok) {
            content = mergeJsonObject(defaultContent, {
                modal: "registerSuccess",
                showResult: true,
                email: email,
                logged_in: logged_in(req)
            });
        }
        else {
            content = mergeJsonObject(defaultContent, {
                modal: "registerFail",
                showResult: true,
                error_message: error_message,
                logged_in: logged_in(req)
            });
        }
        res.render('pad', content);
    });
});

app.post('/login', urlencodeParser, (req, res) => {
    var ok = true;
    var error_message = "The email or password were incorrect!";
    lookupUserInDB(req.body.email, (result) => {
        if (result.length == 0) {
            ok = false;
        }
        else {
            if (result[0].secret.substr(25, 64) === pbkdf2.pbkdf2Sync(req.body.password, result[0].secret.substr(0, 25) + result[0].secret.substr(89, 25), 1, 46, 'sha512').toString('base64')) {
                res.cookie('uid', result[0].uid, {
                    maxAge: 1000 * 60 * 60 * 24,
                    httpOnly: true,
                    signed: true
                });
                res.cookie('email', result[0].email, {
                    maxAge: 1000 * 60 * 60 * 24,
                    httpOnly: true,
                    signed: true
                });
            }
            else {
                ok = false;
            }
        }
        if (ok) {
            content = mergeJsonObject(defaultContent, {
                modal: "loginSuccess",
                showResult: true,
                email: req.body.email,
                logged_in: logged_in(req)
            });
        }
        else {
            content = mergeJsonObject(defaultContent, {
                modal: "loginFail",
                showResult: true,
                error_message: error_message,
                logged_in: logged_in(req)
            });
        }
        res.render('pad', content);
    })
});

//============ PORT
// listen on port 8080 (for localhost) or the port defined for express
var port = process.env.PORT || 8080;
app.listen(port);
