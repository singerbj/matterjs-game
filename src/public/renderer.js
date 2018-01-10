const WebSocket = require('ws');
const Matter = require('matter-js/build/matter.js');
const raf = require('raf');
const Decoder = new TextDecoder("utf-8");
const Paper = require('paper');
const Howler = require('howler');
const remote = require('electron').remote;
const Helpers = require('../shared/helpers');

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
var gameStarted = false;

var joinGame = function (name, startServer, ipToJoin) {
    var server = require('../shared/game.js')(startServer);

    var bodyMap = {};
    var shotMap = {};
    var playerArray = [];
    var wallArray = [];
    var itemArray = [];
    var toDelete = [];
    var shots = [];
    var reloads = [];
    var keys = {};
    var fps = -1;
    var player, decodedDataList, parsedData, mouseX = 0,
        mouseY = 0;
    var canvas = document.querySelector('#canvas');
    var canvasWidth = 1920;
    var canvasHeight = 1080;

    var marginLeft = 0;
    var marginTop = 0;
    var fpsText, ammoText, healthText, groundText;
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

    const client = new WebSocket('ws://' + (ipToJoin !== undefined ? ipToJoin : '127.0.0.1') + ':6574');
    client.on('open', function () {
        menuDiv.style.display = 'none';
        console.log('Connected');

        client.on('message', function (data) {
            parsedData = JSON.parse(data);
            if (parsedData.gameStarted === true) {
                gameStarted = true;
                lobbyDiv.style.display = 'none';
            } else {
                playersList.innerHTML = '';
                if (parsedData.playerArray) {
                    parsedData.playerArray.forEach(function (player) {
                        var li = document.createElement('li');
                        li.innerText = player.n;
                        playersList.appendChild(li);
                    });
                }
            }
            if (parsedData.playerArray) {
                playerArray = parsedData.playerArray;
            }
            if (parsedData.wallArray) {
                wallArray = parsedData.wallArray;
            }
            if (parsedData.itemArray) {
                itemArray = parsedData.itemArray;
            }
            if (parsedData.toDelete) {
                toDelete = parsedData.toDelete;
            }
            if (parsedData.player) {
                player = parsedData.player;
            }
            if (parsedData.shots) {
                shots = parsedData.shots;
            }
            if (parsedData.fps) {
                fps = parsedData.fps;
            }
            if (parsedData.reloads) {
                reloads = parsedData.reloads;
            }
        });

        client.on('close', function () {
            console.log('Connection closed');
        });

        var sendEvent = function (event) {
            client.send(JSON.stringify(event));
        };

        var engine, render, entity, offsetX, offsetY;
        var renderObjects = function (entityMap) {
            if (player) {
                offsetX = (canvas.width / (2 * window.devicePixelRatio)) - player.x;
                offsetY = (canvas.height / (2 * window.devicePixelRatio)) - player.y;

                entityMap.forEach(function (entity) {
                    if (!(entity instanceof Array)) {
                        if (entity.deleted !== true) {
                            if (!bodyMap[entity.i]) {
                                var body;
                                if (entity.t === 'w') {
                                    body = new Paper.Path.Rectangle(entity.x + offsetX, entity.y + offsetY, entity.w, entity.h);
                                    body.fillColor = 'green';
                                } else if (entity.t === 'p') {
                                    body = new Paper.Path.Circle(entity.x + offsetX, entity.y + offsetY, entity.r);
                                    if (player && player.i === entity.i) {
                                        body.fillColor = 'blue';
                                    } else {
                                        body.fillColor = 'black';
                                    }
                                } else if (entity.t === 'g') {
                                    body = new Paper.Path.Rectangle(entity.x + offsetX, entity.y + offsetY, entity.w, entity.h);
                                    body.fillColor = 'orange';
                                    body.sendToBack();
                                }
                                body.applyMatrix = false;
                                bodyMap[entity.i] = body;
                            } else {
                                bodyMap[entity.i].position = new Point(entity.x + offsetX, entity.y + offsetY);
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
            if (shots.length > 0) {
                gunShotSound.play();
            }
            shots.forEach(function (shot) {
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
            var shot, previousOpacity, previousStrokeWidth;
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
                    gameStarted = true;
                }
            };

        };

        var renderFps = function () {
            if (!fpsText) {
                fpsText = new Paper.PointText(new Point(marginLeft + 5, marginTop + 20));
                fpsText.fillColor = 'black';
            } else {
                fpsText.content = 'Server: ' + fps.toString();
                fpsText.bringToFront();
            }
        };

        var renderHud = function () {
            if (!ammoText) {
                ammoText = new Paper.PointText(new Point(marginLeft + 5, (canvas.height / window.devicePixelRatio) - marginTop - 40));
                ammoText.fillColor = 'black';
            }
            if (!healthText) {
                healthText = new Paper.PointText(new Point(marginLeft + 5, (canvas.height / window.devicePixelRatio) - marginTop - 20));
                healthText.fillColor = 'black';
            }
            if (!groundText) {
                groundText = new Paper.PointText(new Point(marginLeft + 5, (canvas.height / window.devicePixelRatio) - marginTop - 60));
                healthText.fillColor = 'black';
            }
            if (player) {
                if (player.h > 0) {
                    healthText.content = Math.ceil(player.h / 10) + '% HP';
                    if (player.g) {
                        ammoText.content = player.g.n + ' - Ammo: ' + player.g.ammo + ' / ' + player.g.maxAmmo + ' - Reloaded: ' + player.re + '%';
                    }
                    if (player.gr.length > 0) {
                        groundText.content = 'Press F to pickup: ' +
                            player.gr.map(function (item) {
                                return item.n;
                            }).join(', ');
                    } else {
                        groundText.content = ''
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
            reloads.forEach(function () {
                reloadSound.play();
            });
        };

        Paper.install(window);
        Paper.setup(canvas);

        var currentTime;
        view.onFrame = function () {
            deleteObjects(toDelete);
            renderObjects(playerArray);
            renderObjects(wallArray);
            renderObjects(itemArray);
            renderShots();
            handleReloads();

            if (player) {
                client.send(JSON.stringify({
                    type: 'mouse',
                    x: mouseX - (canvas.width / 2),
                    y: mouseY - (canvas.height / 2),
                    keys: keys,
                    start: hosting && gameStarted,
                    name: name
                }));
            }

            renderHud();
            renderFps();
        }

        window.Paper = Paper;

        canvas.onmousemove = function (e) {
            mouseX = e.offsetX * window.devicePixelRatio;
            mouseY = e.offsetY * window.devicePixelRatio;
        };

        // var acceptInput = true;
        canvas.onmouseenter = function () {
            Object.keys(keys).forEach(function (key) {
                keys[key] = 'onkeyup';
            });
        };

        canvas.onmouseout = function () {
            // acceptInput = false;
            Object.keys(keys).forEach(function (key) {
                keys[key] = 'onkeyup';
            });
        };

        window.onmousedown = function (event) {
            sendEvent({
                type: 'onmousedown',
                which: event.which
            });
        };
        window.onmouseup = function (event) {
            sendEvent({
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
                sendEvent({
                    keys: keys
                });
            }
        };
        window.onkeyup = function (event) {
            keys[event.key.toUpperCase()] = 'onkeyup';
            sendEvent({
                keys: keys
            });
        };
    });

    client.on('error', function () {
        alert("Error connecting to: " + joinInput.value);
        window.location.reload();
    });


};

joinButton.onclick = function () {
    hosting = false;
    startButton.style.display = 'none';
    lobbyDiv.style.display = 'block';
    window.localStorage.setItem('join', joinInput.value);
    joinGame(nameInput.value, false, joinInput.value);
};
hostButton.onclick = function () {
    hosting = true;
    startButton.style.display = 'inline-block';
    lobbyDiv.style.display = 'block';
    joinGame(nameInput.value, hosting);
};
nameInput.value = window.localStorage.getItem('name') || 'player' + Helpers.rand(100, 999);
var lastJoined = window.localStorage.getItem('join') || '127.0.0.1';
joinInput.value = lastJoined;
