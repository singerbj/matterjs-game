var Matter = require('matter-js/build/matter.js');
const Helpers = require('../helpers');

module.exports = function(x, y, w, h){
    var body = Matter.Bodies.rectangle(x, y, w, h);
    Matter.Body.setInertia(body, Infinity);
    Matter.Body.setStatic(body, true);
    return {
        id: Helpers.getUUID(),
        type: 'wall',
        shape: 'rectangle',
        x: x,
        y: y,
        w: w,
        h: h,
        angle: body.angle,
        matterjs: body,
        serialize: function(){
            return {
                id: this.id,
                type: this.type,
                shape: this.shape,
                x: this.x,
                y: this.y,
                w: this.w,
                h: this.h
            }
        }
    };
};
