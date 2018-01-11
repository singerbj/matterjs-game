var Matter = require('matter-js/build/matter.js');
var Helpers = require('../helpers');
var Raycast = require('../raycast');

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
    var entity = {
        id: entityId,
        type: type,
        name: '',
        x: x,
        y: y,
        r: r,
        health: 1000,
        speed: 1.4,
        diagonalSpeed: 0.9899,
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
        inventory: {},
        ground: {},
        handleFiring: function (engine) {
            var self = this;
            var time = Date.now();
            var playerX = this.x;
            var playerY = this.y;
            if (this.health > 0) {
                if (this.gun) {
                    if (!this.reloading) {
                        if (this.firing && this.gun.ammo > 0 && (!this.lastShot || (time - this.lastShot) >= this.gun.fireRate)) {
                            this.lastShot = time;
                            this.gun.ammo -= 1;

                            var i, shotObj, result, shotX, shotY, k, arrayOfShots = [];
                            for (i = 0; i < this.gun.bulletsPerShot; i += 1) {
                                k = (this.gun.range / (Math.sqrt(Math.pow(this.aim, 2) + 1)));

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

                                shotX += (Helpers.rand(-this.gun.spread, this.gun.spread));
                                shotY += (Helpers.rand(-this.gun.spread, this.gun.spread));

                                shotObj = {
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

                                result = Raycast(Matter.Composite.allBodies(engine.world).filter(function (body) {
                                    return body.id !== self.matterjs.id && body.entity.type !== 'g';
                                }), shotObj.start, shotObj.end);

                                if (result.length > 0) {
                                    shotObj.end = {
                                        x: result[0].point.x,
                                        y: result[0].point.y,
                                    };
                                    shotObj.hit = true;
                                    shotObj.hitEntityId = result[0].body.entity.id;
                                    shotObj.hitEntityType = result[0].body.entity.type;
                                    // shotObj.shooterEntityId = result[0].body.entityId;
                                }
                                arrayOfShots.push(shotObj);
                            }

                            return arrayOfShots;
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
            }
        },
        handleHit: function (shot) {
            this.health -= shot.damage;
            if (this.health < 0) {
                this.health = 0;
            }
        },
        lastPickupPutdown: Date.now(),
        handlePickup: function (itemMap, Engine) {
            var now = Date.now();
            if (now - this.lastPickupPutdown > 500) {
                this.lastPickupPutdown = now;
                this.reloadStart = undefined;
                this.reloaded = 0;
                this.reloading = false;
                var self = this;
                if (this.health > 0) {
                    var groudKeys = Object.keys(this.ground);
                    if (groudKeys.length > 0) {
                        groudKeys.forEach(function (key) {
                            if (Object.keys(self.inventory).length < 2) {
                                itemMap[key].deleted = true;
                                Engine.removeItem(itemMap[key]);
                                self.inventory[key] = self.ground[key];
                                if (!self.gun && self.inventory[key].type === 'g') {
                                    self.gun = self.inventory[key];
                                }
                            }
                        });
                    } else {
                        if (self.gun) {
                            self.gun.deleted = false;
                            delete self.inventory[self.gun.id];
                            var body = Matter.Bodies.rectangle(self.x, self.y, self.gun.w, self.gun.h, {
                                collisionFilter: {
                                    mask: Helpers.collisionFilters.normal
                                }
                            });
                            self.gun.matterjs = body;
                            body.entity = self.gun;
                            self.gun.id = Helpers.getUUID();

                            itemMap[self.gun.id] = self.gun;
                            Engine.addItem(itemMap[self.gun.id]);

                            var inventoryKeys = Object.keys(self.inventory);
                            if (inventoryKeys.length > 0) {
                                self.gun = self.inventory[inventoryKeys[0]];
                            } else {
                                self.gun = undefined;
                            }
                        }
                    }
                }
            }
        },
        switchWeapon: function (key) {
            if (this.health > 0 && !this.reloading) {
                var gun = this.inventory[Object.keys(this.inventory)[parseInt(key, 10) - 1]]
                if (gun) {
                    this.gun = gun;
                }
            }
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
                h: this.health,
                in: Helpers.serializeMapToArray(this.inventory),
                gr: Helpers.serializeMapToArray(this.ground),
                n: this.name
            }
        }
    };
    body.entity = entity;
    return entity;
};
