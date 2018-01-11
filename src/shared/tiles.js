var Wall = require('./entities/wall');
var Helpers = require('./helpers');

module.exports = {
    generate: function (tileSize, wallWidth) {
        return [
            {
                wallSpecs: [],
                itemSpecs: [{
                    x: tileSize / 2,
                    y: tileSize / 2
                }]
            },
            {
                wallSpecs: [{
                    x: (tileSize / 2) - 60,
                    y: (tileSize / 2) - 60,
                    w: 120,
                    h: 120
                }],
                itemSpecs: [{
                    x: 40,
                    y: 40
                }]
            }, {
                wallSpecs: [{
                    x: tileSize / 4,
                    y: tileSize / 4,
                    w: tileSize / 2,
                    h: wallWidth
                }, {
                    x: (tileSize / 4) + (tileSize / 2),
                    y: tileSize / 4,
                    w: wallWidth,
                    h: tileSize / 2
                }, {
                    x: tileSize / 4,
                    y: tileSize / 4,
                    w: wallWidth,
                    h: tileSize / 2
                }, {
                    x: tileSize / 4,
                    y: (tileSize / 4) + (tileSize / 2),
                    w: tileSize / 6,
                    h: wallWidth
                }, {
                    x: tileSize / 4 + tileSize / 3 + (wallWidth),
                    y: (tileSize / 4) + (tileSize / 2),
                    w: (tileSize / 6),
                    h: wallWidth
                }],
                itemSpecs: [{
                    x: tileSize / 2,
                    y: tileSize / 2
                }]
            }, {
                wallSpecs: [{
                    x: (tileSize / 8),
                    y: (tileSize / 8),
                    w: 80,
                    h: 80
                }, {
                    x: (tileSize / 8) * 3,
                    y: (tileSize / 8) * 5,
                    w: 60,
                    h: 60
                }, {
                    x: (tileSize / 8) * 5,
                    y: (tileSize / 8) * 2,
                    w: 40,
                    h: 40
                }],
                itemSpecs: [{
                    x: (tileSize / 2) + 60,
                    y: (tileSize / 2) + 40
                }]
            }
        ];
    },
    offsetAndCreate: function (tile, x, y, possibleItems) {
        var actualTile = {
            walls: [],
            items: []
        };
        var offsetX, offsetY;
        tile.wallSpecs.forEach(function (wall) {
            offsetX = wall.x + x;
            offsetY = wall.y + y;
            actualTile.walls.push(new Wall(offsetX, offsetY, wall.w, wall.h));
        });
        tile.itemSpecs.forEach(function (item) {
            offsetX = item.x + x;
            offsetY = item.y + y;
            actualTile.items.push(new possibleItems[Helpers.rand(0, possibleItems.length)](offsetX, offsetY));
        });
        return actualTile;
    }
};
