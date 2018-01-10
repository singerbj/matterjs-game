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
                    event = JSON.parse(data);
                    if (gameStarted && c.player) {
                        if (event.keys) {
                            Matter.Sleeping.set(c.player.matterjs, false);
                            Object.keys(event.keys).forEach(function (key) {
                                if (key === 'W') {
                                    c.player.moving.up = (event.keys[key] === 'onkeydown');
                                } else if (key === 'A') {
                                    c.player.moving.left = (event.keys[key] === 'onkeydown');
                                } else if (key === 'S') {
                                    c.player.moving.down = (event.keys[key] === 'onkeydown');
                                } else if (key === 'D') {
                                    c.player.moving.right = (event.keys[key] === 'onkeydown');
                                } else if (key === 'F' && event.keys[key] === 'onkeydown') {
                                    c.player.handlePickup(itemMap, Engine);
                                } else if (key === 'R' && event.keys[key] === 'onkeydown' && c.player.gun && c.player.gun.ammo < c.player.gun.maxAmmo && !c.player.reloading) {
                                    c.player.reloading = true;
                                    reloads.push({
                                        x: c.player.x,
                                        y: c.player.y
                                    });
                                } else if ((key === '1' || key === '2') && event.keys[key] === 'onkeydown') {
                                    c.player.switchWeapon(key);
                                }
                            });
                        }
                        if (event.type === 'onmousedown') {
                            c.player.firing = true;
                        }
                        if (event.type === 'onmouseup') {
                            c.player.firing = false;
                        }
                        if (event.type === 'mouse') {
                            c.player.mouse = {
                                x: event.x,
                                y: event.y
                            };
                            c.player.aim = (4 * event.y) / (4 * event.x);
                        }
                        if (event.name) {
                            c.player.name = event.name;
                        }
                    } else {
                        if (event.start === true) {
                            gameStarted = true;
                        }
                        if (event.name) {
                            c.player.name = event.name;
                        }
                    }
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

        var velocity = {
                x: 0,
                y: 0
            },
            shots = [];
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

            Object.keys(clients).forEach(function (id) {
                if (clients[id].player && clients[id].player.health > 0) {
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

                    if (velocity.x !== 0 && velocity.y !== 0) {
                        var change = Math.sqrt()
                        if (velocity.x > 0) {
                            velocity.x = clients[id].player.diagonalSpeed;
                        } else {
                            velocity.x = -clients[id].player.diagonalSpeed;
                        }
                        if (velocity.y > 0) {
                            velocity.y = clients[id].player.diagonalSpeed;
                        } else {
                            velocity.y = -clients[id].player.diagonalSpeed;
                        }
                    }

                    Matter.Body.setVelocity(clients[id].player.matterjs, velocity);

                    clients[id].player.x = clients[id].player.matterjs.position.x;
                    clients[id].player.y = clients[id].player.matterjs.position.y;
                } else if (playerMap[clients[id].player.id] && clients[id].player.health === 0) {
                    toDelete.push(clients[id].player.id);
                    Engine.removePlayer(playerMap[clients[id].player.id]);
                    delete playerMap[clients[id].player.id];
                    // delete clients[id].player;
                }
            });
        }, function (engine, fps) {
            Object.keys(clients).forEach(function (id) {
                clients[id].send(JSON.stringify({
                    playerArray: Helpers.serializeMap(playerMap),
                    wallArray: Helpers.serializeMap(wallMap),
                    itemArray: Helpers.serializeMap(itemMap),
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

        var mapBodies = MapBuilder.buildMap(mapSize, mapSize);
        mapBodies.walls.forEach(function (wall) {
            wallMap[wall.id] = wall;
            Engine.addWall(wall);
        });
        mapBodies.items.forEach(function (item) {
            itemMap[item.id] = item;
            Engine.addItem(item);
        });
    }
}
