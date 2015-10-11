var WebSocketServer = require("ws").Server;
var yahooApi = require('./yahoo.js');
var rp = require('request-promise');
var http = require("http");
//var requestModule = require('request');
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



var yahoo_consumer_key = "dj0yJmk9OVh1eXRma3dtUnFYJmQ9WVdrOVl6bEhkRXRQTTJVbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD01OA--";
var yahoo_consumer_secret = "7ccf9d99b2e49136029d2c35e585cc967cb53dae";

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

var server = http.createServer(app);
var port = process.env.PORT || 5000;
server.listen(port);

console.log("http server listening on %d", port);

var wss = new WebSocketServer({server: server});
console.log("websocket server created")

wss.on("connection", function (ws) {
    var request = ws.upgradeReq;
    var response = {writeHead: {}};
    var user = null;
    sessionHandler(request, response, function (err) {
        user = request.session.user;
        console.log("websocket connection open to user: " + JSON.stringify(user));
    });

    ws.send("test ");
    
    ws.on('open', function open(){
       ws.send("server open happened") ;
    });

    ws.on('message', function(message){
        console.log("recevied message: "+message+" from "+user.username);
        console.log("got web socket readFantasyData request for: "+user.username);
        yahooApi.wsReadFantasyData(user,mongoDb, ws);
    });


    ws.on("close", function () {
        console.log("websocket connection close")
    });
});

app.set('port', (process.env.PORT || 5000));
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static(__dirname + '/public'));
var sessionHandler = session({secret: 'grant'});
app.use(sessionHandler);
// mount grant 
app.use(grant);

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

console.log("starting index.js");

function stringToJson(string) {
    var retValue = string;
    if (typeof string === "string") {
        retValue = eval("(" + string + ")");
    }

    return retValue;
}

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
    console.log("User: " + JSON.stringify(req.session.userObj));
    res.redirect('/connect/yahoo?username=' + req.session.userObj.username);
});

app.get('/callback', function (request, response) {
    console.log("callback route request: " + request);
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
    if (request.session.grant) {
        for (var key in request.session.grant) {
            console.log("request.session.grant key: " + key + "=" + request.session.grant[key]);
        }
    } else {
        console.log("no request.session.grant");
    }
    if (request.session.grant.step1) {
        for (var key in request.session.grant.step1) {
            console.log("request.session.grant.step1 key: " + key + "=" + request.session.grant.step1[key]);
        }
    } else {
        console.log("no request.session.grant.step1");
    }
    if (request.session.grant.response) {
        for (var key in request.session.grant.response) {
            console.log("request.session.grant.response key: " + key + "=" + request.session.grant.response[key]);
        }
    } else {
        console.log("no request.session.grant.response");
    }
    var userObj = {username: "notFound"};
    if (request.session.user) {
        var userObj = request.session.user;
        userObj.grant = request.session.grant;
        var userCollection = mongoDb.collection("users");
        userCollection.updateOne({username: userObj.username}, {$set: {grant: request.session.grant}}, function (err, r) {
            console.log("Error updating user? " + err);
            response.rediret("/#/home?readData=true");
        });
    } else {
        response.sendStatus(400);
    }

});

app.get('/getLeagueData', function (request, response) {
    var access_token = request.session.user.grant.response.access_token;
    var access_secret = request.session.user.grant.response.access_secret;
    var yahooId = request.session.user.grant.response.raw.xoauth_yahoo_guid;
    console.log('yahooId=' + yahooId);
    var leagues = request.session.user.leagues;

    var url = 'https://fantasysports.yahooapis.com/fantasy/v2/league/' + leagues[0].league_key + '?format=json&oauth_version="1.0"';
    url += "&access_token=" + access_token;
    console.log("url=" + url);
    requestModule(url, function (error, fantasyresponse, body) {
        console.log("error: " + error);
        console.log("status code = " + fantasyresponse.statusCode);
        console.log(body) // Show the HTML for the Google homepage. 
        var bodyJson = body;
        if (typeof body === "string") {
            console.log("converted body string to json");
            bodyJson = eval("(" + body + ")");
        }
        for (var key in bodyJson) {
            console.log("bodyJson key: " + key + " = " + bodyJson[key]);
        }
        response.json(bodyJson);
    });
});

