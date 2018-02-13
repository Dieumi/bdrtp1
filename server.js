var http = require('http');
var cheerio = require('cheerio');
//var rp = require('request-retry');
	var request = require('requestretry');
var MongoClient = require('mongodb').MongoClient,
   test = require('assert');
var htmlparser = require('htmlparser');
var Regex = require("regex");

MongoClient.connect('mongodb://localhost:27017', function(err, client) {
  var db = client.db('graph_algorithms');

	var regex = /sorcerer\/wizard [01234]/;
	var regex2 = /Components V/;
	//console.log(regex.test("School conjuration (creation) [acid]; Level sorcerer/wizard 2, magus 2, bloodrager 2Casting Time 1 standard actionComponents V, S, M (rhubarb leaf and an adder's stomach), F (a dart)Range long (400 ft. + 40 ft./level)Effect one arrow of acidDuration 1 round + 1 round per three levelsSaving Throw none; Spell Resistance no"));
//  console.log(db);
   // Create a test collection

   var collection = db.collection('SSSP');
	  
	 collection.find({}).toArray(function(err, result) {
    if (err) throw err;
    console.log(result);

  });
   //Pour garder le chemin, enregistrer un backpointer.
		var objet=[];

   for(var i =1;i<1976;i++){

		var options = {
			method: 'GET',
		 	uri: 'http://www.dxcontent.com/SDB_SpellBlock.asp?SDBID='+i,
			timeout: 600000,
      headers: {
            'Connection': 'keep-alive',
            'Accept-Encoding': '',
            'Accept-Language': 'en-US,en;q=0.8'
        }
		};

			//console.log("attempt number test ");

			request({
				url:'http://www.dxcontent.com/SDB_SpellBlock.asp?SDBID='+i,
				maxAttempts:5,
				retryDelay:500
			},function(err,response,body){

			 var rawHtml = cheerio.load(body);
			 var div = rawHtml('.SpellDiv .SPDet').text();


			 if(regex.test(div) ){

				 //console.log();
				 //console.log(rawHtml('.SpellDiv .SPDet ').text());

				 var name1= rawHtml('.SpellDiv .heading').text();
				 var level1= div.split("sorcerer\/wizard")[1][1];
				 var Components1= div.match(/([VSMF][^a-z]+|[VSMF])\s/g);
				 var Resistance1= div.split("Spell Resistance")[1];
				 console.log(name1);
				// console.log(level1);
				 var data={
					 name: name1,
					 level : level1,
					 Components: Components1,
					 Resistance : Resistance1
				 };
					 objet.push(data);
					 console.log(objet.length)
				 collection.insert(data);
			 }


			 //console.log(rawHtml('.SpellDiv .SPDesc').text());
 /*
					var handler = new htmlparser.DefaultHandler(function(error, dom){
							if (error)
									console.log(error.toString())

					});
					var parser = new htmlparser.Parser(handler);
					parser.parseComplete(rawHtml);
			 //   console.log(handler.dom[1]);
 */

})
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
