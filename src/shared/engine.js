const p2 = require('p2');
const raf = require('raf');
const Player = require('./entities/player');

module.exports = function(callback){
    var world;
    var scaleX = 50;
    var scaleY = -50;

    var init = function() {
        world = new p2.World({
            gravity: [0, 0]
        });
    };

    var animate = function () {
        callback();
        raf(animate);
        world.step(1 / 60);
    };

    init();
    animate();

    return {
        addPlayer: function(player){
            console.log('player added');
            world.addBody(player.p2);
        },
        removePlayer: function(player){
            console.log('player removed');
            world.removeBody(player.p2);
        },
        addWall: function(player){
            console.log('wall added');
            world.addBody(player.p2);
        },
        removeWall: function(player){
            console.log('wall removed');
            world.removeBody(player.p2);
        }
    };
}
