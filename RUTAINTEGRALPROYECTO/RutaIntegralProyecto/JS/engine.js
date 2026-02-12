// ==============================================
// GAME ENGINE - Renderizado, cámara y game loop
// ==============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============================
// CONFIGURACIÓN DE PANTALLA
// ============================
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ============================
// CARGAR SPRITESHEET
// ============================
const spritesheet = new Image();
spritesheet.src = '../assets/img/tileset/Spritesheet/roguelikeSheet_transparent.png';

let spritesheetLoaded = false;
spritesheet.onload = () => {
    spritesheetLoaded = true;
    console.log('Spritesheet cargado correctamente');
};
spritesheet.onerror = () => {
    console.error('Error al cargar el spritesheet');
};

// ============================
// CARGAR SPRITE DEL PERSONAJE (del menú)
// ============================
const playerImg = new Image();
const selectedCharId = localStorage.getItem('selectedCharacter') || 'estudiante';

const charImgPaths = {
    'estudiante': '../assets/img/personajes/Male person/PNG/Poses/character_malePerson_idle.png',
    'matematico': '../assets/img/personajes/Female person/PNG/Poses/character_femalePerson_idle.png',
    'ingeniero': '../assets/img/personajes/Male adventurer/PNG/Poses/character_maleAdventurer_idle.png',
    'cientifico': '../assets/img/personajes/Female adventurer/PNG/Poses/character_femaleAdventurer_idle.png',
    'genio': '../assets/img/personajes/Zombie/PNG/Poses/character_zombie_idle.png',
    'robot': '../assets/img/personajes/Robot/PNG/Poses/character_robot_idle.png',
};
playerImg.src = charImgPaths[selectedCharId] || charImgPaths['estudiante'];

// ============================
// CÁMARA
// ============================
const camera = {
    x: 0,
    y: 0,

    // Seguir al jugador centrado
    follow(player) {
        this.x = player.x * TILE_SIZE * SCALE - canvas.width / 2 + (TILE_SIZE * SCALE) / 2;
        this.y = player.y * TILE_SIZE * SCALE - canvas.height / 2 + (TILE_SIZE * SCALE) / 2;

        // Para mapas pequeños (interiores), centrar el mapa en la pantalla
        const mapPixelW = MAP_WIDTH * TILE_SIZE * SCALE;
        const mapPixelH = MAP_HEIGHT * TILE_SIZE * SCALE;

        if (mapPixelW <= canvas.width) {
            // Mapa más angosto que la pantalla: centrar horizontalmente
            this.x = -(canvas.width - mapPixelW) / 2;
        } else {
            const maxX = mapPixelW - canvas.width;
            this.x = Math.max(0, Math.min(this.x, maxX));
        }

        if (mapPixelH <= canvas.height) {
            // Mapa más bajo que la pantalla: centrar verticalmente
            this.y = -(canvas.height - mapPixelH) / 2;
        } else {
            const maxY = mapPixelH - canvas.height;
            this.y = Math.max(0, Math.min(this.y, maxY));
        }
    }
};

// ============================
// JUGADOR
// ============================
const player = {
    x: PLAYER_START.x,
    y: PLAYER_START.y,
    targetX: PLAYER_START.x,
    targetY: PLAYER_START.y,
    speed: 0.08,       // Velocidad de interpolación
    moving: false,
    direction: 'down',  // up, down, left, right

    update() {
        // Interpolación suave hacia la posición objetivo
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.02) {
            this.x += dx * this.speed * 3;
            this.y += dy * this.speed * 3;
            this.moving = true;
        } else {
            this.x = this.targetX;
            this.y = this.targetY;
            this.moving = false;
        }
    },

    tryMove(dx, dy) {
        if (this.moving) return; // No mover si está en transición

        const newX = this.targetX + dx;
        const newY = this.targetY + dy;

        // Dirección visual
        if (dx > 0) this.direction = 'right';
        else if (dx < 0) this.direction = 'left';
        else if (dy > 0) this.direction = 'down';
        else if (dy < 0) this.direction = 'up';

        // Verificar límites del mapa
        if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) return;

        // Verificar colisiones
        if (mapCollision[newY][newX] === COLLISION_TYPES.SOLID) return;

        // Verificar interacción
        if (mapCollision[newY][newX] === COLLISION_TYPES.INTERACTIVE) {
            const consumed = handleInteraction(newX, newY);
            if (consumed) return; // La interacción teleportó al jugador, no mover
        }

        this.targetX = newX;
        this.targetY = newY;
    }
};


let interactionMessage = '';
let interactionTimer = 0;

function showDialogue(title, body) {
    gameState.showingDialogue = true;
    gameState.dialogueTitle = title;
    gameState.dialogueBody = body;
}

function closeDialogue() {
    gameState.showingDialogue = false;
    gameState.dialogueTitle = '';
    gameState.dialogueBody = '';
}



function handleInteraction(x, y) {

    // === INTERACCIÓN CON NPC ===
    if (window.npcs) {
        for (const npc of window.npcs) {
            if (npc.x === x && npc.y === y) {
                handleNpcInteraction(npc);
                return true; // consume la interacción
            }
        }
    }


    // Si estamos en interior y pisamos la puerta de salida
    if (gameState.isIndoors) {
        const interior = interiorMaps[gameState.currentInterior];
        if (interior && y === interior.height - 1 && x === Math.floor(interior.width / 2)) {
            exitInterior();
            return true; // Consumido: teleport
        }
    }

    // Buscar si es la puerta de un edificio (exterior)
    if (!gameState.isIndoors && window.buildingLabels) {
        for (const bld of window.buildingLabels) {
            for (let h = 2; h <= 4; h++) {
                const dy = bld.y + h - 1;
                const ddx = bld.x + Math.floor(bld.width / 2);
                if (x === ddx && y === dy) {
                    // Entrar a la escena del crimen
                    if (bld.label === 'ESCENA DEL CRIMEN') {
                        enterInterior('crimeScene');
                        return true; // Consumido: teleport
                    }
                    // Entrar a la comisaría
                    if (bld.label === 'COMISARÍA') {
                        enterInterior('comisaria');
                        return true;
                    }
                    // Entrar a los apartamentos
                    if (bld.label === 'APARTAMENTOS') {
                        enterInterior('apartamentos');
                        return true;
                    }
                    // Entrar al restaurante
                    if (bld.label === 'RESTAURANTE') {
                        enterInterior('restaurante');
                        return true;
                    }
                    // Entrar al hospital
                    if (bld.label === 'HOSPITAL') {
                        enterInterior('hospital');
                        return true;
                    }
                    // Entrar a la casa sospechosa
                    if (bld.label === 'CASA ???') {
                        enterInterior('casa');
                        return true;
                    }
                    // Entrar a la biblioteca
                    if (bld.label === 'BIBLIOTECA') {
                        enterInterior('biblioteca');
                        return true;
                    }
                    interactionMessage = `📍 ${bld.label}`;
                    interactionTimer = 180;
                    return false;
                }
            }
        }
    }
    interactionMessage = '🔍 Lugar de interés...';
    interactionTimer = 120;
    return false;
}
function handleNpcInteraction(npc) {
    // ETAPA 0: Primera vez - Manda a la biblioteca
    if (gameState.caseStage === 0) {
        showDialogue(
            'TESTIGO: DON ROBERTO',
            'Detective… esto no es un robo cualquiera.\n\n' +
            'Anoche vi a alguien salir apresurado, mirando hacia todos lados.\n' +
            'No pude verle bien el rostro, pero dejó caer algo.\n\n' +
            'Si quiere empezar por algún lado… revise la BIBLIOTECA.\n' +
            'Ahí siempre se esconden cosas que la gente no quiere que se vean.'
        );

        enableRiddleById(3); // biblioteca
        gameState.caseStage = 1;
        return;
    }

    // ETAPA 1: Esperando que resuelva biblioteca
    if (gameState.caseStage === 1 && !RIDDLES.find(r => r.id === 3).solved) {
        showDialogue(
            'DON ROBERTO',
            'Siga la pista, detective.\n\n' +
            'La BIBLIOTECA es el primer paso.\n' +
            'Cuando resuelva eso… vuelva conmigo.'
        );
        return;
    }
    
    // ETAPA 2: Resolvió biblioteca → va al HOSPITAL
    if (gameState.caseStage === 1 && RIDDLES.find(r => r.id === 3).solved) {
        showDialogue(
            'DON ROBERTO',
            '¡Excelente trabajo, detective!\n\n' +
            'Esa pista confirma mis sospechas.\n' +
            'Ahora vaya al HOSPITAL.\n' +
            'Allí encontrará algo crucial.'
        );
        
        enableRiddleById(6); // hospital
        gameState.caseStage = 2;
        return;
    }

    // ETAPA 3: Esperando que resuelva hospital
    if (gameState.caseStage === 2 && !RIDDLES.find(r => r.id === 6).solved) {
        showDialogue(
            'DON ROBERTO',
            'Vaya al HOSPITAL, detective.\n\n' +
            'No pierda tiempo.'
        );
        return;
    }

    // ETAPA 4: Resolvió hospital → va a COMISARÍA
    if (gameState.caseStage === 2 && RIDDLES.find(r => r.id === 6).solved) {
        showDialogue(
            'DON ROBERTO',
            'Esa pista es muy valiosa.\n\n' +
            'Ahora necesita revisar los archivos en la COMISARÍA.\n' +
            'Busque con cuidado.'
        );
        
        enableRiddleById(1); // comisaría
        gameState.caseStage = 3;
        return;
    }

    // ETAPA 5: Esperando que resuelva comisaría
    if (gameState.caseStage === 3 && !RIDDLES.find(r => r.id === 1).solved) {
        showDialogue(
            'DON ROBERTO',
            'La COMISARÍA tiene información vital.\n\n' +
            'Revise bien.'
        );
        return;
    }

    // ETAPA 6: Resolvió comisaría → va a APARTAMENTOS
    if (gameState.caseStage === 3 && RIDDLES.find(r => r.id === 1).solved) {
        showDialogue(
            'DON ROBERTO',
            'Interesante… muy interesante.\n\n' +
            'Ahora vaya a los APARTAMENTOS.\n' +
            'Hay algo que debe encontrar ahí.'
        );
        
        enableRiddleById(4); // apartamentos
        gameState.caseStage = 4;
        return;
    }

    // ETAPA 7: Esperando que resuelva apartamentos
    if (gameState.caseStage === 4 && !RIDDLES.find(r => r.id === 4).solved) {
        showDialogue(
            'DON ROBERTO',
            'Los APARTAMENTOS guardan secretos.\n\n' +
            'Encuentre la pista.'
        );
        return;
    }

    // ETAPA 8: Resolvió apartamentos → va al RESTAURANTE
    if (gameState.caseStage === 4 && RIDDLES.find(r => r.id === 4).solved) {
        showDialogue(
            'DON ROBERTO',
            'Excelente trabajo.\n\n' +
            'Ahora vaya al RESTAURANTE.\n' +
            'La última pista lo espera ahí.'
        );
        
        enableRiddleById(5); // restaurante
        gameState.caseStage = 5;
        return;
    }

    // ETAPA 9: Esperando que resuelva restaurante
    if (gameState.caseStage === 5 && !RIDDLES.find(r => r.id === 5).solved) {
        showDialogue(
            'DON ROBERTO',
            'El RESTAURANTE es su última parada.\n\n' +
            'Encuentre la pista final.'
        );
        return;
    }

    // ETAPA 10: Resolvió restaurante → va a ESCENA DEL CRIMEN (final)
    if (gameState.caseStage === 5 && RIDDLES.find(r => r.id === 5).solved) {
        showDialogue(
            'DON ROBERTO',
            '¡Lo ha logrado, detective!\n\n' +
            'Ahora tiene todas las pistas.\n' +
            'Vaya a la ESCENA DEL CRIMEN y resuelva el caso final.'
        );
        
        enableRiddleById(2); // escena del crimen
        gameState.caseStage = 6;
        return;
    }

    // ETAPA 11: Esperando que resuelva escena del crimen
    if (gameState.caseStage === 6 && !RIDDLES.find(r => r.id === 2).solved) {
        showDialogue(
            'DON ROBERTO',
            'La ESCENA DEL CRIMEN tiene la respuesta final.\n\n' +
            '¡Termine el caso!'
        );
        return;
    }

    // ETAPA FINAL: Todo resuelto
    if (gameState.caseStage === 6 && RIDDLES.find(r => r.id === 2).solved) {
        showDialogue(
            'DON ROBERTO',
            '¡FELICIDADES, DETECTIVE!\n\n' +
            'Ha resuelto el caso.\n' +
            'El asesino es CARLOS MENDEZ.'
        );
        return;
    }
}


// ============================
// SISTEMA DE INTERIORES
// ============================
// Backup del mapa exterior
let outdoorMapFloor = null;
let outdoorMapObjects = null;
let outdoorMapCollision = null;
let outdoorMapWidth = 0;
let outdoorMapHeight = 0;

function enterInterior(interiorId) {
    const interior = interiorMaps[interiorId];
    if (!interior) return;

    // Guardar posición exterior
    gameState.outdoorPos = { x: player.targetX, y: player.targetY };

    // Backup de las capas exteriores
    outdoorMapFloor = mapFloor.map(r => [...r]);
    outdoorMapObjects = mapObjects.map(r => [...r]);
    outdoorMapCollision = mapCollision.map(r => [...r]);
    outdoorMapWidth = MAP_WIDTH;
    outdoorMapHeight = MAP_HEIGHT;

    // Reemplazar capas con el interior
    mapFloor.length = 0;
    mapObjects.length = 0;
    mapCollision.length = 0;
    for (let y = 0; y < interior.height; y++) {
        mapFloor[y] = [...interior.floor[y]];
        mapObjects[y] = [...interior.objects[y]];
        mapCollision[y] = [...interior.collision[y]];
    }

    // Cambiar dimensiones
    // Usamos variables globales window para que render() las vea
    window._MAP_WIDTH = MAP_WIDTH;
    window._MAP_HEIGHT = MAP_HEIGHT;
    MAP_WIDTH = interior.width;
    MAP_HEIGHT = interior.height;

    // Mover jugador a la entrada interior
    player.x = interior.playerStart.x;
    player.y = interior.playerStart.y;
    player.targetX = interior.playerStart.x;
    player.targetY = interior.playerStart.y;
    player.direction = 'up';

    gameState.isIndoors = true;
    gameState.currentInterior = interiorId;

    interactionMessage = `🏠 ${interior.label}`;
    interactionTimer = 150;
}

function exitInterior() {
    const interior = interiorMaps[gameState.currentInterior];

    // Restaurar mapa exterior
    mapFloor.length = 0;
    mapObjects.length = 0;
    mapCollision.length = 0;
    for (let y = 0; y < outdoorMapHeight; y++) {
        mapFloor[y] = [...outdoorMapFloor[y]];
        mapObjects[y] = [...outdoorMapObjects[y]];
        mapCollision[y] = [...outdoorMapCollision[y]];
    }

    MAP_WIDTH = outdoorMapWidth;
    MAP_HEIGHT = outdoorMapHeight;

    // Posición fuera del edificio
    const exitPos = interior ? interior.outsideDoor : gameState.outdoorPos;
    player.x = exitPos.x;
    player.y = exitPos.y;
    player.targetX = exitPos.x;
    player.targetY = exitPos.y;
    player.direction = 'down';

    gameState.isIndoors = false;
    gameState.currentInterior = null;

    interactionMessage = '🚪 Saliste del edificio';
    interactionTimer = 120;
}

// ============================
// CONTROLES (teclado)
// ============================
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    // Manejar input de acertijos
    if (gameState.showingFinale || gameState.gameComplete) {
        if (e.key === 'Enter' || e.key === ' ') {
            if (gameState.showingFinale) {
                gameState.showingFinale = false;
                gameState.gameComplete = true;
            } else {
                // Volver al menú
                window.location.href = '../index.html';
            }
        }
        e.preventDefault();
        return;
    }
    if (gameState.showingResult) {
        if (e.key === 'Enter' || e.key === ' ') {
            closeResult();
        }
        e.preventDefault();
        return;
    }
    if (gameState.activeRiddle !== null) {
        // Seleccionar opción con teclas 1-4 o a-d
        if (e.key === '1' || e.key === 'a' || e.key === 'A') selectRiddleOption(0);
        else if (e.key === '2' || e.key === 'b' || e.key === 'B') selectRiddleOption(1);
        else if (e.key === '3' || e.key === 'c' || e.key === 'C') selectRiddleOption(2);
        else if (e.key === '4' || e.key === 'd' || e.key === 'D') selectRiddleOption(3);
        e.preventDefault();
        return;
    }
    e.preventDefault();
    
    // ✨ Interacción con E (hablar / entrar / usar) - MODIFICADO
    if (e.key === 'e' || e.key === 'E') {
        // Primero, intentar interactuar con NPC cercano (sin importar dirección)
        if (tryInteractWithNearbyNPC()) {
            e.preventDefault();
            return;
        }
        
        // Si no hay NPC cerca, usar la interacción direccional normal (puertas, etc.)
        const front = getFrontTile(player.x, player.y, player.direction);
        handleInteraction(front.x, front.y);
        e.preventDefault();
        return;
    }
    
    if (gameState.showingDialogue) {
        if (e.key === 'Enter' || e.key === 'b' || e.key === 'B') {
            closeDialogue();
        }
        e.preventDefault();
        return;
    }
});

function getFrontTile(px, py, dir) {
    let x = px, y = py;
    if (dir === 'up') y--;
    else if (dir === 'down') y++;
    else if (dir === 'left') x--;
    else if (dir === 'right') x++;
    return { x, y };
}

