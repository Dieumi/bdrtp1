var http = require('http');
var cheerio = require('cheerio');
var rp = require('request-promise');
	var request = require('request');
var MongoClient = require('mongodb').MongoClient,
   test = require('assert');
MongoClient.connect('mongodb://localhost:27017', function(err, client) {
  var db = client.db('graph_algorithms');
//  console.log(db);
   // Create a test collection

   var collection = db.collection('SSSP');
   //Pour garder le chemin, enregistrer un backpointer.
   for(var i =1;i<2;i++){

     rp("http://www.dxcontent.com/SDB_SpellBlock.asp?SDBID="+i ).then(function(body){
      var $= cheerio.load(body);
      console.log($('.SpellDiv .heading').text());
      console.log($('.SpellDiv .SPDet').text());
      console.log($('.SpellDiv .SPDesc').text());
     });

   }
  /* var graph =
       [
           { _id:"Ed" ,  value:{ backpointer: "", changed: false, type: "full", distance: 0, adjlist: ["Frank", "Julien"]}},
           { _id:"Frank", value:{ backpointer: "",changed: false,type: "full", distance: Infinity, adjlist: ["Ed"]}},
           {_id:"Julien",value:{ backpointer: "",changed: false,type: "full", distance: Infinity, adjlist: ["Ed", "Florentin", "Valere"]}},
           { _id:"Valere", value:{ backpointer: "",changed: false,type: "full", distance: Infinity, adjlist: ["Julien", "Florentin", "Bruno"]}},
           { _id:"Bruno", value:{ backpointer: "",changed: false,type: "full", distance: Infinity, adjlist: ["Valere"]}},
           { _id:"Florentin", value:{ backpointer: "",changed: false,type: "full", distance: Infinity, adjlist: ["Julien", "Valere"]}}
       ];

   // console.log(graph);

   collection.removeMany(); //Efface tout (sync)

   // Insert some documents to perform map reduce over
   //Utilise une promise
   collection.insertMany(graph, {w:1}).then(function (result) {

       //Map utilise l'objet this
       var map = function () {

           //    print(tojson(this));

           var vertex = this._id;
           var adjlist = this.value.adjlist;
           var distance = this.value.distance;

           // print("Full objet emit");
           //print(vertex, this);
           emit(vertex, this.value); //Re-émettre la même chose

           if (distance == Infinity) return; //Si la distance est infinie, pas besoin d'emitter des trucs...

           for (var i = 0; i < adjlist.length; i++) {

               var adj = adjlist[i]; //valere, julien etc
               //  print(adj, distance+1);
               var objet = {type:"compact", distance:distance+1, backpointer:vertex};

               //   print("map ", adj, tojson(objet));
               emit(adj, objet);
           }

       };

       //Find lowest distance and write it
       var reduce = function (key, values)
       {
           print("1er Reduce : ", tojson(key), tojson(values));
           var full = {};

           //First, find the original one
           for (var i = 0; i < values.length; i++)
           {
               var val = values[i];
               if (val.type == "full") {
                   full = val;
               }
           }

           //On met full a "aucun changement"
           full.changed = false;

           //Then improve on it
           for (var i = 0; i < values.length; i++)
           {
               var val = values[i];
               if (val.type == "compact") {
                   if (val.distance < full.distance) {
                       full.changed = true;
                       full.distance = val.distance;
                       full.backpointer = val.backpointer;
                   }
               }
           }

           print("Full object de ", key);
           print(tojson(full));
           return full;
       };

       //tf = test function
       function bfs_iteration(i, max, cb)
       {
           // Peform the map reduce
           collection.mapReduce(map, reduce, {out: {replace: "SSSP"}})
           .then(function (collection)
           {
               collection.find().toArray()
                   .then(function (docs)
                   {
                       console.log(docs);
                       console.log("************************************************************************");
                       console.log("************************************************************************");
                       console.log("************************************************************************");

                       //1ere condition d'arrêt. Le graphe converge (algo fini)
                       //Sinon, on a egalement un maximum d'iterations
                       //Nombre max d'iterations atteint
                       console.log("VALEUR DE I = ", i);
                       if (i == max)
                           cb();

                       // Peform a simple find and return all the documents
                       collection.find({"value.changed": true}).toArray()
                           .then(function (docs)
                           {

                               console.log("GROS LOG DES DOCS TROUVES");
                               console.log("************************************************************************");
                               console.log(docs);

                               if (docs.length == 0) {
                                   console.log("SORTIE TAKEN");
                                   cb();
                               }
                               else {
                                   console.log("ENCORE UNE ITERATION");
                                   bfs_iteration(i + 1, max, cb);
                               }
                           })
                   })
           })
       }

   bfs_iteration(0, 10, function fin() {
       console.log("Fin du programme!!!");
       db.close();
   })

}) //Insertmany
*/
}) //MongoClient Connect
