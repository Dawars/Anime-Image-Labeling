var express = require('express');
var connection = require("mysql");

var app = express();

app.use(express.static('static'));
app.use('/anime/iisnode', express.static('iisnode'))

app.get('/', function (req, res) {
    res.send('Hello World!')
});

app.get('/anime/', function (req, res) {
    res.send('Anime images!')
});
app.get('/anime/tutorial', function (req, res) {
    res.send('Tutorial!')
});

app.get('/anime/getRandomImage', function (req, res) {
    var config = require('./db-config');
    var mysql = require('mysql')
    var connection = mysql.createConnection(config);

    connection.connect()

    connection.query('SELECT 1 + 1 AS solution', function (err, rows, fields) {
        if (err) throw err

        console.log('The solution is: ', rows[0].solution)
    })

    connection.end()

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
