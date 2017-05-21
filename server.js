var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var mysql = require('mysql');
var config = require('./db-config');

var app = express();

// map static resources to url
app.use('/anime/', express.static('static'));
app.use('/anime/iisnode', express.static('iisnode')); // debug only

// parse application/json
// app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// set up template engine
app.engine('html', require('hogan-express'));
app.set('view engine', 'html');


const sqlQuery = 'SELECT image.image_id, image.series, image.link FROM image ' +
    'LEFT JOIN ratings ON image.image_id=ratings.image_id ' +
    'GROUP BY ratings.image_id ORDER BY COUNT(ratings.rating_id)';


// url handling
app.get('/anime/', function (req, res) {
    // var startImage = getNextImage();

    res.render('card', {
        head_title: 'Image Labeling',
        card_title: 'Introduction',
        img: '/anime/img/aang.jpg',
    });
});

var domain = "/anime/";
/**
 *
 * @param req
 * @param res
 * @param success if the previous update was successful
 */
var nextImageFunc = function (req, res, success) {
    var connection = mysql.createConnection(config);
    try {
        connection.connect();
        connection.query(sqlQuery, function (err, rows, fields) {
            if (err) throw err;
            var imgLink = 'img/' + rows[0].series + '/' + rows[0].link;

            console.log('Image sent: ', imgLink);

            res.send({
                id: rows[0].image_id,
                imgURL: domain + imgLink,
                prevSave: success// todo add successfully saved flag
            })
        });
    } catch (e) {
        console.error(e);
    } finally {
        connection.end();
    }
};

const sqlInsert = 'INSERT INTO ratings SET ?';

app.get('/anime/next_image', nextImageFunc);
app.post('/anime/next_image', function (req, res) {
    console.log("post request");
    console.log(req.body);      // your JSON

    var id = req.body.id; // image_id
    var text = req.body.text;
    var char = req.body.char;
    var empty = req.body.empty;
    var logo = req.body.logo;

    console.log('id ', id, ' text ', text, ' char ', char, ' empty ', empty, ' logo ', logo);

    if (id !== -1) {

        // check session

        // convert values
        var vars = {
            // rating_id: '',
            image_id: id,
            text: text === 'true' ? 1 : 0,
            person: char === 'true' ? 1 : 0,
            empty: empty === 'true' ? 1 : 0,
            logo: logo === 'true' ? 1 : 0
        };
        console.log(vars);
        // save to db
        var connection = mysql.createConnection(config);
        try {
            connection.connect();
            var query = connection.query(sqlInsert, vars, function (err, results, fields) {
                // if (err) throw err;
                // console.log('Inserted ', results.affectedRows, 'rows');
            });
            console.log(query.sql);

        } catch (e) {
            console.error(e);
        } finally {
            connection.end();
        }
    }

    return nextImageFunc(req, res, true); // redirect to get impl
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log('Example app listening on port ' + port)
});
