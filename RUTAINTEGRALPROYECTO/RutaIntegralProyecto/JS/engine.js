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

function handleInteraction(x, y) {
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
});

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
        if (!riddle.solved && riddle.x === px && riddle.y === py) {
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

function drawUI() {
    // Mini-mapa (solo en exterior)
    if (!gameState.isIndoors) {
        drawMinimap();
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
    placeRiddleMarkers();
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
