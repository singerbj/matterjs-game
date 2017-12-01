var Matter = require('matter-js/build/matter.js');
const raf = require('raf');
const Player = require('./entities/player');

module.exports = function(callback){
    var engine, render;
    var scaleX = 50;
    var scaleY = -50;

    var init = function() {
        engine = Matter.Engine.create();

        // render = Matter.Render.create({
        //     element: document.body,
        //     engine: engine
        //     // options: options
        // });

        Matter.Engine.run(engine);
        // Matter.Render.run(render);
        engine.world.gravity.x = 0;
        engine.world.gravity.y = 0;
    };

    var animate = function (t) {
        raf(animate);
        callback(engine);
        Matter.Engine.update(engine, 1000 / 60);
    };

    init();
    animate();

    return {
        addPlayer: function(player){
            console.log('player added');
            Matter.World.addBody(engine.world, player.matterjs);
        },
        // getBody: function(playerId){
        //     world.getBodyById(playerId);
        // },
        removePlayer: function(player){
            console.log('player removed');
            Matter.Composite.remove(engine.world, player.matterjs);
        },
        addWall: function(wall){
            console.log('wall added');
            Matter.World.addBody(engine.world, wall.matterjs);
        },
        removeWall: function(wall){
            console.log('wall removed');
            Matter.Composite.remove(engine.world, wall.matterjs);
        }
    };
}
