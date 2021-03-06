const Matter = require('matter-js/build/matter.js');
const Helpers = require('../helpers');

module.exports = function (x, y, w, h) {
    var adjustedX = x + (w / 2);
    var adjustedY = y + (h / 2);
    var body = Matter.Bodies.rectangle(adjustedX, adjustedY, w, h, {
        collisionFilter: {
            mask: Helpers.collisionFilters.normal
        }
    });
    Matter.Body.setInertia(body, Infinity);
    Matter.Body.setStatic(body, true);
    var entityId = Helpers.getUUID();
    var type = 'w';
    var entity = {
        id: entityId,
        type: type,
        x: adjustedX,
        y: adjustedY,
        w: w,
        h: h,
        angle: body.angle,
        matterjs: body,
        serialize: function () {
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
    body.entity = entity;
    return entity;
};
