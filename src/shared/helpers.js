const uuidv4 = require('uuid/v4');

module.exports = {
    getUUID: function(){
        return uuidv4();
    },
    serializeMap: function(obj){
        return Object.keys(obj).map(function(id){
            return obj[id].serialize();
        });
    }
}
