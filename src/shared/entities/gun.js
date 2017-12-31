const Helpers = require('../helpers');

module.exports = function(){
    var entityId = Helpers.getUUID();
    return {
        id: entityId,
        type: 'g',
        fireRate: 100,
        damage: 100,
        range: 1000,
        maxAmmo: 64,
        ammo: 64,
        reloadTime: 2500,
        damage: 100
    };
};
