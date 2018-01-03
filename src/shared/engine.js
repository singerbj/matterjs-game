var Matter = require('matter-js/build/matter.js');
const raf = require('raf');
const Player = require('./entities/player');
const Helpers = require('./helpers');

module.exports = function (callback) {
    var engine, render;
    var scaleX = 50;
    var scaleY = -50;

    var init = function () {
        engine = Matter.Engine.create();

        // render = Matter.Render.create({
        //     element: document.body,
        //     engine: engine
        //     // options: options
        // });

        Matter.Engine.run(engine);
        // Matter.Render.run(render);
        engine.enableSleeping = true;
        engine.world.gravity.x = 0;
        engine.world.gravity.y = 0;

        Matter.Events.on(engine, "collisionStart", function(event){
            event.pairs.forEach(function(pair){
                if(pair.bodyA.type === 'g'|| pair.bodyB.type === 'g'){
                    pair.isActive = false;
                    var player, item;
                    if(pair.bodyA.type === 'p'){
                        player = pair.bodyA.entity;
                        item = pair.bodyB.entity;
                    }else{
                        player = pair.bodyB.entity;
                        item = pair.bodyA.entity;
                    }
                    if(!item.deleted){
                        player.ground[item.id] = item;
                    }
                }
            });
        });

        Matter.Events.on(engine, "collisionEnd", function(event){
            event.pairs.forEach(function(pair){
                if(pair.bodyA.type === 'g'|| pair.bodyB.type === 'g'){
                    var player, item;
                    if(pair.bodyA.type === 'p'){
                        player = pair.bodyA.entity;
                        item = pair.bodyB.entity;
                    }else{
                        player = pair.bodyB.entity;
                        item = pair.bodyA.entity;
                    }
                    delete player.ground[item.id];
                }
            });
        });
    };

    var lastTimeFps;
    var fps = -1;
    var lastFpsDraw = Date.now();
    var currentTime;

    var animate = function (t) {
        raf(animate);
        callback(engine, fps);
        Matter.Engine.update(engine, 1000 / 60);
        currentTime = Date.now();
        if (lastTimeFps && (currentTime - lastFpsDraw) > 500) {
            lastFpsDraw = currentTime;
            fps = Math.floor(1000 / (currentTime - lastTimeFps));
        }
        lastTimeFps = currentTime;
    };

    init();
    animate();

    return {
        addPlayer: function (player) {
            console.log('player added');
            Matter.World.addBody(engine.world, player.matterjs);
        },
        // getBody: function(playerId){
        //     world.getBodyById(playerId);
        // },
        removePlayer: function (player) {
            console.log('player removed');
            Matter.Composite.remove(engine.world, player.matterjs);
        },
        addWall: function (wall) {
            console.log('wall added');
            Matter.World.addBody(engine.world, wall.matterjs);
        },
        removeWall: function (wall) {
            console.log('wall removed');
            Matter.Composite.remove(engine.world, wall.matterjs);
        },
        addItem: function (item) {
            console.log('item added');
            Matter.World.addBody(engine.world, item.matterjs);
        },
        removeItem: function (item) {
            console.log('item removed');
            Matter.Composite.remove(engine.world, item.matterjs);
        }
    };
}
