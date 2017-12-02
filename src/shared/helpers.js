const uuidv4 = require('uuid/v4');

module.exports = {
    getUUID: function(){
        return uuidv4();
    },
    serializeMap: function(obj){
        return Object.keys(obj).map(function(id){
            if(id[0] !== '_'){
                return obj[id].serialize();
            }else{
                return obj[id];
            }
        });
    },
    rand: function (min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
    },
    // lineIntersect: function (a,b) {
    //     var am = (a[0].y - a[1].y) / (a[0].x - a[1].x);  // slope of line 1
    //     var bm = (b[0].y - b[1].y) / (b[0].x - b[1].x);  // slope of line 2
    //     if(a.m - b.m < Number.EPSILON){
    //         return undefined;
    //     }else{
    //         return { x: (am * a[0].x - bm*b[0].x + b[0].y - a[0].y) / (am - bm),
    //             y: (am*bm*(b[0].x-a[0].x) + bm*a[0].y - am*b[0].y) / (bm - am)};
    //     }
    // },
    // closestPoint: function(point, points){
    //     return points.reduce(function(prev, curr) {
    //         var prevD = Math.sqrt(Math.pow(prev.x - point.x, 2) + Math.pow(prev.y - point.y, 2));
    //         var currD = Math.sqrt(Math.pow(curr.x - point.x, 2) + Math.pow(curr.y - point.y, 2));
    //         return currD < prevD ? curr : prev;
    //     });
    // }
}
