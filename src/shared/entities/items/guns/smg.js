var Matter = require('matter-js/build/matter.js');
var Helpers = require('../../../helpers');

module.exports = function (x, y) {
    var width = 40;
    var height = 20;
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
    var entity = {
        id: entityId,
        name: 'Sub Machine Gun',
        type: type,
        x: adjustedX,
        y: adjustedY,
        w: width,
        h: height,
        fireRate: 50,
        range: 600,
        spread: 60,
        maxAmmo: 30,
        ammo: 30,
        reloadTime: 2500,
        damage: 70,
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
