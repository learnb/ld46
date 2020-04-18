/* Configuration */
var bleeper = require('pixelbox/bleeper');


/* Define Game State Variables */
// Adventure Sim
var npc = { // "Pet" non-playable character
    radius: 4,
    hp: 100,
    hunger: 100,
    gold: 0,
    x: 60,
    y: 20,
    sid: 0
}

var monster = { // damages npc
    radius: 4,
    x: 0,
    y: 0,
    sid: 48
}

var monsterList = [];

var loot = { // bonus gold when collected
    radius: 4,
    x: 0,
    y: 0,
    sid: 35
}

var lootList = [];

// Action Game
var pc = { // playable character
    radius: 4,
    x: 60,
    y: 100,
    sid: 16
}

var obstacle = { // damages pc
    radius: 4,
    x: 0,
    y: 0,
    sid: 32
}

var obstacleList = [];

var collectible = { // pc can collect
    radius: 4,
    x: 0,
    y: 0,
    sid0: 33,
    sid1: 34,
    type: 0
}

var collectibleList = []

var gameActive = false;
var gameTimer = 0;
var gameTimerMax = 32;
var gameCost = 10;

var background = getMap("map")

function init() { // reset state data to defaults
    gameTimer = gameTimerMax;
    gameActive = false;
    npc = { // "Pet" non-playable character
        radius: 4,
        hp: 100,
        hunger: 100,
        gold: 10,
        x: 60,
        y: 20,
        sid: 0
    }

    pc = { // playable character
        radius: 4,
        x: 60,
        y: 100,
        sid: 16
    }
    obstacleList = []
    collectibleList = []
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
    updateGame(deltaX, deltaY);

    // Adventure Sim Collision
    updateSim();

    /* Render */
    cls();

    // background
    draw(background, 0, 0)

    // other sprites
    if (gameActive) drawGame()

    // characters
    sprite(npc.sid, npc.x, npc.y)
    sprite(pc.sid, pc.x, pc.y)

    // UI
    drawSimUI();
    drawGameUI();
};

/* State Update functions */

function updateGame(dX, dY) {
    let blocked = checkGameWalls(dX, dY);

    if (!blocked.x) {
        pc.x += dX;
    }
    if (!blocked.y) {
        pc.y += dY;
    }

    if (gameActive) {
        // collectiable collision
        let removedItems = [];
        collectibleList.forEach((elem) => {
            if (collisionCheck(elem, pc)) {
                removedItems.push(elem);
                sfx('pickup', 1)
                if (elem.type == 0) healNPC()
                if (elem.type == 1) feedNPC()
            }
        })
        var updatedList = collectibleList.filter(elem => !removedItems.includes(elem))
        collectibleList = updatedList

        // obstacle collision
        removedItems = [];
        obstacleList.forEach((elem) => {
            if (collisionCheck(elem, pc)) {
                removedItems.push(elem);
                sfx('dmg2', 1)
                hurtPC()
            }
        })
        var updatedList = obstacleList.filter(elem => !removedItems.includes(elem))
        obstacleList = updatedList

        // reduce timer
        gameTimer-0.1 <= 0 ? gameTimer = 0 : gameTimer -= 0.1;
    }

    if (gameTimer <= 0) gameActive = false;
}

function hurtPC() {
    gameTimer -= 3
}

function feedNPC() {
    npc.hunger+10 >= 100 ? npc.hunger = 100 : npc.hunger += 10
}

function healNPC() {
    npc.hp+10 >= 100 ? npc.hp = 100 : npc.hp += 10
}


function startActionGame() {
    genGame(); // generate enemies and collectibles
    gameTimer = gameTimerMax;
    gameActive = true;
}

function genGame() {
    for (let i=0; i<=5; i++) {
        let c1 = Object.assign({}, collectible)
        c1.x = random((8*1), (8*14))
        c1.y = random((8*9), (8*14))
        c1.type = random(0, 2)
        collectibleList.push(c1)
    }

    for (let i=0; i<=5; i++) {
        let o1 = Object.assign({}, obstacle)
        o1.x = random((8*1), (8*14))
        o1.y = random((8*9), (8*14))
        obstacleList.push(o1)
    }
    
    return
}

function collisionCheck(entA, entB) {
    var dx = entA.x - entB.x;
    var dy = entA.y - entB.y;
    var dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < entA.radius + entB.radius) {
        return true;
    }

    return false
}

function checkGameWalls(dX, dY){
    let blocked = {x: false, y: false}
    if(pc.y+dY < (8*9) || pc.y+dY > (8*14)) {blocked.y = true} 
    if(pc.x+dX < (8*1) || pc.x+dX > (8*14)) {blocked.x = true} 
    return blocked
}

function death() {
    sfx('death', 0.5)
    init();
}

function updateSim() {
    // npc actions

    // consume resources
    npc.hp <= 0 ? npc.hp = 0 : npc.hp -= 0.001
    npc.hunger <= 0 ? npc.hunger = 0 : npc.hunger -= 0.01

    // gain gold
    npc.gold += 0.03
}

/* Render functions */

function drawGame() {
    collectibleList.forEach((elem, indx) => {
        if (elem.type == 0) sprite(elem.sid0, elem.x, elem.y)
        if (elem.type == 1) sprite(elem.sid1, elem.x, elem.y)
    })
    obstacleList.forEach((elem, indx) => {
        sprite(elem.sid, elem.x, elem.y)
    })
}

function drawSimUI() {
    // hp bar
    drawBar((8*2), (8*0)+1, (npc.hp/100), 9)


    // hunger bar
    drawBar((8*10), (8*0)+1, (npc.hunger/100), 14)

    // gold label
    drawLabel((8*1)-1, (8*8), (8*14)+2, `gold: ${Math.floor(npc.gold)}`)
    return
}

function drawGameUI() {
    let x = (8*6)
    let y = (8*15)+1
    let val = gameTimer/gameTimerMax
    drawBar(x,y,val,7);
    return
}

function drawBar(x, y, val, pid) {
    let w = 32;
    let h = 6;
    val = val*w
    // bg
    paper(0)
    rectf(x, y, w, h)
    // bar
    paper(pid)
    rectf(x, y, val, h)
    // border
    pen(1)
    rect(x, y, w, h)
    return
}

function drawLabel(x, y, w, val) {
    // bg
    paper(0)
    rectf(x,y,w,8)
    // text
    pen(11)
    print(val, x+2, y+1)
    // border
    pen(8)
    rect(x,y,w,8)
}