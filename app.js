var express = require('express');
var path = require("path");
var app = express();
var session = require('express-session');

app.use(express.static('static'));
app.use(session({secret: 'keyboard cat', cookie: {maxAge: null}}));

var port = process.env.port || 3000;
app.listen(port, function () {
    console.log('Anime image labeling app listening on port ' + port + '!')
});

app.get('/', function (req, res) {
    res.send('test')
});

app.get('/getRandomImage', function (req, res) {
    res.send({
        id: 22,
        imgURL: "http://animedata.azurewebsites.net/img/text.jpg"
    })
});
