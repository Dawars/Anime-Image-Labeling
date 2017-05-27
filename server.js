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

app.enable('trust proxy');
const sqlQueryNext = 'SELECT image_id,filename,series.title,series.folder FROM images AS r1 ' +
    'JOIN series USING(series_id) ' +
    'JOIN (SELECT CEIL(RAND() * (SELECT MAX(image_id) FROM images)) AS id) AS r2 ' +
    'WHERE r1.image_id >= r2.id ' +
    'ORDER BY r1.image_id ASC ' +
    'LIMIT 1'; // fixme remove 0 byte images
/*
 const sqlQueryNext = 'SELECT images.image_id, series.title, series.folder, images.filename FROM images ' +
 'LEFT JOIN ratings USING(image_id) ' +
 'LEFT JOIN series USING(series_id) ' +
 'GROUP BY ratings.image_id ORDER BY COUNT(ratings.rating_id) LIMIT 1';
 */
const sqlQueryLink = 'SELECT title, filename, folder FROM images ' +
    'LEFT JOIN series ON images.series_id=series.series_id ' +
    'WHERE `image_id` = ?';
const sqlInsertUser = 'INSERT IGNORE INTO users SET ?';
const sqlInsertRating = 'INSERT INTO ratings SET ?';

function strEndsWith(str, suffix) {
    return str.match(suffix + "$") == suffix;
}

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
                var imgLink, source;
                var cardTitle = 'Introduction';

                if (rows[0] === undefined) {
                    imgLink = 'img/404.jpg';
                    source = 'http://mangaonlinehere.com';
                    cardTitle ='Image not found'
                } else {
                    imgLink = 'img/' + rows[0].folder + '/' + rows[0].filename;
                    source = rows[0].title;
                }res.render('card', {
                    head_title: 'Image Labeling',
                    card_title: cardTitle,
                    image_id: imageId,
                    img: imgLink,
                    source: source
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

        // todo save user_id
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

function uploadDir(dir) {
    var sqlInsertImages = 'INSERT INTO images (series_id, filename) VALUES ';

    // create series row
    console.log('processing dir ' + dir);
    fs.readdir(root + dir, function (err, files) {
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (strEndsWith(file.toLowerCase(), '.jpg') || strEndsWith(file.toLowerCase(), '.jpeg')) {
                sqlInsertImages += "(LAST_INSERT_ID(),'" + file + "')";
                if (i !== files.length - 1) {
                    sqlInsertImages += ',';
                }
            }
        }

        var insertSeries = "INSERT IGNORE INTO series (title, folder) VALUES('" + dir + "','" + dir + "');";
        // write query
        /* fs.writeFile(root + dir + "/_insert.sql", insertSeries + sqlInsertImages, function (err) {
         if (err) {
         console.log(err);
         return;
         }
         console.log(dir + " query saved");
         });*/
        var multiConfig = require('./db-config');
        multiConfig.multipleStatements = true;
        var connection = mysql.createConnection(multiConfig);
        try {
            connection.connect();
            var query = connection.query(insertSeries + sqlInsertImages, function (err, results, fields) {
                if (err) throw err;

                console.log(dir, ' inserted (probably) ', files.length, ' rows');
                // add check file when dir/file already done
                fs.appendFileSync(root + 'saved_series.txt', dir);

                console.log(dir + " saved");

            });
            // console.log(query.sql);
        } catch (e) {
            console.error(e);
        } finally {
            connection.end();
        }
    });
}
app.get('/anime/update', function (req, res) {

    // read done file in sync
    var done = fs.readFileSync(root + 'saved_series.txt').toString().split("\n");


    fs.readdir(root, function (err, files) {
        for (var i = 0; i < files.length; i++) {
            var dir = files[i];
            if (done.indexOf(dir) === -1) { // not already processed
                if (fs.statSync(root + dir).isDirectory()) {
                    uploadDir(dir);
                }
            }
        }
    });
    res.send('done');
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log('Example app listening on port ' + port)
});
