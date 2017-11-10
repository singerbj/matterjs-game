var Matter = require('matter-js/build/matter.js');
const Helpers = require('../helpers');

module.exports = function(x, y){
    var r = 20;
    var body = Matter.Bodies.circle(x, y, r);
    Matter.Body.setInertia(body, Infinity);
    return {
        id: Helpers.getUUID(),
        shape: 'circle',
        x: x,
        y: y,
        r: r,
        speed: 1.5,
        moving: {
            up: false,
            down: false,
            left: false,
            right: false
        },
        firing: false,
        matterjs: body,
        serialize: function(){
            return {
                shape: this.shape,
                x: this.x,
                y: this.y,
                r: this.r
            }
        }
    };
};