// ✨ NUEVA FUNCIÓN - Buscar e interactuar con NPC cercano
function tryInteractWithNearbyNPC() {
    if (!window.npcs) return false;
    
    const px = Math.round(player.x);
    const py = Math.round(player.y);
    
    // Buscar NPC en las 8 casillas adyacentes + la casilla actual
    const searchOffsets = [
        {dx: 0, dy: 0},   // misma casilla
        {dx: -1, dy: 0},  // izquierda
        {dx: 1, dy: 0},   // derecha
        {dx: 0, dy: -1},  // arriba
        {dx: 0, dy: 1},   // abajo
        {dx: -1, dy: -1}, // diagonal superior izquierda
        {dx: 1, dy: -1},  // diagonal superior derecha
        {dx: -1, dy: 1},  // diagonal inferior izquierda
        {dx: 1, dy: 1}    // diagonal inferior derecha
    ];
    
    // Buscar NPC en cada posición
    for (const offset of searchOffsets) {
        const checkX = px + offset.dx;
        const checkY = py + offset.dy;
        
        for (const npc of window.npcs) {
            if (npc.x === checkX && npc.y === checkY) {
                // ¡Encontramos un NPC cercano!
                handleNpcInteraction(npc);
                return true; // Interacción exitosa
            }
        }
    }
    
    return false; // No hay NPCs cerca
}

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Click/tap para seleccionar opciones del acertijo
canvas.addEventListener('click', (e) => {
    if (gameState.showingFinale) {
        gameState.showingFinale = false;
        gameState.gameComplete = true;
        return;
    }
    if (gameState.gameComplete) {
        window.location.href = '../index.html';
        return;
    }
    if (gameState.showingResult) {
        closeResult();
        return;
    }
    if (gameState.activeRiddle !== null) {
        // Detectar click en opciones
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const cw = canvas.width;
        const ch = canvas.height;
        const panelW = Math.min(600, cw - 40);
        const panelX = (cw - panelW) / 2;
        const optionStartY = ch / 2 - 20;
        const optionH = 45;

        for (let i = 0; i < 4; i++) {
            const oy = optionStartY + i * optionH;
            if (clickX >= panelX + 20 && clickX <= panelX + panelW - 20 &&
                clickY >= oy && clickY <= oy + optionH - 5) {
                selectRiddleOption(i);
                break;
            }
        }
    }
});

// Intervalo de movimiento (para que no sea instantáneo)
let moveTimer = 0;
const MOVE_DELAY = 8; // Frames entre movimientos

function handleInput() {
    // Bloquear movimiento si hay un acertijo o pantalla activa
    if (gameState.activeRiddle !== null || gameState.showingResult || gameState.showingFinale || gameState.gameComplete) return;

    if (moveTimer > 0) {
        moveTimer--;
        return;
    }

    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        player.tryMove(0, -1);
        moveTimer = MOVE_DELAY;
    } else if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        player.tryMove(0, 1);
        moveTimer = MOVE_DELAY;
    } else if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.tryMove(-1, 0);
        moveTimer = MOVE_DELAY;
    } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.tryMove(1, 0);
        moveTimer = MOVE_DELAY;
    }

    // Chequear si el jugador pisó un marcador de evidencia
    checkForRiddle(player.targetX, player.targetY);
}

function checkForRiddle(px, py) {
    for (const riddle of RIDDLES) {

        if (!gameState.enabledRiddleIds.includes(riddle.id)) continue;
        if (riddle.solved) continue;

        if (
            gameState.isIndoors &&
            gameState.currentInterior === riddle.interior &&
            riddle.x === px &&
            riddle.y === py
        ) {
            gameState.activeRiddle = riddle;
            break;
        }
    }
}



function selectRiddleOption(optionIndex) {
    if (gameState.activeRiddle === null) return;
    const riddle = gameState.activeRiddle;

    // La respuesta correcta siempre es 'a' (index 0)
    if (optionIndex === 0) {
        riddle.solved = true;
        gameState.riddlesSolved++;
        gameState.cluesFound.push(riddle.clueText);
        gameState.resultCorrect = true;
        // Quitar marcador del mapa
        mapObjects[riddle.y][riddle.x] = T.EMPTY;
    } else {
        gameState.resultCorrect = false;
    }
    gameState.showingResult = true;
}

function closeResult() {
    gameState.showingResult = false;
    if (gameState.resultCorrect) {
        gameState.activeRiddle = null;
        // Verificar si se completaron todos
        if (gameState.riddlesSolved >= gameState.totalRiddles) {
            gameState.showingFinale = true;
        }
    }
    // Si fue incorrecto, el acertijo sigue activo para reintentarlo
}

// ============================
// CONTROLES TÁCTILES
// ============================
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 10) return; // Ignorar taps muy pequeños

    if (absDx > absDy) {
        player.tryMove(dx > 0 ? 1 : -1, 0);
    } else {
        player.tryMove(0, dy > 0 ? 1 : -1);
    }
    e.preventDefault();
}, { passive: false });

// ============================
// RENDERIZADO
// ============================

// Colores de respaldo para cada tipo de tile
const TILE_COLORS = {};
TILE_COLORS[T.GRASS] = '#3a7d22';
TILE_COLORS[T.GRASS2] = '#4a8d32';
TILE_COLORS[T.GRASS3] = '#2e6a18';
TILE_COLORS[T.DIRT] = '#8b7355';
TILE_COLORS[T.DIRT2] = '#9a8265';
TILE_COLORS[T.ROAD_H] = '#505050';
TILE_COLORS[T.ROAD_V] = '#505050';
TILE_COLORS[T.ROAD_CROSS] = '#585858';
TILE_COLORS[T.SIDEWALK] = '#b0a898';
TILE_COLORS[T.ROAD_TL] = '#505050';
TILE_COLORS[T.ROAD_TR] = '#505050';
TILE_COLORS[T.ROAD_BL] = '#505050';
TILE_COLORS[T.ROAD_BR] = '#505050';
TILE_COLORS[T.WALL] = '#7a5636';
TILE_COLORS[T.WALL2] = '#8a6640';
TILE_COLORS[T.DOOR] = '#c68c3c';
TILE_COLORS[T.WINDOW] = '#7a5636';
TILE_COLORS[T.ROOF] = '#8B2020';
TILE_COLORS[T.ROOF2] = '#a02828';
TILE_COLORS[T.BRICKS] = '#9b6e4c';
TILE_COLORS[T.BRICKS2] = '#a87e5c';
TILE_COLORS[T.TREE] = '#3a7d22';
TILE_COLORS[T.TREE2] = '#4a8d32';
TILE_COLORS[T.BENCH] = '#8B6914';
TILE_COLORS[T.LAMP] = '#b0a898';
TILE_COLORS[T.TRASH] = '#666666';
TILE_COLORS[T.HYDRANT] = '#dd2222';
TILE_COLORS[T.MAILBOX] = '#2255cc';
TILE_COLORS[T.SIGN] = '#dddddd';
TILE_COLORS[T.CAR_T] = '#cc3333';
TILE_COLORS[T.CAR_B] = '#cc3333';
TILE_COLORS[T.POLICE_CAR] = '#1144cc';
TILE_COLORS[T.CRIME_TAPE] = '#ffdd00';
TILE_COLORS[T.CHALK_OUTLINE] = '#ffffff';
TILE_COLORS[T.CONE] = '#ff6600';
// Interior tiles
TILE_COLORS[T.FLOOR_WOOD] = '#8B6B4A';
TILE_COLORS[T.FLOOR_TILE] = '#9E9E8E';
TILE_COLORS[T.WALL_INT] = '#5C4033';
TILE_COLORS[T.WALL_INT2] = '#6B4E3D';
TILE_COLORS[T.COUNTER] = '#6B5040';
TILE_COLORS[T.SHELF] = '#7A6050';
TILE_COLORS[T.TABLE] = '#5C3D2E';
TILE_COLORS[T.CHAIR] = '#8B6914';
TILE_COLORS[T.BLOOD] = '#5a0000';
TILE_COLORS[T.BLOOD2] = '#7a1111';
TILE_COLORS[T.BROKEN_GLASS] = '#aabbcc';
TILE_COLORS[T.OVERTURNED] = '#7A6050';
TILE_COLORS[T.KNIFE] = '#cccccc';
TILE_COLORS[T.PAPER] = '#f0e8d0';
TILE_COLORS[T.CASH_REGISTER] = '#556655';
TILE_COLORS[T.DOOR_INT] = '#c68c3c';
TILE_COLORS[T.RUG] = '#8B3A3A';
TILE_COLORS[T.LAMP_INT] = '#d4c090';
TILE_COLORS[T.PLANT_INT] = '#3a7d22';
TILE_COLORS[T.FOOTPRINT] = '#3a2010';
TILE_COLORS[T.MARKER_NUM] = '#ffcc00';
// Comisaría tiles
TILE_COLORS[T.DESK] = '#6B5040';
TILE_COLORS[T.FILING_CABINET] = '#707878';
TILE_COLORS[T.BULLETIN_BOARD] = '#C4A46C';
TILE_COLORS[T.JAIL_BARS] = '#555555';
TILE_COLORS[T.JAIL_FLOOR] = '#6a6a6a';
TILE_COLORS[T.BENCH_INT] = '#777777';
TILE_COLORS[T.COFFEE_MACHINE] = '#333333';
TILE_COLORS[T.WANTED_POSTER] = '#e8d8a0';
TILE_COLORS[T.COMPUTER] = '#6B5040';
TILE_COLORS[T.RADIO] = '#6B5040';
TILE_COLORS[T.WHITEBOARD] = '#f0f0f0';
TILE_COLORS[T.CLOCK] = '#5C4033';
TILE_COLORS[T.FLAG] = '#5C4033';
// Apartment tiles
TILE_COLORS[T.BED] = '#8B4513';
TILE_COLORS[T.STOVE] = '#444444';
TILE_COLORS[T.FRIDGE] = '#d0d0d0';
TILE_COLORS[T.TV] = '#111111';
TILE_COLORS[T.SOFA] = '#6B4226';
TILE_COLORS[T.SINK] = '#b0b0b0';
TILE_COLORS[T.PICTURE] = '#5C4033';
TILE_COLORS[T.BOOKSHELF] = '#5C3D2E';
TILE_COLORS[T.STAIRS] = '#7a7a7a';
TILE_COLORS[T.WALL_DIV] = '#6B5040';
TILE_COLORS[T.DOOR_APT] = '#a07020';
TILE_COLORS[T.CARPET] = '#8B7355';
TILE_COLORS[T.TOWEL] = '#5C4033';
// Restaurant tiles
TILE_COLORS[T.BAR_COUNTER] = '#4A3020';
TILE_COLORS[T.BAR_STOOL] = '#555555';
TILE_COLORS[T.WINE_RACK] = '#3C2415';
TILE_COLORS[T.MENU_BOARD] = '#2a2a2a';
TILE_COLORS[T.PLATES] = '#5C3D2E';
TILE_COLORS[T.KITCHEN_HOOD] = '#888888';
TILE_COLORS[T.FLOOR_CHECKER] = '#ddd8c8';
TILE_COLORS[T.CANDLE] = '#5C3D2E';
TILE_COLORS[T.HOSPITAL_BED] = '#e8e8f0';
TILE_COLORS[T.CURTAIN] = '#a8d8ea';
TILE_COLORS[T.MEDICINE_CABINET] = '#f0f0f0';
TILE_COLORS[T.IV_STAND] = '#c0c0c0';
TILE_COLORS[T.MONITOR] = '#2a2a3a';
TILE_COLORS[T.STRETCHER] = '#d0d8e0';
TILE_COLORS[T.RECEPTION_DESK] = '#5a8abf';
TILE_COLORS[T.WHEELCHAIR] = '#555555';
TILE_COLORS[T.MEDICAL_CROSS] = '#cc2222';
TILE_COLORS[T.FLOOR_HOSPITAL] = '#e4e8e0';
TILE_COLORS[T.FLOOR_DARK] = '#3a3530';
TILE_COLORS[T.WALL_DARK] = '#4a4540';
TILE_COLORS[T.COBWEB] = '#3a3530';
TILE_COLORS[T.BARREL] = '#6b4226';
TILE_COLORS[T.CRATE] = '#7a6030';
TILE_COLORS[T.CANDELABRA] = '#3a3530';
TILE_COLORS[T.NEWSPAPER] = '#c8b888';
TILE_COLORS[T.ROPE] = '#8b7355';
TILE_COLORS[T.MIRROR] = '#708090';
TILE_COLORS[T.FIREPLACE] = '#5a3020';
TILE_COLORS[T.TROPHY] = '#b8960c';
TILE_COLORS[T.BOOKSHELF_TALL] = '#5a3a1e';
TILE_COLORS[T.READING_DESK] = '#6b4e2e';
TILE_COLORS[T.GLOBE] = '#3080a0';
TILE_COLORS[T.STUDY_LAMP] = '#6b4e2e';
TILE_COLORS[T.CARD_CATALOG] = '#7a6040';
TILE_COLORS[T.FLOOR_CARPET] = '#7a4040';
TILE_COLORS[T.BOOK_PILE] = '#6b4e2e';
TILE_COLORS[T.ATLAS] = '#c8b888';
TILE_COLORS[T.ARMCHAIR] = '#6b3030';

