const Helpers = require('../helpers');

module.exports = function(){
    return {
        id: Helpers.getUUID(),
        type: 'g',
        fireRate: 300,
        damage: 100,
        range: 1000,
        maxAmmo: 32,
        ammo: 32,
        reloadTime: 2000
    };
};
