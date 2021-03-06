var cheerio = require('cheerio');
var request = require('requestretry');
var MongoClient = require('mongodb').MongoClient;
var format = require('string-format');
var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database(':memory:');

const MAXINDEX = 1976;
const collectionname = 'Spell';
const dbname = 'BDR_TP1';

format.extend(String.prototype);

MongoClient.connect('mongodb://localhost:27017', function (err, client) {
    var db = client.db(dbname);

    var collection = db.collection(collectionname, function (error, result) {
        if (error)
            throw error;
        console.log('Reached collection {}'.format(result.collectionName))
    });

    collection.find({}).toArray(function (err, result) {
        if (err) throw err;
        if (result.length > 0) {
            console.log('Found items in collection {}'.format(collection.collectionName));
            collection.drop(function (mongoError) {
                if (mongoError)
                    throw mongoError;
                console.log('Collection cleaned');
                db.createCollection(collectionname, function (error, result) {
                    if (error)
                        throw error;
                    collection = result;
                    console.log('Collection {} successfully created'.format(collection.collectionName));
                })
            })
        }

    });
    var responses = [];
    var responsecount = 1;
    console.log('Fetching data from website...');

    for (var i = 1; i < MAXINDEX; i++) {



        //console.log("attempt number test ");
        request({
            url: 'http://www.dxcontent.com/SDB_SpellBlock.asp?SDBID=' + i,
            maxAttempts: 10,
            retryDelay: 500
        }, function (err, response, body) {

            if (err) {
                throw err;

            }
            else {
                responses.push(body);
                //console.log('count ' +responsecount + ' i ' +i);
                responsecount++;

                if (responsecount === MAXINDEX) {
                    console.log('Obtained {0} items from website'.format(responsecount));
                    processResults(responses, client, collection);
                }
            }


        })


    }


}); //MongoClient Connect

function processResults(results, client, collection) {
    var regex = /sorcerer\/wizard [01234]/;
    //var regex2 = /Components V/;
    var length = results.length;
    // console.log(length);

    var objet = [];
    for (var i = 0; i < length; i++) {

        var rawHtml = cheerio.load(results[i]);
        var div = rawHtml('.SpellDiv .SPDet').text();
        if (div !== "") {


            var rangepos = div.search('Range');
            var afterRange = div.slice(rangepos);
            div = div.slice(0, rangepos) + ' ';
            div += afterRange;


            var name1 = rawHtml('.SpellDiv .heading').text();
            if (div.indexOf('sorcerer\/wizard') !== -1) {
                var level1 = div.split("sorcerer\/wizard")[1][1];
            } else {
                var level1 = div.match(/[0-9]/)[0];
            }

            var job = div.match(/Level(.*)Casting/g);

            var classes = job[0].match(/.*[^Casting]/g);
            classes = classes[0].match(/[^Level].*/g);
            classes = classes[0].match(/([a-z]+)/g);
            var Components1 = div.match(/([VSMF][^a-z]+|[VSMF]|[?])\s/g);
            var Resistance1 = div.split("Spell Resistance")[1];
            if (Resistance1 != null) {
                Resistance1 = Resistance1.replace(/\s/g, '');
                Resistance1 = Resistance1 === 'yes';
            }
            var data = {
                name: name1,
                level: parseInt(level1),
                Components: Components1[0].replace(/\s/g, '').split(','),
                Classes: classes,
                Resistance: Resistance1
            };
            objet.push(data);

        }
    }
    collection.insertMany(objet, function (error, result) {
        if (error)
            throw error;
        else {
            console.log('Inserted {0} items in DB'.format(result.insertedCount));

        }

        collection.find().toArray().then(function (resultat) {
            console.log("/////MONGODB///////");
            var spell = resultat.filter(function (result) {
                if (result.Classes.includes('sorcerer') || result.Classes.includes('wizard')) {

                    if ((result.Components[0] === 'V' | result.Components === 'V') && result.level <= 4 && result.Components.length === 1) {
                        return result;
                    }
                }
            }).map(function (result) {
                return [result.name, result.level];
            });
            console.log('MapReduce result:');
            console.log(spell);
            console.log(spell.length);
            client.close(false);
        })
    });

    insertInSqlLite(objet);

}


function insertInSqlLite(data) {
    console.log("///////SQLITE///////");
    db.serialize(function () {
        db.run('DROP TABLE IF EXISTS spell');
        db.run('CREATE TABLE IF NOT EXISTS spell (id INTEGER PRIMARY KEY, name TEXT NOT NULL, classes TEXT NOT NULL, level INTEGER NOT NULL, components TEXT NOT NULL,' +
            'spell_resistance INTEGER)');

        var statement = db.prepare('INSERT INTO spell(name, classes, level, components, spell_resistance) VALUES (?,?,?,?,?)', function (error) {
            if (error)
                throw error;
        });
        var datalen = data.length;
        for (var i = 0; i < datalen; i++) {
            statement.run(data[i].name, data[i].Classes.join(), data[i].level, data[i].Components.join(), data[i].Resistance, function (error) {
                if (error)
                    throw error;
            });
        }
        statement.finalize(function (error) {
            if (error)
                throw error;
        });

        db.all('SELECT name, level FROM spell WHERE level<=4 AND components = "V" AND (classes LIKE "%sorcerer%" OR classes LIKE "%wizard%")', function (err, rows) {
            if (err)
                throw err;
            console.log('sqlite result:');
            console.log(rows);
            console.log(rows.length);

        });
    });

    db.close();
}