function drawTile(tileId, screenX, screenY) {
    if (tileId === T.EMPTY || tileId < 0) return;

    const tileSize = TILE_SIZE * SCALE;

    // ====== MARCADOR DE EVIDENCIA (pulsante) ======
    if (tileId === T.EVIDENCE) {
        const pulse = (Math.sin(Date.now() / 300) + 1) / 2; // 0 a 1
        const glowAlpha = 0.3 + pulse * 0.4;

        // Glow de fondo
        ctx.fillStyle = `rgba(255, 204, 0, ${glowAlpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(screenX + tileSize / 2, screenY + tileSize / 2, tileSize * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Sobre / evidencia
        ctx.fillStyle = `rgba(255, 204, 0, ${0.7 + pulse * 0.3})`;
        ctx.fillRect(screenX + tileSize * 0.2, screenY + tileSize * 0.3, tileSize * 0.6, tileSize * 0.4);

        // Triángulo del sobre
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize * 0.2, screenY + tileSize * 0.3);
        ctx.lineTo(screenX + tileSize * 0.5, screenY + tileSize * 0.55);
        ctx.lineTo(screenX + tileSize * 0.8, screenY + tileSize * 0.3);
        ctx.fillStyle = `rgba(220, 170, 0, ${0.7 + pulse * 0.3})`;
        ctx.fill();

        // Signo de exclamación flotante
        const floatY = Math.sin(Date.now() / 400) * 4;
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#ff4444';
        ctx.textAlign = 'center';
        ctx.fillText('❗', screenX + tileSize / 2, screenY + floatY);
        ctx.textAlign = 'left';
        return;
    }

    // Renderizado con colores y formas detalladas
    const color = TILE_COLORS[tileId] || '#333';
    ctx.fillStyle = color;
    ctx.fillRect(screenX, screenY, tileSize, tileSize);

    // ====== DETALLES VISUALES POR TIPO DE TILE ======

    if (tileId === T.GRASS || tileId === T.GRASS2 || tileId === T.GRASS3) {
        // Briznas de pasto aleatorias (basadas en posición para consistencia)
        const seed = (screenX * 7 + screenY * 13) & 0xFF;
        ctx.fillStyle = tileId === T.GRASS2 ? '#5aa842' : '#2f6d1a';
        for (let i = 0; i < 4; i++) {
            const bx = ((seed + i * 37) % (tileSize - 6)) + 3;
            const by = ((seed + i * 53) % (tileSize - 6)) + 3;
            ctx.fillRect(screenX + bx, screenY + by, 2, 3);
        }
    } else if (tileId === T.SIDEWALK) {
        // Acera con líneas de separación
        ctx.strokeStyle = '#9a9282';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2);
        // Grietas sutiles
        ctx.strokeStyle = '#a09888';
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize / 2, screenY);
        ctx.lineTo(screenX + tileSize / 2, screenY + tileSize);
        ctx.stroke();
    } else if (tileId === T.ROAD_H) {
        // Carretera horizontal con línea central discontinua
        ctx.fillStyle = '#ffdd44';
        const dashLen = 12;
        const gapLen = 8;
        const offsetX = screenX % (dashLen + gapLen);
        for (let dx = -offsetX; dx < tileSize; dx += dashLen + gapLen) {
            ctx.fillRect(screenX + Math.max(0, dx), screenY + tileSize / 2 - 1,
                Math.min(dashLen, tileSize - Math.max(0, dx)), 2);
        }
    } else if (tileId === T.ROAD_V) {
        // Carretera vertical con línea central discontinua
        ctx.fillStyle = '#ffdd44';
        const dashLen = 12;
        const gapLen = 8;
        const offsetY = screenY % (dashLen + gapLen);
        for (let dy = -offsetY; dy < tileSize; dy += dashLen + gapLen) {
            ctx.fillRect(screenX + tileSize / 2 - 1, screenY + Math.max(0, dy),
                2, Math.min(dashLen, tileSize - Math.max(0, dy)));
        }
    } else if (tileId === T.ROAD_CROSS) {
        // Cruce con marcas
        ctx.fillStyle = '#ffdd44';
        ctx.fillRect(screenX, screenY + tileSize / 2 - 1, tileSize, 2);
        ctx.fillRect(screenX + tileSize / 2 - 1, screenY, 2, tileSize);
    } else if (tileId === T.DOOR) {
        // Puerta detallada
        ctx.fillStyle = '#a07020';
        const dw = tileSize * 0.5;
        const dh = tileSize * 0.75;
        const dx = screenX + (tileSize - dw) / 2;
        const dy = screenY + tileSize - dh;
        ctx.fillRect(dx, dy, dw, dh);
        // Marco
        ctx.strokeStyle = '#6a4a10';
        ctx.lineWidth = 2;
        ctx.strokeRect(dx, dy, dw, dh);
        // Perilla
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(dx + dw * 0.75, dy + dh * 0.55, 3, 0, Math.PI * 2);
        ctx.fill();
        // Arco superior
        ctx.strokeStyle = '#6a4a10';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dx + dw / 2, dy, dw / 2, Math.PI, 0);
        ctx.stroke();
    } else if (tileId === T.WINDOW) {
        // Pared con ventana
        ctx.fillStyle = '#7a5636';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Ventana
        const wm = 8;
        ctx.fillStyle = '#aaddff';
        ctx.fillRect(screenX + wm, screenY + wm, tileSize - wm * 2, tileSize - wm * 2);
        // Marco de ventana
        ctx.strokeStyle = '#5a3a1a';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX + wm, screenY + wm, tileSize - wm * 2, tileSize - wm * 2);
        // Cruz
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize / 2, screenY + wm);
        ctx.lineTo(screenX + tileSize / 2, screenY + tileSize - wm);
        ctx.moveTo(screenX + wm, screenY + tileSize / 2);
        ctx.lineTo(screenX + tileSize - wm, screenY + tileSize / 2);
        ctx.stroke();
        // Brillo
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(screenX + wm + 2, screenY + wm + 2, 6, 6);
    } else if (tileId === T.WALL || tileId === T.WALL2) {
        // Pared con textura de ladrillos
        ctx.strokeStyle = tileId === T.WALL ? '#5a3a1a' : '#6a4a2a';
        ctx.lineWidth = 1;
        for (let by = 0; by < tileSize; by += 8) {
            const offset = (by % 16 === 0) ? 0 : tileSize / 3;
            for (let bx = offset; bx < tileSize; bx += tileSize * 0.45) {
                ctx.strokeRect(screenX + bx + 1, screenY + by + 1, tileSize * 0.4, 6);
            }
        }
    } else if (tileId === T.ROOF || tileId === T.ROOF2) {
        // Techo con textura
        const roofColor2 = tileId === T.ROOF ? '#6a1515' : '#801818';
        ctx.fillStyle = roofColor2;
        // Tejas
        for (let ty = 0; ty < tileSize; ty += 8) {
            const off = (ty % 16 === 0) ? 0 : 10;
            for (let tx = off; tx < tileSize; tx += 20) {
                ctx.fillRect(screenX + tx, screenY + ty, 18, 6);
            }
        }
        // Borde inferior
        ctx.fillStyle = '#4a0a0a';
        ctx.fillRect(screenX, screenY + tileSize - 3, tileSize, 3);
    } else if (tileId === T.TREE || tileId === T.TREE2) {
        // Árbol con tronco y copa
        // Tronco
        ctx.fillStyle = '#6b4226';
        ctx.fillRect(screenX + tileSize * 0.38, screenY + tileSize * 0.55, tileSize * 0.24, tileSize * 0.45);
        // Copa (3 círculos)
        const treeGreen = tileId === T.TREE ? '#1a7a1a' : '#2a8a2a';
        const treeGreen2 = tileId === T.TREE ? '#0d6a0d' : '#1d7a1d';
        ctx.fillStyle = treeGreen2;
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.35, screenY + tileSize * 0.42, tileSize * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.65, screenY + tileSize * 0.42, tileSize * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = treeGreen;
        ctx.beginPath();
        ctx.arc(screenX + tileSize / 2, screenY + tileSize * 0.28, tileSize * 0.32, 0, Math.PI * 2);
        ctx.fill();
    } else if (tileId === T.LAMP) {
        // Farola
        ctx.fillStyle = '#777';
        ctx.fillRect(screenX + tileSize * 0.45, screenY + tileSize * 0.25, tileSize * 0.1, tileSize * 0.75);
        // Base
        ctx.fillRect(screenX + tileSize * 0.35, screenY + tileSize * 0.88, tileSize * 0.3, tileSize * 0.12);
        // Luz
        ctx.fillStyle = '#ffee55';
        ctx.beginPath();
        ctx.arc(screenX + tileSize / 2, screenY + tileSize * 0.2, 7, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.fillStyle = 'rgba(255,238,80,0.15)';
        ctx.beginPath();
        ctx.arc(screenX + tileSize / 2, screenY + tileSize * 0.2, 14, 0, Math.PI * 2);
        ctx.fill();
    } else if (tileId === T.HYDRANT) {
        // Hidrante
        ctx.fillStyle = '#cc1111';
        ctx.fillRect(screenX + tileSize * 0.32, screenY + tileSize * 0.3, tileSize * 0.36, tileSize * 0.6);
        // Cabeza
        ctx.fillRect(screenX + tileSize * 0.28, screenY + tileSize * 0.25, tileSize * 0.44, tileSize * 0.15);
        // Tapa superior
        ctx.fillStyle = '#aa0000';
        ctx.fillRect(screenX + tileSize * 0.36, screenY + tileSize * 0.15, tileSize * 0.28, tileSize * 0.12);
        // Brazos
        ctx.fillRect(screenX + tileSize * 0.2, screenY + tileSize * 0.45, tileSize * 0.6, tileSize * 0.1);
    } else if (tileId === T.POLICE_CAR) {
        // Patrulla de policía
        // Cuerpo
        ctx.fillStyle = '#1144cc';
        ctx.fillRect(screenX + tileSize * 0.1, screenY + tileSize * 0.25, tileSize * 0.8, tileSize * 0.5);
        // Techo
        ctx.fillStyle = '#0d3399';
        ctx.fillRect(screenX + tileSize * 0.25, screenY + tileSize * 0.15, tileSize * 0.5, tileSize * 0.2);
        // Ventanas
        ctx.fillStyle = '#88bbff';
        ctx.fillRect(screenX + tileSize * 0.28, screenY + tileSize * 0.18, tileSize * 0.18, tileSize * 0.12);
        ctx.fillRect(screenX + tileSize * 0.54, screenY + tileSize * 0.18, tileSize * 0.18, tileSize * 0.12);
        // Sirena (pulsante rojo/azul)
        const sirenPhase = Math.sin(Date.now() / 200);
        ctx.fillStyle = sirenPhase > 0 ? '#ff0000' : '#0066ff';
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.5, screenY + tileSize * 0.12, 4, 0, Math.PI * 2);
        ctx.fill();
        // Glow de sirena
        ctx.fillStyle = sirenPhase > 0 ? 'rgba(255,0,0,0.15)' : 'rgba(0,100,255,0.15)';
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.5, screenY + tileSize * 0.12, 12, 0, Math.PI * 2);
        ctx.fill();
        // Ruedas
        ctx.fillStyle = '#222';
        ctx.fillRect(screenX + tileSize * 0.12, screenY + tileSize * 0.72, tileSize * 0.18, tileSize * 0.12);
        ctx.fillRect(screenX + tileSize * 0.7, screenY + tileSize * 0.72, tileSize * 0.18, tileSize * 0.12);
        // Letrero POLICE
        ctx.fillStyle = '#ffffff';
        ctx.font = '6px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('POLICE', screenX + tileSize / 2, screenY + tileSize * 0.56);
        ctx.textAlign = 'left';
    } else if (tileId === T.CRIME_TAPE) {
        // Cinta policial amarilla/negra
        const stripeW = 6;
        for (let i = 0; i < tileSize; i += stripeW * 2) {
            ctx.fillStyle = '#ffdd00';
            ctx.fillRect(screenX + i, screenY + tileSize * 0.42, Math.min(stripeW, tileSize - i), tileSize * 0.16);
            ctx.fillStyle = '#222';
            ctx.fillRect(screenX + i + stripeW, screenY + tileSize * 0.42, Math.min(stripeW, tileSize - i - stripeW), tileSize * 0.16);
        }
    } else if (tileId === T.CHALK_OUTLINE) {
        // Silueta de tiza de la víctima
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2;
        // Cabeza
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.5, screenY + tileSize * 0.2, 5, 0, Math.PI * 2);
        ctx.stroke();
        // Cuerpo
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize * 0.5, screenY + tileSize * 0.28);
        ctx.lineTo(screenX + tileSize * 0.5, screenY + tileSize * 0.6);
        ctx.stroke();
        // Brazos
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize * 0.25, screenY + tileSize * 0.35);
        ctx.lineTo(screenX + tileSize * 0.75, screenY + tileSize * 0.45);
        ctx.stroke();
        // Piernas
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize * 0.5, screenY + tileSize * 0.6);
        ctx.lineTo(screenX + tileSize * 0.3, screenY + tileSize * 0.85);
        ctx.moveTo(screenX + tileSize * 0.5, screenY + tileSize * 0.6);
        ctx.lineTo(screenX + tileSize * 0.72, screenY + tileSize * 0.82);
        ctx.stroke();
    } else if (tileId === T.CONE) {
        // Cono naranja
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize * 0.5, screenY + tileSize * 0.15);
        ctx.lineTo(screenX + tileSize * 0.3, screenY + tileSize * 0.8);
        ctx.lineTo(screenX + tileSize * 0.7, screenY + tileSize * 0.8);
        ctx.closePath();
        ctx.fill();
        // Franja reflectante
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(screenX + tileSize * 0.36, screenY + tileSize * 0.45, tileSize * 0.28, tileSize * 0.08);
        // Base
        ctx.fillStyle = '#cc5500';
        ctx.fillRect(screenX + tileSize * 0.25, screenY + tileSize * 0.78, tileSize * 0.5, tileSize * 0.1);
    } else if (tileId === T.BENCH) {
        // Banca de parque
        ctx.fillStyle = '#8B6914';
        // Asiento
        ctx.fillRect(screenX + 4, screenY + tileSize * 0.38, tileSize - 8, tileSize * 0.15);
        // Respaldo
        ctx.fillRect(screenX + 4, screenY + tileSize * 0.25, tileSize - 8, tileSize * 0.08);
        // Patas
        ctx.fillStyle = '#5a4010';
        ctx.fillRect(screenX + 8, screenY + tileSize * 0.53, 4, tileSize * 0.35);
        ctx.fillRect(screenX + tileSize - 12, screenY + tileSize * 0.53, 4, tileSize * 0.35);
    } else if (tileId === T.TRASH) {
        // Bote de basura
        ctx.fillStyle = '#555';
        ctx.fillRect(screenX + tileSize * 0.28, screenY + tileSize * 0.3, tileSize * 0.44, tileSize * 0.6);
        // Tapa
        ctx.fillStyle = '#666';
        ctx.fillRect(screenX + tileSize * 0.24, screenY + tileSize * 0.24, tileSize * 0.52, tileSize * 0.1);
        // Asa
        ctx.fillStyle = '#777';
        ctx.fillRect(screenX + tileSize * 0.42, screenY + tileSize * 0.16, tileSize * 0.16, tileSize * 0.1);
    } else if (tileId === T.MAILBOX) {
        // Buzón
        ctx.fillStyle = '#2244aa';
        ctx.fillRect(screenX + tileSize * 0.3, screenY + tileSize * 0.25, tileSize * 0.4, tileSize * 0.35);
        // Poste
        ctx.fillStyle = '#555';
        ctx.fillRect(screenX + tileSize * 0.45, screenY + tileSize * 0.55, tileSize * 0.1, tileSize * 0.45);
        // Bandera
        ctx.fillStyle = '#dd3333';
        ctx.fillRect(screenX + tileSize * 0.7, screenY + tileSize * 0.28, tileSize * 0.08, tileSize * 0.18);
    }

    // ====== TILES DE INTERIOR ======
    else if (tileId === T.FLOOR_WOOD) {
        ctx.fillStyle = '#8B6B4A';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        ctx.strokeStyle = '#7A5A3A';
        ctx.lineWidth = 1;
        for (let i = 0; i < tileSize; i += 8) {
            ctx.beginPath();
            ctx.moveTo(screenX, screenY + i);
            ctx.lineTo(screenX + tileSize, screenY + i);
            ctx.stroke();
        }
    } else if (tileId === T.FLOOR_TILE) {
        ctx.fillStyle = '#9E9E8E';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        ctx.strokeStyle = '#8A8A7A';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2);
    } else if (tileId === T.WALL_INT) {
        ctx.fillStyle = '#5C4033';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        ctx.strokeStyle = '#4A3028';
        ctx.lineWidth = 1;
        for (let row = 0; row < tileSize; row += 8) {
            const offset = (row / 8) % 2 === 0 ? 0 : tileSize / 2;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY + row);
            ctx.lineTo(screenX + tileSize, screenY + row);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(screenX + offset, screenY + row);
            ctx.lineTo(screenX + offset, screenY + row + 8);
            ctx.stroke();
        }
    } else if (tileId === T.COUNTER) {
        ctx.fillStyle = '#6B5040';
        ctx.fillRect(screenX + 2, screenY + tileSize * 0.2, tileSize - 4, tileSize * 0.6);
        ctx.fillStyle = '#8A7060';
        ctx.fillRect(screenX, screenY + tileSize * 0.15, tileSize, tileSize * 0.12);
    } else if (tileId === T.SHELF) {
        ctx.fillStyle = '#7A6050';
        ctx.fillRect(screenX + 2, screenY, tileSize - 4, tileSize);
        ctx.fillStyle = '#8A7060';
        ctx.fillRect(screenX, screenY + tileSize * 0.25, tileSize, 3);
        ctx.fillRect(screenX, screenY + tileSize * 0.55, tileSize, 3);
        ctx.fillRect(screenX, screenY + tileSize * 0.85, tileSize, 3);
        const colors = ['#cc4444', '#4488cc', '#44aa44', '#ddaa44'];
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = colors[i];
            ctx.fillRect(screenX + 6 + i * 12, screenY + tileSize * 0.3, 8, 10);
            ctx.fillStyle = colors[i + 1] || colors[0];
            ctx.fillRect(screenX + 6 + i * 12, screenY + tileSize * 0.6, 8, 10);
        }
    } else if (tileId === T.TABLE) {
        ctx.fillStyle = '#5C3D2E';
        ctx.fillRect(screenX + 4, screenY + tileSize * 0.3, tileSize - 8, tileSize * 0.4);
        ctx.fillStyle = '#4A3020';
        ctx.fillRect(screenX + 6, screenY + tileSize * 0.65, 4, tileSize * 0.3);
        ctx.fillRect(screenX + tileSize - 10, screenY + tileSize * 0.65, 4, tileSize * 0.3);
    } else if (tileId === T.CHAIR) {
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(screenX + tileSize * 0.25, screenY + tileSize * 0.4, tileSize * 0.5, tileSize * 0.15);
        ctx.fillRect(screenX + tileSize * 0.25, screenY + tileSize * 0.1, tileSize * 0.1, tileSize * 0.35);
        ctx.fillStyle = '#6A5010';
        ctx.fillRect(screenX + tileSize * 0.28, screenY + tileSize * 0.55, 3, tileSize * 0.35);
        ctx.fillRect(screenX + tileSize * 0.65, screenY + tileSize * 0.55, 3, tileSize * 0.35);
    } else if (tileId === T.BLOOD) {
        ctx.fillStyle = '#5a0000';
        ctx.beginPath();
        ctx.ellipse(screenX + tileSize * 0.5, screenY + tileSize * 0.5, tileSize * 0.4, tileSize * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4a0000';
        ctx.beginPath();
        ctx.ellipse(screenX + tileSize * 0.45, screenY + tileSize * 0.55, tileSize * 0.2, tileSize * 0.15, 0.3, 0, Math.PI * 2);
        ctx.fill();
    } else if (tileId === T.BLOOD2) {
        ctx.fillStyle = '#6a1111';
        const splats = [[0.3, 0.4, 5], [0.6, 0.3, 4], [0.5, 0.7, 6], [0.7, 0.6, 3], [0.2, 0.6, 4]];
        for (const [sx, sy, r] of splats) {
            ctx.beginPath();
            ctx.arc(screenX + tileSize * sx, screenY + tileSize * sy, r, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (tileId === T.BROKEN_GLASS) {
        ctx.strokeStyle = 'rgba(180, 200, 220, 0.6)';
        ctx.lineWidth = 1;
        const shards = [[0.2, 0.3, 0.4, 0.5], [0.5, 0.2, 0.6, 0.6], [0.3, 0.6, 0.7, 0.4], [0.6, 0.7, 0.8, 0.3]];
        for (const [x1, y1, x2, y2] of shards) {
            ctx.beginPath();
            ctx.moveTo(screenX + tileSize * x1, screenY + tileSize * y1);
            ctx.lineTo(screenX + tileSize * x2, screenY + tileSize * y2);
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(200, 220, 240, 0.5)';
        ctx.fillRect(screenX + tileSize * 0.3, screenY + tileSize * 0.4, 4, 3);
        ctx.fillRect(screenX + tileSize * 0.6, screenY + tileSize * 0.3, 3, 5);
        ctx.fillRect(screenX + tileSize * 0.4, screenY + tileSize * 0.7, 5, 2);
    } else if (tileId === T.OVERTURNED) {
        ctx.fillStyle = '#7A6050';
        ctx.save();
        ctx.translate(screenX + tileSize * 0.5, screenY + tileSize * 0.5);
        ctx.rotate(-0.4);
        ctx.fillRect(-tileSize * 0.4, -tileSize * 0.15, tileSize * 0.8, tileSize * 0.7);
        ctx.fillStyle = '#5A4030';
        ctx.fillRect(-tileSize * 0.35, -tileSize * 0.05, tileSize * 0.7, 3);
        ctx.fillRect(-tileSize * 0.35, tileSize * 0.25, tileSize * 0.7, 3);
        ctx.restore();
        ctx.fillStyle = '#cc4444';
        ctx.fillRect(screenX + tileSize * 0.1, screenY + tileSize * 0.8, 6, 5);
        ctx.fillStyle = '#4488cc';
        ctx.fillRect(screenX + tileSize * 0.7, screenY + tileSize * 0.75, 5, 6);
    } else if (tileId === T.CASH_REGISTER) {
        ctx.fillStyle = '#556655';
        ctx.fillRect(screenX + tileSize * 0.15, screenY + tileSize * 0.3, tileSize * 0.7, tileSize * 0.5);
        ctx.fillStyle = '#223322';
        ctx.fillRect(screenX + tileSize * 0.25, screenY + tileSize * 0.15, tileSize * 0.5, tileSize * 0.2);
        ctx.fillStyle = '#888';
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 3; c++) {
                ctx.fillRect(screenX + tileSize * 0.25 + c * 8, screenY + tileSize * 0.55 + r * 7, 5, 4);
            }
        }
        ctx.fillStyle = '#445544';
        ctx.fillRect(screenX + tileSize * 0.1, screenY + tileSize * 0.75, tileSize * 0.8, tileSize * 0.15);
    } else if (tileId === T.DOOR_INT) {
        ctx.fillStyle = '#c68c3c';
        ctx.fillRect(screenX + tileSize * 0.2, screenY, tileSize * 0.6, tileSize);
        ctx.fillStyle = '#aa7020';
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.65, screenY + tileSize * 0.5, 3, 0, Math.PI * 2);
        ctx.fill();
        const exitPulse = (Math.sin(Date.now() / 500) + 1) / 2;
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillStyle = `rgba(0, 255, 100, ${0.5 + exitPulse * 0.5})`;
        ctx.textAlign = 'center';
        ctx.fillText('SALIR', screenX + tileSize / 2, screenY + tileSize * 0.3);
        ctx.textAlign = 'left';
    } else if (tileId === T.RUG) {
        ctx.fillStyle = '#8B3A3A';
        ctx.fillRect(screenX + 2, screenY + 2, tileSize - 4, tileSize - 4);
        ctx.strokeStyle = '#6B2A2A';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX + 4, screenY + 4, tileSize - 8, tileSize - 8);
    } else if (tileId === T.LAMP_INT) {
        ctx.fillStyle = '#888';
        ctx.fillRect(screenX + tileSize * 0.45, screenY + tileSize * 0.3, tileSize * 0.1, tileSize * 0.6);
        ctx.fillStyle = '#d4c090';
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize * 0.3, screenY + tileSize * 0.35);
        ctx.lineTo(screenX + tileSize * 0.7, screenY + tileSize * 0.35);
        ctx.lineTo(screenX + tileSize * 0.6, screenY + tileSize * 0.1);
        ctx.lineTo(screenX + tileSize * 0.4, screenY + tileSize * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 230, 150, 0.1)';
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.5, screenY + tileSize * 0.2, 16, 0, Math.PI * 2);
        ctx.fill();
    } else if (tileId === T.PLANT_INT) {
        ctx.fillStyle = '#8B5E3C';
        ctx.save();
        ctx.translate(screenX + tileSize * 0.5, screenY + tileSize * 0.7);
        ctx.rotate(0.8);
        ctx.fillRect(-8, -6, 16, 12);
        ctx.restore();
        ctx.fillStyle = '#4A3520';
        ctx.beginPath();
        ctx.ellipse(screenX + tileSize * 0.6, screenY + tileSize * 0.8, 10, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2d7a15';
        ctx.beginPath();
        ctx.ellipse(screenX + tileSize * 0.3, screenY + tileSize * 0.3, 6, 10, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3a8d22';
        ctx.beginPath();
        ctx.ellipse(screenX + tileSize * 0.5, screenY + tileSize * 0.25, 5, 8, 0.4, 0, Math.PI * 2);
        ctx.fill();
    } else if (tileId === T.FOOTPRINT) {
        ctx.fillStyle = 'rgba(60, 30, 10, 0.5)';
        ctx.beginPath();
        ctx.ellipse(screenX + tileSize * 0.5, screenY + tileSize * 0.35, 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(screenX + tileSize * 0.5, screenY + tileSize * 0.7, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    } else if (tileId === T.MARKER_NUM) {
        const pulse = (Math.sin(Date.now() / 400) + 1) / 2;
        ctx.fillStyle = `rgba(255, 204, 0, ${0.8 + pulse * 0.2})`;
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize * 0.5, screenY + tileSize * 0.1);
        ctx.lineTo(screenX + tileSize * 0.2, screenY + tileSize * 0.85);
        ctx.lineTo(screenX + tileSize * 0.8, screenY + tileSize * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', screenX + tileSize * 0.5, screenY + tileSize * 0.7);
        ctx.textAlign = 'left';
    } else if (tileId === T.PAPER) {
        ctx.fillStyle = '#f0e8d0';
        ctx.save();
        ctx.translate(screenX + tileSize * 0.5, screenY + tileSize * 0.5);
        ctx.rotate(0.2);
        ctx.fillRect(-10, -8, 20, 16);
        ctx.fillStyle = '#888';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-7, -5 + i * 4, 14, 1);
        }
        ctx.restore();
    }

    // ====== TILES DE COMISARÍA ======
    else if (tileId === T.DESK) {
        // Escritorio de oficina
        ctx.fillStyle = '#6B5040';
        ctx.fillRect(screenX + 2, screenY + tileSize * 0.25, tileSize - 4, tileSize * 0.5);
        // Superficie
        ctx.fillStyle = '#8A7060';
        ctx.fillRect(screenX, screenY + tileSize * 0.2, tileSize, tileSize * 0.12);
        // Cajón
        ctx.fillStyle = '#5A4030';
        ctx.fillRect(screenX + tileSize * 0.15, screenY + tileSize * 0.55, tileSize * 0.3, tileSize * 0.15);
        // Tirador del cajón
        ctx.fillStyle = '#999';
        ctx.fillRect(screenX + tileSize * 0.25, screenY + tileSize * 0.6, tileSize * 0.1, 2);
        // Patas
        ctx.fillStyle = '#4A3020';
        ctx.fillRect(screenX + 4, screenY + tileSize * 0.7, 3, tileSize * 0.25);
        ctx.fillRect(screenX + tileSize - 7, screenY + tileSize * 0.7, 3, tileSize * 0.25);
    } else if (tileId === T.FILING_CABINET) {
        // Archivero metálico
        ctx.fillStyle = '#707878';
        ctx.fillRect(screenX + tileSize * 0.15, screenY + 2, tileSize * 0.7, tileSize - 4);
        // Cajones (3 niveles)
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const cy = screenY + 6 + i * ((tileSize - 10) / 3);
            ctx.strokeRect(screenX + tileSize * 0.2, cy, tileSize * 0.6, (tileSize - 14) / 3);
            // Tirador
            ctx.fillStyle = '#aaa';
            ctx.fillRect(screenX + tileSize * 0.4, cy + 4, tileSize * 0.2, 2);
        }
    } else if (tileId === T.BULLETIN_BOARD) {
        // Tablero de evidencias/pistas
        ctx.fillStyle = '#8B6B3E';
        ctx.fillRect(screenX + 2, screenY + 2, tileSize - 4, tileSize - 4);
        // Fondo de corcho
        ctx.fillStyle = '#C4A46C';
        ctx.fillRect(screenX + 4, screenY + 4, tileSize - 8, tileSize - 8);
        // Papeles clavados
        ctx.fillStyle = '#f0e8d0';
        ctx.fillRect(screenX + 7, screenY + 7, 12, 10);
        ctx.fillStyle = '#ddd8c0';
        ctx.fillRect(screenX + tileSize * 0.55, screenY + 12, 10, 8);
        // Hilo rojo conectando
        ctx.strokeStyle = '#cc2222';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX + 13, screenY + 12);
        ctx.lineTo(screenX + tileSize * 0.6, screenY + 16);
        ctx.stroke();
        // Chinchetas
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.arc(screenX + 10, screenY + 8, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3333ff';
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.6, screenY + 13, 2, 0, Math.PI * 2);
        ctx.fill();
    } else if (tileId === T.JAIL_BARS) {
        // Barrotes de celda
        ctx.fillStyle = '#555';
        const barWidth = 3;
        const gap = (tileSize - barWidth * 4) / 5;
        for (let i = 0; i < 4; i++) {
            const bx = screenX + gap + i * (barWidth + gap);
            ctx.fillRect(bx, screenY, barWidth, tileSize);
        }
        // Barra horizontal superior e inferior
        ctx.fillStyle = '#666';
        ctx.fillRect(screenX, screenY + 2, tileSize, 3);
        ctx.fillRect(screenX, screenY + tileSize - 5, tileSize, 3);
    } else if (tileId === T.JAIL_FLOOR) {
        // Piso de celda (concreto frío)
        ctx.fillStyle = '#6a6a6a';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        ctx.strokeStyle = '#5a5a5a';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2);
        // Grietas
        ctx.strokeStyle = '#555';
        ctx.beginPath();
        ctx.moveTo(screenX + 8, screenY + 5);
        ctx.lineTo(screenX + 20, screenY + 25);
        ctx.stroke();
    } else if (tileId === T.BENCH_INT) {
        // Banca de celda (metálica)
        ctx.fillStyle = '#777';
        ctx.fillRect(screenX + 4, screenY + tileSize * 0.35, tileSize - 8, tileSize * 0.15);
        // Patas
        ctx.fillStyle = '#666';
        ctx.fillRect(screenX + 6, screenY + tileSize * 0.5, 3, tileSize * 0.4);
        ctx.fillRect(screenX + tileSize - 9, screenY + tileSize * 0.5, 3, tileSize * 0.4);
    } else if (tileId === T.COFFEE_MACHINE) {
        // Cafetera
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX + tileSize * 0.2, screenY + tileSize * 0.15, tileSize * 0.6, tileSize * 0.7);
        // Pantalla/botones
        ctx.fillStyle = '#225522';
        ctx.fillRect(screenX + tileSize * 0.3, screenY + tileSize * 0.25, tileSize * 0.4, tileSize * 0.15);
        // Luz encendida
        const coffeePulse = (Math.sin(Date.now() / 800) + 1) / 2;
        ctx.fillStyle = `rgba(0, 255, 0, ${0.5 + coffeePulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.7, screenY + tileSize * 0.3, 2, 0, Math.PI * 2);
        ctx.fill();
        // Dispensador
        ctx.fillStyle = '#555';
        ctx.fillRect(screenX + tileSize * 0.35, screenY + tileSize * 0.55, tileSize * 0.3, tileSize * 0.2);
        // Taza
        ctx.fillStyle = '#ddd';
        ctx.fillRect(screenX + tileSize * 0.38, screenY + tileSize * 0.68, tileSize * 0.24, tileSize * 0.12);
        // Vapor
        ctx.strokeStyle = 'rgba(200,200,200,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize * 0.45, screenY + tileSize * 0.65);
        ctx.quadraticCurveTo(screenX + tileSize * 0.42, screenY + tileSize * 0.55, screenX + tileSize * 0.48, screenY + tileSize * 0.48);
        ctx.stroke();
    } else if (tileId === T.WANTED_POSTER) {
        // Cartel "Se Busca"
        ctx.fillStyle = '#e8d8a0';
        ctx.fillRect(screenX + 4, screenY + 3, tileSize - 8, tileSize - 6);
        // Bordesb
        ctx.strokeStyle = '#8a7a50';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX + 4, screenY + 3, tileSize - 8, tileSize - 6);
        // Texto "SE BUSCA"
        ctx.fillStyle = '#5a2a0a';
        ctx.font = 'bold 5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SE', screenX + tileSize / 2, screenY + 12);
        ctx.fillText('BUSCA', screenX + tileSize / 2, screenY + 18);
        // Silueta
        ctx.fillStyle = '#4a3a20';
        ctx.beginPath();
        ctx.arc(screenX + tileSize / 2, screenY + tileSize * 0.6, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(screenX + tileSize * 0.35, screenY + tileSize * 0.7, tileSize * 0.3, 6);
        // Texto recompensa
        ctx.fillStyle = '#884422';
        ctx.font = '4px monospace';
        ctx.fillText('$$$', screenX + tileSize / 2, screenY + tileSize - 6);
        ctx.textAlign = 'left';
    } else if (tileId === T.COMPUTER) {
        // Monitor de computadora en escritorio
        ctx.fillStyle = '#6B5040';
        ctx.fillRect(screenX + 2, screenY + tileSize * 0.25, tileSize - 4, tileSize * 0.5);
        ctx.fillStyle = '#8A7060';
        ctx.fillRect(screenX, screenY + tileSize * 0.2, tileSize, tileSize * 0.12);
        // Monitor
        ctx.fillStyle = '#222';
        ctx.fillRect(screenX + tileSize * 0.2, screenY + tileSize * 0.02, tileSize * 0.6, tileSize * 0.35);
        // Pantalla
        ctx.fillStyle = '#1a3a5a';
        ctx.fillRect(screenX + tileSize * 0.24, screenY + tileSize * 0.06, tileSize * 0.52, tileSize * 0.26);
        // Texto en pantalla
        ctx.fillStyle = '#44cc88';
        ctx.font = '4px monospace';
        const flicker = Math.sin(Date.now() / 600) > 0;
        if (flicker) {
            ctx.fillRect(screenX + tileSize * 0.28, screenY + tileSize * 0.12, tileSize * 0.3, 1);
            ctx.fillRect(screenX + tileSize * 0.28, screenY + tileSize * 0.18, tileSize * 0.4, 1);
            ctx.fillRect(screenX + tileSize * 0.28, screenY + tileSize * 0.24, tileSize * 0.2, 1);
        }
        // Base del monitor
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX + tileSize * 0.4, screenY + tileSize * 0.35, tileSize * 0.2, tileSize * 0.06);
    } else if (tileId === T.RADIO) {
        // Radio policial en escritorio
        ctx.fillStyle = '#6B5040';
        ctx.fillRect(screenX + 2, screenY + tileSize * 0.25, tileSize - 4, tileSize * 0.5);
        ctx.fillStyle = '#8A7060';
        ctx.fillRect(screenX, screenY + tileSize * 0.2, tileSize, tileSize * 0.12);
        // Radio
        ctx.fillStyle = '#222';
        ctx.fillRect(screenX + tileSize * 0.25, screenY + tileSize * 0.02, tileSize * 0.5, tileSize * 0.3);
        // Antena
        ctx.fillStyle = '#555';
        ctx.fillRect(screenX + tileSize * 0.65, screenY - tileSize * 0.1, 2, tileSize * 0.2);
        // Luces parpadeantes
        const radioPulse = (Math.sin(Date.now() / 300) + 1) / 2;
        ctx.fillStyle = `rgba(255, 50, 50, ${0.4 + radioPulse * 0.6})`;
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.35, screenY + tileSize * 0.1, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(50, 255, 50, ${0.6 - radioPulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.55, screenY + tileSize * 0.1, 2, 0, Math.PI * 2);
        ctx.fill();
        // Altavoz rejilla
        ctx.fillStyle = '#444';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(screenX + tileSize * 0.32, screenY + tileSize * 0.16 + i * 4, tileSize * 0.36, 1);
        }
    } else if (tileId === T.WHITEBOARD) {
        // Pizarrón blanco
        ctx.fillStyle = '#888';
        ctx.fillRect(screenX + 2, screenY + 2, tileSize - 4, tileSize - 4);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(screenX + 4, screenY + 4, tileSize - 8, tileSize - 8);
        // Notas escritas
        ctx.fillStyle = '#2244aa';
        ctx.fillRect(screenX + 8, screenY + 8, 14, 1);
        ctx.fillRect(screenX + 8, screenY + 13, 20, 1);
        ctx.fillStyle = '#cc2222';
        ctx.fillRect(screenX + 8, screenY + 18, 10, 1);
        // Marco inferior (bandeja)
        ctx.fillStyle = '#999';
        ctx.fillRect(screenX + 3, screenY + tileSize - 6, tileSize - 6, 3);
        // Marcador
        ctx.fillStyle = '#cc2222';
        ctx.fillRect(screenX + tileSize * 0.6, screenY + tileSize - 7, 8, 3);
    } else if (tileId === T.CLOCK) {
        // Reloj de pared
        ctx.fillStyle = '#5C4033';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Cara del reloj
        ctx.fillStyle = '#f5f0e0';
        ctx.beginPath();
        ctx.arc(screenX + tileSize / 2, screenY + tileSize / 2, tileSize * 0.35, 0, Math.PI * 2);
        ctx.fill();
        // Borde
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX + tileSize / 2, screenY + tileSize / 2, tileSize * 0.35, 0, Math.PI * 2);
        ctx.stroke();
        // Manecillas
        const cx = screenX + tileSize / 2;
        const cy = screenY + tileSize / 2;
        // Hora (fija a las ~10:10 para estética)
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - 5, cy - 8);
        ctx.stroke();
        // Minuto
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 3, cy - 11);
        ctx.stroke();
        // Centro
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();
    } else if (tileId === T.FLAG) {
        // Bandera (en pared)
        ctx.fillStyle = '#5C4033';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Asta
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(screenX + tileSize * 0.2, screenY + 4, 3, tileSize - 8);
        // Bandera (México simplificada)
        const flagW = tileSize * 0.55;
        const flagH = tileSize * 0.4;
        const fx = screenX + tileSize * 0.28;
        const fy = screenY + 6;
        ctx.fillStyle = '#006847';
        ctx.fillRect(fx, fy, flagW / 3, flagH);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(fx + flagW / 3, fy, flagW / 3, flagH);
        ctx.fillStyle = '#CE1126';
        ctx.fillRect(fx + flagW * 2 / 3, fy, flagW / 3, flagH);
    }

    // ====== TILES DE APARTAMENTOS ======
    else if (tileId === T.BED) {
        // Cama vista desde arriba
        // Marco
        ctx.fillStyle = '#6B4226';
        ctx.fillRect(screenX + 2, screenY + 2, tileSize - 4, tileSize - 4);
        // Sábana
        ctx.fillStyle = '#ddd8cc';
        ctx.fillRect(screenX + 4, screenY + 4, tileSize - 8, tileSize * 0.55);
        // Almohada
        ctx.fillStyle = '#f0ece0';
        ctx.fillRect(screenX + 6, screenY + 5, tileSize - 14, tileSize * 0.2);
        // Cobija
        ctx.fillStyle = '#4466aa';
        ctx.fillRect(screenX + 4, screenY + tileSize * 0.5, tileSize - 8, tileSize * 0.38);
        // Pliegue de cobija
        ctx.strokeStyle = '#3355888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX + 6, screenY + tileSize * 0.6);
        ctx.lineTo(screenX + tileSize - 6, screenY + tileSize * 0.65);
        ctx.stroke();
    } else if (tileId === T.STOVE) {
        // Estufa
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX + 3, screenY + 3, tileSize - 6, tileSize - 6);
        // Superficie
        ctx.fillStyle = '#444';
        ctx.fillRect(screenX + 4, screenY + 4, tileSize - 8, tileSize - 8);
        // 4 quemadores
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        const qs = tileSize * 0.25;
        ctx.beginPath();
        ctx.arc(screenX + qs + 4, screenY + qs + 4, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(screenX + tileSize - qs - 4, screenY + qs + 4, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(screenX + qs + 4, screenY + tileSize - qs - 4, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(screenX + tileSize - qs - 4, screenY + tileSize - qs - 4, 5, 0, Math.PI * 2);
        ctx.stroke();
        // Un quemador encendido (rojo)
        ctx.fillStyle = 'rgba(255, 80, 20, 0.3)';
        ctx.beginPath();
        ctx.arc(screenX + qs + 4, screenY + qs + 4, 4, 0, Math.PI * 2);
        ctx.fill();
    } else if (tileId === T.FRIDGE) {
        // Refrigerador
        ctx.fillStyle = '#d8d8d8';
        ctx.fillRect(screenX + 4, screenY + 2, tileSize - 8, tileSize - 4);
        // Puerta superior (congelador)
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX + 5, screenY + 3, tileSize - 10, tileSize * 0.35);
        // Puerta inferior
        ctx.strokeRect(screenX + 5, screenY + tileSize * 0.42, tileSize - 10, tileSize * 0.52);
        // Manija superior
        ctx.fillStyle = '#888';
        ctx.fillRect(screenX + tileSize - 12, screenY + tileSize * 0.15, 2, 8);
        // Manija inferior
        ctx.fillRect(screenX + tileSize - 12, screenY + tileSize * 0.55, 2, 10);
    } else if (tileId === T.TV) {
        // Televisor
        ctx.fillStyle = '#111';
        ctx.fillRect(screenX + 4, screenY + tileSize * 0.2, tileSize - 8, tileSize * 0.5);
        // Pantalla encendida
        const tvFlicker = (Math.sin(Date.now() / 500) + 1) / 2;
        ctx.fillStyle = `rgba(40, 80, 140, ${0.6 + tvFlicker * 0.4})`;
        ctx.fillRect(screenX + 6, screenY + tileSize * 0.24, tileSize - 12, tileSize * 0.42);
        // Reflejo
        ctx.fillStyle = 'rgba(150, 200, 255, 0.15)';
        ctx.fillRect(screenX + 8, screenY + tileSize * 0.28, 8, 4);
        // Base/soporte
        ctx.fillStyle = '#222';
        ctx.fillRect(screenX + tileSize * 0.35, screenY + tileSize * 0.7, tileSize * 0.3, tileSize * 0.08);
        ctx.fillRect(screenX + tileSize * 0.25, screenY + tileSize * 0.76, tileSize * 0.5, tileSize * 0.06);
    } else if (tileId === T.SOFA) {
        // Sofá
        ctx.fillStyle = '#7a5030';
        ctx.fillRect(screenX + 2, screenY + tileSize * 0.15, tileSize - 4, tileSize * 0.7);
        // Cojines
        ctx.fillStyle = '#8B6040';
        ctx.fillRect(screenX + 4, screenY + tileSize * 0.25, tileSize * 0.4, tileSize * 0.5);
        ctx.fillRect(screenX + tileSize * 0.5, screenY + tileSize * 0.25, tileSize * 0.4 - 4, tileSize * 0.5);
        // Línea de separación
        ctx.strokeStyle = '#6a4020';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize * 0.5, screenY + tileSize * 0.3);
        ctx.lineTo(screenX + tileSize * 0.5, screenY + tileSize * 0.7);
        ctx.stroke();
        // Respaldo
        ctx.fillStyle = '#6a4020';
        ctx.fillRect(screenX + 2, screenY + tileSize * 0.1, tileSize - 4, tileSize * 0.12);
    } else if (tileId === T.SINK) {
        // Fregadero
        ctx.fillStyle = '#b0b0b0';
        ctx.fillRect(screenX + 4, screenY + tileSize * 0.2, tileSize - 8, tileSize * 0.6);
        // Cuenca
        ctx.fillStyle = '#999';
        ctx.beginPath();
        ctx.ellipse(screenX + tileSize * 0.5, screenY + tileSize * 0.5, tileSize * 0.25, tileSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Agua
        ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + tileSize * 0.5, screenY + tileSize * 0.52, tileSize * 0.15, tileSize * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        // Grifo
        ctx.fillStyle = '#777';
        ctx.fillRect(screenX + tileSize * 0.45, screenY + tileSize * 0.15, tileSize * 0.1, tileSize * 0.15);
        ctx.fillRect(screenX + tileSize * 0.4, screenY + tileSize * 0.12, tileSize * 0.2, tileSize * 0.06);
    } else if (tileId === T.PICTURE) {
        // Cuadro en pared
        ctx.fillStyle = '#5C4033';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Marco dorado
        ctx.fillStyle = '#b8960c';
        ctx.fillRect(screenX + 6, screenY + 5, tileSize - 12, tileSize - 10);
        // Interior del cuadro (paisaje)
        ctx.fillStyle = '#4a8dcc';
        ctx.fillRect(screenX + 8, screenY + 7, tileSize - 16, (tileSize - 14) * 0.5);
        ctx.fillStyle = '#3a8a2a';
        ctx.fillRect(screenX + 8, screenY + 7 + (tileSize - 14) * 0.5, tileSize - 16, (tileSize - 14) * 0.5);
        // Montaña
        ctx.fillStyle = '#5a5a6a';
        ctx.beginPath();
        ctx.moveTo(screenX + 14, screenY + tileSize * 0.55);
        ctx.lineTo(screenX + tileSize * 0.5, screenY + 9);
        ctx.lineTo(screenX + tileSize - 10, screenY + tileSize * 0.55);
        ctx.fill();
    } else if (tileId === T.BOOKSHELF) {
        // Librero alto
        ctx.fillStyle = '#5C3D2E';
        ctx.fillRect(screenX + 3, screenY, tileSize - 6, tileSize);
        // Estantes
        ctx.fillStyle = '#4A2D1E';
        ctx.fillRect(screenX + 3, screenY + tileSize * 0.25, tileSize - 6, 2);
        ctx.fillRect(screenX + 3, screenY + tileSize * 0.5, tileSize - 6, 2);
        ctx.fillRect(screenX + 3, screenY + tileSize * 0.75, tileSize - 6, 2);
        // Libros (colores variados)
        const bookColors = ['#cc3333', '#3366cc', '#33aa44', '#cc9933', '#9944cc', '#cc6633'];
        for (let shelf = 0; shelf < 3; shelf++) {
            const shelfY = screenY + shelf * tileSize * 0.25 + 4;
            for (let b = 0; b < 4; b++) {
                ctx.fillStyle = bookColors[(shelf * 4 + b) % bookColors.length];
                ctx.fillRect(screenX + 6 + b * 8, shelfY, 6, tileSize * 0.2);
            }
        }
    } else if (tileId === T.STAIRS) {
        // Escaleras
        ctx.fillStyle = '#7a7a7a';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Peldaños
        ctx.fillStyle = '#8a8a8a';
        const steps = 5;
        for (let i = 0; i < steps; i++) {
            const stepY = screenY + i * (tileSize / steps);
            ctx.fillRect(screenX + 2, stepY, tileSize - 4, tileSize / steps - 2);
            // Sombra
            ctx.fillStyle = '#666';
            ctx.fillRect(screenX + 2, stepY + tileSize / steps - 3, tileSize - 4, 2);
            ctx.fillStyle = '#8a8a8a';
        }
        // Barandilla
        ctx.fillStyle = '#555';
        ctx.fillRect(screenX + 1, screenY, 2, tileSize);
        ctx.fillRect(screenX + tileSize - 3, screenY, 2, tileSize);
        // Flecha indicando dirección
        ctx.fillStyle = '#ccc';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('↑', screenX + tileSize / 2, screenY + tileSize / 2 + 4);
        ctx.textAlign = 'left';
    } else if (tileId === T.WALL_DIV) {
        // Pared divisoria interior (más delgada)
        ctx.fillStyle = '#6B5040';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Textura
        ctx.fillStyle = '#5A4030';
        ctx.fillRect(screenX, screenY + tileSize * 0.45, tileSize, tileSize * 0.1);
        // Borde superior e inferior
        ctx.fillStyle = '#7B6050';
        ctx.fillRect(screenX, screenY, tileSize, 2);
        ctx.fillRect(screenX, screenY + tileSize - 2, tileSize, 2);
    } else if (tileId === T.DOOR_APT) {
        // Puerta de apartamento
        ctx.fillStyle = '#a07020';
        const dw = tileSize * 0.6;
        const dh = tileSize;
        const dx = screenX + (tileSize - dw) / 2;
        ctx.fillRect(dx, screenY, dw, dh);
        // Marco
        ctx.strokeStyle = '#704a10';
        ctx.lineWidth = 2;
        ctx.strokeRect(dx, screenY, dw, dh);
        // Perilla
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(dx + dw * 0.78, screenY + dh * 0.5, 3, 0, Math.PI * 2);
        ctx.fill();
        // Número de apartamento
        ctx.fillStyle = '#ddd';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('APT', screenX + tileSize / 2, screenY + tileSize * 0.35);
        ctx.textAlign = 'left';
    } else if (tileId === T.CARPET) {
        // Alfombra de pasillo
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Patrón decorativo
        ctx.fillStyle = '#7A6245';
        ctx.fillRect(screenX + 3, screenY + 3, tileSize - 6, tileSize - 6);
        // Rombos decorativos
        ctx.fillStyle = '#9B8365';
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize / 2, screenY + 5);
        ctx.lineTo(screenX + tileSize - 8, screenY + tileSize / 2);
        ctx.lineTo(screenX + tileSize / 2, screenY + tileSize - 5);
        ctx.lineTo(screenX + 8, screenY + tileSize / 2);
        ctx.closePath();
        ctx.fill();
    } else if (tileId === T.TOWEL) {
        // Toalla/perchero en pared
        ctx.fillStyle = '#5C4033';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Perchero
        ctx.fillStyle = '#888';
        ctx.fillRect(screenX + tileSize * 0.45, screenY + tileSize * 0.15, tileSize * 0.1, tileSize * 0.15);
        // Gancho
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.5, screenY + tileSize * 0.35, 4, 0, Math.PI);
        ctx.stroke();
        // Toalla colgando
        ctx.fillStyle = '#eee';
        ctx.fillRect(screenX + tileSize * 0.3, screenY + tileSize * 0.38, tileSize * 0.4, tileSize * 0.5);
        // Franjas de la toalla
        ctx.fillStyle = '#4488cc';
        ctx.fillRect(screenX + tileSize * 0.3, screenY + tileSize * 0.45, tileSize * 0.4, 3);
        ctx.fillRect(screenX + tileSize * 0.3, screenY + tileSize * 0.7, tileSize * 0.4, 3);
    }

    // ====== TILES DE RESTAURANTE ======
    else if (tileId === T.FLOOR_CHECKER) {
        // Piso ajedrezado
        const half = tileSize / 2;
        ctx.fillStyle = '#ddd8c8';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        ctx.fillStyle = '#c4bfaf';
        // Determinar patrón ajedrezado basado en posición
        const tileX = Math.floor(screenX / tileSize);
        const tileY = Math.floor(screenY / tileSize);
        if ((tileX + tileY) % 2 === 0) {
            ctx.fillRect(screenX, screenY, half, half);
            ctx.fillRect(screenX + half, screenY + half, half, half);
        } else {
            ctx.fillRect(screenX + half, screenY, half, half);
            ctx.fillRect(screenX, screenY + half, half, half);
        }
    } else if (tileId === T.BAR_COUNTER) {
        // Barra del bar (madera oscura pulida)
        ctx.fillStyle = '#4A3020';
        ctx.fillRect(screenX + 2, screenY, tileSize - 4, tileSize);
        // Superficie pulida
        ctx.fillStyle = '#5A3828';
        ctx.fillRect(screenX + 2, screenY, tileSize - 4, tileSize * 0.15);
        // Brillo
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(screenX + 4, screenY + 2, tileSize * 0.4, 3);
        // Moldura lateral
        ctx.fillStyle = '#3A2010';
        ctx.fillRect(screenX + tileSize - 5, screenY, 3, tileSize);
        // Reposapiés
        ctx.fillStyle = '#666';
        ctx.fillRect(screenX + tileSize - 8, screenY + tileSize * 0.7, 6, 3);
    } else if (tileId === T.BAR_STOOL) {
        // Banquillo de barra
        // Asiento circular
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(screenX + tileSize / 2, screenY + tileSize * 0.35, tileSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // Cojin
        ctx.fillStyle = '#8B2020';
        ctx.beginPath();
        ctx.arc(screenX + tileSize / 2, screenY + tileSize * 0.35, tileSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
        // Pata central
        ctx.fillStyle = '#555';
        ctx.fillRect(screenX + tileSize * 0.45, screenY + tileSize * 0.55, tileSize * 0.1, tileSize * 0.35);
        // Base
        ctx.fillRect(screenX + tileSize * 0.3, screenY + tileSize * 0.85, tileSize * 0.4, tileSize * 0.08);
    } else if (tileId === T.WINE_RACK) {
        // Estante de vinos (en pared)
        ctx.fillStyle = '#3C2415';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Estantes horizontales
        ctx.fillStyle = '#2A1808';
        ctx.fillRect(screenX, screenY + tileSize * 0.2, tileSize, 2);
        ctx.fillRect(screenX, screenY + tileSize * 0.5, tileSize, 2);
        ctx.fillRect(screenX, screenY + tileSize * 0.8, tileSize, 2);
        // Botellas (círculos/óvalos)
        const bottleColors = ['#4a1028', '#2a5a2a', '#8a7030', '#3a1838', '#1a4a3a', '#6a2020'];
        for (let row = 0; row < 3; row++) {
            const by = screenY + row * tileSize * 0.3 + 6;
            for (let b = 0; b < 3; b++) {
                ctx.fillStyle = bottleColors[(row * 3 + b) % bottleColors.length];
                ctx.beginPath();
                ctx.ellipse(screenX + 8 + b * 12, by, 4, 6, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    } else if (tileId === T.MENU_BOARD) {
        // Pizarrón de menú
        ctx.fillStyle = '#5C4033';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Pizarrón
        ctx.fillStyle = '#1a2a1a';
        ctx.fillRect(screenX + 3, screenY + 3, tileSize - 6, tileSize - 6);
        // Marco
        ctx.strokeStyle = '#6B4E3D';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX + 3, screenY + 3, tileSize - 6, tileSize - 6);
        // Texto del menú (líneas tipo tiza)
        ctx.fillStyle = '#ddd';
        ctx.fillRect(screenX + 7, screenY + 8, 16, 1);
        ctx.fillRect(screenX + 7, screenY + 14, 22, 1);
        ctx.fillRect(screenX + 7, screenY + 20, 18, 1);
        ctx.fillRect(screenX + 7, screenY + 26, 20, 1);
        // Título
        ctx.fillStyle = '#ffdd44';
        ctx.font = '5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MENÚ', screenX + tileSize / 2, screenY + 8);
        ctx.textAlign = 'left';
        // Precios
        ctx.fillStyle = '#aaddaa';
        ctx.fillRect(screenX + tileSize - 14, screenY + 14, 8, 1);
        ctx.fillRect(screenX + tileSize - 14, screenY + 20, 8, 1);
    } else if (tileId === T.PLATES) {
        // Mesa con platos
        ctx.fillStyle = '#5C3D2E';
        ctx.fillRect(screenX + 4, screenY + tileSize * 0.3, tileSize - 8, tileSize * 0.4);
        // Superficie de mesa
        ctx.fillStyle = '#6D4E3E';
        ctx.fillRect(screenX + 4, screenY + tileSize * 0.25, tileSize - 8, tileSize * 0.1);
        // Plato 1 (blanco
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.35, screenY + tileSize * 0.45, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.35, screenY + tileSize * 0.45, 4, 0, Math.PI * 2);
        ctx.fill();
        // Plato 2
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.65, screenY + tileSize * 0.45, 6, 0, Math.PI * 2);
        ctx.fill();
        // Comida en el plato
        ctx.fillStyle = '#cc6633';
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.65, screenY + tileSize * 0.45, 3, 0, Math.PI * 2);
        ctx.fill();
        // Cubiertos
        ctx.fillStyle = '#ccc';
        ctx.fillRect(screenX + tileSize * 0.15, screenY + tileSize * 0.35, 1, 12);
        ctx.fillRect(screenX + tileSize * 0.82, screenY + tileSize * 0.35, 1, 12);
    } else if (tileId === T.KITCHEN_HOOD) {
        // Campana de cocina (en pared)
        ctx.fillStyle = '#5C4033';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Campana metálica
        ctx.fillStyle = '#999';
        ctx.beginPath();
        ctx.moveTo(screenX + 4, screenY + tileSize);
        ctx.lineTo(screenX + 8, screenY + tileSize * 0.3);
        ctx.lineTo(screenX + tileSize - 8, screenY + tileSize * 0.3);
        ctx.lineTo(screenX + tileSize - 4, screenY + tileSize);
        ctx.closePath();
        ctx.fill();
        // Filtros
        ctx.fillStyle = '#777';
        ctx.fillRect(screenX + 10, screenY + tileSize * 0.5, tileSize - 20, tileSize * 0.3);
        // Rejilla
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(screenX + 12 + i * 6, screenY + tileSize * 0.5);
            ctx.lineTo(screenX + 12 + i * 6, screenY + tileSize * 0.8);
            ctx.stroke();
        }
        // Luz
        ctx.fillStyle = 'rgba(255, 230, 150, 0.2)';
        ctx.beginPath();
        ctx.arc(screenX + tileSize / 2, screenY + tileSize * 0.85, 8, 0, Math.PI * 2);
        ctx.fill();
    } else if (tileId === T.CANDLE) {
        // Vela en mesa
        ctx.fillStyle = '#5C3D2E';
        ctx.fillRect(screenX + 4, screenY + tileSize * 0.3, tileSize - 8, tileSize * 0.4);
        ctx.fillStyle = '#6D4E3E';
        ctx.fillRect(screenX + 4, screenY + tileSize * 0.25, tileSize - 8, tileSize * 0.1);
        // Candelabro
        ctx.fillStyle = '#b8960c';
        ctx.fillRect(screenX + tileSize * 0.43, screenY + tileSize * 0.55, tileSize * 0.14, tileSize * 0.08);
        // Vela
        ctx.fillStyle = '#f5f0d0';
        ctx.fillRect(screenX + tileSize * 0.45, screenY + tileSize * 0.2, tileSize * 0.1, tileSize * 0.38);
        // Llama (animada)
        const flamePulse = (Math.sin(Date.now() / 200) + 1) / 2;
        const flameSize = 3 + flamePulse * 2;
        // Glow
        ctx.fillStyle = `rgba(255, 180, 50, ${0.1 + flamePulse * 0.1})`;
        ctx.beginPath();
        ctx.arc(screenX + tileSize / 2, screenY + tileSize * 0.2, 10, 0, Math.PI * 2);
        ctx.fill();
        // Llama exterior
        ctx.fillStyle = `rgba(255, 140, 20, ${0.7 + flamePulse * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(screenX + tileSize / 2, screenY + tileSize * 0.17, 3, flameSize, 0, 0, Math.PI * 2);
        ctx.fill();
        // Llama interior
        ctx.fillStyle = '#ffee88';
        ctx.beginPath();
        ctx.ellipse(screenX + tileSize / 2, screenY + tileSize * 0.19, 1.5, flameSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // ====== TILES DE HOSPITAL ======
    } else if (tileId === T.FLOOR_HOSPITAL) {
        // Piso de linóleo verdoso/grisáceo
        ctx.fillStyle = '#e4e8e0';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Líneas de junta sutiles
        ctx.strokeStyle = '#d0d4cc';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2);

    } else if (tileId === T.HOSPITAL_BED) {
        // Base de cama metálica
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(screenX + 2, screenY + tileSize * 0.7, tileSize - 4, tileSize * 0.25);
        // Colchón
        ctx.fillStyle = '#e8e8f0';
        ctx.fillRect(screenX + 4, screenY + tileSize * 0.15, tileSize - 8, tileSize * 0.55);
        // Sábana
        ctx.fillStyle = '#d0dce8';
        ctx.fillRect(screenX + 4, screenY + tileSize * 0.3, tileSize - 8, tileSize * 0.3);
        // Almohada
        ctx.fillStyle = '#f0f0f5';
        ctx.fillRect(screenX + 6, screenY + tileSize * 0.15, tileSize * 0.35, tileSize * 0.18);
        // Borde metálico cabecera
        ctx.fillStyle = '#888';
        ctx.fillRect(screenX + 2, screenY + tileSize * 0.1, 3, tileSize * 0.6);
        ctx.fillRect(screenX + tileSize - 5, screenY + tileSize * 0.1, 3, tileSize * 0.6);

    } else if (tileId === T.CURTAIN) {
        // Cortina divisoria azul claro
        ctx.fillStyle = '#a8d8ea';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Pliegues verticales
        ctx.strokeStyle = '#8bc4dc';
        ctx.lineWidth = 1;
        for (let cx = 4; cx < tileSize; cx += 8) {
            ctx.beginPath();
            ctx.moveTo(screenX + cx, screenY);
            ctx.quadraticCurveTo(screenX + cx + 3, screenY + tileSize / 2, screenX + cx, screenY + tileSize);
            ctx.stroke();
        }
        // Riel superior
        ctx.fillStyle = '#888';
        ctx.fillRect(screenX, screenY, tileSize, 3);
        // Ganchos
        ctx.fillStyle = '#aaa';
        for (let gx = 6; gx < tileSize; gx += 10) {
            ctx.fillRect(screenX + gx, screenY + 2, 3, 4);
        }

    } else if (tileId === T.MEDICINE_CABINET) {
        // Gabinete blanco
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(screenX + 3, screenY + 2, tileSize - 6, tileSize - 4);
        // Borde
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX + 3, screenY + 2, tileSize - 6, tileSize - 4);
        // División central
        ctx.fillStyle = '#ddd';
        ctx.fillRect(screenX + 3, screenY + tileSize * 0.45, tileSize - 6, 2);
        // Cruz roja
        ctx.fillStyle = '#cc2222';
        ctx.fillRect(screenX + tileSize * 0.38, screenY + tileSize * 0.15, tileSize * 0.24, tileSize * 0.08);
        ctx.fillRect(screenX + tileSize * 0.46, screenY + tileSize * 0.08, tileSize * 0.08, tileSize * 0.22);
        // Frascos en estante inferior
        ctx.fillStyle = '#88bbdd';
        ctx.fillRect(screenX + 8, screenY + tileSize * 0.55, 5, tileSize * 0.3);
        ctx.fillStyle = '#dd8888';
        ctx.fillRect(screenX + 16, screenY + tileSize * 0.55, 5, tileSize * 0.3);
        ctx.fillStyle = '#88dd88';
        ctx.fillRect(screenX + 24, screenY + tileSize * 0.55, 5, tileSize * 0.3);

    } else if (tileId === T.IV_STAND) {
        // Poste metálico
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(screenX + tileSize * 0.46, screenY + tileSize * 0.15, 3, tileSize * 0.75);
        // Base trípode
        ctx.fillStyle = '#999';
        ctx.fillRect(screenX + tileSize * 0.3, screenY + tileSize * 0.85, tileSize * 0.4, 3);
        // Gancho superior
        ctx.fillStyle = '#aaa';
        ctx.fillRect(screenX + tileSize * 0.32, screenY + tileSize * 0.12, tileSize * 0.36, 3);
        // Bolsa de suero
        ctx.fillStyle = '#ddeeff';
        ctx.fillRect(screenX + tileSize * 0.35, screenY + tileSize * 0.18, tileSize * 0.15, tileSize * 0.2);
        ctx.strokeStyle = '#aaccee';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(screenX + tileSize * 0.35, screenY + tileSize * 0.18, tileSize * 0.15, tileSize * 0.2);
        // Tubo del suero
        ctx.strokeStyle = '#aaccee';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize * 0.42, screenY + tileSize * 0.38);
        ctx.lineTo(screenX + tileSize * 0.42, screenY + tileSize * 0.6);
        ctx.stroke();

    } else if (tileId === T.MONITOR) {
        // Cuerpo del monitor
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(screenX + 4, screenY + 4, tileSize - 8, tileSize - 10);
        // Pantalla
        ctx.fillStyle = '#112211';
        ctx.fillRect(screenX + 6, screenY + 6, tileSize - 12, tileSize - 16);
        // Línea de ECG animada
        const ecgPhase = (Date.now() / 100) % 30;
        ctx.strokeStyle = '#00ff44';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const midY = screenY + tileSize * 0.4;
        for (let px = 0; px < tileSize - 14; px += 2) {
            const pos = (px + ecgPhase) % 30;
            let yOff = 0;
            if (pos > 10 && pos < 13) yOff = -6;
            else if (pos > 13 && pos < 15) yOff = 8;
            else if (pos > 15 && pos < 17) yOff = -3;
            if (px === 0) ctx.moveTo(screenX + 7 + px, midY + yOff);
            else ctx.lineTo(screenX + 7 + px, midY + yOff);
        }
        ctx.stroke();
        // Pie del monitor
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(screenX + tileSize * 0.35, screenY + tileSize - 8, tileSize * 0.3, 4);

    } else if (tileId === T.STRETCHER) {
        // Camilla con ruedas
        ctx.fillStyle = '#888';
        ctx.fillRect(screenX + 2, screenY + tileSize * 0.75, tileSize - 4, 4);
        // Ruedas
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(screenX + 8, screenY + tileSize * 0.88, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + tileSize - 8, screenY + tileSize * 0.88, 3, 0, Math.PI * 2);
        ctx.fill();
        // Superficie
        ctx.fillStyle = '#d0d8e0';
        ctx.fillRect(screenX + 3, screenY + tileSize * 0.3, tileSize - 6, tileSize * 0.45);
        // Sábana
        ctx.fillStyle = '#e8eff5';
        ctx.fillRect(screenX + 5, screenY + tileSize * 0.35, tileSize - 10, tileSize * 0.3);
        // Almohada
        ctx.fillStyle = '#f5f5ff';
        ctx.fillRect(screenX + 6, screenY + tileSize * 0.32, tileSize * 0.25, tileSize * 0.12);

    } else if (tileId === T.RECEPTION_DESK) {
        // Escritorio azulado de recepción
        ctx.fillStyle = '#5a8abf';
        ctx.fillRect(screenX + 1, screenY + tileSize * 0.2, tileSize - 2, tileSize * 0.7);
        // Superficie
        ctx.fillStyle = '#6a9acf';
        ctx.fillRect(screenX + 1, screenY + tileSize * 0.2, tileSize - 2, tileSize * 0.15);
        // Panel frontal
        ctx.fillStyle = '#4a7aaf';
        ctx.fillRect(screenX + 2, screenY + tileSize * 0.4, tileSize - 4, tileSize * 0.45);
        // Línea decorativa
        ctx.fillStyle = '#7ab0df';
        ctx.fillRect(screenX + 2, screenY + tileSize * 0.38, tileSize - 4, 2);

    } else if (tileId === T.WHEELCHAIR) {
        // Silla de ruedas
        // Ruedas grandes
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.3, screenY + tileSize * 0.7, tileSize * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.7, screenY + tileSize * 0.7, tileSize * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        // Asiento
        ctx.fillStyle = '#2255aa';
        ctx.fillRect(screenX + tileSize * 0.2, screenY + tileSize * 0.3, tileSize * 0.6, tileSize * 0.25);
        // Respaldo
        ctx.fillStyle = '#2255aa';
        ctx.fillRect(screenX + tileSize * 0.2, screenY + tileSize * 0.1, tileSize * 0.15, tileSize * 0.3);
        // Manijas
        ctx.fillStyle = '#888';
        ctx.fillRect(screenX + tileSize * 0.15, screenY + tileSize * 0.08, tileSize * 0.15, 3);
        // Reposapiés
        ctx.fillStyle = '#888';
        ctx.fillRect(screenX + tileSize * 0.5, screenY + tileSize * 0.58, tileSize * 0.2, 3);

    } else if (tileId === T.MEDICAL_CROSS) {
        // Pared con cruz médica
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Cruz roja
        ctx.fillStyle = '#cc2222';
        ctx.fillRect(screenX + tileSize * 0.3, screenY + tileSize * 0.15, tileSize * 0.4, tileSize * 0.7);
        ctx.fillRect(screenX + tileSize * 0.15, screenY + tileSize * 0.3, tileSize * 0.7, tileSize * 0.4);
        // Borde blanco de la cruz
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX + tileSize * 0.3, screenY + tileSize * 0.15, tileSize * 0.4, tileSize * 0.7);
        ctx.strokeRect(screenX + tileSize * 0.15, screenY + tileSize * 0.3, tileSize * 0.7, tileSize * 0.4);

        // ====== TILES DE CASA SOSPECHOSA ======
    } else if (tileId === T.FLOOR_DARK) {
        // Piso oscuro desgastado
        ctx.fillStyle = '#3a3530';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Grietas y desgaste
        ctx.strokeStyle = '#2e2a25';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(screenX + 5, screenY + 3);
        ctx.lineTo(screenX + 15, screenY + 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX + 30, screenY + 8);
        ctx.lineTo(screenX + 25, screenY + 35);
        ctx.stroke();
        // Manchas
        ctx.fillStyle = 'rgba(30, 25, 20, 0.3)';
        ctx.beginPath();
        ctx.arc(screenX + 20, screenY + 25, 5, 0, Math.PI * 2);
        ctx.fill();

    } else if (tileId === T.WALL_DARK) {
        // Pared oscura con grietas
        ctx.fillStyle = '#4a4540';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Textura de ladrillo desgastado
        ctx.strokeStyle = '#3a3530';
        ctx.lineWidth = 0.5;
        for (let by = 4; by < tileSize; by += 10) {
            ctx.beginPath();
            ctx.moveTo(screenX, screenY + by);
            ctx.lineTo(screenX + tileSize, screenY + by);
            ctx.stroke();
        }
        for (let bx = 8; bx < tileSize; bx += 16) {
            ctx.beginPath();
            ctx.moveTo(screenX + bx, screenY);
            ctx.lineTo(screenX + bx, screenY + tileSize);
            ctx.stroke();
        }
        // Grieta diagonal
        ctx.strokeStyle = '#2a2520';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX + 10, screenY + 5);
        ctx.lineTo(screenX + 20, screenY + 22);
        ctx.lineTo(screenX + 15, screenY + 40);
        ctx.stroke();

    } else if (tileId === T.COBWEB) {
        // Telaraña en esquina
        ctx.fillStyle = '#3a3530';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
        ctx.lineWidth = 0.5;
        // Hilos radiales
        for (let a = 0; a < Math.PI / 2; a += Math.PI / 8) {
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(screenX + Math.cos(a) * tileSize, screenY + Math.sin(a) * tileSize);
            ctx.stroke();
        }
        // Espirales
        for (let r = 8; r < tileSize; r += 8) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, r, 0, Math.PI / 2);
            ctx.stroke();
        }

    } else if (tileId === T.BARREL) {
        // Barril de madera
        ctx.fillStyle = '#6b4226';
        ctx.fillRect(screenX + 6, screenY + 4, tileSize - 12, tileSize - 8);
        // Aros metálicos
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX + 5, screenY + 8, tileSize - 10, 3);
        ctx.strokeRect(screenX + 5, screenY + tileSize - 14, tileSize - 10, 3);
        // Tapa
        ctx.fillStyle = '#7a5030';
        ctx.fillRect(screenX + 6, screenY + 3, tileSize - 12, 5);
        // Tablones
        ctx.strokeStyle = '#5a3218';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize / 2, screenY + 4);
        ctx.lineTo(screenX + tileSize / 2, screenY + tileSize - 5);
        ctx.stroke();

    } else if (tileId === T.CRATE) {
        // Cajón de madera
        ctx.fillStyle = '#7a6030';
        ctx.fillRect(screenX + 4, screenY + 4, tileSize - 8, tileSize - 8);
        // Tablones horizontales
        ctx.strokeStyle = '#5a4020';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX + 4, screenY + 4, tileSize - 8, tileSize - 8);
        ctx.beginPath();
        ctx.moveTo(screenX + 4, screenY + tileSize / 2);
        ctx.lineTo(screenX + tileSize - 4, screenY + tileSize / 2);
        ctx.stroke();
        // X de refuerzo
        ctx.strokeStyle = '#8a7040';
        ctx.beginPath();
        ctx.moveTo(screenX + 6, screenY + 6);
        ctx.lineTo(screenX + tileSize - 6, screenY + tileSize - 6);
        ctx.moveTo(screenX + tileSize - 6, screenY + 6);
        ctx.lineTo(screenX + 6, screenY + tileSize - 6);
        ctx.stroke();

    } else if (tileId === T.CANDELABRA) {
        // Candelabro de pie
        ctx.fillStyle = '#3a3530';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Poste
        ctx.fillStyle = '#b8960c';
        ctx.fillRect(screenX + tileSize * 0.45, screenY + tileSize * 0.25, 4, tileSize * 0.65);
        // Base
        ctx.fillRect(screenX + tileSize * 0.3, screenY + tileSize * 0.85, tileSize * 0.4, 4);
        // Brazos
        ctx.fillRect(screenX + tileSize * 0.2, screenY + tileSize * 0.22, tileSize * 0.6, 3);
        // Velas (3)
        ctx.fillStyle = '#f5f0d0';
        ctx.fillRect(screenX + tileSize * 0.22, screenY + tileSize * 0.1, 4, tileSize * 0.14);
        ctx.fillRect(screenX + tileSize * 0.45, screenY + tileSize * 0.08, 4, tileSize * 0.16);
        ctx.fillRect(screenX + tileSize * 0.68, screenY + tileSize * 0.1, 4, tileSize * 0.14);
        // Llamas animadas
        const fPhase = (Math.sin(Date.now() / 180) + 1) / 2;
        ctx.fillStyle = `rgba(255, 150, 30, ${0.7 + fPhase * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(screenX + tileSize * 0.24, screenY + tileSize * 0.08, 2, 3 + fPhase, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(screenX + tileSize * 0.47, screenY + tileSize * 0.06, 2, 3 + fPhase * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(screenX + tileSize * 0.7, screenY + tileSize * 0.08, 2, 3 + fPhase, 0, 0, Math.PI * 2);
        ctx.fill();

    } else if (tileId === T.NEWSPAPER) {
        // Periódicos apilados
        ctx.fillStyle = '#3a3530';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Pila de periódicos
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#c8b888' : '#d8c898';
            ctx.fillRect(screenX + 6 - i, screenY + tileSize * 0.5 - i * 5, tileSize - 12, 6);
            // Líneas de texto
            ctx.fillStyle = '#8a8060';
            ctx.fillRect(screenX + 9 - i, screenY + tileSize * 0.52 - i * 5, tileSize - 20, 1);
            ctx.fillRect(screenX + 9 - i, screenY + tileSize * 0.58 - i * 5, tileSize - 22, 1);
        }
        // Titular visible
        ctx.fillStyle = '#4a4030';
        ctx.fillRect(screenX + 6, screenY + tileSize * 0.32, tileSize - 14, 3);

    } else if (tileId === T.ROPE) {
        // Soga (evidencia)
        ctx.fillStyle = '#3a3530';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(screenX + 8, screenY + 10);
        ctx.quadraticCurveTo(screenX + tileSize * 0.6, screenY + 5, screenX + tileSize - 10, screenY + 15);
        ctx.quadraticCurveTo(screenX + tileSize * 0.4, screenY + tileSize * 0.7, screenX + 12, screenY + tileSize - 10);
        ctx.stroke();
        // Textura de fibras
        ctx.strokeStyle = '#a08565';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(screenX + 10, screenY + 11);
        ctx.quadraticCurveTo(screenX + tileSize * 0.6, screenY + 6, screenX + tileSize - 11, screenY + 16);
        ctx.stroke();

    } else if (tileId === T.MIRROR) {
        // Espejo roto en la pared
        ctx.fillStyle = '#4a4540';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Marco
        ctx.fillStyle = '#6a5a3a';
        ctx.fillRect(screenX + 6, screenY + 4, tileSize - 12, tileSize - 8);
        // Superficie del espejo
        ctx.fillStyle = '#708090';
        ctx.fillRect(screenX + 8, screenY + 6, tileSize - 16, tileSize - 12);
        // Reflejo
        ctx.fillStyle = 'rgba(180, 200, 220, 0.3)';
        ctx.fillRect(screenX + 10, screenY + 8, 6, tileSize - 18);
        // Grietas del espejo
        ctx.strokeStyle = '#aabbcc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX + 18, screenY + 10);
        ctx.lineTo(screenX + 12, screenY + 25);
        ctx.lineTo(screenX + 20, screenY + 35);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX + 18, screenY + 10);
        ctx.lineTo(screenX + 28, screenY + 20);
        ctx.stroke();

    } else if (tileId === T.FIREPLACE) {
        // Chimenea
        ctx.fillStyle = '#5a3020';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Marco de piedra
        ctx.fillStyle = '#6a6560';
        ctx.fillRect(screenX + 2, screenY + 2, tileSize - 4, 6);
        ctx.fillRect(screenX + 2, screenY + 2, 6, tileSize - 4);
        ctx.fillRect(screenX + tileSize - 8, screenY + 2, 6, tileSize - 4);
        // Interior oscuro
        ctx.fillStyle = '#1a1210';
        ctx.fillRect(screenX + 8, screenY + 8, tileSize - 16, tileSize - 12);
        // Fuego animado
        const firePulse = (Math.sin(Date.now() / 150) + 1) / 2;
        // Brasas
        ctx.fillStyle = `rgba(200, 60, 20, ${0.5 + firePulse * 0.3})`;
        ctx.fillRect(screenX + 10, screenY + tileSize - 10, tileSize - 20, 4);
        // Llamas
        ctx.fillStyle = `rgba(255, 120, 20, ${0.6 + firePulse * 0.4})`;
        ctx.beginPath();
        ctx.ellipse(screenX + tileSize * 0.4, screenY + tileSize * 0.55, 4, 6 + firePulse * 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 200, 50, ${0.5 + firePulse * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(screenX + tileSize * 0.55, screenY + tileSize * 0.6, 3, 5 + firePulse * 2, 0, 0, Math.PI * 2);
        ctx.fill();

    } else if (tileId === T.TROPHY) {
        // Trofeo sospechoso (objeto pesado)
        ctx.fillStyle = '#3a3530';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Pedestal
        ctx.fillStyle = '#5a4030';
        ctx.fillRect(screenX + tileSize * 0.25, screenY + tileSize * 0.7, tileSize * 0.5, tileSize * 0.2);
        ctx.fillRect(screenX + tileSize * 0.3, screenY + tileSize * 0.65, tileSize * 0.4, tileSize * 0.08);
        // Trofeo dorado
        ctx.fillStyle = '#b8960c';
        // Copa
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize * 0.3, screenY + tileSize * 0.25);
        ctx.lineTo(screenX + tileSize * 0.35, screenY + tileSize * 0.5);
        ctx.lineTo(screenX + tileSize * 0.65, screenY + tileSize * 0.5);
        ctx.lineTo(screenX + tileSize * 0.7, screenY + tileSize * 0.25);
        ctx.closePath();
        ctx.fill();
        // Tallo
        ctx.fillRect(screenX + tileSize * 0.44, screenY + tileSize * 0.5, tileSize * 0.12, tileSize * 0.15);
        // Brillo
        ctx.fillStyle = '#d4b020';
        ctx.fillRect(screenX + tileSize * 0.38, screenY + tileSize * 0.3, 4, 8);
        // Mancha roja sutil (¿sangre?)
        ctx.fillStyle = 'rgba(150, 30, 20, 0.4)';
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.55, screenY + tileSize * 0.35, 3, 0, Math.PI * 2);
        ctx.fill();

        // ====== TILES DE BIBLIOTECA ======
    } else if (tileId === T.FLOOR_CARPET) {
        // Piso alfombrado granate
        ctx.fillStyle = '#7a4040';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Patrón de alfombra sutil
        ctx.fillStyle = 'rgba(100, 50, 50, 0.3)';
        ctx.fillRect(screenX + 2, screenY + 2, tileSize - 4, tileSize - 4);
        ctx.strokeStyle = '#6a3535';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(screenX + 4, screenY + 4, tileSize - 8, tileSize - 8);

    } else if (tileId === T.BOOKSHELF_TALL) {
        // Estante alto de libros
        ctx.fillStyle = '#5a3a1e';
        ctx.fillRect(screenX + 2, screenY, tileSize - 4, tileSize);
        // Estantes horizontales
        ctx.fillStyle = '#4a2e14';
        ctx.fillRect(screenX + 2, screenY + tileSize * 0.33, tileSize - 4, 2);
        ctx.fillRect(screenX + 2, screenY + tileSize * 0.66, tileSize - 4, 2);
        // Libros (fila superior)
        const bookColors1 = ['#cc3333', '#3366aa', '#33aa55', '#aa8833', '#883399'];
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = bookColors1[i];
            ctx.fillRect(screenX + 4 + i * 8, screenY + 2, 6, tileSize * 0.3);
        }
        // Libros (fila media)
        const bookColors2 = ['#aa5533', '#3355cc', '#559933', '#cc9944', '#553388'];
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = bookColors2[i];
            ctx.fillRect(screenX + 4 + i * 8, screenY + tileSize * 0.35, 6, tileSize * 0.3);
        }
        // Libros (fila inferior)
        const bookColors3 = ['#884422', '#225599', '#448833', '#bb7722', '#664499'];
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = bookColors3[i];
            ctx.fillRect(screenX + 4 + i * 8, screenY + tileSize * 0.68, 6, tileSize * 0.28);
        }

    } else if (tileId === T.READING_DESK) {
        // Mesa de lectura de madera oscura
        ctx.fillStyle = '#6b4e2e';
        ctx.fillRect(screenX + 1, screenY + tileSize * 0.2, tileSize - 2, tileSize * 0.65);
        // Superficie más clara
        ctx.fillStyle = '#7a5e3e';
        ctx.fillRect(screenX + 1, screenY + tileSize * 0.2, tileSize - 2, tileSize * 0.12);
        // Patas
        ctx.fillStyle = '#5a3e1e';
        ctx.fillRect(screenX + 3, screenY + tileSize * 0.8, 4, tileSize * 0.15);
        ctx.fillRect(screenX + tileSize - 7, screenY + tileSize * 0.8, 4, tileSize * 0.15);
        // Panel frontal
        ctx.fillStyle = '#604020';
        ctx.fillRect(screenX + 2, screenY + tileSize * 0.35, tileSize - 4, tileSize * 0.45);

    } else if (tileId === T.GLOBE) {
        // Globo terráqueo
        ctx.fillStyle = '#7a4040';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Soporte
        ctx.fillStyle = '#6b4226';
        ctx.fillRect(screenX + tileSize * 0.4, screenY + tileSize * 0.65, tileSize * 0.2, tileSize * 0.25);
        ctx.fillRect(screenX + tileSize * 0.25, screenY + tileSize * 0.85, tileSize * 0.5, 4);
        // Arco de soporte
        ctx.strokeStyle = '#b8960c';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(screenX + tileSize / 2, screenY + tileSize * 0.4, tileSize * 0.28, 0, Math.PI, true);
        ctx.stroke();
        // Esfera del globo
        ctx.fillStyle = '#3080a0';
        ctx.beginPath();
        ctx.arc(screenX + tileSize / 2, screenY + tileSize * 0.4, tileSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // Continentes
        ctx.fillStyle = '#55aa55';
        ctx.fillRect(screenX + tileSize * 0.35, screenY + tileSize * 0.28, 8, 6);
        ctx.fillRect(screenX + tileSize * 0.55, screenY + tileSize * 0.35, 6, 8);
        ctx.fillRect(screenX + tileSize * 0.3, screenY + tileSize * 0.45, 5, 5);
        // Brillo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(screenX + tileSize * 0.42, screenY + tileSize * 0.33, 4, 0, Math.PI * 2);
        ctx.fill();

    } else if (tileId === T.STUDY_LAMP) {
        // Lámpara de escritorio
        ctx.fillStyle = '#6b4e2e';
        ctx.fillRect(screenX + 1, screenY + tileSize * 0.2, tileSize - 2, tileSize * 0.65);
        ctx.fillStyle = '#7a5e3e';
        ctx.fillRect(screenX + 1, screenY + tileSize * 0.2, tileSize - 2, tileSize * 0.12);
        // Base de la lámpara
        ctx.fillStyle = '#b8960c';
        ctx.fillRect(screenX + tileSize * 0.4, screenY + tileSize * 0.12, tileSize * 0.2, tileSize * 0.1);
        // Brazo
        ctx.fillStyle = '#a0860c';
        ctx.fillRect(screenX + tileSize * 0.47, screenY - tileSize * 0.1, 3, tileSize * 0.25);
        // Pantalla de la lámpara
        ctx.fillStyle = '#2a6a2a';
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize * 0.3, screenY - tileSize * 0.08);
        ctx.lineTo(screenX + tileSize * 0.7, screenY - tileSize * 0.08);
        ctx.lineTo(screenX + tileSize * 0.6, screenY - tileSize * 0.2);
        ctx.lineTo(screenX + tileSize * 0.4, screenY - tileSize * 0.2);
        ctx.closePath();
        ctx.fill();
        // Luz cálida
        ctx.fillStyle = 'rgba(255, 240, 180, 0.15)';
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize * 0.32, screenY - tileSize * 0.06);
        ctx.lineTo(screenX + tileSize * 0.68, screenY - tileSize * 0.06);
        ctx.lineTo(screenX + tileSize * 0.75, screenY + tileSize * 0.2);
        ctx.lineTo(screenX + tileSize * 0.25, screenY + tileSize * 0.2);
        ctx.closePath();
        ctx.fill();

    } else if (tileId === T.CARD_CATALOG) {
        // Fichero/catálogo de biblioteca
        ctx.fillStyle = '#7a6040';
        ctx.fillRect(screenX + 3, screenY + 3, tileSize - 6, tileSize - 6);
        // Cajones (4x3 cuadrícula)
        ctx.strokeStyle = '#5a4020';
        ctx.lineWidth = 1;
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                const cx = screenX + 5 + col * 10;
                const cy = screenY + 5 + row * 12;
                ctx.strokeRect(cx, cy, 8, 10);
                // Tirador
                ctx.fillStyle = '#b8960c';
                ctx.fillRect(cx + 3, cy + 4, 2, 2);
            }
        }
        // Etiqueta superior
        ctx.fillStyle = '#f0e8d0';
        ctx.fillRect(screenX + 8, screenY + 1, tileSize - 16, 3);

    } else if (tileId === T.BOOK_PILE) {
        // Pila de libros en mesa
        ctx.fillStyle = '#6b4e2e';
        ctx.fillRect(screenX + 1, screenY + tileSize * 0.2, tileSize - 2, tileSize * 0.65);
        ctx.fillStyle = '#7a5e3e';
        ctx.fillRect(screenX + 1, screenY + tileSize * 0.2, tileSize - 2, tileSize * 0.12);
        // Libros apilados
        const pileColors = ['#cc3333', '#3366aa', '#33aa55', '#aa8833'];
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = pileColors[i];
            ctx.fillRect(screenX + 10 + (i % 2), screenY + tileSize * 0.0 + i * 5, 22, 4);
        }
        // Libro abierto encima
        ctx.fillStyle = '#f0e8d0';
        ctx.fillRect(screenX + 8, screenY - 2, 14, 7);
        ctx.fillRect(screenX + 22, screenY - 1, 14, 6);
        ctx.strokeStyle = '#8a7a5a';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(screenX + 22, screenY - 2);
        ctx.lineTo(screenX + 22, screenY + 5);
        ctx.stroke();

    } else if (tileId === T.ATLAS) {
        // Atlas/mapa en la pared
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Marco
        ctx.fillStyle = '#6b4226';
        ctx.strokeStyle = '#5a3216';
        ctx.lineWidth = 1;
        ctx.fillRect(screenX + 4, screenY + 3, tileSize - 8, tileSize - 6);
        ctx.strokeRect(screenX + 4, screenY + 3, tileSize - 8, tileSize - 6);
        // Fondo del mapa
        ctx.fillStyle = '#e8dcc0';
        ctx.fillRect(screenX + 6, screenY + 5, tileSize - 12, tileSize - 10);
        // Dibujo del mapa (continentes simples)
        ctx.fillStyle = '#88aa66';
        ctx.fillRect(screenX + 10, screenY + 8, 8, 10);
        ctx.fillRect(screenX + 22, screenY + 12, 10, 14);
        ctx.fillRect(screenX + 12, screenY + 22, 6, 8);
        // Líneas de meridianos
        ctx.strokeStyle = 'rgba(100, 80, 50, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize / 2, screenY + 5);
        ctx.lineTo(screenX + tileSize / 2, screenY + tileSize - 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX + 6, screenY + tileSize / 2);
        ctx.lineTo(screenX + tileSize - 6, screenY + tileSize / 2);
        ctx.stroke();

    } else if (tileId === T.ARMCHAIR) {
        // Sillón de lectura
        ctx.fillStyle = '#7a4040';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        // Base del sillón
        ctx.fillStyle = '#6b3030';
        ctx.fillRect(screenX + 4, screenY + tileSize * 0.25, tileSize - 8, tileSize * 0.6);
        // Cojín
        ctx.fillStyle = '#7a3838';
        ctx.fillRect(screenX + 6, screenY + tileSize * 0.35, tileSize - 12, tileSize * 0.35);
        // Respaldo
        ctx.fillStyle = '#6b3030';
        ctx.fillRect(screenX + 4, screenY + tileSize * 0.15, tileSize - 8, tileSize * 0.15);
        // Apoyabrazos
        ctx.fillStyle = '#5a2525';
        ctx.fillRect(screenX + 2, screenY + tileSize * 0.2, 5, tileSize * 0.55);
        ctx.fillRect(screenX + tileSize - 7, screenY + tileSize * 0.2, 5, tileSize * 0.55);
        // Patas
        ctx.fillStyle = '#4a2a1a';
        ctx.fillRect(screenX + 5, screenY + tileSize * 0.85, 4, tileSize * 0.1);
        ctx.fillRect(screenX + tileSize - 9, screenY + tileSize * 0.85, 4, tileSize * 0.1);
        // Botón decorativo
        ctx.fillStyle = '#8a4848';
        ctx.beginPath();
        ctx.arc(screenX + tileSize / 2, screenY + tileSize * 0.22, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function render() {
    // Limpiar canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calcular qué tiles son visibles
    const startCol = Math.floor(camera.x / (TILE_SIZE * SCALE));
    const startRow = Math.floor(camera.y / (TILE_SIZE * SCALE));
    const endCol = Math.ceil((camera.x + canvas.width) / (TILE_SIZE * SCALE));
    const endRow = Math.ceil((camera.y + canvas.height) / (TILE_SIZE * SCALE));

    // Dibujar capa de suelo
    for (let y = startRow; y <= endRow && y < MAP_HEIGHT; y++) {
        for (let x = startCol; x <= endCol && x < MAP_WIDTH; x++) {
            if (y < 0 || x < 0) continue;
            const screenX = x * TILE_SIZE * SCALE - camera.x;
            const screenY = y * TILE_SIZE * SCALE - camera.y;
            drawTile(mapFloor[y][x], screenX, screenY);
        }
    }

    // Dibujar capa de objetos
    for (let y = startRow; y <= endRow && y < MAP_HEIGHT; y++) {
        for (let x = startCol; x <= endCol && x < MAP_WIDTH; x++) {
            if (y < 0 || x < 0) continue;
            const screenX = x * TILE_SIZE * SCALE - camera.x;
            const screenY = y * TILE_SIZE * SCALE - camera.y;
            drawTile(mapObjects[y][x], screenX, screenY);
        }
    }

    // Dibujar NPCs (solo en exterior)
    if (!gameState.isIndoors) {
        drawNPCs();
    }

      // 🔴 SI HAY DIÁLOGO, SOLO DIBUJA ESO
    if (gameState.showingDialogue) {
        drawDialogueUI();
        return;
    }

    // Dibujar etiquetas de edificios (solo en exterior)
    if (!gameState.isIndoors && window.buildingLabels) {
        ctx.font = 'bold 12px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00e6ff';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;

        for (const bld of window.buildingLabels) {
            const labelX = (bld.x + bld.width / 2) * TILE_SIZE * SCALE - camera.x;
            const labelY = bld.y * TILE_SIZE * SCALE - camera.y - 8;
            ctx.fillText(bld.label, labelX, labelY);
        }
        ctx.shadowBlur = 0;
    }

    // Etiqueta de interior
    if (gameState.isIndoors && gameState.currentInterior) {
        const interior = interiorMaps[gameState.currentInterior];
        if (interior) {
            ctx.font = 'bold 12px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff4444';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.fillText(interior.label, canvas.width / 2, 30);
            ctx.shadowBlur = 0;
        }
    }

    // Dibujar jugador
    drawPlayer();

    // Dibujar UI
    drawUI();

    // Dibujar HUD de progreso
    drawProgressHUD();

    drawUI();
    drawDialogueUI();
    drawRiddleUI();


    // Dibujar acertijo si está activo
    if (gameState.activeRiddle !== null) {
        drawRiddleUI();
    }

    // Dibujar resultado
    if (gameState.showingResult) {
        drawResultUI();
    }

    // Dibujar pantalla final
    if (gameState.showingFinale) {
        drawFinaleUI();
    }

    // Dibujar pantalla de victoria final
    if (gameState.gameComplete) {
        drawGameCompleteUI();
    }
}

function drawNPCs() {
    for (const npc of npcs) {
        const screenX = npc.x * TILE_SIZE * SCALE - camera.x;
        const screenY = npc.y * TILE_SIZE * SCALE - camera.y;
        const size = TILE_SIZE * SCALE;

        // Skip si está fuera de pantalla
        if (screenX < -size || screenX > canvas.width || screenY < -size || screenY > canvas.height) continue;

        // Cuerpo del NPC
        ctx.fillStyle = npc.color;
        ctx.fillRect(screenX + 6, screenY + 12, size - 12, size - 16);

        // Cabeza
        ctx.fillStyle = npc.sprite === 'female' ? '#f4c2a1' : '#e8b896';
        ctx.beginPath();
        ctx.arc(screenX + size / 2, screenY + size / 4, 8, 0, Math.PI * 2);
        ctx.fill();

        // Cabello
        ctx.fillStyle = npc.sprite === 'female' ? '#8b4513' : '#4a4a4a';
        ctx.beginPath();
        ctx.arc(screenX + size / 2, screenY + size / 4 - 4, 10, 0, Math.PI);
        ctx.fill();

        // Indicador de tipo
        let indicator = '';
        let indicatorColor = '';
        if (npc.type === NPC_TYPES.WITNESS) {
            indicator = '👁️';
            indicatorColor = '#4a9eff';
        } else if (npc.type === NPC_TYPES.SUSPECT) {
            indicator = '❓';
            indicatorColor = '#ff4444';
        }

        if (indicator) {
            ctx.font = '12px Arial';
            ctx.fillStyle = indicatorColor;
            ctx.textAlign = 'center';
            ctx.fillText(indicator, screenX + size / 2, screenY - 5);
        }

        // Nombre del NPC (cuando está cerca)
        const dist = Math.abs(npc.x - Math.round(player.x)) + Math.abs(npc.y - Math.round(player.y));
        if (dist <= 2) {
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            const nameWidth = ctx.measureText(npc.name).width;
            ctx.fillRect(screenX + size / 2 - nameWidth / 2 - 4, screenY + size + 2, nameWidth + 8, 14);

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(npc.name, screenX + size / 2, screenY + size + 12);
        }

        // Animación de bobbing sutil
        const bobbing = Math.sin(Date.now() / 1000 + npc.x + npc.y) * 1;
        ctx.save();
        ctx.translate(0, bobbing);
        ctx.restore();
    }
}

function drawPlayer() {
    const screenX = player.x * TILE_SIZE * SCALE - camera.x;
    const screenY = player.y * TILE_SIZE * SCALE - camera.y;
    const size = TILE_SIZE * SCALE;

    // Efecto de bobbing al moverse
    let bobOffset = 0;
    if (player.moving) {
        bobOffset = Math.sin(Date.now() / 80) * 3;
    }

    if (playerImg.complete && playerImg.naturalWidth > 0) {
        // Flip horizontal si va a la izquierda
        ctx.save();
        if (player.direction === 'left') {
            ctx.translate(screenX + size, screenY + bobOffset);
            ctx.scale(-1, 1);
            ctx.drawImage(playerImg, 0, 0, size, size);
        } else {
            ctx.drawImage(playerImg, screenX, screenY + bobOffset, size, size);
        }
        ctx.restore();
    } else {
        // Fallback: cuadrado de color
        ctx.fillStyle = '#00e6ff';
        ctx.fillRect(screenX + 8, screenY + 8 + bobOffset, size - 16, size - 16);
    }

    // Indicador de dirección (pequeña flecha)
    ctx.fillStyle = 'rgba(0, 230, 255, 0.5)';
    const arrowSize = 6;
    const cx = screenX + size / 2;
    const cy = screenY + size / 2 + bobOffset;

    ctx.beginPath();
    switch (player.direction) {
        case 'up':
            ctx.moveTo(cx, cy - size / 2 - arrowSize);
            ctx.lineTo(cx - arrowSize, cy - size / 2 + 2);
            ctx.lineTo(cx + arrowSize, cy - size / 2 + 2);
            break;
        case 'down':
            ctx.moveTo(cx, cy + size / 2 + arrowSize);
            ctx.lineTo(cx - arrowSize, cy + size / 2 - 2);
            ctx.lineTo(cx + arrowSize, cy + size / 2 - 2);
            break;
        case 'left':
            ctx.moveTo(cx - size / 2 - arrowSize, cy);
            ctx.lineTo(cx - size / 2 + 2, cy - arrowSize);
            ctx.lineTo(cx - size / 2 + 2, cy + arrowSize);
            break;
        case 'right':
            ctx.moveTo(cx + size / 2 + arrowSize, cy);
            ctx.lineTo(cx + size / 2 - 2, cy - arrowSize);
            ctx.lineTo(cx + size / 2 - 2, cy + arrowSize);
            break;
    }
    ctx.fill();
}



let _dialogCloseRect = null; // guarda el área de la X para click/tap

function drawDialogueUI() {
    if (!gameState.showingDialogue) return; // Solo mostrar si hay diálogo activo
    const cw = canvas.width;
    const ch = canvas.height;

    // Fondo oscuro
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, cw, ch);

    // Panel
    const w = 600;
    const h = 300;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#00e6ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    // Título
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffcc00';
    ctx.textAlign = 'center';
    ctx.fillText(gameState.dialogueTitle, cw / 2, y + 40);

    // Texto
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    wrapText(ctx, gameState.dialogueBody, x + 30, y + 80, w - 60, 18);

    // Pie
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'center';
    ctx.fillText('Presiona ENTER o B para cerrar', cw / 2, y + h - 20);
}



function isInside(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

function onCanvasPointer(e) {
    if (!gameState.showingDialogue) return;

    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const py = (e.clientY - rect.top) * (canvas.height / rect.height);

    // mismas medidas que en drawDialogueUI()
    const cw = canvas.width;
    const ch = canvas.height;
    const panelW = Math.min(720, cw - 30);
    const panelH = Math.min(420, ch - 40);
    const panelX = (cw - panelW) / 2;
    const panelY = (ch - panelH) / 2;

    // área de la X (esquina superior derecha del panel)
    const xSize = 32;
    const xPad = 14;
    const xRectX = panelX + panelW - xSize - xPad;
    const xRectY = panelY + xPad;

    if (isInside(px, py, xRectX, xRectY, xSize, xSize)) {
        closeDialogue();
    }

    e.preventDefault();
}

canvas.addEventListener('click', onCanvasPointer);
canvas.addEventListener('touchstart', (e) => onCanvasPointer(e.touches[0]), { passive: false });




function drawUI() {
    // Mini-mapa (solo en exterior)
    if (!gameState.isIndoors) {
        drawMinimap();
    }

    // === Panel de diálogo (si está abierto) ===
    if (gameState.showingDialogue) {
        drawDialogueUI();
        return; // IMPORTANTE: no dibujar el mensaje pequeño debajo
    }


    // Mensaje de interacción
    if (interactionTimer > 0) {
        interactionTimer--;
        const alpha = interactionTimer > 30 ? 1 : interactionTimer / 30;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        const msgWidth = ctx.measureText(interactionMessage).width + 40;
        const msgX = canvas.width / 2 - msgWidth / 2;
        ctx.fillRect(msgX, canvas.height - 100, msgWidth, 40);
        ctx.strokeStyle = '#00e6ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(msgX, canvas.height - 100, msgWidth, 40);

        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillStyle = '#00e6ff';
        ctx.textAlign = 'center';
        ctx.fillText(interactionMessage, canvas.width / 2, canvas.height - 74);
        ctx.restore();
    }

    // Controles en pantalla (para móvil)
    drawMobileControls();

    // Instrucciones
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'left';
    ctx.fillText('WASD / Flechas para moverse', 10, canvas.height - 10);
}

function drawMinimap() {
    const mmSize = 120;
    const mmPadding = 10;
    const mmX = canvas.width - mmSize - mmPadding;
    const mmY = mmPadding;
    const tileW = mmSize / MAP_WIDTH;
    const tileH = mmSize / MAP_HEIGHT;

    // Fondo del minimapa
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mmX - 2, mmY - 2, mmSize + 4, mmSize + 4);
    ctx.strokeStyle = '#00e6ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(mmX - 2, mmY - 2, mmSize + 4, mmSize + 4);

    // Dibuar tiles simplificados
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            let color = '#2d5a1e'; // Pasto

            const floor = mapFloor[y][x];
            const obj = mapObjects[y][x];

            if (floor === T.ROAD_H || floor === T.ROAD_V || floor === T.ROAD_CROSS) {
                color = '#555';
            } else if (floor === T.SIDEWALK) {
                color = '#888';
            }

            if (obj === T.WALL || obj === T.WALL2 || obj === T.BRICKS || obj === T.BRICKS2 || obj === T.ROOF || obj === T.ROOF2 || obj === T.WINDOW || obj === T.DOOR) {
                color = '#8B4513';
            } else if (obj === T.TREE || obj === T.TREE2) {
                color = '#0a4a0a';
            } else if (obj === T.EVIDENCE) {
                color = '#ffcc00'; // Amarillo brillante para marcadores
            }

            ctx.fillStyle = color;
            ctx.fillRect(mmX + x * tileW, mmY + y * tileH, tileW + 0.5, tileH + 0.5);
        }
    }

    // Jugador en el minimapa
    ctx.fillStyle = '#00e6ff';
    ctx.fillRect(
        mmX + player.x * tileW - 1,
        mmY + player.y * tileH - 1,
        3, 3
    );
}

