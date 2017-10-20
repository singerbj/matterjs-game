const Player = require('./entities/player');
const Helpers = require('./helpers');
const Net = require('net');
const Decoder = new TextDecoder("utf-8");

var playerMap = {};
var wallMap = {};
var clients = {};

if(true){ //if we are the server
    var server = Net.createServer();
    server.on('connection', function(c) {
        console.log('new client', c);
        //save client
        c.id = Helpers.getUUID();
        clients[c.id] = c;
        //create player for client
        var newPlayer = new Player(0,0);
        playerMap[newPlayer.id] = newPlayer;
        clients[c.id].player = newPlayer;
        Engine.addPlayer(newPlayer);

        c.on('data', function(data) {
            console.log('connection data',  JSON.parse(Decoder.decode(data)));
        });

        c.once('close', function() {
            console.log('connection from ' + remoteAddress + ' closed', );
            Engine.removePlayer(playerMap[player.id]);
            delete playerMap[player.id];
            delete clients[c.id];
        });

        c.on('error', function(err) {
            console.log('Connection ' + remoteAddress + ' error: ' + err.message);
            Engine.removePlayer(playerMap[player.id]);
            delete playerMap[player.id];
            delete clients[c.id];
        });
    });

    var Engine = require('./engine')(function(){
        Object.keys(clients).forEach(function(id){
            clients[id].write(JSON.stringify({
                playerMap: Helpers.serializeMap(playerMap),
                wallMap: Helpers.serializeMap(wallMap)
            }));
        });
    });

    server.listen(6754, function() {
        console.log('server listening on port:', server.address().port);
    });
} //else { //if we aren't running a server
    var client = new Net.Socket();
    client.connect(6754, '127.0.0.1', function() {
    	console.log('Connected');
    });

    client.on('data', function(data) {
        var parsedData = JSON.parse(Decoder.decode(data));
    	console.log('Received: ', parsedData);
    	// client.destroy(); // kill client after server's response
        playerMap = parsedData.playerMap;
        wallMap = parsedData.wallMap;
    });

    client.on('close', function() {
    	console.log('Connection closed');
    });
// }

module.exports = {
    playerMap: playerMap,
    wallMap: wallMap
};
