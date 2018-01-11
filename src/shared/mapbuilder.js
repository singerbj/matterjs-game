var Tiles = require('./tiles');
var Wall = require('./entities/wall');
var Helpers = require('./helpers');

var possibleItems = [
    require('./entities/items/guns/lmg'),
    require('./entities/items/guns/shotgun'),
    require('./entities/items/guns/ar'),
    require('./entities/items/guns/smg'),
    require('./entities/items/guns/sniper')
];

module.exports = {
    tileSize: 500,
    wallWidth: 10,
    buildMap: function (mapWidth, mapHeight) {
        if (mapWidth % this.tileSize !== 0 || mapHeight % this.tileSize !== 0) {
            console.warn('WARNING: Map size doesn\'t perfectly match tile size of ' + this.tileSize + '...');
        }

        var possibleTiles = Tiles.generate(this.tileSize, this.wallWidth);

        var bodies = {
            walls: [],
            items: []
        };

        var topLeft = {
            x: 0 - (mapWidth / 2),
            y: 0 - (mapHeight / 2)
        };
        var topRight = {
            x: 0 + (mapWidth / 2),
            y: 0 - (mapHeight / 2)
        };
        var bottomLeft = {
            x: 0 - (mapWidth / 2),
            y: 0 + (mapHeight / 2)
        };
        var bottomRight = {
            x: 0 + (mapWidth / 2),
            y: 0 + (mapHeight / 2)
        };

        //create border walls
        //top
        bodies.walls.push(new Wall(topLeft.x + this.wallWidth, topLeft.y - this.wallWidth, mapWidth, this.wallWidth));
        //right
        bodies.walls.push(new Wall(topRight.x, topRight.y, this.wallWidth, mapHeight + this.wallWidth));
        //bottom
        bodies.walls.push(new Wall(bottomLeft.x, bottomLeft.y, mapWidth, this.wallWidth));
        //left
        bodies.walls.push(new Wall(topLeft.x, topLeft.y - this.wallWidth, this.wallWidth, mapHeight + this.wallWidth));

        //for each tile space, select a random tile and draw the walls relative to the tile space's position
        var i, j, x, y, generatedTile, randomTile;
        for (i = 0; i < (mapWidth / this.tileSize); i += 1) {
            for (j = 0; j < (mapHeight / this.tileSize); j += 1) {
                x = (i * this.tileSize) - (mapWidth / 2);
                y = (j * this.tileSize) - (mapWidth / 2);

                randomTile = possibleTiles[Helpers.rand(0, possibleTiles.length)];
                generatedTile = Tiles.offsetAndCreate(randomTile, x, y, possibleItems);
                bodies.walls = bodies.walls.concat(generatedTile.walls);
                bodies.items = bodies.items.concat(generatedTile.items);
            }
        }

        return bodies;
    }
}
