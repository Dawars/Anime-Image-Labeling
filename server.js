var express = require('express');
var path = require('path');
var connection = require("mysql");

var app = express();

// map static resources to url
app.use('/anime/', express.static('static'));
app.use('/anime/iisnode', express.static('iisnode')); // debug only

// set up template engine
app.engine('html', require('hogan-express'));
app.set('view engine', 'html');


// url handling
app.get('/anime/', function (req, res) {

    res.render('card', {
        head_title: 'Image Labeling',
        card_title: 'Introduction',
        img: '/anime/img/aang.jpg',
    });
});

app.get('/anime/tutorial', function (req, res) {
    res.send('Tutorial!')
});

app.get('/anime/getRandomImage', function (req, res) {
    var config = require('./db-config');
    var mysql = require('mysql');
    var connection = mysql.createConnection(config);

    connection.connect();

    connection.query('SELECT 1 + 1 AS solution', function (err, rows, fields) {
        if (err) throw err;

        console.log('The solution is: ', rows[0].solution)
    });

    connection.end();

    res.send('end')
    /*
     res.send({
     // TODO db conn
     id: 22,
     imgURL: "http://animedata.azurewebsites.net/img/text.jpg"
     })*/
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log('Example app listening on port ' + port)
});
