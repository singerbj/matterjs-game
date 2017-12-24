const Wall = require('./entities/wall');

module.exports = {
    generate: function(tileSize, wallWidth){
        return [
            {
                wallSpecs: [],
                gunSpecs: []
            },
            {
                wallSpecs: [{
                    x: (tileSize / 2) - 60,
                    y: (tileSize / 2) - 60,
                    w: 120,
                    h: 120
                }],
                gunSpecs: []
            }, {
                wallSpecs: [{
                    x: tileSize / 4,
                    y: tileSize / 4,
                    w: tileSize / 2,
                    h: wallWidth
                },{
                    x: (tileSize / 4) + (tileSize / 2),
                    y: tileSize / 4,
                    w: wallWidth,
                    h: tileSize / 2
                },{
                    x: tileSize / 4,
                    y: tileSize / 4,
                    w: wallWidth,
                    h: tileSize / 2
                },{
                    x: tileSize / 4,
                    y: (tileSize / 4) + (tileSize / 2),
                    w: tileSize / 6,
                    h: wallWidth
                },{
                    x: tileSize / 4 + tileSize / 3 + (wallWidth),
                    y: (tileSize / 4) + (tileSize / 2),
                    w: (tileSize / 6),
                    h: wallWidth
                }],
                gunSpecs: []
            },{
                wallSpecs: [{
                    x: (tileSize / 8),
                    y: (tileSize / 8),
                    w: 80,
                    h: 80
                },{
                    x: (tileSize / 8) * 3,
                    y: (tileSize / 8) * 5,
                    w: 60,
                    h: 60
                },{
                    x: (tileSize / 8) * 5,
                    y: (tileSize / 8) * 2,
                    w: 40,
                    h: 40
                }],
                gunSpecs: []
            }
        ];
    },
    offsetAndCreate: function(tile, x, y){
        var actualTile = {
            walls: [],
            guns: []
        };
        var offsetX, offsetY;
        tile.wallSpecs.forEach(function(wall){
            offsetX = wall.x + x;
            offsetY = wall.y + y;
            actualTile.walls.push(new Wall(offsetX, offsetY, wall.w, wall.h));
        });
        tile.gunSpecs.forEach(function(gun){
            offsetX = gun.x + x;
            offsetY = gun.y + y;
            // actualTile.guns.push(new Wall(gun.x, gun.y, gun.w, gun.h));
        });
        return actualTile;
    }
};
