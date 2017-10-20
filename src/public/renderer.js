const Net = require('net');

var Game = require('../shared/game.js');

// Autodetect, create and append the renderer to the body element
var renderer = PIXI.autoDetectRenderer(960, 540, { backgroundColor: 0x000000, antialias: true });
document.body.appendChild(renderer.view);

// Create the main stage for your display objects
var stage = new PIXI.Container();
// Initialize the pixi Graphics class
var graphics = new PIXI.Graphics();

var graphicsMap = {};

var wall;
var renderWalls = function(){
    Object.keys(Game.wallMap).forEach(function(key){
        wall = Game.wallMap[key];
        if(!graphicsMap[player.id]){
            graphics.beginFill(0xe74c3c); // Red
            graphics.drawRectangle(wall.x, wall.y, wall.w, wall.h);
            graphics.endFill();
            stage.addChild(graphics);
            graphicsMap[player.id] = graphics;
        }else{
            graphicsMap[player.id].x = wall.x;
            graphicsMap[player.id].y = wall.y;
            graphicsMap[player.id].w = wall.w;
            graphicsMap[player.id].h = wall.h;
        }
    });
};

var player;
var renderPlayers = function(){
    Object.keys(Game.playerMap).forEach(function(key){
        player = Game.playerMap[key];
        if(!graphicsMap[player.id]){
            graphics.beginFill(0x33ccff); //Blue maybe?
            graphics.drawCircle(player.x, player.y, player.r);
            graphics.endFill();
            stage.addChild(graphics);
            graphicsMap[player.id] = graphics;
        }else{
            graphicsMap[player.id].x = player.x;
            graphicsMap[player.id].y = player.y;
            graphicsMap[player.id].r = player.r;
        }
    });
};

var animate = function () {
    console.log(Game.wallMap, Game.playerMap);

    renderWalls();
    renderPlayers();
    renderer.render(stage);
    requestAnimationFrame(animate);
};
animate();



// // Set the fill color
// graphics.beginFill(0xe74c3c); // Red
//
// // Draw a circle
// graphics.drawCircle(60, 185, 40); // drawCircle(x, y, radius)
// graphics.drawCircle(0, 0, 10); // drawCircle(x, y, radius)
//
// // Applies fill to lines and shapes since the last call to beginFill.
// graphics.endFill();
//
// // Add the graphics to the stage
// stage.addChild(graphics);
