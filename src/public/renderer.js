/*global window, document, Howl, TextDecoder, setTimeout, console, view*/
(function () {
    'use strict';
    var WebSocket = require('ws');
    var Matter = require('matter-js/build/matter.js');
    var raf = require('raf');
    var Decoder = new TextDecoder("utf-8");
    var Paper = require('paper');
    var Howler = require('howler');
    var remote = require('electron').remote;
    var Helpers = require('../shared/helpers');

    //Load sounds
    var gunShotSound = new Howl({
        src: ['../audio/gunshot.wav'],
        volume: 0.03
    });
    var reloadSound = new Howl({
        src: ['../audio/reload.mp3'],
        volume: 0.05
    });

    var nameInput = document.querySelector('.name-input');
    var joinButton = document.querySelector('.start-join');
    var joinInput = document.querySelector('.start-join-input');
    var hostButton = document.querySelector('.start-host');
    var menuDiv = document.querySelector('#menu');
    var lobbyDiv = document.querySelector('#lobby');
    var startButton = document.querySelector('.start-game');
    var playersList = document.querySelector('.players');
    var hosting = false;

    var joinGame = function (name, startServer, ipToJoin) {

        // Paper.project.importSVG('../svg/guns.svg', function (a, b, c) {
        //     console.log(a, b, c);
        // });
        var server = require('../shared/game.js')(startServer, ipToJoin);

        var bodyMap = {};
        var shotMap = {};
        var keys = {};
        var reloadPlaying = false;
        var decodedDataList, parsedData, mouseX = 0,
            mouseY = 0;
        var canvas = document.querySelector('#canvas');
        var canvasWidth = 1920;
        var canvasHeight = 1080;

        var marginLeft = 0;
        var marginTop = 0;
        var fpsText, ammoText, healthText, groundText, lastResize;
        var centerCanvas = function () {
            lastResize = Date.now();
            marginLeft = ((canvasWidth - window.innerWidth) / 2);
            marginTop = ((canvasHeight - window.innerHeight) / 2);
            canvas.style.marginLeft = -marginLeft + 'px';
            canvas.style.marginTop = -marginTop + 'px';
        };
        centerCanvas();
        window.onresize = function () {
            if (fpsText) {
                fpsText.remove();
                fpsText = undefined;
            }
            if (ammoText) {
                ammoText.remove();
                ammoText = undefined;
            }
            if (healthText) {
                healthText.remove();
                healthText = undefined;
            }
            if (groundText) {
                groundText.remove();
                groundText = undefined;
            }
            centerCanvas();
        };


        var engine, render, entity, offsetX, offsetY;
        var renderObjects = function (entityMap) {
            if (server.getPlayer()) {
                offsetX = (canvas.width / (2 * window.devicePixelRatio)) - server.getPlayer().x;
                offsetY = (canvas.height / (2 * window.devicePixelRatio)) - server.getPlayer().y;

                // entityMap.forEach(function (entity) {
                Object.keys(entityMap).forEach(function (key) {
                    entity = entityMap[key];
                    if (!(entity instanceof Array)) {
                        if (entity.deleted !== true) {
                            if (!bodyMap[entity.i]) {
                                var body;
                                if (entity.t === 'w') {
                                    body = new Paper.Path.Rectangle(entity.x + offsetX, entity.y + offsetY, entity.w, entity.h);
                                    body.fillColor = '#333';
                                } else if (entity.t === 'p') {
                                    body = new Paper.Path.Circle(entity.x + offsetX, entity.y + offsetY, entity.r);
                                    if (server.getPlayer() && server.getPlayer().i === entity.i) {
                                        body.fillColor = 'blue';
                                    } else {
                                        body.fillColor = 'red';
                                    }
                                } else if (entity.t === 'g') {
                                    body = new Paper.Path.Rectangle(entity.x + offsetX, entity.y + offsetY, entity.w, entity.h);
                                    body.fillColor = 'darkgreen';
                                    body.sendToBack();
                                }else if(entity.t === 'c'){
                                    body = new Paper.Path.Rectangle(entity.x + offsetX, entity.y + offsetY, entity.w, entity.h);
                                    body.fillColor = 'lightblue';
                                    body.sendToBack();
                                }
                                body.applyMatrix = false;
                                bodyMap[entity.i] = body;
                            } else {
                                bodyMap[entity.i].position = new Paper.Point(entity.x + offsetX, entity.y + offsetY);
                                if(entity.t === 'c'){
                                    bodyMap[entity.i].remove();
                                    body = new Paper.Path.Rectangle(entity.x + offsetX, entity.y + offsetY, entity.w, entity.h);
                                    body.fillColor = 'lightblue';
                                    body.sendToBack();
                                    body.applyMatrix = false;
                                    bodyMap[entity.i] = body;
                                }
                            }

                            if (entity.a) {
                                bodyMap[entity.i].rotate((entity.a * 180 / Math.PI) - (bodyMap[entity.i].rotation));
                            }
                        } else {
                            bodyMap[entity.i].remove();
                        }
                    }
                });
            }

        };

        var deleteObjects = function (objectIdArray) {
            if (objectIdArray.forEach) {
                objectIdArray.forEach(function (id) {
                    if (bodyMap[id]) {
                        bodyMap[id].remove();
                        delete bodyMap[id];
                    }
                });
            }
        };

        var renderShots = function () {
            if (server.getShots().length > 0) {
                gunShotSound.play();
            }
            server.getShots().forEach(function (shot) {
                if (shot && !shotMap[shot.id]) {
                    shotMap[shot.id] = shot;
                    shotMap[shot.id].path = new Paper.Path.Line(new Paper.Point(shot.start.x + offsetX, shot.start.y + offsetY), new Paper.Point(shot.end.x + offsetX, shot.end.y + offsetY));
                    shotMap[shot.id].path.sendToBack();
                    shotMap[shot.id].path.strokeWidth = 1.5;
                    shotMap[shot.id].path.opacity = 0.2;
                    shotMap[shot.id].path.strokeColor = 'black';

                    if (shot.hit === true) {
                        var path = new Paper.Path.Circle(new Paper.Point(shot.end.x + offsetX, shot.end.y + offsetY), 5);
                        path.opacity = 0.3;
                        if (shot.hitEntityType === 'p') {
                            path.fillColor = 'red';
                            setTimeout(function () {
                                path.remove();
                            }, 50);
                        } else {
                            path.fillColor = 'yellow';
                            setTimeout(function () {
                                path.remove();
                            }, 50);
                        }
                    }
                }
            });
            var previousOpacity, previousStrokeWidth;
            Object.keys(shotMap).forEach(function (key) {
                previousOpacity = shotMap[key].path.opacity;
                previousStrokeWidth = shotMap[key].path.strokeWidth;
                shotMap[key].path.remove();
                if (previousOpacity > 0.01) {
                    shotMap[key].path = new Paper.Path.Line(new Paper.Point(shotMap[key].start.x + offsetX, shotMap[key].start.y + offsetY), new Paper.Point(shotMap[key].end.x + offsetX, shotMap[key].end.y + offsetY));
                    shotMap[key].path.sendToBack();
                    shotMap[key].path.strokeWidth = previousStrokeWidth + 0.1;
                    shotMap[key].path.strokeColor = 'black';
                    shotMap[key].path.opacity = previousOpacity - 0.01;
                } else {
                    delete shotMap[key];
                }
            });

            startButton.onclick = function () {
                if (hosting) {
                    console.log('starting game!');
                    server.startGame();
                }
            };

        };

        var renderFps = function () {
            if (!fpsText) {
                fpsText = new Paper.PointText(new Paper.Point(marginLeft + 5, marginTop + 20));
                fpsText.fillColor = 'black';
            } else {
                fpsText.content = 'Server: ' + server.getFps().toString();
                fpsText.bringToFront();
            }
        };

        var renderHud = function () {
            if (!ammoText) {
                ammoText = new Paper.PointText(new Paper.Point(marginLeft + 5, (canvas.height / window.devicePixelRatio) - marginTop - 40));
                ammoText.fillColor = 'black';
            }
            if (!healthText) {
                healthText = new Paper.PointText(new Paper.Point(marginLeft + 5, (canvas.height / window.devicePixelRatio) - marginTop - 20));
                healthText.fillColor = 'black';
            }
            if (!groundText) {
                groundText = new Paper.PointText(new Paper.Point(marginLeft + 5, (canvas.height / window.devicePixelRatio) - marginTop - 60));
                healthText.fillColor = 'black';
            }
            if (server.getPlayer()) {
                if (server.getPlayer().h > 0) {
                    healthText.content = Math.ceil(server.getPlayer().h / 10) + '% HP';
                    if (server.getPlayer().g) {
                        ammoText.content = server.getPlayer().g.n + ' - Ammo: ' + server.getPlayer().g.ammo + ' / ' + server.getPlayer().g.maxAmmo + ' - Reloaded: ' + server.getPlayer().re + '%';
                    } else {
                        ammoText.content = '';
                    }
                    if (server.getPlayer().gr.length > 0) {
                        groundText.content = 'Press F to pickup: ' +
                            server.getPlayer().gr.map(function (item) {
                                return item.n;
                            }).join(', ');
                    } else {
                        groundText.content = '';
                    }
                } else {
                    healthText.content = 'You are dead';
                }
            }
            ammoText.bringToFront();
            healthText.bringToFront();
            groundText.bringToFront();
        };

        var handleReloads = function () {
            if (server.getPlayer()) {
                if (server.getPlayer().re > 0) {
                    if (reloadPlaying === false) {
                        reloadPlaying = true;
                        reloadSound.play();
                    }
                } else {
                    reloadSound.stop();
                    reloadPlaying = false;
                }
            }
        };

        Paper.install(window);
        Paper.setup(canvas);

        var currentTime;
        view.onFrame = function () {
            if (server.getGameStarted()) {
                menuDiv.style.display = 'none';
                lobbyDiv.style.display = 'none';
            } else if (menuDiv.style.display !== 'block' && lobbyDiv.style.display === 'block') {
                var currentPlayer;
                playersList.innerHTML = '';
                Object.keys(server.getPlayerMap()).forEach(function (key) {
                    currentPlayer = server.getPlayerMap()[key];
                    var div = document.createElement('div');
                    div.innerText = currentPlayer.n || "Unnamed Player";
                    playersList.appendChild(div);
                });
            }
            deleteObjects(server.getToDelete());
            renderObjects(server.getPlayerMap());
            renderObjects(server.getWallMap());
            renderObjects(server.getItemMap());
            renderObjects(server.getCircle());

            renderShots();
            handleReloads();

            if (server.getPlayer()) {
                server.sendEvent({
                    type: 'mouse',
                    x: mouseX - (canvas.width / 2),
                    y: mouseY - (canvas.height / 2),
                    keys: keys,
                    name: name
                });
            }

            renderHud();
            renderFps();
        }

        window.Paper = Paper;

        canvas.onmousemove = function (e) {
            mouseX = e.offsetX * window.devicePixelRatio;
            mouseY = e.offsetY * window.devicePixelRatio;
        };

        // canvas.onmouseenter = function () {
        //     Object.keys(keys).forEach(function (key) {
        //         keys[key] = 'onkeyup';
        //     });
        // };

        // canvas.onmouseout = function () {
        //     Object.keys(keys).forEach(function (key) {
        //         keys[key] = 'onkeyup';
        //     });
        // };

        window.onmousedown = function (event) {
            server.sendEvent({
                type: 'onmousedown',
                which: event.which
            });
        };
        window.onmouseup = function (event) {
            server.sendEvent({
                type: 'onmouseup',
                which: event.which
            });
        };
        window.onkeydown = function (event) {
            if (event.key === 'Escape') {
                var window = remote.getCurrentWindow();
                window.close();
            } else if (event.key === 'F11') {
                event.preventDefault();
            } else {
                keys[event.key.toUpperCase()] = 'onkeydown';
                server.sendEvent({
                    keys: keys
                });
            }
        };
        window.onkeyup = function (event) {
            keys[event.key.toUpperCase()] = 'onkeyup';
            server.sendEvent({
                keys: keys
            });
        };
    };

    joinButton.onclick = function () {
        hosting = false;
        startButton.style.display = 'none';
        lobbyDiv.style.display = 'block';
        window.localStorage.setItem('join', joinInput.value);
        window.localStorage.setItem('name', nameInput.value);
        joinGame(nameInput.value, false, joinInput.value);
    };
    hostButton.onclick = function () {
        hosting = true;
        startButton.style.display = 'inline-block';
        lobbyDiv.style.display = 'block';
        window.localStorage.setItem('name', nameInput.value);
        joinGame(nameInput.value, hosting);
    };
    nameInput.value = window.localStorage.getItem('name') || 'player' + Helpers.rand(100, 999);
    var lastJoined = window.localStorage.getItem('join') || '127.0.0.1';
    joinInput.value = lastJoined;
}());
