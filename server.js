var express = require('express');

var bodyParser = require('body-parser');
var path = require('path');

var config = require('./db-config');
var mysql = require('mysql');

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


const sqlQueryNext = 'SELECT images.image_id, series.series_id, series.title, series.folder, images.filename FROM images ' +
    'LEFT JOIN ratings ON images.image_id=ratings.image_id ' +
    'LEFT JOIN series ON images.series_id=series.series_id ' +
    'GROUP BY ratings.image_id ORDER BY COUNT(ratings.rating_id)';
const sqlQueryLink = 'SELECT title, filename, folder FROM images ' +
    'LEFT JOIN series ON images.series_id=series.series_id ' +
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
                var imgLink = 'img/' + rows[0].folder + '/' + rows[0].filename;
                res.render('card', {
                    head_title: 'Image Labeling',
                    card_title: 'Introduction',
                    image_id: imageId,
                    img: imgLink,
                    source: rows[0].title
                });

            });
        } catch (e) {
            console.error(e);
        } finally {
            connection.end();
        }
    } else {
        res.render('card', {
            head_title: 'Image Labeling',
            card_title: 'Anime or Cartoon',
            image_id: '0',
            img: '/anime/img/aang.jpg',
            source: 'Avatar: The Last Airbender'
        });
    }
};
app.get('/anime/', cardFunc); // intro, start
// app.get('/anime/tutorial/:tutorial_id(\\d+)/', cardFunc); // tutorial
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
        var query = connection.query(sqlQueryNext, function (err, rows, fields) {
            if (err) throw err;
            var imgLink = 'img/' + rows[0].folder + '/' + rows[0].filename;

            console.log('Image sent: ', imgLink);

            res.send({
                id: rows[0].image_id,
                imgURL: domain + imgLink,
                imgSrc: rows[0].title,
                prevSave: success
            })
        });
        console.log(query.sql);
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

    if (id === undefined) {
        console.error('id undefined in nextImage Post');
        res.statusCode(404);
        return;
    }

    if (parseInt(id) < 0) { // tutorial
        console.log('Tutorial: ', id);

        res.send({
            id: id,
            imgURL: domain + 'img/tutorial' + (-id) + '.jpg',
            imgSrc: "Fullmetal Alchemist: Brotherhood",
            prevSave: true
        })
    } else if (parseInt(id) === 0) { // don't save
        nextImageFunc(req, res, true); // redirect to get impl
    } else { // save and next

        // check session

        // convert values
        var vars = {
            image_id: id,
            text: text === 'true' ? 1 : 0,
            person: char === 'true' ? 1 : 0,
            logo: logo === 'true' ? 1 : 0,
            empty: empty === 'true' ? 1 : 0
        };
        // save to db
        var connection = mysql.createConnection(config);
        try {
            connection.connect();
            var query = connection.query(sqlInsertRating, vars, function (err, results, fields) {
                if (err) throw err;
                // console.log('Inserted ', results.affectedRows, 'rows');

                nextImageFunc(req, res, parseInt(results.affectedRows) > 0); // redirect to get impl
            });
            console.log(query.sql);

        } catch (e) {
            console.error(e);
        } finally {
            connection.end();
        }
    }
});

const root = './static/img/';
const fs = require('fs');

const sqlInsertImages = 'INSERT INTO images (series_id, filename) VALUES ?';
function uploadDir(dir) {
    // create series row

    fs.readdir(root + dir, function (err, files) {
        // create array
        var images = [];

        files.forEach(function (file) {
            var element = ['LAST_INSERT_ID()', file];
            images.push(element);
        });

        var multiConfig = require('./db-config');
        multiConfig.multipleStatements = true;
        var connection = mysql.createConnection(multiConfig);
        try {
            connection.connect();
            // var dir = connection.escape(dir);
            var insertSeries = "INSERT INTO series (title, folder) VALUES ('" + dir + "', '" + dir + "');";
            var query = connection.query(insertSeries + sqlInsertImages, [images], function (err, results, fields) {
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
