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
        img: '/anime/img/Attack_On_Titan/Attack_On_Titan_ep01_0155.jpg', // '/anime/img/aang.jpg',
    });
});

app.get('/anime/tutorial', function (req, res) {
    res.send('Tutorial!')
});

var domain = "http://dawars.me/anime/";

app.get('/anime/next_image', function (req, res) {
    var config = require('./db-config');
    var mysql = require('mysql');
    var connection = mysql.createConnection(config);

    connection.connect();

    var sql = 'SELECT image.image_id, image.series, image.link FROM image ' +
        'LEFT JOIN ratings ON image.image_id=ratings.image_id ' +
        'GROUP BY ratings.image_id ORDER BY COUNT(ratings.rating_id)';
    connection.query(sql, function (err, rows, fields) {
        if (err) throw err;
        var img = 'img' + rows[0].series + '/' + rows[0].link;
        console.log('Image sent: ', img);
        res.send({
            id: rows[0].image_id,
            imgURL: domain + img
        })
    });

    connection.end();

});

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log('Example app listening on port ' + port)
});
