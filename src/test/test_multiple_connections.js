const WebSocket = require('ws');
const Matter = require('matter-js/build/matter.js');
const raf = require('raf');
const Paper = require('paper');
const Howler = require('howler');
const remote = require('electron').remote;
const Helpers = require('../shared/helpers');

var createNewClient = function (ipToJoin) {
    var keys = {};
    var mouseX = 0,
        mouseY = 0;
    const client = new WebSocket('ws://' + (ipToJoin !== undefined ? ipToJoin : '127.0.0.1') + ':6574');
    client.on('open', function () {
        console.log('Connected');

        client.on('message', function (data) {
            parsedData = JSON.parse(data);
        });

        var sendEvent = function (event) {
            client.send(JSON.stringify(event));
        };

        var lastKeys = Date.now();
        var lastClick = Date.now();
        setInterval(function () {
            var now = Date.now();
            if (Date.now() - lastKeys > Helpers.rand(1000, 4000)) {
                lastKeys = now;
                    ['W', 'A', 'S', 'D', 'R', 'F'].forEach(function (key) {
                    keys[key] = Helpers.rand(0, 2) === 1 ? 'onkeydown' : 'onkeyup';
                });

                sendEvent({
                    type: 'onmouseup'
                });
            }

            if (Date.now() - lastClick > Helpers.rand(500, 2000)) {
                lastClick = now;
                mouseX = Helpers.rand(-1000, 1000);
                mouseY = Helpers.rand(-1000, 1000);

                sendEvent({
                    type: 'onmousedown',
                    which: 1
                });
            }
            var msg = {
                type: 'mouse',
                x: mouseX,
                y: mouseY,
                keys: keys
            };
            client.send(JSON.stringify(msg));
        }, 60);

    });

    client.on('error', function () {
        alert("Error connecting to: " + joinInput.value);
        window.location.reload();
    });

    client.on('close', function () {
        console.log('Connection closed');
    });
};

var i;
for (i = 0; i < 20; i += 1) {
    createNewClient();
}

// var sendEvent = function (event) {
//     client.send(JSON.stringify(event));
// };
//
// canvas.onmousemove = function (e) {
//     mouseX = e.offsetX;
//     mouseY = e.offsetY;
// };
//
// // var acceptInput = true;
// canvas.onmouseenter = function () {
//     Object.keys(keys).forEach(function (key) {
//         keys[key] = 'onkeyup';
//     });
// };
//
// canvas.onmouseout = function () {
//     // acceptInput = false;
//     Object.keys(keys).forEach(function (key) {
//         keys[key] = 'onkeyup';
//     });
// };
//
// window.onmousedown = function (event) {
//     sendEvent({
//         type: 'onmousedown',
//         which: event.which
//     });
// };
// window.onmouseup = function (event) {
//     sendEvent({
//         type: 'onmouseup',
//         which: event.which
//     });
// };
// window.onkeydown = function (event) {
//     if (event.key === 'Escape') {
//         var window = remote.getCurrentWindow();
//         window.close();
//     } else if (event.key === 'F11') {
//         event.preventDefault();
//     } else {
//         keys[event.key.toUpperCase()] = 'onkeydown';
//         sendEvent({
//             keys: keys
//         });
//     }
// };
// window.onkeyup = function (event) {
//     keys[event.key.toUpperCase()] = 'onkeyup';
//     sendEvent({
//         keys: keys
//     });
// };
