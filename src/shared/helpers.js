const uuidv4 = require('uuid/v4');

module.exports = {
    getUUID: function(){
        return uuidv4();
    },
    serializeMap: function(obj){
        var mapCopy = {}, copy;
        Object.keys(obj).forEach(function(id){
            copy = Object.assign({}, obj[id]);
            delete copy.p2;
            mapCopy[id] = copy;
        });
        return mapCopy;
    }
}