function drawMobileControls() {
    // Solo mostrar en pantallas pequeñas (o touch)
    if (!('ontouchstart' in window)) return;

    const btnSize = 50;
    const padding = 20;
    const centerX = padding + btnSize + 5;
    const centerY = canvas.height - padding - btnSize - 5;

    ctx.globalAlpha = 0.4;

    // Arriba
    drawControlButton(centerX, centerY - btnSize - 5, btnSize, '▲');
    // Abajo
    drawControlButton(centerX, centerY + btnSize + 5, btnSize, '▼');
    // Izquierda
    drawControlButton(centerX - btnSize - 5, centerY, btnSize, '◀');
    // Derecha
    drawControlButton(centerX + btnSize + 5, centerY, btnSize, '▶');

    ctx.globalAlpha = 1;
}

function drawControlButton(x, y, size, label) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#00e6ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);

    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + size / 2, y + size / 2 + 6);
}

// ============================
// RIDDLE UI - Interfaz de acertijos
// ============================
function drawRiddleUI() {
    const riddle = gameState.activeRiddle;
    if (!riddle) return;

    const cw = canvas.width;
    const ch = canvas.height;

    // Overlay oscuro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, cw, ch);

    // Panel central
    const panelW = Math.min(600, cw - 40);
    const panelH = 360;
    const panelX = (cw - panelW) / 2;
    const panelY = (ch - panelH) / 2 - 30;

    // Fondo del panel
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#00e6ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Icono de evidencia
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🔎', cw / 2, panelY + 35);

    // Título
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffcc00';
    ctx.textAlign = 'center';
    ctx.fillText('Selecciona la opción correcta', cw / 2, panelY + 65);

    // Ubicación
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(`📍 ${riddle.location} - Acertijo ${riddle.id}/${gameState.totalRiddles}`, cw / 2, panelY + 90);

    // Pregunta
    ctx.font = '13px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    wrapText(ctx, riddle.question, cw / 2, panelY + 125, panelW - 60, 22);

    // Opciones
    const optionStartY = panelY + 180;
    const optionH = 45;

    for (let i = 0; i < riddle.options.length; i++) {
        const opt = riddle.options[i];
        const oy = optionStartY + i * optionH;

        // Fondo de la opción
        ctx.fillStyle = 'rgba(0, 230, 255, 0.1)';
        ctx.fillRect(panelX + 20, oy, panelW - 40, optionH - 5);
        ctx.strokeStyle = '#00e6ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX + 20, oy, panelW - 40, optionH - 5);

        // Tecla
        ctx.fillStyle = '#00e6ff';
        ctx.font = 'bold 14px "Press Start 2P", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${opt.label})`, panelX + 35, oy + 27);

        // Texto de la opción
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillText(opt.text, panelX + 80, oy + 27);
    }

    // Instrucción
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('Presiona 1-4 o A-D para responder', cw / 2, panelY + panelH - 10);
}

