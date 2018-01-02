const WebSocket = require('ws');
const Matter = require('matter-js/build/matter.js');
const raf = require('raf');
const Decoder = new TextDecoder("utf-8");
const Paper = require('paper');
const Howler = require('howler'); //require('node_modules/howler/dist/howler.min.js');

//Load sounds
var gunShotSound = new Howl({
    src: ['../audio/gunshot.wav'],
    volume: 0.6
});
var reloadSound = new Howl({
    src: ['../audio/reload.mp3'],
    volume: 0.8
});

require('../shared/game.js')(confirm("Start the server?"));

var bodyMap = {};
var shotMap = {};
var playerArray = [];
var wallArray = [];
var itemArray = [];
var toDelete = [];
var shots = [];
var reloads = [];
var fps = -1;
var player, decodedDataList, parsedData, mouseX = 0,
    mouseY = 0;
var canvas = document.querySelector('#canvas');
var canvasWidth = 1920;
var canvasHeight = 1080;

var marginLeft = 0;
var marginTop = 0;
var fpsText, ammoText, healthText;
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
    centerCanvas();
};

const client = new WebSocket('ws://127.0.0.1:6574');
client.on('open', function () {
    console.log('Connected');

    client.on('message', function (data) {
        parsedData = JSON.parse(data);
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

    require('./input')(sendEvent);

    var engine, render, entity, offsetX, offsetY;
    var renderObjects = function (entityMap) {
        if (player) {
            offsetX = (canvas.width / 2) - player.x;
            offsetY = (canvas.height / 2) - player.y;

            entityMap.forEach(function (entity) {
                if (!(entity instanceof Array)) {
                    if (!bodyMap[entity.i]) {
                        var body;
                        if (entity.t === 'w') {
                            body = new Paper.Path.Rectangle(entity.x + offsetX, entity.y + offsetY, entity.w, entity.h);
                            body.fillColor = 'green';
                        } else if (entity.t === 'p') {
                            body = new Paper.Path.Circle(entity.x + offsetX, entity.y + offsetY, entity.r);
                            body.fillColor = 'blue';
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
        shots.forEach(function (shot) {
            if (shot) {
                gunShotSound.play();
                shotMap[shot.id] = shot;
                shotMap[shot.id].path = new Paper.Path.Line(new Paper.Point(shot.start.x + offsetX, shot.start.y + offsetY), new Paper.Point(shot.end.x + offsetX, shot.end.y + offsetY));
                shotMap[shot.id].path.sendToBack();
                shotMap[shot.id].path.strokeWidth = 1.5;
                shotMap[shot.id].path.opacity = 0.2;
                // if(shotMap[shot.id].hit === true){
                //     shotMap[shot.id].path.strokeColor = 'red';
                // }else{
                shotMap[shot.id].path.strokeColor = 'black';
                // }
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
                shotMap[key].path.strokeWidth = previousStrokeWidth + 0.2;
                // if(shotMap[key] && shotMap[key].hit === true){
                //     shotMap[key].path.strokeColor = 'red';
                // }else{
                shotMap[key].path.strokeColor = 'black';
                // }
                shotMap[key].path.opacity = previousOpacity - 0.01;
            } else {
                delete shotMap[key];
            }
        });

    };

    var renderFps = function (clientFps) {
        if (!fpsText) {
            fpsText = new Paper.PointText(new Point(marginLeft + 5, marginTop + 20));
            fpsText.fillColor = 'black';
        } else {
            fpsText.content = 'Server: ' + fps.toString() + ' - Client: ' + clientFps;
            fpsText.bringToFront();
        }
    };

    var renderHud = function () {
        if (!ammoText) {
            ammoText = new Paper.PointText(new Point(marginLeft + 5, (canvas.height) - marginTop - 40));
            ammoText.fillColor = 'black';
        }
        if (!healthText) {
            healthText = new Paper.PointText(new Point(marginLeft + 5, (canvas.height) - marginTop - 20));
            healthText.fillColor = 'black';
        }
        if (player && player.g) {
            ammoText.content = 'Ammo: ' + player.g.ammo + ' / ' + player.g.maxAmmo + ' - Reloaded: ' + player.re + '%';
            healthText.content = Math.ceil(player.h / 10) + '% HP'
            ammoText.bringToFront();
            healthText.bringToFront();
        }
    };

    var handleReloads = function () {
        reloads.forEach(function () {
            reloadSound.play();
        });
    };

    Paper.install(window);
    Paper.setup(canvas);

    var clientLastTimeFps;
    var clientFps = -1;
    var clientLastFpsDraw = Date.now();
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
                y: mouseY - (canvas.height / 2)
            }));
        }

        currentTime = Date.now();
        if (clientLastTimeFps && (currentTime - clientLastFpsDraw) > 500) {
            clientLastFpsDraw = currentTime;
            clientFps = Math.floor(1000 / (currentTime - clientLastTimeFps));
        }
        clientLastTimeFps = currentTime;
        renderHud();
        renderFps(clientFps);
    }

    window.Paper = Paper;

    canvas.onmousemove = function (e) {
        mouseX = e.offsetX;
        mouseY = e.offsetY;
    };
});
