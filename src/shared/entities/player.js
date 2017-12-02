const Matter = require('matter-js/build/matter.js');
const Helpers = require('../helpers');
const Gun = require('./gun');
const Raycast = require('../raycast');

module.exports = function(x, y){
    var r = 8;
    var body = Matter.Bodies.circle(x, y, r*2, r*2);
    Matter.Body.setInertia(body, Infinity);
    return {
        id: Helpers.getUUID(),
        type: 'p',
        x: x,
        y: y,
        r: r,
        speed: 1.2,
        moving: {
            up: false,
            down: false,
            left: false,
            right: false
        },
        mouse:{
            x: 0,
            y: 0
        },
        firing: false,
        matterjs: body,
        angle: 0,
        aim: 0,
        gun: new Gun(),
        handleFiring: function(engine){
            var self = this;
            var time = Date.now();
            if(this.firing && (!this.lastShot || (time - this.lastShot) >= this.gun.fireRate)){
                this.lastShot = time;

                var k = (this.gun.range / (Math.sqrt(Math.pow(this.aim, 2) + 1)));

                var shotX;
                var shotY;
                if (this.mouse.x < this.x) {
                    shotX = this.x - k;
                    shotY = this.y - (k * this.aim);
                } else {
                    shotX = this.x + k;
                    shotY = this.y + (k * this.aim);
                }

                if (this.aim === -Infinity) {
                    shotY = this.y - this.gun.range;
                } else if (this.aim === Infinity) {
                    shotY = this.y + this.gun.range;
                }

                var shotVector = [{
                    x: this.x,
                    y: this.y
                }, {
                    x: shotX,
                    y: shotY
                }];

                var result = Raycast(Matter.Composite.allBodies(engine.world), shotVector[0], shotVector[1]).filter(function(raycol){
                    return raycol.body.id !== self.matterjs.id;
                });

                if(result.length > 0){
                    shotVector[1] = {
                        x: result[0].point.x,
                        y: result[0].point.y,
                    };
                }

                return shotVector;
            }
        },
        serialize: function(){
            return {
                i: this.id,
                t: this.type,
                x: this.x,
                y: this.y,
                r: this.r * 2,
                a: this.angle
            }
        }
    };
};