function drawResultUI() {
    const cw = canvas.width;
    const ch = canvas.height;

    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, cw, ch);

    const panelW = Math.min(500, cw - 40);
    const panelH = 220;
    const panelX = (cw - panelW) / 2;
    const panelY = (ch - panelH) / 2;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(panelX, panelY, panelW, panelH);

    if (gameState.resultCorrect) {
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✅', cw / 2, panelY + 45);

        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillStyle = '#00ff88';
        ctx.fillText('¡CORRECTO!', cw / 2, panelY + 75);

        // Mostrar pista desbloqueada
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffcc00';
        const clue = gameState.cluesFound[gameState.cluesFound.length - 1];
        wrapText(ctx, clue, cw / 2, panelY + 110, panelW - 40, 18);

        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText(`Pistas: ${gameState.riddlesSolved}/${gameState.totalRiddles}`, cw / 2, panelY + 175);
    } else {
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 3;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('❌', cw / 2, panelY + 50);

        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillStyle = '#ff4444';
        ctx.fillText('INCORRECTO', cw / 2, panelY + 80);

        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Intenta de nuevo...', cw / 2, panelY + 120);
    }

    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('Presiona ENTER para continuar', cw / 2, panelY + panelH - 15);
}

function drawFinaleUI() {
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, cw, ch);

    const panelW = Math.min(620, cw - 40);
    const panelH = 400;
    const panelX = (cw - panelW) / 2;
    const panelY = (ch - panelH) / 2;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 3;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏆', cw / 2, panelY + 40);

    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('¡CASO RESUELTO!', cw / 2, panelY + 70);

    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Has reunido todas las pistas:', cw / 2, panelY + 100);

    // Listar pistas
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = '#00e6ff';
    ctx.textAlign = 'left';
    for (let i = 0; i < gameState.cluesFound.length; i++) {
        const clueShort = gameState.cluesFound[i].replace('🔍 ', '');
        wrapText(ctx, clueShort, panelX + 30, panelY + 130 + i * 35, panelW - 60, 14);
    }

    ctx.textAlign = 'center';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#ff4444';
    ctx.fillText('El asesino es: CARLOS MENDEZ', cw / 2, panelY + panelH - 60);

    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('Presiona ENTER para continuar', cw / 2, panelY + panelH - 20);
}

