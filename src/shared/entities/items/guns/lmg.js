const Matter = require('matter-js/build/matter.js');
const Helpers = require('../../../helpers');

module.exports = function (x, y) {
    var width = 10;
    var height = 10;
    var adjustedX = x + (width / 2);
    var adjustedY = y + (height / 2);
    var body = Matter.Bodies.rectangle(adjustedX, adjustedY, width, height, {
        collisionFilter: {
            mask: Helpers.collisionFilters.normal
        }
    });
    Matter.Body.setInertia(body, Infinity);
    Matter.Body.setStatic(body, true);
    var entityId = Helpers.getUUID();
    var type = 'g';
    body.entityId = entityId;
    body.type = type;
    var entity = {
        id: entityId,
        name: 'Light Machine Gun',
        type: type,
        x: adjustedX,
        y: adjustedY,
        w: width,
        h: height,
        fireRate: 100,
        range: 1000,
        spread: 25,
        maxAmmo: 64,
        ammo: 64,
        reloadTime: 2500,
        damage: 100,
        bulletsPerShot: 1,
        matterjs: body,
        serialize: function () {
            return {
                i: this.id,
                n: this.name,
                t: this.type,
                x: this.x,
                y: this.y,
                w: this.w,
                h: this.h,
                fireRate: this.fireRate,
                damage: this.damage,
                range: this.range,
                maxAmmo: this.maxAmmo,
                ammo: this.ammo,
                reloadTime: this.reloadTime,
                damage: this.damage
            }
        }
    };
    body.entity = entity;
    return entity;
};
