const Matter = require('matter-js/build/matter.js');
const Helpers = require('../helpers');
const Gun = require('./items/guns/gun');
const Raycast = require('../raycast');

module.exports = function (x, y) {
    var r = 8;
    var body = Matter.Bodies.circle(x, y, r * 2, {
        collisionFilter: {
            mask: Helpers.collisionFilters.normal
        }
    });
    Matter.Body.setInertia(body, Infinity);
    var entityId = Helpers.getUUID();
    var type = 'p';
    body.entityId = entityId;
    body.type = type;
    return {
        id: entityId,
        type: type,
        x: x,
        y: y,
        r: r,
        health: 1000,
        speed: 1.2,
        moving: {
            up: false,
            down: false,
            left: false,
            right: false
        },
        mouse: {
            x: 0,
            y: 0
        },
        firing: false,
        reloading: false,
        reloaded: 0,
        reloadStart: undefined,
        matterjs: body,
        angle: 0,
        aim: 0,
        gun: undefined,
        inventory: [],
        handleFiring: function (engine) {
            var self = this;
            var time = Date.now();
            var playerX = this.x;
            var playerY = this.y;
            if(this.gun){
                if (!this.reloading) {
                    if (this.firing && this.gun.ammo > 0 && (!this.lastShot || (time - this.lastShot) >= this.gun.fireRate)) {
                        this.lastShot = time;
                        this.gun.ammo -= 1;

                        this.aim += (Helpers.rand(-this.gun.spread, this.gun.spread) / 500);

                        var k = (this.gun.range / (Math.sqrt(Math.pow(this.aim, 2) + 1)));

                        var shotX;
                        var shotY;
                        if ((playerX + this.mouse.x) < playerX) {
                            shotX = playerX - k;
                            shotY = playerY - (k * this.aim);
                        } else {
                            shotX = playerX + k;
                            shotY = playerY + (k * this.aim);
                        }

                        if (this.aim === -Infinity) {
                            shotY = playerY - this.gun.range;
                        } else if (this.aim === Infinity) {
                            shotY = playerY + this.gun.range;
                        }

                        var shotObj = {
                            id: Helpers.getUUID(),
                            start: {
                                x: playerX,
                                y: playerY
                            },
                            end: {
                                x: shotX,
                                y: shotY
                            },
                            hit: false,
                            time: Date.now(),
                            damage: this.gun.damage
                        };

                        var result = Raycast(Matter.Composite.allBodies(engine.world).filter(function (body) {
                            return body.id !== self.matterjs.id && body.collisionFilter.mask === 0x0001;
                        }), shotObj.start, shotObj.end);

                        if (result.length > 0) {
                            shotObj.end = {
                                x: result[0].point.x,
                                y: result[0].point.y,
                            };
                            shotObj.hit = true;
                            shotObj.hitEntityId = result[0].body.entityId;
                            shotObj.shooterEntityId = result[0].body.entityId;
                        }

                        return shotObj;
                    }
                } else {
                    if (!this.reloadStart) {
                        this.reloadStart = Date.now();
                    } else {
                        if (Date.now() > (this.gun.reloadTime + this.reloadStart)) {
                            this.reloadStart = undefined;
                            this.reloaded = 0;
                            this.reloading = false;
                            this.gun.ammo = this.gun.maxAmmo;
                        } else {
                            this.reloaded = Math.floor((Date.now() - this.reloadStart) / this.gun.reloadTime * 100);
                        }
                    }
                }
            }
        },
        handleHit: function (shot) {
            this.health -= shot.damage;
        },
        serialize: function () {
            return {
                i: this.id,
                t: this.type,
                x: this.x,
                y: this.y,
                r: this.r * 2,
                a: this.angle,
                g: this.gun ? this.gun.serialize() : undefined,
                re: this.reloaded,
                h: this.health
            }
        }
    };
};
