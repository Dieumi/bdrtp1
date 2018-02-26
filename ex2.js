var MongoClient = require('mongodb').MongoClient;


const collectionname = 'Pagerank';
const dbname = 'BDR_TP1';


MongoClient.connect('mongodb://localhost:27017', function (err, client) {
    var db = client.db(dbname);
    var collection = db.collection(collectionname);
    collection.removeMany();

    var graph =
        [
            {_id: 'A', value: {pagerank: 1, outgoinglinks: ['B', 'C']}},
            {_id: 'B', value: {pagerank: 1, outgoinglinks: ['C']}},
            {_id: 'C', value: {pagerank: 1, outgoinglinks: ['A']}},
            {_id: 'D', value: {pagerank: 1, outgoinglinks: ['C']}}
        ];

    collection.insertMany(graph).then(function (value) {


        var map = function () {
            var outlinks = this.value.outgoinglinks;
            var pr = this.value.pagerank;
            var id = this._id;
            var val = this.value;
            emit(id, val);
            emit(id, 0);
            for (var i = 0; i < outlinks.length; i++) {
                var out = outlinks[i];
                emit(out, pr / outlinks.length);
            }
        };

        var reduce = function (key, values) {
            // print('reduce ' +key);
            //print(tojson(values));
            const dampingfactor = 0.85;
            var full = {};
            var pagerank = 0;
            for (var i = 0; i < values.length; i++) {
                var val = values[i];
                if (typeof  val !== 'number') {
                    full = val;
                }
                else {
                    pagerank += val;
                }
            }

            pagerank = (1 - dampingfactor) + (dampingfactor * pagerank);
            full.pagerank = pagerank;

            print("Full value de " + key);
            print(tojson(full));
            return full;


        };

        function pagerank_iteration(i, max, callback) {
            collection.mapReduce(map, reduce, {out: {replace: collectionname}}).then(function (resultcollection) {
                resultcollection.find().toArray().then(function (docs) {
                    console.log(docs);
                    console.log("************************************************************************");
                    console.log("************************************************************************");
                    console.log("************************************************************************");
                    console.log("VALEUR DE I = ", i);
                    if (i === max)
                        callback();
                    else {
                        console.log("ENCORE UNE ITERATION");
                        pagerank_iteration(i + 1, max, callback);
                    }
                })
            })
        }

        pagerank_iteration(0, 20, function fin() {
            console.log("Fin du programme!!!");
            client.close(false);
            //process.exit()
        })
    })
});