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
    response.render('pages/yahoo');
});

app.get('/', function (request, response) {
    response.render('pages/index');
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});


