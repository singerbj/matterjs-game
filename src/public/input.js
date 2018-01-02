const remote = require('electron').remote;

module.exports = function (sendEvent) {
    window.onmousedown = function (event) {
        sendEvent({
            type: 'onmousedown',
            which: event.which
        });
    };
    window.onmouseup = function (event) {
        sendEvent({
            type: 'onmouseup',
            which: event.which
        });
    };
    window.onkeydown = function (event) {
        if (event.key === 'Escape') {
            var window = remote.getCurrentWindow();
            window.close();
        } else if (event.key === 'F11') {
            event.preventDefault();
        } else {
            sendEvent({
                type: 'onkeydown',
                key: event.key
            });
        }
    };
    window.onkeyup = function (event) {
        sendEvent({
            type: 'onkeyup',
            key: event.key
        });
    };
};