function drawGameCompleteUI() {
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.fillStyle = 'rgba(0,0,0,0.93)';
    ctx.fillRect(0, 0, cw, ch);

    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎉', cw / 2, ch / 2 - 60);

    ctx.font = '18px "Press Start 2P", monospace';
    ctx.fillStyle = '#00ff88';
    ctx.fillText('¡FELICIDADES!', cw / 2, ch / 2 - 20);

    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Has resuelto el caso de', cw / 2, ch / 2 + 20);
    ctx.fillStyle = '#00e6ff';
    ctx.fillText('Murder Cálculo', cw / 2, ch / 2 + 45);

    // Tiempo
    const totalSec = Math.floor(gameState.timer / 60);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(`Tiempo: ${mins}m ${secs.toString().padStart(2, '0')}s`, cw / 2, ch / 2 + 80);

    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('Presiona ENTER para volver al menú', cw / 2, ch / 2 + 120);
}

function drawProgressHUD() {
    // Barra de progreso de pistas (esquina superior izquierda)
    const hudX = 10;
    const hudY = 10;
    const barW = 160;
    const barH = 12;

    // Fondo
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(hudX - 2, hudY - 2, barW + 4, 40);

    // Etiqueta
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffcc00';
    ctx.textAlign = 'left';
    ctx.fillText(`PISTAS: ${gameState.riddlesSolved}/${gameState.totalRiddles}`, hudX + 4, hudY + 10);

    // Barra de progreso
    ctx.fillStyle = '#333';
    ctx.fillRect(hudX + 4, hudY + 18, barW - 8, barH);

    const fillW = ((barW - 8) * gameState.riddlesSolved) / gameState.totalRiddles;
    ctx.fillStyle = gameState.riddlesSolved >= gameState.totalRiddles ? '#00ff88' : '#00e6ff';
    ctx.fillRect(hudX + 4, hudY + 18, fillW, barH);

    ctx.strokeStyle = '#00e6ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(hudX + 4, hudY + 18, barW - 8, barH);

    // Timer (esquina superior izq, debajo de pistas)
    gameState.timer++;
    const totalSec = Math.floor(gameState.timer / 60);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = mins >= 25 ? '#ff4444' : '#aaa';
    ctx.fillText(`⏱ ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`, hudX + 4, hudY + 48);
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    const lines = [];

    for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
            lines.push(line.trim());
            line = word + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line.trim());

    const align = context.textAlign;
    for (let i = 0; i < lines.length; i++) {
        context.fillText(lines[i], x, y + i * lineHeight);
    }
}