app.get('/getNFLGameList', function (request, response) {
    var access_token = request.session.user.grant.response.access_token;
    var access_secret = request.session.user.grant.response.access_secret;
    var yahooId = request.session.user.grant.response.raw.xoauth_yahoo_guid;
    console.log('yahooId=' + yahooId);
    var url = 'https://fantasysports.yahooapis.com/fantasy/v2/games;game_codes=nfl?format=json&oauth_version="1.0"';
    url += "&access_token=" + access_token;
    console.log("url=" + url);
    requestModule(url, function (error, fantasyresponse, body) {
        console.log("error: " + error);
        console.log("status code = " + fantasyresponse.statusCode);
        console.log(body) // Show the HTML for the Google homepage. 
        var bodyJson = body;
        if (typeof body === "string") {
            console.log("converted body string to json");
            bodyJson = eval("(" + body + ")");
        }
        for (var key in bodyJson) {
            console.log("bodyJson key: " + key + " = " + bodyJson[key]);
        }

        response.json(bodyJson);

    });
});

app.get('/getMatchups', function (request, response) {
    var access_token = request.session.user.grant.response.access_token;
    var access_secret = request.session.user.grant.response.access_secret;
    var yahooId = request.session.user.grant.response.raw.xoauth_yahoo_guid;
    console.log('yahooId=' + yahooId);
    var url = 'https://fantasysports.yahooapis.com/fantasy/v2/team/348.l.373304.t.3/matchups?format=json&oauth_version="1.0"';
    url += "&access_token=" + access_token;
    console.log("url=" + url);
    requestModule(url, function (error, fantasyresponse, body) {
        console.log("error: " + error);
        console.log("status code = " + fantasyresponse.statusCode);
        console.log(body) // Show the HTML for the Google homepage. 
        var bodyJson = body;
        if (typeof body === "string") {
            console.log("converted body string to json");
            bodyJson = eval("(" + body + ")");
        }
        for (var key in bodyJson) {
            console.log("bodyJson key: " + key + " = " + bodyJson[key]);
        }

        response.json(bodyJson);

    });
});

app.get('/getTeams', function (request, response) {

    var access_token = request.session.user.grant.response.access_token;
    var access_secret = request.session.user.grant.response.access_secret;
    var yahooId = request.session.user.grant.response.raw.xoauth_yahoo_guid;
    console.log('yahooId=' + yahooId);
    var url = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/teams?format=json&oauth_version="1.0"';
    url += "&access_token=" + access_token;
    console.log("url=" + url);
    requestModule(url, function (error, fantasyresponse, body) {
        console.log("error: " + error);
        console.log("status code = " + fantasyresponse.statusCode);
        console.log(body) // Show the HTML for the Google homepage. 
        var bodyJson = body;
        if (typeof body === "string") {
            console.log("converted body string to json");
            bodyJson = eval("(" + body + ")");
        }
        for (var key in bodyJson) {
            console.log("bodyJson key: " + key + " = " + bodyJson[key]);
        }

        response.json(bodyJson);

    });
});

