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


const sqlQueryNext = 'SELECT image.image_id, image.series, image.link FROM image ' +
    'LEFT JOIN ratings ON image.image_id=ratings.image_id ' +
    'GROUP BY ratings.image_id ORDER BY COUNT(ratings.rating_id)';
const sqlQueryLink = 'SELECT series, link FROM image ' +
    'WHERE `image_id` = ?';
const sqlInsertUser = 'INSERT IGNORE INTO users SET ?';
const sqlInsertRating = 'INSERT INTO ratings SET ?';

function insertUser(ip) {
    var vars = {ip: ip};
    var connection = mysql.createConnection(config);
    try {
        connection.connect();
        var query = connection.query(sqlInsertUser, vars, function (err, results, fields) {
            if (err) throw err;
        });
        console.log(query.sql);

    } catch (e) {
        console.error(e);
    } finally {
        connection.end();
    }
}

app.enable('trust proxy');

// url handling
var cardFunc = function (req, res) {
    // add new user
    var ip = req.headers['x-forwarded-for'];
    console.log(ip);
    insertUser(ip);

    // init session

    // save session cookie to db

    // load image from url
    var imageId = req.params.image_id;
    if (imageId !== undefined) {
        var connection = mysql.createConnection(config);
        try {
            connection.connect();
            connection.query(sqlQueryLink, [imageId], function (err, rows, fields) {
                if (err) throw err;
                if (rows[0] === undefined) {
                    res.status(404);
                    return;
                }
                var imgLink = 'img/' + rows[0].series + '/' + rows[0].link;
                res.render('card', {
                    head_title: 'Image Labeling',
                    card_title: 'Introduction',
                    image_id: imageId,
                    img: imgLink
                });

            });
        } catch (e) {
            console.error(e);
        } finally {
            connection.end();
        }
    } else {
        // TODO add intro page by default
        res.render('card', {
            head_title: 'Image Labeling',
            card_title: 'Introduction',
            image_id: '-1',
            img: '/anime/img/aang.jpg'
        });
    }
};
app.get('/anime/', cardFunc);
app.get('/anime/:image_id(\\d+)/', cardFunc);

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
        connection.query(sqlQueryNext, function (err, rows, fields) {
            if (err) throw err;
            var imgLink = 'img/' + rows[0].series + '/' + rows[0].link;

            console.log('Image sent: ', imgLink);

            res.send({
                id: rows[0].image_id,
                imgURL: domain + imgLink,
                prevSave: success
            })
        });
    } catch (e) {
        console.error(e);
    } finally {
        connection.end();
    }
};


app.get('/anime/next_image', nextImageFunc);
app.post('/anime/next_image', function (req, res) {
    console.log("post request");

    var id = req.body.id; // image_id
    var text = req.body.text;
    var char = req.body.char;
    var empty = req.body.empty;
    var logo = req.body.logo;

    if (id !== '-1') {

        // check session

        // convert values
        var vars = {
            image_id: id,
            text: text === 'true' ? 1 : 0,
            person: char === 'true' ? 1 : 0,
            empty: empty === 'true' ? 1 : 0,
            logo: logo === 'true' ? 1 : 0
        };
        // save to db
        var connection = mysql.createConnection(config);
        try {
            connection.connect();
            var query = connection.query(sqlInsertRating, vars, function (err, results, fields) {
                // if (err) throw err;
                console.log('Inserted ', results.affectedRows, 'rows');

                nextImageFunc(req, res, results.affectedRows > 0); // redirect to get impl
            });
            console.log(query.sql);

        } catch (e) {
            console.error(e);
        } finally {
            connection.end();
        }
    } else {
        nextImageFunc(req, res, true); // redirect to get impl
    }

});

const root = './static/img/';
const fs = require('fs');

const sqlInsertImages = 'INSERT INTO image (series, link, isanime) VALUES ?';
function uploadDir(dir) {
    fs.readdir(root + dir, function (err, files) {
        // create array
        var images = [];

        files.forEach(function (file) {
            var element = [dir, file, 1];
            images.push(element);
        });
        var connection = mysql.createConnection(config);
        try {
            connection.connect();
            var query = connection.query(sqlInsertImages, [images], function (err, results, fields) {
                if (err) throw err;

                console.log(dir, ' inserted with ', results.affectedRows, ' / ' + images.length);
                // todo add check file when dir/file already done

            });
            console.log(query.sql);
        } catch (e) {
            console.error(e);
        } finally {
            connection.end();
        }
    });
}
app.get('/anime/update', function (req, res) {

    fs.readdir(root, function (err, files) {
        files.forEach(function (file) {
            if (fs.statSync(root + file).isDirectory()) {
                uploadDir(file);
            }
        });
    });
    res.send('done');
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log('Example app listening on port ' + port)
});
