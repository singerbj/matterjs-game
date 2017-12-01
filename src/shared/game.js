const Player = require('./entities/player');
const Wall = require('./entities/wall');
const Helpers = require('./helpers');
const WebSocket = require('ws');
const Decoder = new TextDecoder("utf-8");
const Matter = require('matter-js/build/matter.js');


module.exports = function(startServer){
    var playerMap = {};
    var wallMap = {};
    var toDelete = [];
    var clientPlayerMap = {};
    var clientWallMap = {};
    var clients = {};

    if(startServer){ //if we are the server
        var server = new WebSocket.Server({ port: 6574 });
        server.on('connection', function(c) {
            // console.log('new client', c);
            //save client
            c.id = Helpers.getUUID();
            clients[c.id] = c;
            //create player for client
            var newPlayer = new Player(0,0);
            playerMap[newPlayer.id] = newPlayer;
            c.player = newPlayer;
            Engine.addPlayer(newPlayer);

            c.on('message', function(data) {
                event = JSON.parse(data);
                if(event.type === 'onkeydown'){
                    if(event.key === 'w'){
                        c.player.moving.up = true;
                    } else if(event.key === 'a'){
                        c.player.moving.left = true;
                    } else if(event.key === 's'){
                        c.player.moving.down = true;
                    } else if(event.key === 'd'){
                        c.player.moving.right = true;
                    }
                } else if(event.type === 'onkeyup'){
                    if(event.key === 'w'){
                        c.player.moving.up = false;
                    } else if(event.key === 'a'){
                        c.player.moving.left = false;
                    } else if(event.key === 's'){
                        c.player.moving.down = false;
                    } else if(event.key === 'd'){
                        c.player.moving.right = false;
                    }
                } else if(event.type === 'onmousedown'){
                    c.player.firing = true;
                } else if(event.type === 'onmouseup'){
                    c.player.firing = false;
                } else if(event.type === 'mouse'){
                    c.player.mouse = {
                        x: c.player.x + event.x,
                        y: c.player.y + event.y
                    };
                    c.player.aim = (4 * event.y) / (4 * event.x);
                }
            });

            c.once('close', function() {
                console.log('player left');
                Engine.removePlayer(playerMap[c.player.id]);
                delete playerMap[c.player.id];
                delete clients[c.id];
                toDelete.push(c.player.id);
            });

            c.on('error', function(err) {
                // console.log('player connection error');
                Engine.removePlayer(playerMap[c.player.id]);
                delete playerMap[c.player.id];
                delete clients[c.id];
                toDelete.push(c.player.id);
            });
        });

        var velocity = {x: 0, y: 0};
        var Engine = require('./engine')(function(engine){

            //Add promise to these loops
            var shots = []
            Object.keys(playerMap).forEach(function(id){
                if(id[0] !== '_'){
                    playerMap[id].x = playerMap[id].matterjs.position.x;
                    playerMap[id].y = playerMap[id].matterjs.position.y;

                    shots.push(playerMap[id].handleFiring(engine));
                }
            });

            Object.keys(wallMap).forEach(function(id){
                wallMap[id].x = wallMap[id].matterjs.position.x;
                wallMap[id].y = wallMap[id].matterjs.position.y;
            });

            Object.keys(clients).forEach(function(id){
                if(clients[id].player.moving.up && !clients[id].player.moving.down){
                    velocity.y = -clients[id].player.speed;
                }else if(!clients[id].player.moving.up && clients[id].player.moving.down){
                    velocity.y = clients[id].player.speed;
                }else{
                    velocity.y = 0;
                }

                if(clients[id].player.moving.left && !clients[id].player.moving.right){
                    velocity.x = -clients[id].player.speed;
                }else if(!clients[id].player.moving.left && clients[id].player.moving.right){
                    velocity.x = clients[id].player.speed;
                }else{
                    velocity.x = 0;
                }
                Matter.Body.setVelocity(clients[id].player.matterjs, velocity);


                clients[id].player.x = clients[id].player.matterjs.position.x;
                clients[id].player.y = clients[id].player.matterjs.position.y;

                clients[id].send(JSON.stringify({
                    playerArray: Helpers.serializeMap(playerMap)
                }));
                clients[id].send(JSON.stringify({
                    wallArray: Helpers.serializeMap(wallMap)
                }));
                clients[id].send(JSON.stringify({
                    toDelete: toDelete
                }));
                clients[id].send(JSON.stringify({
                    player: clients[id].player.serialize()
                }));
                clients[id].send(JSON.stringify({
                    shots: shots
                }));
            });
        });

        // add a bunch of random walls
        for(var i = 0; i < 200; i += 1){
            var wall = new Wall(Helpers.rand(100, 1000), Helpers.rand(100, 1000), Helpers.rand(20, 380), Helpers.rand(20, 380));
            wallMap[wall.id] = wall;
            Engine.addWall(wall);
        }
        //
        // for(var i = 0; i < 1; i += 1){
        //     var wall = new Wall(Helpers.rand(0, 40), Helpers.rand(0, 40), Helpers.rand(20, 40), Helpers.rand(20, 40));
        //     wallMap[wall.id] = wall;
        //     Engine.addWall(wall);
        // }
    }
}
