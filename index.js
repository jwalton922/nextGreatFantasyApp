var FantasySports = require('fantasysports');
var express = require('express');
var session = require('express-session');
var Grant = require('grant-express');
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
var app = express();

app.set('port', (process.env.PORT || 5000));
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static(__dirname + '/public'));
app.use(session({secret:'grant'}))
// mount grant 
app.use(grant)

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/handle_yahoo_response', function (request, response) {
    console.log("handle_yahoo_response request: "+request);
    for(var key in request.query){
        console.log("request.query key: "+key+"="+request.query[key]);
    }
    for(var key in request.body){
        console.log("request.body key: "+key+"="+request.body[key]);
    }
    for(var key in request.params){
        console.log("request.params key: "+key+"="+request.params[key]);
    }
    for(var key in request.session){
        console.log("request.session key: "+key+"="+request.session[key]);
    }
    for(var key in request.session.grant){
        console.log("request.session.grant key: "+key+"="+request.session.grant[key]);
    }
    FantasySports
        .request(request, response)
        .api('http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json')
        .done(function(data) {
            var leagueData = data.fantasy_content.users[0].user[1].games[0].game[1].leagues,
                leagues = [];

            _.each(leagueData, function(value) {
                if (value.league) leagues.push(value.league[0]);
            });

            response.json(leagues);
        });
    response.render('pages/yahoo');
});

app.get('/', function (request, response) {
    response.render('pages/index');
});

app.get('/yahoolanding', function (request, response) {
    console.log("yahoolanding request: "+request);
    FantasySports
        .request(request, response)
        .api('http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json')
        .done(function(data) {
            var leagueData = data.fantasy_content.users[0].user[1].games[0].game[1].leagues,
                leagues = [];

            _.each(leagueData, function(value) {
                if (value.league) leagues.push(value.league[0]);
            });

            response.json(leagues);
        });
    response.render('pages/yahoo');
});

app.get('/makeYahooRequest', function(req,res){
    FantasySports
        .request(req, res)
        .api('http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json')
        .done(function(data) {
            var leagueData = data.fantasy_content.users[0].user[1].games[0].game[1].leagues,
                leagues = [];

            _.each(leagueData, function(value) {
                if (value.league) leagues.push(value.league[0]);
            });

            res.json(leagues);
        });
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});


