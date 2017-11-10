var Matter = require('matter-js/build/matter.js');
const Helpers = require('../helpers');

module.exports = function(x, y, w, h){
    var body = Matter.Bodies.rectangle(x, y, w, h);
    Matter.Body.setInertia(body, Infinity);
    return {
        id: Helpers.getUUID(),
        shape: 'rectangle',
        x: x,
        y: y,
        w: w,
        h: h,
        angle: body.angle,
        matterjs: body,
        serialize: function(){
            return {
                shape: this.shape,
                x: this.x,
                y: this.y,
                w: this.w,
                h: this.h
            }
        }
    };
};