// ============================
// GAME LOOP
// ============================
function gameLoop() {
    handleInput();
    player.update();
    camera.follow(player);

    render();
    requestAnimationFrame(gameLoop);
}

// ============================
// PANTALLA DE CARGA
// ============================
const loadingScreen = document.getElementById('loadingScreen');
const loadingBar = document.getElementById('loadingBar');
const loadingText = document.getElementById('loadingText');

function updateLoading(percent, text) {
    if (loadingBar) loadingBar.style.width = percent + '%';
    if (loadingText) loadingText.textContent = text;
}

function hideLoadingScreen() {
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}


// ============================
// INICIALIZACIÓN
// ============================
window.addEventListener('load', () => {
    console.log('Inicializando juego...');

    updateLoading(30, 'Generando mapa de la ciudad...');
    generateCityMap();
    generateCrimeSceneInterior();
    generateComisariaInterior();
    generateApartamentosInterior();
    generateRestauranteInterior();
    generateHospitalInterior();
    generateCasaInterior();
    generateBibliotecaInterior();
    //placeRiddleMarkers();
    console.log('Mapa generado:', MAP_WIDTH, 'x', MAP_HEIGHT);
    updateLoading(70, 'Preparando acertijos...');

    // Iniciar directamente (renderizado por colores, no depende del spritesheet)
    setTimeout(() => {
        updateLoading(100, '¡Listo!');
        setTimeout(() => {
            hideLoadingScreen();
            gameLoop();
        }, 400);
    }, 500);
});

// ============================
// CERRAR DIÁLOGO CON CLICK / TAP EN LA X
// ============================

let dialogCloseRect = null;

function isInsideRect(px, py, r) {
    return r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function handleDialoguePointer(clientX, clientY) {
    if (!gameState.showingDialogue) return;

    const rect = canvas.getBoundingClientRect();
    const px = (clientX - rect.left) * (canvas.width / rect.width);
    const py = (clientY - rect.top) * (canvas.height / rect.height);

    if (isInsideRect(px, py, _dialogCloseRect)) {
        closeDialogue();
    }
}

canvas.addEventListener('click', (e) => {
    handleDialoguePointer(e.clientX, e.clientY);
});

canvas.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
        handleDialoguePointer(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault();
    }
}, { passive: false });