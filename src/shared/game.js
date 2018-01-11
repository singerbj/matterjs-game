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
    var mapSize = 4000;
    var gameStarted = false;
    var fps;


    var velocity = {
        x: 0,
        y: 0
    };
    var shots = [];
    var Engine = require('./engine')(function (engine, fps) {
        //Add promise to these loops
        shots = [];
        var arrayOfShots,
            shot, hitEntity;
        Object.keys(playerMap).forEach(function (id) {
            playerMap[id].x = playerMap[id].matterjs.position.x;
            playerMap[id].y = playerMap[id].matterjs.position.y;
            playerMap[id].ground = {};

            arrayOfShots = playerMap[id].handleFiring(engine);
            if (arrayOfShots) {
                arrayOfShots.forEach(function (shot) {
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
                });
            }

        });

        Object.keys(wallMap).forEach(function (id) {
            wallMap[id].x = wallMap[id].matterjs.position.x;
            wallMap[id].y = wallMap[id].matterjs.position.y;
        });

        Object.keys(itemMap).forEach(function (id) {
            if (!itemMap[id].deleted) {
                itemMap[id].x = itemMap[id].matterjs.position.x;
                itemMap[id].y = itemMap[id].matterjs.position.y;
            } else {
                toDelete.push(id);
                Engine.removeItem(itemMap[id]);
                delete itemMap[id];
            }
        });


        Object.keys(playerMap).forEach(function (id) {
            var currentPlayer = playerMap[id];
            if (currentPlayer && currentPlayer.health > 0) {
                if (currentPlayer.moving.up && !currentPlayer.moving.down) {
                    velocity.y = -currentPlayer.speed;
                } else if (!currentPlayer.moving.up && currentPlayer.moving.down) {
                    velocity.y = currentPlayer.speed;
                } else {
                    velocity.y = 0;
                }

                if (currentPlayer.moving.left && !currentPlayer.moving.right) {
                    velocity.x = -currentPlayer.speed;
                } else if (!currentPlayer.moving.left && currentPlayer.moving.right) {
                    velocity.x = currentPlayer.speed;
                } else {
                    velocity.x = 0;
                }

                if (velocity.x !== 0 && velocity.y !== 0) {
                    var change = Math.sqrt()
                    if (velocity.x > 0) {
                        velocity.x = currentPlayer.diagonalSpeed;
                    } else {
                        velocity.x = -currentPlayer.diagonalSpeed;
                    }
                    if (velocity.y > 0) {
                        velocity.y = currentPlayer.diagonalSpeed;
                    } else {
                        velocity.y = -currentPlayer.diagonalSpeed;
                    }
                }

                Matter.Body.setVelocity(currentPlayer.matterjs, velocity);

                currentPlayer.x = currentPlayer.matterjs.position.x;
                currentPlayer.y = currentPlayer.matterjs.position.y;
            } else if (playerMap[currentPlayer.id] && currentPlayer.health === 0) {
                toDelete.push(currentPlayer.id);
                Engine.removePlayer(playerMap[currentPlayer.id]);
                delete playerMap[currentPlayer.id];
                // delete currentPlayer;
            }
        });
    }, function (engine, engineFps) {
        fps = engineFps;
        Object.keys(clients).forEach(function (id) {
            clients[id].send(JSON.stringify({
                playerMap: Helpers.serializeMap(playerMap),
                wallMap: Helpers.serializeMap(wallMap),
                itemMap: Helpers.serializeMap(itemMap),
                toDelete: toDelete,
                player: clients[id].player ? clients[id].player.serialize() : undefined,
                shots: shots,
                fps: fps,
                reloads: reloads,
                gameStarted: gameStarted
            }));
            reloads = [];
        });
    });

    var hostPlayer = new Player(Helpers.rand(-(mapSize / 2) + 100, (mapSize / 2) - 100), Helpers.rand(-(mapSize / 2) + 100, (mapSize / 2) - 100));
    playerMap[hostPlayer.id] = hostPlayer;
    Engine.addPlayer(hostPlayer);

    var handleMessage = function(data, c){
        var currentPlayer = c ? c.player : hostPlayer;
        event = JSON.parse(data);
        if (gameStarted && currentPlayer) {
            if (event.keys) {
                Matter.Sleeping.set(currentPlayer.matterjs, false);
                Object.keys(event.keys).forEach(function (key) {
                    if (key === 'W') {
                        currentPlayer.moving.up = (event.keys[key] === 'onkeydown');
                    } else if (key === 'A') {
                        currentPlayer.moving.left = (event.keys[key] === 'onkeydown');
                    } else if (key === 'S') {
                        currentPlayer.moving.down = (event.keys[key] === 'onkeydown');
                    } else if (key === 'D') {
                        currentPlayer.moving.right = (event.keys[key] === 'onkeydown');
                    } else if (key === 'F' && event.keys[key] === 'onkeydown') {
                        currentPlayer.handlePickup(itemMap, Engine);
                    } else if (key === 'R' && event.keys[key] === 'onkeydown' && currentPlayer.gun && currentPlayer.gun.ammo < currentPlayer.gun.maxAmmo && !currentPlayer.reloading) {
                        currentPlayer.reloading = true;
                    } else if ((key === '1' || key === '2') && event.keys[key] === 'onkeydown') {
                        currentPlayer.switchWeapon(key);
                    }
                });
            }
            if (event.type === 'onmousedown') {
                currentPlayer.firing = true;
            }
            if (event.type === 'onmouseup') {
                currentPlayer.firing = false;
            }
            if (event.type === 'mouse') {
                currentPlayer.mouse = {
                    x: event.x,
                    y: event.y
                };
                currentPlayer.aim = (4 * event.y) / (4 * event.x);
            }
            if (event.name) {
                currentPlayer.name = event.name;
            }
        } else {
            if (event.name) {
                currentPlayer.name = event.name;
            }
        }
    };

    if (startServer) { //if we are the server
        var server = new WebSocket.Server({
            port: 6574
        });
        server.on('connection', function (c) {
            if (!gameStarted) {
                //save client
                c.id = Helpers.getUUID();
                clients[c.id] = c;
                //create player for client
                var newPlayer = new Player(Helpers.rand(-(mapSize / 2) + 100, (mapSize / 2) - 100), Helpers.rand(-(mapSize / 2) + 100, (mapSize / 2) - 100));
                playerMap[newPlayer.id] = newPlayer;
                c.player = newPlayer;
                Engine.addPlayer(newPlayer);

                c.on('message', function (data) {
                    handleMessage(data, c);
                });

                c.once('close', function () {
                    console.log('player left');
                    toDelete.push(c.player.id);
                    Engine.removePlayer(playerMap[c.player.id]);
                    delete playerMap[c.player.id];
                    delete clients[c.id];
                });

                c.on('error', function (err) {
                    // Engine.removePlayer(playerMap[c.player.id]);
                    // delete playerMap[c.player.id];
                    // delete clients[c.id];
                    // toDelete.push(c.player.id);
                    console.log(err);
                });
            } else {
                c.close();
            }
        });

        var mapBodies = MapBuilder.buildMap(mapSize, mapSize);
        mapBodies.walls.forEach(function (wall) {
            wallMap[wall.id] = wall;
            Engine.addWall(wall);
        });
        mapBodies.items.forEach(function (item) {
            itemMap[item.id] = item;
            Engine.addItem(item);
        });
    };

    return {
        getPlayerMap: function(){
            return Helpers.serializeMap(playerMap);
        },
        getWallMap: function(){
            return Helpers.serializeMap(wallMap);
        },
        getItemMap: function(){
            return Helpers.serializeMap(itemMap);
        },
        getToDelete: function(){
            return toDelete;
        },
        getPlayer: function(){
            return hostPlayer.serialize();
        },
        getShots: function(){
            return shots;
        },
        getFps: function(){
            return fps;
        },
        getReloads: function(){
            return reloads;
        },
        getGameStarted: function(){
            return gameStarted;
        },
        startGame: function(){
            gameStarted = true;
        },
        sendEvent: function(event){
            if(startServer){
                handleMessage(JSON.stringify(event));
            }else{
                //TODO: send it over networking
            }
        }
    };
}
