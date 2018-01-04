var Matter = require('matter-js/build/matter.js');
const raf = require('raf');
const Player = require('./entities/player');
const Helpers = require('./helpers');

module.exports = function (beforeCallback, afterCallback) {
    var engine, render;
    var scaleX = 50;
    var scaleY = -50;

    var init = function () {
        engine = Matter.Engine.create();

        Matter.Engine.run(engine);
        // Matter.Render.run(render);
        engine.enableSleeping = true;
        engine.world.gravity.x = 0;
        engine.world.gravity.y = 0;

        Matter.Events.on(engine, "collisionStart", function (event) {
            event.pairs.forEach(function (pair) {
                if (pair.bodyA.entity.type === 'g' || pair.bodyB.entity.type === 'g') {
                    pair.isActive = false;
                    var player, item;
                    if (pair.bodyA.entity.type === 'p') {
                        player = pair.bodyA.entity;
                        item = pair.bodyB.entity;
                    } else {
                        player = pair.bodyB.entity;
                        item = pair.bodyA.entity;
                    }
                    if (!item.deleted) {
                        player.ground[item.id] = item;
                    }
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
        beforeCallback(engine, fps);
        Matter.Engine.update(engine, 1000 / 60);
        afterCallback(engine, fps);
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
            Matter.World.addBody(engine.world, player.matterjs);
            console.log('player added');
        },
        // getBody: function(playerId){
        //     world.getBodyById(playerId);
        // },
        removePlayer: function (player) {
            Matter.Composite.remove(engine.world, player.matterjs);
            console.log('player removed');
        },
        addWall: function (wall) {
            Matter.World.addBody(engine.world, wall.matterjs);
            console.log('wall added');
        },
        removeWall: function (wall) {
            Matter.Composite.remove(engine.world, wall.matterjs);
            console.log('wall removed');
        },
        addItem: function (item) {
            Matter.World.addBody(engine.world, item.matterjs);
            console.log('item added');
        },
        removeItem: function (item) {
            Matter.Composite.remove(engine.world, item.matterjs);
            console.log('item removed');
        }
    };
}
