var requestModule = require('request');
var FantasySports = require('fantasysports');
var express = require('express');
var assert = require('assert');
var session = require('express-session');
var Grant = require('grant-express');
var MongoClient = require('mongodb').MongoClient
        , assert = require('assert');
var passport = require('passport');
var YahooStrategy = require('passport-yahoo').Strategy;

// Connection URL
var url = process.env.MONGOLAB_URI;
// Use connect method to connect to the Server
var mongoDb = null;
MongoClient.connect(url, function (err, db) {
    assert.equal(null, err);
    mongoDb = db;
});
var grant = new Grant(
        {
            "server": {
                "protocol": "https",
                "host": "floating-journey-8362.herokuapp.com",
                "callback": "/callback",
                "transport": "session",
                "state": true
            },
            "yahoo": {
                "key": "dj0yJmk9OVh1eXRma3dtUnFYJmQ9WVdrOVl6bEhkRXRQTTJVbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD01OA--",
                "secret": "7ccf9d99b2e49136029d2c35e585cc967cb53dae",
                "callback": "/handle_yahoo_response"
            },
            "provider2": {}
        }
);

passport.use(new YahooStrategy({
    returnURL: 'http://localhost:3000/auth/yahoo/return',
    realm: 'http://localhost:3000/'
},
function (identifier, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

        // To keep the example simple, the user's Yahoo profile is returned to
        // represent the logged-in user.  In a typical application, you would want
        // to associate the Yahoo account with a user record in your database,
        // and return that user instead.
        profile.identifier = identifier;
        console.log(identifier);
        console.log(JSON.stringify(profile));
        return done(null, profile);
    });
}
));

var app = express();

app.set('port', (process.env.PORT || 5000));
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static(__dirname + '/public'));
app.use(session({secret: 'grant'}))
// mount grant 
app.use(grant);

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// GET /auth/yahoo
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Yahoo authentication will involve redirecting
//   the user to yahoo.com.  After authenticating, Yahoo will redirect the
//   user back to this application at /auth/yahoo/return
app.get('/auth/yahoo',
        passport.authenticate('yahoo', {failureRedirect: '/login'}),
        function (req, res) {
            console.log("/auth/yahoo called");
            res.redirect('/');
        });

// GET /auth/yahoo/return
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/yahoo/return',
        passport.authenticate('yahoo', {failureRedirect: '/login'}),
        function (req, res) {
            console.log("/auth/yahoo/return called");
            res.redirect('/');
        });
        
app.get('/connect_yahoo', function (req, res) {
  // generate random state parameter on each authorization attempt
  console.log("User: "+JSON.stringify(req.session.userObj));
  res.redirect('/connect/yahoo?username=' + req.session.userObj.username);
});