app.get('/getFantasyHistory', function (request, response) {

    var access_token = request.session.user.grant.response.access_token;
    var access_secret = request.session.user.grant.response.access_secret;
    var yahooId = request.session.user.grant.response.raw.xoauth_yahoo_guid;
    console.log('yahooId=' + yahooId);
    var url = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json&oauth_version="1.0"';
    url += "&access_token=" + access_token;
    console.log("url=" + url);
    requestModule(url, function (error, fantasyresponse, body) {
        console.log("error: " + error);
        console.log("status code = " + fantasyresponse.statusCode);
        console.log(body) // Show the HTML for the Google homepage. 
        var bodyJson = body;
        if (typeof body === "string") {
            console.log("converted body string to json");
            bodyJson = eval("(" + body + ")");
        }
        for (var key in bodyJson) {
            console.log("bodyJson key: " + key + " = " + bodyJson[key]);
        }
        var games = bodyJson.fantasy_content.users[0].user[1].games;
        for (var key in games) {
            if (!games[key].game) {
                continue;
            }
            console.log("games key: " + key);
            var game = games[key];
            console.log("Game:\n" + JSON.stringify(game, true));
            if (game.game[0].game_key === "348") {
                var leagues = game.game[1].leagues;
                var leagueData = [];
                for (var leagueKey in leagues) {
                    if (!leagues[leagueKey].league) {
                        continue;
                    }
                    console.log("Trying to to get league from leagueKey=" + leagueKey);
                    console.log(leagueKey + "= " + leagues[leagueKey]);
                    var someLeague = leagues[leagueKey].league[0];
                    console.log("Found league data: " + JSON.stringify(someLeague));
                    leagueData.push(someLeague);
                }
                var userObj = request.session.user;
                userObj.leagues = leagueData
                var userCollection = mongoDb.collection("users");
                userCollection.updateOne({username: userObj.username}, {$set: {leagues: leagueData}}, function (err, r) {
                    console.log("Error updating user? " + err);
                    response.json(userObj);
                });
            } else {
                console.log("Unknow game key: " + game.game[0].game_key);
            }
        }

    });
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

    var userObj = request.session.user;
    userObj.grant = request.session.grant;
    var userCollection = mongoDb.collection("users");
    userCollection.updateOne({username: userObj.username}, {$set: {grant: request.session.grant}}, function (err, r) {
        console.log("Error updating user? " + err);
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

function renewYahooTokens(userObj) {
    var url = "https://api.login.yahoo.com/oauth/v2/get_token";
    var oauth_nonce = new Date().getTime() + '' + new Date().getMilliseconds();
    var oauth_consumer_key = yahoo_consumer_key
    var oauth_signature_method = 'plaintext';
    var oauth_signature = yahoo_consumer_secret + '%26' + userObj.grant.response.access_secret;
    var oauth_version = '1.0';
    var oauth_token = userObj.grant.response.access_token;
    var oauth_timestamp = new Date().getTime();
    var oauth_session_handle = userObj.grant.response.raw.oauth_session_handle;
    console.log("signature: " + oauth_signature);
    var urlWithQureryParams = url +
            "?oauth_nonce=" + oauth_nonce +
            "&oauth_consumer_key=" + oauth_consumer_key +
            "&oauth_signature_method=" + oauth_signature_method +
            "&oauth_signature=" + oauth_signature +
            "&oauth_version=" + oauth_version +
            "&oauth_token=" + oauth_token +
            "&oauth_timestamp=" + oauth_timestamp +
            "&oauth_session_handle=" + oauth_session_handle;
    console.log("renew token url: " + urlWithQureryParams);
    var renewResponse = rp.get(urlWithQureryParams).then(function (body) {
        console.log("Token renew response: " + JSON.stringify(body));
        return body;
    });
    console.log("after promise: " + renewResponse);
    return renewResponse;
}

function testMakeResponse(response) {

    var rpReturn = rp.get('http://localhost:5000/randomBlob').then(function (body) {
        console.log("response from randomblob: " + JSON.stringify(body));
        response.json(stringToJson(body));
    });

}

app.get("/requestPromiseTest", function (request, response) {
    testMakeResponse(response);
});

app.get('/randomBlob', function (request, response) {
    response.json({bob: "loblaw"});
})

app.get('/renewYahooToken', function (request, response) {

    var newTokenData = renewYahooTokens(request.session.user);
    console.log("Return from renewTokenFunction: " + JSON.stringify(newTokenData));
    response.json(newTokenData);
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

app.get('/requestYahooSync', function (req, res) {
    var user = req.session.user;
    if (user == null) {
        console.log("No user in session");
        res.sendStatus(500);
    }


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

app.get('/getUser', function (req, res) {

    var userObj = {username: "notFound"};
    if (req.session.user) {
        userObj = req.session.user;
    }
    res.json(req.session.user);
});

app.get('/readFantasyData', function (request, response) {
    yahooApi.getAndStoreFantasyFootballData(request.session.user, mongoDb, response);
});

//app.listen(app.get('port'), function () {
//    console.log('Node app is running on port', app.get('port'));
//});




