module.exports = function(sendEvent){
    window.onmousedown = function(event){
        sendEvent({
            type: 'onmousedown',
            which: event.which
        });
    };
    window.onmouseup = function(event){
        sendEvent({
            type: 'onmouseup',
            which: event.which
        });
    };
    window.onkeydown = function(event){
        sendEvent({
            type: 'onkeydown',
            key: event.key
        });
    };
    window.onkeyup = function(event){
        sendEvent({
            type: 'onkeyup',
            key: event.key
        });
    };
};
