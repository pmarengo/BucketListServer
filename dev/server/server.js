var restify     =   require('restify');
var mongojs     =   require('mongojs');
var	morgan  	= 	require('morgan');
var db          =   mongojs('bucketlistapp', ['appUsers','bucketLists']);
var server      =   restify.createServer();
var baseURL		=   'http://localhost:9804/api/v1/bucketList';
var mqtt 		= 	require('mqtt')  
var mqttClient 	= 	mqtt.connect('mqtt://broker.hivemq.com')  


server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(morgan('dev')); // LOGGER

// CORS
server.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

server.listen(process.env.PORT || 9804, function () {
    console.log("Server started @ ", process.env.PORT || 9804);
});

mqttClient.on('connect', function () {
	mqttClient.subscribe('Client/BucketList/Data/Item/POST');
	mqttClient.subscribe('Client/BucketList/Data/Item/PUT');
	mqttClient.subscribe('Client/BucketList/Data/Item/DELETE');
});

var manageUsers =   require('./auth/manageUser')(server, db);
var manageLists =   require('./list/manageList')(server, db, mqttClient, baseURL);