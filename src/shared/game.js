const Player = require('./entities/player');
const Wall = require('./entities/wall');
const Helpers = require('./helpers');
const MapBuilder = require('./mapbuilder');
const WebSocket = require('ws');
const Decoder = new TextDecoder("utf-8");
const Matter = require('matter-js/build/matter.js');


module.exports = function (startServer) {
    var playerMap = {};
    var wallMap = {};
    var itemMap = {};
    var toDelete = [];
    var clients = {};
    var reloads = [];

    if (startServer) { //if we are the server
        var server = new WebSocket.Server({
            port: 6574
        });
        server.on('connection', function (c) {
            // console.log('new client', c);
            //save client
            c.id = Helpers.getUUID();
            clients[c.id] = c;
            //create player for client
            var newPlayer = new Player(0, 0);
            playerMap[newPlayer.id] = newPlayer;
            c.player = newPlayer;
            Engine.addPlayer(newPlayer);

            c.on('message', function (data) {
                event = JSON.parse(data);
                if (event.type === 'onkeydown') {
                    Matter.Sleeping.set(c.player.matterjs, false);
                    if (event.key === 'w' || event.key === 'W') {
                        c.player.moving.up = true;
                    } else if (event.key === 'a' || event.key === 'A') {
                        c.player.moving.left = true;
                    } else if (event.key === 's' || event.key === 'S') {
                        c.player.moving.down = true;
                    } else if (event.key === 'd' || event.key === 'D') {
                        c.player.moving.right = true;
                    } else if ((event.key === 'r' || event.key === 'R') && c.player.gun.ammo < c.player.gun.maxAmmo && !c.player.reloading) {
                        c.player.reloading = true;
                        reloads.push({
                            x: c.player.x,
                            y: c.player.y
                        });
                    }
                } else if (event.type === 'onkeyup') {
                    if (event.key === 'w' || event.key === 'W') {
                        c.player.moving.up = false;
                    } else if (event.key === 'a' || event.key === 'A') {
                        c.player.moving.left = false;
                    } else if (event.key === 's' || event.key === 'S') {
                        c.player.moving.down = false;
                    } else if (event.key === 'd' || event.key === 'D') {
                        c.player.moving.right = false;
                    }
                } else if (event.type === 'onmousedown') {
                    c.player.firing = true;
                } else if (event.type === 'onmouseup') {
                    c.player.firing = false;
                } else if (event.type === 'mouse') {
                    c.player.mouse = {
                        x: c.player.x + event.x,
                        y: c.player.y + event.y
                    };
                    c.player.aim = (4 * event.y) / (4 * event.x);
                }
            });

            c.once('close', function () {
                console.log('player left');
                Engine.removePlayer(playerMap[c.player.id]);
                delete playerMap[c.player.id];
                delete clients[c.id];
                toDelete.push(c.player.id);
            });

            c.on('error', function (err) {
                // console.log('player connection error');
                Engine.removePlayer(playerMap[c.player.id]);
                delete playerMap[c.player.id];
                delete clients[c.id];
                toDelete.push(c.player.id);
            });
        });

        var velocity = {
            x: 0,
            y: 0
        };
        var Engine = require('./engine')(function (engine, fps) {

            //Add promise to these loops
            var shots = [],
                shot, hitEntity;
            Object.keys(playerMap).forEach(function (id) {
                playerMap[id].x = playerMap[id].matterjs.position.x;
                playerMap[id].y = playerMap[id].matterjs.position.y;
                shot = playerMap[id].handleFiring(engine);
                if (shot) {
                    if (shot.hitEntityId) {
                        if (playerMap[shot.hitEntityId]) {
                            hitEntity = playerMap[shot.hitEntityId];
                        } else if (wallMap[shot.hitEntityId]) {
                            hitEntity = wallMap[shot.hitEntityId];
                        }
                        if (hitEntity && hitEntity.handleHit) {
                            hitEntity.handleHit(shot);
                        }
                    }
                    shots.push(shot);
                }
            });

            Object.keys(wallMap).forEach(function (id) {
                wallMap[id].x = wallMap[id].matterjs.position.x;
                wallMap[id].y = wallMap[id].matterjs.position.y;
            });

            Object.keys(itemMap).forEach(function (id) {
                itemMap[id].x = itemMap[id].matterjs.position.x;
                itemMap[id].y = itemMap[id].matterjs.position.y;
            });

            Object.keys(clients).forEach(function (id) {
                if (clients[id].player) {
                    if (clients[id].player.moving.up && !clients[id].player.moving.down) {
                        velocity.y = -clients[id].player.speed;
                    } else if (!clients[id].player.moving.up && clients[id].player.moving.down) {
                        velocity.y = clients[id].player.speed;
                    } else {
                        velocity.y = 0;
                    }

                    if (clients[id].player.moving.left && !clients[id].player.moving.right) {
                        velocity.x = -clients[id].player.speed;
                    } else if (!clients[id].player.moving.left && clients[id].player.moving.right) {
                        velocity.x = clients[id].player.speed;
                    } else {
                        velocity.x = 0;
                    }
                    Matter.Body.setVelocity(clients[id].player.matterjs, velocity);

                    clients[id].player.x = clients[id].player.matterjs.position.x;
                    clients[id].player.y = clients[id].player.matterjs.position.y;

                    clients[id].send(JSON.stringify({
                        playerArray: Helpers.serializeMap(playerMap),
                        wallArray: Helpers.serializeMap(wallMap),
                        itemArray: Helpers.serializeMap(itemMap),
                        toDelete: toDelete,
                        player: clients[id].player.serialize(),
                        shots: shots,
                        fps: fps,
                        reloads: reloads,
                    }));
                    reloads = [];
                }
            });
        });

        var mapBodies = MapBuilder.buildMap(1000, 1000);
        mapBodies.walls.forEach(function (wall) {
            wallMap[wall.id] = wall;
            Engine.addWall(wall);
        });
        mapBodies.items.forEach(function (item) {
            itemMap[item.id] = item;
            Engine.addItem(item);
        });
        // mapBodies.guns.forEach(function(gun){
        //
        // });

        // // add a bunch of random walls
        // for(var i = 0; i < 20; i += 1){
        //     var wall = new Wall(Helpers.rand(100, 1000), Helpers.rand(100, 1000), Helpers.rand(20, 380), Helpers.rand(20, 380));
        //     wallMap[wall.id] = wall;
        //     Engine.addWall(wall);
        // }
        //
        // for(var i = 0; i < 1; i += 1){
        //     var wall = new Wall(Helpers.rand(0, 40), Helpers.rand(0, 40), Helpers.rand(20, 40), Helpers.rand(20, 40));
        //     wallMap[wall.id] = wall;
        //     Engine.addWall(wall);
        // }
    }
}
