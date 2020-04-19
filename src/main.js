/* Configuration */
var bleeper = require('pixelbox/bleeper');


/* Define Game State Variables */
// Adventure Sim
var npc = { // "Pet" non-playable character
    radius: 4,
    speed: 1,
    hp: 100,
    hunger: 100,
    gold: 0,
    x: 60,
    y: 20,
    sid: 0
}
var npcTarget = {
    radius: 3,
    x: 0,
    y: 0
}
var npcWalking = false
var monster = { // damages npc
    radius: 4,
    searchRadius: 8,
    x: 0,
    y: 0,
    sid: 48,
    type: 'm',
    id: 0
}
var monsterList = [];
var monsterTimer = 100;
var loot = { // bonus gold when collected
    radius: 4,
    searchRadius: 8,
    x: 0,
    y: 0,
    sid: 35,
    type: 'l',
    id: 0
}
var lootList = [];
var lootTimer = 100;
var idCounter = 0;

// Action Game
var pc = { // playable character
    radius: 3,
    speed: 1,
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
    radius: 3,
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

var paused = false
var background = getMap("map")

function init() { // reset state data to defaults
    paused = false
    npc = { // "Pet" non-playable character
        radius: 4,
        speed: 0.7,
        hp: 100,
        hunger: 100,
        gold: 10,
        x: 60,
        y: 20,
        sid: 0
    }
    npcWalking = false
    monsterList = []
    lootList = []
    monsterTimer = 100
    lootTimer = 100
    idCounter = 0

    gameTimer = gameTimerMax;
    gameActive = false;
    pc = { // playable character
        radius: 3,
        speed: 1,
        x: 60,
        y: 100,
        sid: 16
    }
    obstacleList = []
    collectibleList = []
    
    patatracker.playSong(0)
}

init();

// Update is called once per frame
exports.update = function () {

    if (!paused) {
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
        drawSim()

        // characters
        sprite(npc.sid, npc.x, npc.y)
        sprite(pc.sid, pc.x, pc.y)

        // UI
        drawSimUI();
        drawGameUI();
    } else {
        if (window.gamepad.btn.A) init()
        drawGameOver();
    }
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

function newID() {
    let v = idCounter
    idCounter += 1
    return v
}

function hurtPC() {
    gameTimer -= gameTimerMax/3
}

function feedNPC() {
    npc.hunger+10 >= 100 ? npc.hunger = 100 : npc.hunger += 10
}

function healNPC() {
    npc.hp+10 >= 100 ? npc.hp = 100 : npc.hp += 10
}

function collectLoot(loot) {
    sfx('coin', 0.5)
    npc.gold += 25

    // remove loot from Sim
    //lootList.splice(lootList.indexOf(loot), 1)
    let updatedList = lootList.filter((elem) => !(elem.id == loot.id))
    lootList = updatedList
}

function fight(mob) {
    sfx('damage', 0.5)
    npc.hp -= random(0, 20)+20
    npc.gold += random(0, 10)+5
    
    // remove loot from Sim
    //monsterList.splice(monsterList.indexOf(mob), 1)
    let updatedList = monsterList.filter((elem) => !(elem.id == mob.id))
    monsterList = updatedList
}


function startActionGame() {
    genGame(); // generate enemies and collectibles
    gameTimer = gameTimerMax;
    gameActive = true;
}

function genGame() {
    // spawn collectibles and obstacles
    collectibleList = []
    obstacleList = []
    for (let i=0; i<=5; i++) {
        let c1 = Object.assign({}, collectible)
        let pos = randomGamePos()
        c1.x = pos.x 
        c1.y = pos.y
        c1.type = random(0, 2)
        collectibleList.push(c1)
    }

    for (let i=0; i<=5; i++) {
        let o1 = Object.assign({}, obstacle)
        let pos = randomGamePos()
        o1.x = pos.x
        o1.y = pos.y
        obstacleList.push(o1)
    }
    
    return
}

function randomGamePos() {
    return {x: random((8*1), (8*14)), y: random((8*9), (8*14)), type: 'p'}
}

function collisionCheck(entA, entB) {
    var dx = entA.x - entB.x;
    var dy = entA.y - entB.y;
    var dist = mag(dx, dy);

    if (dist < entA.radius + entB.radius) {
        return true;
    }

    return false
}

function searchCheck(ent) {
    var dx = npc.x - ent.x
    var dy = npc.y - ent.y
    var dist = mag(dx, dy)

    if (dist < npc.radius + ent.searchRadius) {
        return true;
    }

    return false
}

function checkGameWalls(dX, dY){
    let blocked = {x: false, y: false}
    if(pc.y+1+dY < (8*9) || pc.y-1+dY > (8*14)) {blocked.y = true} 
    if(pc.x+1+dX < (8*1) || pc.x-1+dX > (8*14)) {blocked.x = true} 
    return blocked
}

function death() {
    paused = true
    sfx('death', 0.3)
}

function updateSim() {
    // check end condition
    if (npc.hp <= 0 || npc.hunger <= 0) {
        death()
    }

    // gen mobs and loot
    lootTimer <= 0 ? lootTimer = 0 : lootTimer -= 0.6
    monsterTimer <= 0 ? monsterTimer = 0 : monsterTimer -= 0.4

    if (lootTimer <= 0) {
        spawnLoot()
        lootTimer = 100
    }
    if (monsterTimer <= 0) {
        spawnMonster()
        monsterTimer = 100
    }


    // npc actions
    if (!npcWalking) {
        // acquire target
        let target = {x: null, y: null}

        // NPC search
        target = npcSearch() 

        // wander (random target)
        if (target.x === null || target.y === null) {
            target = randomSimPos()
        }
        npcTarget = target

        npcWalking = true
    } else {
        let target = npcSearch()
        if (target.x !== null || target.y !== null) {
            npcTarget = target
        }
    }

    let vel = npcMoveTo(npcTarget.x, npcTarget.y)
    let dX = vel[0]
    let dY = vel[1]

    if(npcWalking) {
        if (collisionCheck(npc, npcTarget)) {
            npcWalking = false
            if (npcTarget.type == 'l') {
                collectLoot(npcTarget) // collect loot
            }
            if (npcTarget.type == 'm') {
                fight(npcTarget) // fight mob
            }
        }
    }

    let blocked = checkSimWalls(dX, dY);

    if (!blocked.x) {
        npc.x += dX;
    }
    if (!blocked.y) {
        npc.y += dY;
    }


    // consume resources
    npc.hp <= 0 ? npc.hp = 0 : npc.hp -= 0.001
    npc.hunger <= 0 ? npc.hunger = 0 : npc.hunger -= 0.1

    // gain gold
    //npc.gold += 0.03
}

function npcSearch() {
    // NPC search
    let target = {x: null, y: null}
    let foundList = []
    lootList.forEach((elem, indx) => { // scan distances
        foundList.push({dist: dist(npc, elem), elem: elem})
    })
    monsterList.forEach((elem, indx) => { // scan distances
        foundList.push({dist: dist(elem, npc), elem: elem})
    })
    if (foundList.length > 0) {
        foundList.sort((a, b) => a.dist-b.dist) // sort to find min dist
        if (searchCheck(foundList[0].elem)) { // if in sight of npc
            target = Object.assign({}, foundList[0].elem)
        }
    }
    return target
}

function randomSimPos() {
    return {x: (8*random(0,15)), y: (8*random(0,6))+(8*1), type: 'p', radius: 4}
}

function spawnLoot() {
    let l = Object.assign({}, loot)
    let pos = randomSimPos()
    l.x = pos.x
    l.y = pos.y
    l.id = newID()
    lootList.push(l)
}

function spawnMonster() {
    let m = Object.assign({}, monster)
    let pos = randomSimPos()
    m.x = pos.x
    m.y = pos.y
    m.id = newID()
    monsterList.push(m)
}

function npcMoveTo(tx, ty) {
    let vx = tx - npc.x
    let vy = ty - npc.y
    let vel = norm(vx, vy, npc.speed)
    return [vel[0], vel[1]]
}

function checkSimWalls(dX, dY){
    let blocked = {x: false, y: false}
    if(npc.y+dY < (8*1) || npc.y+dY > (8*7)) {blocked.y = true} 
    if(npc.x+dX < (8*0) || npc.x+dX > (8*15)) {blocked.x = true} 
    return blocked
}

function dist(entA, entB) {
    let dx = entA.x - entB.x
    let dy = entA.y - entB.y
    let dist = mag(dx, dy)
    return dist
}

function mag(x, y) {
    return Math.sqrt(x*x + y*y)
}

function norm(x, y, newMag=1) {
    let m = 0
    let _x = x
    let _y = y
    if (!(x == 0 && y == 0)) {
        m = mag(x, y)
        _x = (x/m) * newMag
        _y = (y/m) * newMag
    }
    return [_x, _y]
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

function drawSim() {
    lootList.forEach((elem, indx) => {
        sprite(elem.sid, elem.x, elem.y)
    })
    monsterList.forEach((elem, indx) => {
        sprite(elem.sid, elem.x, elem.y)
    })

    //sprite(16, npcTarget.x, npcTarget.y) // debug: draw target pos
}

function drawGameOver() {
    // bg
    paper(0)
    rectf((8*3), (8*2), (8*10), (8*5))

    // message
    pen(1)
    print("Game Over", (8*4), (8*3))
    print("Press 'Action'", (8*4), (8*5))

    // border
    rect((8*3), (8*2), (8*10), (8*5))
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