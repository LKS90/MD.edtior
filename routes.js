
module.exports = function (app) {

app.get('/', function(req, res) {
    content = mergeJsonObject(defaultContent, {login: false, modal: modalLogin});
    console.log(content);
    res.render('pad', content);
});

app.get('/login', function(req, res) {
    content = mergeJsonObject(defaultContent, {login: true, modal: modalLogin});
    res.render('pad', content);
});

app.post('/login', urlencodeParser, (req, res) => {
    console.log(req.body);
    // passport.authenticate('local'),
    // {
    //     successRedirect: renderSuccess(res),
    //     failureRedirect: '/login'
    //  }
}
);

  app.get('/register', function(req, res) {
      res.render('register', { });
  });

  /* app.post('/register', function(req, res) {
    Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
            return res.render('register', { account : account });
        }

        passport.authenticate('local')(req, res, function () {
          res.redirect('/');
        });
    });
  });
 */

  app.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/');
  });
};
