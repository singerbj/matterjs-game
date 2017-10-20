const p2 = require('p2');
const Helpers = require('../helpers');

module.exports = function(x, y){
    var r = 20;
    var circleBody = new p2.Body({
        mass: 1,
        position: [x, y],
        angularVelocity: 1,
        angularDamping: 0
    });
    circleBody.addShape(new p2.Circle({
        radius: r
    }));
    return {
        id: Helpers.getUUID(),
        x: x,
        y: y,
        r: r,
        p2: circleBody
    };
};
