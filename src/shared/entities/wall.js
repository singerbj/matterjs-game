const Matter = require('matter-js/build/matter.js');
const Helpers = require('../helpers');

module.exports = function(x, y, w, h){
    var body = Matter.Bodies.rectangle(x, y, w, h);
    // Matter.Body.setInertia(body, Infinity);
    // Matter.Body.setStatic(body, true);
    return {
        id: Helpers.getUUID(),
        type: 'w',
        x: x,
        y: y,
        w: w,
        h: h,
        angle: body.angle,
        matterjs: body,
        serialize: function(){
            return {
                i: this.id,
                t: this.type,
                x: this.x,
                y: this.y,
                w: this.w,
                h: this.h,
                a: body.angle
            }
        }
    };
};
