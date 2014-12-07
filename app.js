var debug = false;
// debug = true; // Uncomment to enable debug mode.

var lastTouch = 0;
var pixels = {};
var touches = {};
var arraySize = 16;
var delay = 128;
var mouseIsDown = 0;

touches.allocate = function(x, y) {
    this.storage = new Array(x);
    for (var i = 0; i < x; i++) {
        this.storage[i] = new Array(y);
    }
};

touches.set = function(e, value) {
    e.preventDefault();
    e.stopPropagation();

    lastTouch = Date.now();

    var x = e.pageX;
    var y = e.pageY;

    if (e.touches) {
        var touch = e.touches[0];
        x = touch.pageX;
        y = touch.pageY;
    }

    var i = Math.floor(arraySize * x / innerWidth);
    var ii = Math.floor(arraySize * y / innerHeight);
    if (i < 0 || i >= arraySize || ii < 0 || ii >= arraySize) {
        mouseIsDown = false;
        return;
    }

    this.storage[ii][i] = value;
};

touches.remove = function(e) {
    touches.set(e, false);
};

touches.add = function(e) {
    touches.set(e, true);
};

pixels.allocate = function(x, y) {
    this.element.textContent = '';
    this.storage = new Array(x);
    for (var i = 0; i < x; i++) {
        this.storage[i] = new Array(y);
        for (var ii = 0; ii < y; ii++) {
            this.storage[i][ii] = document.createElement('div');
            this.storage[i][ii].style.left = (100 * ii / arraySize) + '%';
            this.storage[i][ii].style.top = (100 * i / arraySize) + '%';
            this.element.appendChild(this.storage[i][ii]);
        }
    }
};

pixels.randomNumber = function() {
    return Math.floor(Math.random() * 256);
}

pixels.takeWeightedNumber = function(x, y) {
    if (touches.storage[x][y]) {
        return 255;
    } else {
        return this.randomNumber();
    }
};

pixels.randomRgb = function() {
    return (
        'rgb(' +
            this.randomNumber() + ', ' +
            this.randomNumber() + ', ' +
            this.randomNumber() +
        ')'
    );
};

pixels.takeWeightedRgb = function(x, y) {
    return (
        'rgb(' +
            this.takeWeightedNumber(x, y) + ', ' +
            this.takeWeightedNumber(x, y) + ', ' +
            this.takeWeightedNumber(x, y) +
        ')'
    );
};

pixels.render = function() {
    for (var x = 0; x < this.storage.length; x++) {
        for (var y = 0; y < this.storage.length; y++) {
            this.storage[x][y].style.backgroundColor = this.takeWeightedRgb(x, y);
        }
    }
};

window.requestAnimFrame = (function(){
    return (
        window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        }
    );
})();

document.addEventListener('DOMContentLoaded', function(e) {
    var el = document.querySelector('#board');

    var onPressDown = function(e) {
        touches.add(e);
        mouseIsDown = true;
    };

    var onPressUp = function(e) {
        mouseIsDown = false;
    };

    var onPressMove = function(e) {
        if (mouseIsDown) {
            touches.add(e);
        }
    };

    var onTouchStart = function() {
        el.removeEventListener('touchstart', onTouchStart, false);
        el.removeEventListener('mousedown', onPressDown, false);
        el.removeEventListener('mouseup', onPressUp, false);
        el.removeEventListener('mousemove', onPressMove, false);
    };

    el.addEventListener('mousedown', onPressDown, false);
    el.addEventListener('mouseup', onPressUp, false);
    el.addEventListener('mousemove', onPressMove, false);

    el.addEventListener('touchstart', onPressDown, false);
    el.addEventListener('touchmove', onPressMove, false);
    el.addEventListener('touchcancel', onPressUp, false);
    el.addEventListener('touchend', onPressUp, false);

    el.addEventListener('touchstart', onTouchStart, false);

    var onHashChange = function(e) {
        try {
            touches.storage = JSON.parse(atob(location.hash.substring(1)));
            sessionStorage.savedHash = location.hash;
        } catch(e) {
            sessionStorage.savedHash = '';
            location.hash = '';
            touches.allocate(arraySize, arraySize);
        }
    };

    window.addEventListener('hashchange', onHashChange, false);

    pixels.element = el;
    pixels.allocate(arraySize, arraySize);
    setTimeout(function() {
        el.className = 'visible';
    });

    var loaded = false;
    if (location.hash && location.hash !== sessionStorage.savedHash) {
        try {
            touches.storage = JSON.parse(atob(location.hash.substring(1)));
            sessionStorage.savedHash = location.hash;
            loaded = true;
        } catch(e) {
            // ...
        }
    }
    if (!loaded) {
        sessionStorage.savedHash = '';
        location.hash = '';
        touches.allocate(arraySize, arraySize);
    }


    var frames = 0;
    var then = Date.now();
    (function animloop() {
        frames += 1;
        requestAnimFrame(animloop);

        if (Date.now() - then < delay) {
            return;
        }

        then = Date.now();
        pixels.render();

        if (lastTouch && Date.now() > lastTouch + 1000) {
            location.hash = btoa(JSON.stringify(touches.storage));
            lastTouch = 0;
        }
    })();

    if (debug) {
        var fps = document.querySelector('#fps');
        fps.className = 'enabled';
        setInterval(function() {
            fps.textContent = frames;
            frames = 0;
        }, 1000);
    }
});
