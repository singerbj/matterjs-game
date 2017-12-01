const Helpers = require('../helpers');

module.exports = function(){
    return {
        id: Helpers.getUUID(),
        type: 'g',
        fireRate: 133,
        damage: 100,
        range: 1000
    };
};
