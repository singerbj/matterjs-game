var Matter = require('matter-js/build/matter.js');
const Helpers = require('../helpers');

module.exports = function(x, y){
    var r = 15;
    var body = Matter.Bodies.rectangle(x, y, r*2, r*2);
    Matter.Body.setInertia(body, Infinity);
    return {
        id: Helpers.getUUID(),
        type: 'player',
        shape: 'rectangle',
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
        firing: false,
        matterjs: body,
        serialize: function(){
            return {
                id: this.id,
                type: this.type,
                shape: this.shape,
                x: this.x,
                y: this.y,
                w: this.r*2,
                h: this.r*2
            }
        }
    };
};
