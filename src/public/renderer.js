const Net = require('net');
const Matter = require('matter-js/build/matter.js');
const raf = require('raf');
const Decoder = new TextDecoder("utf-8");
const Paper = require('paper');

require('../shared/game.js')(confirm("Start the server?"));

var bodyMap = {};
var playerMap = [];
var wallMap = [];
var toDelete = [];
var player;
var canvas = document.querySelector('#canvas');

var client = new Net.Socket();
client.connect(6754, '127.0.0.1', function() {
    // console.log('Connected');
});

client.on('data', function(data) {
    var decodedDataList = Decoder.decode(data).replace(/\}\{/g,'}}{{').split('}{');
    var parsedData;
    decodedDataList.forEach(function(decodedData){
        parsedData = JSON.parse(decodedData);
        playerMap = parsedData.playerMap;
        wallMap = parsedData.wallMap;
        toDelete = parsedData.toDelete;
        player = parsedData.player;
    });
});

client.on('close', function() {
    // console.log('Connection closed');
});

var sendEvent = function(event){
    client.write(JSON.stringify(event));
};

require('./input')(sendEvent);

var engine, render, entity, offsetX, offsetY;
var renderObjects = function(entityMap){
    if(player){
        offsetX = (canvas.width / 4) - player.x;
        offsetY = (canvas.height / 4) - player.y;

        entityMap.forEach(function(entity){
            if(!(entity instanceof Array)){
                if(!bodyMap[entity.id]){
                    var body;
                    if(entity.type === 'wall'){
                        body = new Paper.Path.Rectangle(entity.x + offsetX, entity.y + offsetY, entity.w, entity.h);
                        body.fillColor = 'green';
                    }else if(entity.type === 'player'){
                        body = new Paper.Path.Rectangle(entity.x + offsetX, entity.y + offsetY, entity.w, entity.h);
                        body.fillColor = 'blue';
                    }
                    bodyMap[entity.id] = body;
                }else{
                    bodyMap[entity.id].position = new Point(entity.x + offsetX, entity.y + offsetY);
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

Paper.install(window);
Paper.setup(canvas);
view.onFrame = function(){
    deleteObjects(toDelete);
    renderObjects(playerMap);
    renderObjects(wallMap);
}

window.Paper = Paper;
// r = new Paper.Path.Rectangle(300, 300, 200, 200);
// r.fillColor = 'blue';
