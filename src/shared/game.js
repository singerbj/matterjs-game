const Player = require('./entities/player');
const Wall = require('./entities/wall');
const Helpers = require('./helpers');
const Net = require('net');
const Decoder = new TextDecoder("utf-8");
const Matter = require('matter-js/build/matter.js');


module.exports = function(startServer){
    var playerMap = {};
    var wallMap = {};
    var clientPlayerMap = {};
    var clientWallMap = {};
    var clients = {};

    if(startServer){ //if we are the server
        var server = Net.createServer();
        server.on('connection', function(c) {
            console.log('new client', c);
            //save client
            c.id = Helpers.getUUID();
            clients[c.id] = c;
            //create player for client
            var newPlayer = new Player(0,0);
            playerMap[newPlayer.id] = newPlayer;
            c.player = newPlayer;
            Engine.addPlayer(newPlayer);

            c.on('data', function(data) {
                var events = Decoder.decode(data).replace(/\}\{/g,'}}{{').split('}{');
                events.forEach(function(event){
                    event = JSON.parse(event);
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
                    }
                });
            });

            c.once('close', function() {
                console.log('player left');
                Engine.removePlayer(playerMap[player.id]);
                delete playerMap[player.id];
                delete clients[c.id];
            });

            c.on('error', function(err) {
                console.log('player connection error');
                Engine.removePlayer(playerMap[player.id]);
                delete playerMap[player.id];
                delete clients[c.id];
            });
        });

        var velocity = {x: 0, y: 0};
        var Engine = require('./engine')(function(){

            //Add promise to these loops
            Object.keys(playerMap).forEach(function(id){
                playerMap[id].x = playerMap[id].matterjs.position.x;
                playerMap[id].y = playerMap[id].matterjs.position.y;
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

                clients[id].write(JSON.stringify({
                    playerMap: Helpers.serializeMap(playerMap),
                    wallMap: Helpers.serializeMap(wallMap)
                }));
            });
        });

        //add a wall
        var wall = new Wall(140, 40, 30, 180);
        wallMap[wall.id] = wall;
        Engine.addWall(wall);

        wall = new Wall(40, 40, 30, 30);
        wallMap[wall.id] = wall;
        Engine.addWall(wall);

        wall = new Wall(140, 400, 30, 30);
        wallMap[wall.id] = wall;
        Engine.addWall(wall);

        wall = new Wall(40, 400, 30, 30);
        wallMap[wall.id] = wall;
        Engine.addWall(wall);

        server.listen(6754, function() {
            console.log('server listening on port:', server.address().port);
        });
    }
}
