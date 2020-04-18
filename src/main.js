/* Configuration */
var bleeper = require('pixelbox/bleeper');


/* Define Game State Variables */
var npc = { // "Pet" non-playable character
    x: 60,
    y: 20
}

var pc = { // playable character
    x: 60,
    y: 100
}

var background = getMap("map")
paper(7);

// Update is called once per frame
exports.update = function () {

    /* User Input */
    let deltaX = 0;
    let deltaY = 0;
    if (window.gamepad.btn.right) deltaX += 1;
    if (window.gamepad.btn.left) deltaX -= 1;
    if (window.gamepad.btn.up) deltaY -= 1;
    if (window.gamepad.btn.down) deltaY += 1;
    if (window.gamepad.btn.A) sfx('death')

    /* Collision Dectection */
    
    // Action Game Collision
    let blocked = checkGameWalls(deltaX, deltaY);

    if (!blocked.x) {
        pc.x += deltaX;
    }
    if (!blocked.y) {
        pc.y += deltaY;
    }

    // Adventure Sim Collision

    cls();
    draw(background, 0, 0)
    sprite(153, npc.x, npc.y)
    sprite(153, pc.x, pc.y)
};

function checkGameWalls(dX, dY){
    let blocked = {x: false, y: false}
    if(pc.y+dY < (8*9) || pc.y+dY > (8*14)) {blocked.y = true} 
    if(pc.x+dX < (8*1) || pc.x+dX > (8*14)) {blocked.x = true} 
    return blocked
}