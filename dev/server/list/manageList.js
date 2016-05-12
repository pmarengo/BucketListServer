module.exports = function (server, db, mqttClient, baseURL) {
    var validateRequest = require("../auth/validateRequest");
    var Client = require('node-rest-client').Client;
    var restClient = new Client();
    var util = require('util');

    server.get("/api/v1/bucketList/data/list", function (req, res, next) {
        validateRequest.validate(req, res, db, function () {
            db.bucketLists.find({
                user : req.params.token
            },function (err, list) {
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8'
                });
                res.end(JSON.stringify(list));
            });
        });
        return next();
    });

    server.get('/api/v1/bucketList/data/item/:id', function (req, res, next) {
        validateRequest.validate(req, res, db, function () {
            db.bucketLists.find({
                _id: db.ObjectId(req.params.id)
            }, function (err, data) {
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8'
                });
                res.end(JSON.stringify(data));
            });
        });
        return next();
    });

    server.post('/api/v1/bucketList/data/item', function (req, res, next) {
        validateRequest.validate(req, res, db, function () {
            var item = req.params;
            item._id = db.ObjectId(req.params._id);
            db.bucketLists.save(item,
                function (err, data) {
                    res.writeHead(200, {
                        'Content-Type': 'application/json; charset=utf-8'
                    });
                    var json = JSON.stringify(data);
                    res.end(json);
                    mqttClient.publish('Server/BucketList/Data/Item/POST', json, [2,false], null);
                });
        });
        return next();
    });

    server.put('/api/v1/bucketList/data/item/:id', function (req, res, next) {
        validateRequest.validate(req, res, db, function () {
            db.bucketLists.findOne({
                _id: db.ObjectId(req.params.id)
            }, function (err, data) {
                // merge req.params/product with the server/product

                var updProd = {}; // updated products 
                // logic similar to jQuery.extend(); to merge 2 objects.
                for (var n in data) {
                    updProd[n] = data[n];
                }
                for (var n in req.params) {
                    if (n != "id" && n != "_id")
                        updProd[n] = req.params[n];
                }
                db.bucketLists.update({
                    _id: db.ObjectId(req.params.id)
                }, updProd, {
                    multi: false
                }, function (err, data) {
                    res.writeHead(200, {
                        'Content-Type': 'application/json; charset=utf-8'
                    });
                    var json = JSON.stringify(data);
                    res.end(json);
                    mqttClient.publish('Server/BucketList/Data/Item/PUT', json, [2,false], null);
                });
            });
        });
        return next();
    });

    server.del('/api/v1/bucketList/data/item/:id', function (req, res, next) {
        validateRequest.validate(req, res, db, function () {
            db.bucketLists.remove({
                _id: db.ObjectId(req.params.id)
            }, function (err, data) {
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8'
                });
                var json = JSON.stringify(data);
                res.end(json);
                mqttClient.publish('Server/BucketList/Data/Item/DELETE', json, [2,false], null);
            });
            return next();
        });
    });
    	 
    mqttClient.on('message', function (topic, message) {
		  // message is Buffer 
		  console.log(message.toString());
		  
		  if(topic === 'Client/BucketList/Data/Item/POST'){
			  var args = {
						data : message.toString(),
						headers: {"Content-Type": "application/json"}
			  };
			  restClient.post(util.format("%s/data/item", baseURL), args, function (message, response) {
					console.log(response);
			  });
		  }
		  
		  if(topic === 'Client/BucketList/Data/Item/PUT'){
			  var json = JSON.parse(message);
			  var args = {
					    path: { "id": json._id },
						data : message.toString(),
						headers: {"Content-Type": "application/json"}
			  };
			  restClient.put(util.format("%s/data/item/${id}", baseURL), args, function (message, response) {
					console.log(response);
			  });
		  }
		  
		  if(topic === 'Client/BucketList/Data/Item/DELETE'){
			  var json = JSON.parse(message);
			  var args = {
					    path: { "id": json._id },
						data : message.toString(),
						headers: {"Content-Type": "application/json"}
			  };
			  restClient.delete(util.format("%s/data/item/${id}", baseURL), args, function (message, response) {
					console.log(response);
			  });
		  }
    });

}