app.get('/handle_yahoo_response', function (request, response) {
    console.log("handle_yahoo_response request: " + request);
    for (var key in request.query) {
        console.log("request.query key: " + key + "=" + request.query[key]);
    }
    for (var key in request.body) {
        console.log("request.body key: " + key + "=" + request.body[key]);
    }
    for (var key in request.params) {
        console.log("request.params key: " + key + "=" + request.params[key]);
    }
    for (var key in request.session) {
        console.log("request.session key: " + key + "=" + request.session[key]);
    }
    for (var key in request.session.grant) {
        console.log("request.session.grant key: " + key + "=" + request.session.grant[key]);
    }

    for (var key in request.session.grant.step1) {
        console.log("request.session.grant.step1 key: " + key + "=" + request.session.grant.step1[key]);
    }

    for (var key in request.session.grant.response) {
        console.log("request.session.grant.response key: " + key + "=" + request.session.grant.response[key]);
    }
    
    var userObj = request.session.userObj;
    userObj.grant = request.session.grant;
    var userCollection = mongoDb.collection("users");
    userCollection.updateOne({username: userObj.username},{$set : {grant: request.session.grant}}, function(err, r){
        console.log("Error updating user? "+err);
        response.json(userObj);
    });
    
//    var url = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json&oauth_version="1.0"';
//    var access_token = request.session.grant.response.access_token;
//    var access_secret = request.session.grant.response.access_secret;
//
//    url += "&access_token=" + access_token;
//    console.log("url=" + url);
//    requestModule(url, function (error, fantasyresponse, body) {
//        console.log("error: " + error);
//        console.log("status code = " + fantasyresponse.statusCode);
//        console.log(body) // Show the HTML for the Google homepage. 
//        var bodyJson = body;
//        if (typeof body === "string") {
//            console.log("converted body string to json");
//            bodyJson = eval("(" + body + ")");
//        }
//        for (var key in bodyJson) {
//            console.log("bodyJson key: " + key + " = " + bodyJson[key]);
//        }
//        var userId = bodyJson.fantasy_content.users["0"].user[0].guid;
//        var userObj = {access_token: access_token, access_secret: access_secret, yahoo_id: userId, "_id": userId, grant: request.session.grant};
//        var userCollection = mongoDb.collection("users");
//        userCollection.insert([
//            userObj
//        ], function (err, result) {
//            console.log("error inserting user? " + err);
//            response.json(body);
//        });
//
//
//    });
//    FantasySports
//        .request(request, response)
//        .api('http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json')
//        .done(function(data) {
//            var leagueData = data.fantasy_content.users[0].user[1].games[0].game[1].leagues,
//                leagues = [];
//
//            _.each(leagueData, function(value) {
//                if (value.league) leagues.push(value.league[0]);
//            });
//
//            response.json(leagues);
//        });
//    response.render('pages/yahoo');
});

app.get('/', function (request, response) {
    var options = {
        root: __dirname + '/public/',
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };
    var fileName = "app/index.html";
    response.sendFile(fileName, options, function (err) {
        if (err) {
            console.log(err);
            res.status(err.status).end();
        }
        else {
            console.log('Sent:', fileName);
        }
    });
});

app.get('/yahoolanding', function (request, response) {
    console.log("yahoolanding request: " + request);
    FantasySports
            .request(request, response)
            .api('http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json')
            .done(function (data) {
                var leagueData = data.fantasy_content.users[0].user[1].games[0].game[1].leagues,
                        leagues = [];

                _.each(leagueData, function (value) {
                    if (value.league)
                        leagues.push(value.league[0]);
                });

                response.json(leagues);
            });
    response.render('pages/yahoo');
});

app.get('/makeYahooRequest', function (req, res) {
    FantasySports
            .request(req, res)
            .api('http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json')
            .done(function (data) {
                var leagueData = data.fantasy_content.users[0].user[1].games[0].game[1].leagues,
                        leagues = [];

                _.each(leagueData, function (value) {
                    if (value.league)
                        leagues.push(value.league[0]);
                });

                res.json(leagues);
            });
});

app.get('/login', function (req, res) {
    var username = req.query.username;
    var password = req.query.password;
    var userCollection = mongoDb.collection("users");
    userCollection.find({username: username}).toArray(function (err, docs) {
        if (docs.length === 1) {
            var userObj = docs[0];
            if (userObj.password === password) {
                req.session.user = userObj;
                res.send(userObj);
            } else {
                res.sendStatus(400)
            }
        } else {
            console.log("Found " + docs.length + " documents with username: " + username);
            res.sendStatus(400);
        }
    });
});

app.get('/register', function (req, res) {
    var username = req.query.username;
    var password = req.query.password;
    console.log("username: " + username + " password: " + password);
    var userCollection = mongoDb.collection("users");
    userCollection.find({username: username}).toArray(function (err, docs) {
        if (docs.length === 0) {
            var userObj = {username: username, password: password};
            userCollection.insert([
                userObj
            ], function (err, result) {
                console.log("error inserting user? " + err);
                req.session.user = userObj;
                res.sendStatus(200);
            });
        } else {
            console.log("Found " + docs.length + " documents with username: " + username);
            res.sendStatus(400);
        }
    });
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});


