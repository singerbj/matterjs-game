var Matter = require('matter-js/build/matter.js');
var Helpers = require('../helpers');

module.exports = function (x, y, r) {
    var body = Matter.Bodies.rectangle(x, y, r, r, {
        collisionFilter: {
            mask: Helpers.collisionFilters.normal
        }
    });
    Matter.Body.setInertia(body, Infinity);
    var entityId = Helpers.getUUID();
    var type = 'c';
    var entity = {
        id: entityId,
        type: type,
        x: x - (r/2),
        y: y - (r/2),
        w: r,
        h: r,
        matterjs: body,
        serialize: function () {
            return {
                i: this.id,
                t: this.type,
                x: this.x,
                y: this.y,
                w: this.w,
                h: this.h
                // r: this.r * 2
            }
        }
    };
    body.entity = entity;
    return entity;
};
