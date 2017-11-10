const Net = require('net');
const Matter = require('matter-js/build/matter.js');
const raf = require('raf');
const Decoder = new TextDecoder("utf-8");

require('../shared/game.js')(confirm("Start the server?"));

var bodyMap = {};
var playerMap = {};
var wallMap = {};

var client = new Net.Socket();
client.connect(6754, '127.0.0.1', function() {
    console.log('Connected');
});

client.on('data', function(data) {
    var parsedData = JSON.parse(Decoder.decode(data));
    console.log('Received: ', parsedData);
    playerMap = parsedData.playerMap;
    wallMap = parsedData.wallMap;
});

client.on('close', function() {
    console.log('Connection closed');
});

var sendEvent = function(event){
    client.write(JSON.stringify(event));
};

require('./input')(sendEvent);

var engine, render, entity, body;
var renderObjects = function(entityMap){
    Object.keys(entityMap).forEach(function(key){
        entity = entityMap[key];
        if(!bodyMap[entity.id]){
            if(entity.shape === 'rectangle'){
                body = Matter.Bodies.rectangle(entity.x, entity.y, entity.w, entity.h);
            }else if(entity.shape === 'circle'){
                body = Matter.Bodies.circle(entity.x, entity.y, entity.r);
            }
            body.isSensor = true;
            Matter.Body.rotate(body, body.angle || 0);
            Matter.World.addBody(engine.world, body);
            bodyMap[entity.id] = body;
        }else{
            bodyMap[entity.id].position.x = entity.x;
            bodyMap[entity.id].position.y = entity.y;
        }
    });
};

var init = function() {
    engine = Matter.Engine.create();
    render = Matter.Render.create({
        element: document.body,
        engine: engine
    });
    Matter.Engine.run(engine);
    Matter.Render.run(render);
    engine.world.gravity.x = 0;
    engine.world.gravity.y = 0;
};

var animate = function (t) {
    raf(animate);
    renderObjects(wallMap);
    renderObjects(playerMap);
    Matter.Engine.update(engine, 1000 / 60);
};

init();
animate();



// // Set the fill color
// body.beginFill(0xe74c3c); // Red
//
// // Draw a circle
// body.drawCircle(60, 185, 40); // drawCircle(x, y, radius)
// body.drawCircle(0, 0, 10); // drawCircle(x, y, radius)
//
// // Applies fill to lines and shapes since the last call to beginFill.
// body.endFill();
//
// // Add the body to the stage
// stage.addChild(body);
