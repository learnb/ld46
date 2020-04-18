/* Configuration */
var bleeper = require('pixelbox/bleeper');


/* Define Game State Variables */
// Adventure Sim
var npc = { // "Pet" non-playable character
    hp: 100,
    hunger: 100,
    gold: 0,
    x: 60,
    y: 20,
    sid: 0
}

// Action Game
var pc = { // playable character
    x: 60,
    y: 100,
    sid: 0
}

var obstacle = { // damanges pc
    x: 0,
    y: 0,
    sid: 177
}

var gameActive = false;
var gameTimer = 0;
var gameTimerMax = 32;
var gameCost = 10;

var background = getMap("map")

function init() { // reset state data to defaults
    gameTimer = gameTimerMax;
    gameActive = false;
    npc = { // "Pet" non-playable character
        hp: 100,
        hunger: 100,
        gold: 100,
        x: 60,
        y: 20,
        sid: 144
    }

    pc = { // playable character
        x: 60,
        y: 100,
        sid: 153
    }
    obstacle = { // damanges pc
        x: 0,
        y: 0,
        sid: 177
    }
}

init();

// Update is called once per frame
exports.update = function () {

    /* User Input */
    let deltaX = 0;
    let deltaY = 0;
    if (window.gamepad.btn.right) deltaX += 1;
    if (window.gamepad.btn.left) deltaX -= 1;
    if (window.gamepad.btn.up) deltaY -= 1;
    if (window.gamepad.btn.down) deltaY += 1;
    if (window.gamepad.btn.A) {
        if (!gameActive && npc.gold >= gameCost) {
            npc.gold -= gameCost;
            startActionGame();
        }
    }

    /* Collision Dectection */
    
    // Action Game Collision
    let blocked = checkGameWalls(deltaX, deltaY);

    if (!blocked.x) {
        pc.x += deltaX;
    }
    if (!blocked.y) {
        pc.y += deltaY;
    }

    if (gameActive) {
        // do game checks

        // reduce timer
        gameTimer <= 0 ? gameTimer = 0 :gameTimer -= 0.1;
    }

    if (gameTimer <= 0) gameActive = false;

    // Adventure Sim Collision

    /* Render */
    cls();

    // background
    draw(background, 0, 0)

    // characters
    sprite(npc.sid, npc.x, npc.y)
    sprite(pc.sid, pc.x, pc.y)

    // UI
    drawSimUI();
    drawGameUI();
};

function startActionGame() {
    genGame(); // generate enemies and collectibles
    gameTimer = gameTimerMax;
    gameActive = true;
}

function genGame() {
    return
}

function checkGameWalls(dX, dY){
    let blocked = {x: false, y: false}
    if(pc.y+dY < (8*9) || pc.y+dY > (8*14)) {blocked.y = true} 
    if(pc.x+dX < (8*1) || pc.x+dX > (8*14)) {blocked.x = true} 
    return blocked
}

function drawSimUI() {
    // hp bg
    paper(0)
    rectf((8*2), (8*0)+1, 32, 6)
    // hp bar
    paper(9)
    rectf((8*2), (8*0)+1, (npc.hp/100)*32, 6)
    // hp border
    pen(1)
    rect((8*2), (8*0)+1, 32, 6)

    // hunger bg
    paper(0)
    rectf((8*10), (8*0)+1, 32, 6)
    // hunger bar
    paper(14)
    rectf((8*10), (8*0)+1, (npc.hunger/100)*32, 6)
    // hunger border
    pen(1)
    rect((8*10), (8*0)+1, 32, 6)

    // gold bg
    paper(0)
    rectf((8*10), (8*8)+1, 32, 6)
    // gold bar
    paper(11)
    rectf((8*10), (8*8)+1, (npc.gold/100)*32, 6)
    // gold border
    pen(1)
    rect((8*10), (8*8)+1, 32, 6)




    return
}

function drawGameUI() {
    // timer bg
    paper(0)
    rectf((8*1), (8*15)+1, 32, 6)
    // timer bar
    paper(7)
    rectf((8*1), (8*15)+1, (gameTimer/gameTimerMax)*32, 6)
    // timer border
    pen(1)
    rect((8*1), (8*15)+1, 32, 6)
    return
}

function death() {
    sfx('death', 0.5)
    init();
}