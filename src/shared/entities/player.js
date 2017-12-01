const Matter = require('matter-js/build/matter.js');
const Helpers = require('../helpers');
const Gun = require('./gun');

module.exports = function(x, y){
    var r = 15;
    var body = Matter.Bodies.circle(x, y, r*2, r*2);
    console.log(body.angle);
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
            var time = Date.now();
            if(this.firing && (!this.lastShot || (time - this.lastShot) >= this.gun.fireRate)){
                this.lastShot = time;

                // var x = Math.sqrt((Math.pow(this.gun.range), 2) / this.aim) - (Math.pow() )
                // a^2 + b^2 = c^2

                var k = (this.gun.range / (Math.sqrt(Math.pow(this.aim, 2) + 1)));

                var shotX;
                var shotY;
                console.log(this.mouse.x, this.x)
                if (this.mouse.x < this.x) {
                    shotX = this.x - k;
                    shotY = this.y - (k * this.aim);
                } else {
                    shotX = this.x + k;
                    shotY = this.y + (k * this.aim);
                }

                if (this.aim === -Infinity) {
                    shotY = this.y - gunLength;
                } else if (this.aim === Infinity) {
                    shotY = this.y + gunLength;
                }

                var shotVector = [{
                    x: this.x,
                    y: this.y
                }, {
                    x: shotX,
                    y: shotY
                }];

                // console.log(this.aim, shotVector[0], shotVector[1]);

                var result = Matter.Query.ray(Matter.Composite.allBodies(engine.world), shotVector[0], shotVector[1]);
                console.log(result);
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
