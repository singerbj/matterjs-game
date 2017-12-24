const WebSocket = require('ws');
const Matter = require('matter-js/build/matter.js');
const raf = require('raf');
const Decoder = new TextDecoder("utf-8");
const Paper = require('paper');

require('../shared/game.js')(confirm("Start the server?"));

var bodyMap = {};
var shotMap = {};
var playerArray = [];
var wallArray = [];
var toDelete = [];
var shots = [];
var fps = -1;
var player, decodedDataList, parsedData, mouseX = 0, mouseY = 0;
var canvas = document.querySelector('#canvas');
var canvasWidth = 1920;
var canvasHeight = 1080;

var marginLeft = 0;
var marginTop = 0;
var fpsText, ammoText, healthText;
var centerCanvas = function(){
    lastResize = Date.now();
    marginLeft = ((canvasWidth - window.innerWidth) / 2);
    marginTop = ((canvasHeight - window.innerHeight) / 2);
    canvas.style.marginLeft = -marginLeft + 'px';
    canvas.style.marginTop = -marginTop + 'px';
};
centerCanvas();
window.onresize = function(){
    if(fpsText){
        fpsText.remove();
        fpsText = undefined;
    }
    if(ammoText){
        ammoText.remove();
        ammoText = undefined;
    }
    if(healthText){
        healthText.remove();
        healthText = undefined;
    }
    centerCanvas();
};

const client = new WebSocket('ws://127.0.0.1:6574');
client.on('open', function(){
    console.log('Connected');

    client.on('message', function(data) {
        parsedData = JSON.parse(data);
        if(parsedData.playerArray){
            playerArray = parsedData.playerArray;
        }
        if(parsedData.wallArray){
            wallArray = parsedData.wallArray;
        }
        if(parsedData.toDelete){
            toDelete = parsedData.toDelete;
        }
        if(parsedData.player){
            player = parsedData.player;
        }
        if(parsedData.shots){
            shots = parsedData.shots;
        }
        if(parsedData.fps){
            fps = parsedData.fps;
        }
    });

    client.on('close', function() {
        console.log('Connection closed');
    });

    var sendEvent = function(event){
        client.send(JSON.stringify(event));
    };

    require('./input')(sendEvent);

    var engine, render, entity, offsetX, offsetY;
    var renderObjects = function(entityMap){
        if(player){
            offsetX = (canvas.width / 4) - player.x;
            offsetY = (canvas.height / 4) - player.y;

            entityMap.forEach(function(entity){
                if(!(entity instanceof Array)){
                    if(!bodyMap[entity.i]){
                        var body;
                        if(entity.t === 'w'){
                            body = new Paper.Path.Rectangle(entity.x + offsetX, entity.y + offsetY, entity.w, entity.h);
                            body.fillColor = 'green';
                        }else if(entity.t === 'p'){
                            body = new Paper.Path.Circle(entity.x + offsetX, entity.y + offsetY, entity.r);
                            body.fillColor = 'blue';
                        }
                        body.applyMatrix = false;
                        bodyMap[entity.i] = body;
                    }else{
                        bodyMap[entity.i].position = new Point(entity.x + offsetX, entity.y + offsetY);
                    }

                    if(entity.a){
                        bodyMap[entity.i].rotate((entity.a * 180 / Math.PI) - (bodyMap[entity.i].rotation));
                    }
                }
            });
        }

    };

    var deleteObjects = function(objectIdArray){
        if(objectIdArray.forEach){
            objectIdArray.forEach(function(id){
                if(bodyMap[id]){
                    bodyMap[id].remove();
                    delete bodyMap[id];
                }
            });
        }
    };

    var renderShots = function(){
        shots.forEach(function(shot){
            if(shot){
                var path = new Paper.Path.Line(new Paper.Point(shot.start.x + offsetX, shot.start.y + offsetY), new Paper.Point(shot.end.x + offsetX, shot.end.y + offsetY));
                if(shot.hit === true){
                    path.strokeColor = 'red';
                }else{
                    path.strokeColor = 'black';
                }
                path.opacity = 0.4;
                shotMap[path.id] = path;
                setTimeout(function(){
                    shotMap[path.id].remove();
                    delete shotMap[path.id];
                }, 10);
            }
        });
    };

    var renderFps = function(clientFps){
        if(!fpsText){
            fpsText = new Paper.PointText(new Point(marginLeft, marginTop + 10));
            fpsText.fillColor = 'black';
        } else {
            fpsText.content = 'Server: ' + fps.toString() + ' - Client: ' + clientFps;
        }
    };

    var renderHud = function(){
        if(!ammoText){
            ammoText = new Paper.PointText(new Point(marginLeft,  (canvas.height / 2) - marginTop - 20));
            ammoText.fillColor = 'black';
        }
        // if(!healthText){
        //     healthText.remove();
        // }
        if(player && player.g){
            ammoText.content = 'Ammo: ' + player.g.ammo + ' / ' + player.g.maxAmmo + ' - Reloaded: ' + player.re;
        }
    };

    Paper.install(window);
    Paper.setup(canvas);

    var clientLastTimeFps;
    var clientFps = -1;
    var clientLastFpsDraw = Date.now();
    var currentTime;
    view.onFrame = function(){
        deleteObjects(toDelete);
        renderObjects(playerArray);
        renderObjects(wallArray);
        renderShots();
        renderHud();

        if(player){
            client.send(JSON.stringify({
                type: 'mouse',
                x: mouseX - (canvas.width / 4),
                y: mouseY - (canvas.height / 4)
            }));
        }

        currentTime = Date.now();
        if (clientLastTimeFps && (currentTime - clientLastFpsDraw) > 500) {
            clientLastFpsDraw = currentTime;
            clientFps = Math.floor(1000 / (currentTime - clientLastTimeFps));
        }
        clientLastTimeFps = currentTime;
        renderFps(clientFps);
    }

    window.Paper = Paper;

    canvas.onmousemove = function(e){
        mouseX = e.offsetX;
        mouseY = e.offsetY;
    };
});
