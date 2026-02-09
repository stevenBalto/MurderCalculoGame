// ==============================================
// MAP DATA - Mapa de ciudad para mundo abierto
// Spritesheet: roguelikeSheet_transparent.png
// Tiles: 16x16, margen 1px
// Spritesheet: 968x526 → 57 cols x 31 rows
// ==============================================

// Tile indices reference (col, row) en el spritesheet
// Cada tile se identifica por su posición: col * 31 + row o un ID secuencial
// ID = row * 57 + col (lectura izq-der, arriba-abajo)

const TILE_SIZE = 16;
const TILE_MARGIN = 1;
const SHEET_COLS = 57;
const SHEET_ROWS = 31;
const SCALE = 3; // Escala de renderizado (16*3 = 48px por tile en pantalla)

// Función helper para calcular ID de tile desde columna y fila del spritesheet
function tileId(col, row) {
    return row * SHEET_COLS + col;
}

// ============================
// TILE ALIASES (nombres legibles)
// Basados en el spritesheet de Kenney Roguelike Modern City
// ============================
const T = {
    // Vacío / transparente
    EMPTY: -1,

    // Suelo / Pavimento (fila ~0-1 del spritesheet)
    GRASS: tileId(0, 0),
    GRASS2: tileId(1, 0),
    GRASS3: tileId(2, 0),
    DIRT: tileId(3, 0),
    DIRT2: tileId(4, 0),

    // Caminos / Calles
    ROAD_H: tileId(5, 0),      // Camino horizontal
    ROAD_V: tileId(6, 0),      // Camino vertical
    ROAD_CROSS: tileId(7, 0),  // Cruce
    SIDEWALK: tileId(8, 0),    // Acera
    ROAD_TL: tileId(9, 0),     // Esquina superior izq
    ROAD_TR: tileId(10, 0),    // Esquina superior der
    ROAD_BL: tileId(9, 1),     // Esquina inferior izq
    ROAD_BR: tileId(10, 1),    // Esquina inferior der

    // Edificios (filas ~2-5)
    WALL: tileId(0, 2),
    WALL2: tileId(1, 2),
    DOOR: tileId(2, 2),
    WINDOW: tileId(3, 2),
    ROOF: tileId(4, 2),
    ROOF2: tileId(5, 2),
    BRICKS: tileId(6, 2),
    BRICKS2: tileId(7, 2),

    // Decoración urbana
    TREE: tileId(0, 3),
    TREE2: tileId(1, 3),
    BENCH: tileId(2, 3),
    LAMP: tileId(3, 3),
    TRASH: tileId(4, 3),
    HYDRANT: tileId(5, 3),
    MAILBOX: tileId(6, 3),
    SIGN: tileId(7, 3),

    // Vehículos
    CAR_T: tileId(0, 4),
    CAR_B: tileId(1, 4),

    // Escena del crimen
    POLICE_CAR: tileId(2, 4),       // Patrulla de policía
    CRIME_TAPE: tileId(3, 4),       // Cinta amarilla de escena del crimen
    CHALK_OUTLINE: tileId(4, 4),    // Silueta de tiza
    CONE: tileId(5, 4),             // Cono naranja

    // Interior tiles
    FLOOR_WOOD: tileId(0, 5),       // Piso de madera
    FLOOR_TILE: tileId(1, 5),       // Piso de baldosa
    WALL_INT: tileId(2, 5),         // Pared interior
    WALL_INT2: tileId(3, 5),        // Pared interior variante
    COUNTER: tileId(4, 5),          // Mostrador/estante
    SHELF: tileId(5, 5),            // Estante con productos
    TABLE: tileId(6, 5),            // Mesa
    CHAIR: tileId(7, 5),            // Silla
    BLOOD: tileId(0, 6),            // Mancha de sangre
    BLOOD2: tileId(1, 6),           // Salpicadura
    BROKEN_GLASS: tileId(2, 6),     // Vidrio roto
    OVERTURNED: tileId(3, 6),       // Objeto volcado
    KNIFE: tileId(4, 6),            // Cuchillo (pista)
    PAPER: tileId(5, 6),            // Papel/nota
    CASH_REGISTER: tileId(6, 6),    // Caja registradora
    DOOR_INT: tileId(7, 6),         // Puerta interior (salida)
    RUG: tileId(0, 7),              // Alfombra
    LAMP_INT: tileId(1, 7),         // Lámpara interior
    PLANT_INT: tileId(2, 7),        // Planta de interior
    FOOTPRINT: tileId(3, 7),        // Huella (pista)
    MARKER_NUM: tileId(4, 7),       // Marcador numérico de evidencia

    // Personajes (fila ~10+)
    PLAYER: tileId(27, 0),
};

// ============================
// COLLISION MAP
// 0 = caminable, 1 = sólido (no pasar)
// ============================
const COLLISION_TYPES = {
    WALKABLE: 0,
    SOLID: 1,
    INTERACTIVE: 2, // Puntos de interacción (pistas, NPCs)
};

// Set de tiles sólidos (no caminables)
const SOLID_TILES = new Set([
    T.WALL, T.WALL2, T.BRICKS, T.BRICKS2,
    T.ROOF, T.ROOF2, T.WINDOW,
    T.TREE, T.TREE2,
    T.CAR_T, T.CAR_B,
    T.HYDRANT, T.MAILBOX, T.SIGN,
    T.BENCH, T.LAMP, T.TRASH,
    T.POLICE_CAR, T.CONE,
]);

// ============================
// MAPA DEL MUNDO (40x30 tiles)
// Ciudad con calles, edificios y parque
// ============================
let MAP_WIDTH = 40;
let MAP_HEIGHT = 30;

// Capa base (suelo)
const mapFloor = [];
// Capa de objetos/edificios
const mapObjects = [];
// Capa de colisiones
const mapCollision = [];

// Generar mapa proceduralmente
function generateCityMap() {
    // Inicializar con pasto
    for (let y = 0; y < MAP_HEIGHT; y++) {
        mapFloor[y] = [];
        mapObjects[y] = [];
        mapCollision[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Variación de pasto
            const grassVariant = Math.random() < 0.7 ? T.GRASS : (Math.random() < 0.5 ? T.GRASS2 : T.GRASS3);
            mapFloor[y][x] = grassVariant;
            mapObjects[y][x] = T.EMPTY;
            mapCollision[y][x] = COLLISION_TYPES.WALKABLE;
        }
    }

    // === CALLES PRINCIPALES ===
    // Calle horizontal principal (fila 10)
    for (let x = 0; x < MAP_WIDTH; x++) {
        mapFloor[9][x] = T.SIDEWALK;
        mapFloor[10][x] = T.ROAD_H;
        mapFloor[11][x] = T.ROAD_H;
        mapFloor[12][x] = T.SIDEWALK;
    }

    // Calle horizontal secundaria (fila 22)
    for (let x = 0; x < MAP_WIDTH; x++) {
        mapFloor[21][x] = T.SIDEWALK;
        mapFloor[22][x] = T.ROAD_H;
        mapFloor[23][x] = T.ROAD_H;
        mapFloor[24][x] = T.SIDEWALK;
    }

    // Calle vertical principal (columna 15)
    for (let y = 0; y < MAP_HEIGHT; y++) {
        mapFloor[y][14] = T.SIDEWALK;
        mapFloor[y][15] = T.ROAD_V;
        mapFloor[y][16] = T.ROAD_V;
        mapFloor[y][17] = T.SIDEWALK;
    }

    // Calle vertical secundaria (columna 30)
    for (let y = 0; y < MAP_HEIGHT; y++) {
        mapFloor[y][29] = T.SIDEWALK;
        mapFloor[y][30] = T.ROAD_V;
        mapFloor[y][31] = T.ROAD_V;
        mapFloor[y][32] = T.SIDEWALK;
    }

    // Cruces
    const intersections = [
        { x: 15, y: 10 }, { x: 16, y: 10 },
        { x: 15, y: 11 }, { x: 16, y: 11 },
        { x: 30, y: 10 }, { x: 31, y: 10 },
        { x: 30, y: 11 }, { x: 31, y: 11 },
        { x: 15, y: 22 }, { x: 16, y: 22 },
        { x: 15, y: 23 }, { x: 16, y: 23 },
        { x: 30, y: 22 }, { x: 31, y: 22 },
        { x: 30, y: 23 }, { x: 31, y: 23 },
    ];
    intersections.forEach(p => {
        mapFloor[p.y][p.x] = T.ROAD_CROSS;
    });

    // === EDIFICIOS (bloques sólidos) ===
    // Bloque 1: Comisaría (arriba-izquierda)
    placeBuilding(2, 2, 6, 4, "COMISARÍA");

    // Bloque 2: Escena del crimen (arriba-centro) - antes era TIENDA
    placeBuilding(19, 2, 5, 4, "ESCENA DEL CRIMEN");

    // Bloque 3: Biblioteca (arriba-derecha)
    placeBuilding(34, 2, 5, 4, "BIBLIOTECA");

    // Bloque 4: Apartamentos (abajo-izquierda)
    placeBuilding(2, 14, 6, 4, "APARTAMENTOS");

    // Bloque 5: Restaurante (centro)
    placeBuilding(19, 14, 5, 4, "RESTAURANTE");

    // Bloque 6: Hospital (derecha-centro)
    placeBuilding(34, 14, 5, 4, "HOSPITAL");

    // Bloque 7: Parque (abajo-izquierda) - Con árboles
    placePark(2, 26, 8, 3);

    // Bloque 8: Casa sospechosa (abajo-derecha)
    placeBuilding(34, 26, 5, 3, "CASA ???");

    // === ESCENA DEL CRIMEN (alrededor de la tienda) ===
    placeCrimeScene(19, 2, 5, 4);

    // === DECORACIÓN ===
    // Árboles sueltos
    const treePositions = [
        [0, 0], [1, 0], [38, 0], [39, 0],
        [0, 29], [1, 29], [38, 29], [39, 29],
        [13, 5], [18, 5], [13, 15], [18, 15],
        [28, 5], [33, 5], [28, 15], [33, 15],
    ];
    treePositions.forEach(([x, y]) => {
        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
            mapObjects[y][x] = T.TREE;
            mapCollision[y][x] = COLLISION_TYPES.SOLID;
        }
    });

    // Farolas a lo largo de las calles
    for (let x = 2; x < MAP_WIDTH; x += 5) {
        if (mapCollision[9][x] === COLLISION_TYPES.WALKABLE && mapObjects[9][x] === T.EMPTY) {
            mapObjects[9][x] = T.LAMP;
            mapCollision[9][x] = COLLISION_TYPES.SOLID;
        }
        if (mapCollision[24][x] === COLLISION_TYPES.WALKABLE && mapObjects[24][x] === T.EMPTY) {
            mapObjects[24][x] = T.LAMP;
            mapCollision[24][x] = COLLISION_TYPES.SOLID;
        }
    }

    // Bancas
    placeIfEmpty(13, 9, T.BENCH);
    placeIfEmpty(18, 9, T.BENCH);
    placeIfEmpty(13, 24, T.BENCH);
    placeIfEmpty(18, 24, T.BENCH);

    // Hidrantes
    placeIfEmpty(8, 9, T.HYDRANT);
    placeIfEmpty(25, 12, T.HYDRANT);

    // Botes de basura
    placeIfEmpty(9, 12, T.TRASH);
    placeIfEmpty(26, 9, T.TRASH);
}

// Helper: Colocar edificio
function placeBuilding(startX, startY, width, height, label) {
    for (let y = startY; y < startY + height && y < MAP_HEIGHT; y++) {
        for (let x = startX; x < startX + width && x < MAP_WIDTH; x++) {
            if (y === startY) {
                mapObjects[y][x] = T.ROOF;
            } else if (y === startY + height - 1 && x === startX + Math.floor(width / 2)) {
                mapObjects[y][x] = T.DOOR;
                mapCollision[y][x] = COLLISION_TYPES.INTERACTIVE;
            } else if (y === startY + 1) {
                mapObjects[y][x] = (x % 2 === 0) ? T.WINDOW : T.WALL;
                mapCollision[y][x] = COLLISION_TYPES.SOLID;
            } else {
                mapObjects[y][x] = T.WALL;
                mapCollision[y][x] = COLLISION_TYPES.SOLID;
            }

            // El techo y las paredes son sólidas (excepto la puerta)
            if (mapCollision[y][x] !== COLLISION_TYPES.INTERACTIVE) {
                mapCollision[y][x] = COLLISION_TYPES.SOLID;
            }
        }
    }

    // Guardar label del edificio
    if (!window.buildingLabels) window.buildingLabels = [];
    window.buildingLabels.push({
        x: startX,
        y: startY,
        width: width,
        label: label
    });
}

// Helper: Colocar parque
function placePark(startX, startY, width, height) {
    for (let y = startY; y < startY + height && y < MAP_HEIGHT; y++) {
        for (let x = startX; x < startX + width && x < MAP_WIDTH; x++) {
            mapFloor[y][x] = T.GRASS2;
            if ((x + y) % 3 === 0) {
                mapObjects[y][x] = T.TREE2;
                mapCollision[y][x] = COLLISION_TYPES.SOLID;
            } else if ((x + y) % 5 === 0) {
                mapObjects[y][x] = T.BENCH;
                mapCollision[y][x] = COLLISION_TYPES.SOLID;
            }
        }
    }
}

// Helper: Colocar objeto si la celda está vacía
function placeIfEmpty(x, y, tileType) {
    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
        if (mapObjects[y][x] === T.EMPTY && mapCollision[y][x] === COLLISION_TYPES.WALKABLE) {
            mapObjects[y][x] = tileType;
            mapCollision[y][x] = COLLISION_TYPES.SOLID;
        }
    }
}

// Helper: Colocar escena del crimen alrededor de un edificio
function placeCrimeScene(bx, by, bw, bh) {
    // Patrullas de policía en la calle (fila 7 = acera/calle debajo del edificio)
    // Patrulla izquierda
    placeIfEmpty(18, 7, T.POLICE_CAR);
    // Patrulla derecha
    placeIfEmpty(24, 7, T.POLICE_CAR);

    // Cinta policial alrededor (en la acera, fila 7)
    for (let x = bx - 1; x <= bx + bw; x++) {
        if (x >= 0 && x < MAP_WIDTH) {
            const yy = by + bh + 1; // una fila debajo del edificio
            if (yy < MAP_HEIGHT && mapObjects[yy][x] === T.EMPTY) {
                mapObjects[yy][x] = T.CRIME_TAPE;
                // La cinta NO bloquea el paso
            }
        }
    }

    // Cinta a los lados
    for (let y = by; y < by + bh; y++) {
        if (bx - 1 >= 0 && mapObjects[y][bx - 1] === T.EMPTY) {
            mapObjects[y][bx - 1] = T.CRIME_TAPE;
        }
        if (bx + bw < MAP_WIDTH && mapObjects[y][bx + bw] === T.EMPTY) {
            mapObjects[y][bx + bw] = T.CRIME_TAPE;
        }
    }

    // Silueta de tiza frente a la puerta
    const doorX = bx + Math.floor(bw / 2);
    const chalkY = by + bh;
    if (chalkY < MAP_HEIGHT && mapObjects[chalkY][doorX] === T.EMPTY) {
        mapObjects[chalkY][doorX] = T.CHALK_OUTLINE;
    }

    // Conos naranjas
    placeIfEmpty(bx - 1, by + bh, T.CONE);
    placeIfEmpty(bx + bw, by + bh, T.CONE);
    placeIfEmpty(bx - 1, by + bh + 1, T.CONE);
    placeIfEmpty(bx + bw, by + bh + 1, T.CONE);
}

// ============================
// NPCS - Testigos y Sospechosos
// ============================
const NPC_TYPES = {
    WITNESS: 'witness',
    SUSPECT: 'suspect',
    CIVILIAN: 'civilian'
};

const npcs = [
    // TESTIGOS
    {
        id: 'witness1',
        name: 'María González',
        type: NPC_TYPES.WITNESS,
        x: 5, y: 13, // Cerca de la comisaría
        sprite: 'female',
        color: '#4a9eff', // Azul para testigos
        dialogues: [
            { 
                text: '¡Detective! Vi algo extraño anoche cerca de la tienda...',
                options: [
                    { text: '¿Qué viste exactamente?', response: 'Vi a alguien con una chaqueta roja huyendo. Llevaba algo en las manos, pero estaba muy oscuro.' },
                    { text: '¿A qué hora fue?', response: 'Eran aproximadamente las 11:30 PM. Estaba sacando la basura cuando lo vi.' }
                ]
            }
        ],
        clue: 'El sospechoso usaba chaqueta roja y huyó cerca de las 11:30 PM'
    },
    {
        id: 'witness2', 
        name: 'Don Roberto',
        type: NPC_TYPES.WITNESS,
        x: 25, y: 26, // Cerca del parque
        sprite: 'male',
        color: '#4a9eff',
        dialogues: [
            {
                text: 'Buenos días, detective. He estado esperándolo.',
                options: [
                    { text: '¿Tiene información sobre el caso?', response: 'Sí, ayer vi a alguien discutiendo fuertemente cerca del restaurante. Uno gritaba sobre "números" y "cálculos".' },
                    { text: '¿Reconoció a alguno?', response: 'Uno parecía ser el contador del pueblo, pero el otro... no lo había visto antes.' }
                ]
            }
        ],
        clue: 'Hubo una discusión sobre "números" y "cálculos" cerca del restaurante'
    },
    
    // SOSPECHOSOS
    {
        id: 'suspect1',
        name: 'Carlos Mendez',
        type: NPC_TYPES.SUSPECT,
        x: 20, y: 16, // Cerca del restaurante
        sprite: 'male',
        color: '#ff4444', // Rojo para sospechosos
        dialogues: [
            {
                text: '¿Detective? No sé por qué me interroga...',
                options: [
                    { text: '¿Dónde estuvo anoche a las 11:30?', response: 'Estaba... eh... trabajando en mi oficina. Tengo muchos cálculos pendientes.' },
                    { text: '¿Conoce a la víctima?', response: 'Claro que sí, teníamos... diferencias sobre algunos números. Pero jamás haría algo así.' }
                ]
            }
        ],
        clue: 'Admite tener "diferencias sobre números" con la víctima. Su coartada es débil.',
        suspicion: 75
    },
    {
        id: 'suspect2',
        name: 'Ana López', 
        type: NPC_TYPES.SUSPECT,
        x: 35, y: 5, // Cerca de la biblioteca
        sprite: 'female',
        color: '#ff4444',
        dialogues: [
            {
                text: 'No tengo tiempo para esto, detective.',
                options: [
                    { text: '¿Por qué tiene tanta prisa?', response: 'Tengo que... resolver algunos problemas matemáticos urgentes. Es muy importante.' },
                    { text: '¿Dónde consiguió esa chaqueta roja?', response: '¿Qué chaqueta? ¡No sé de qué habla!' }
                ]
            }
        ],
        clue: 'Nerviosa cuando se menciona la chaqueta roja. Habla de "problemas matemáticos urgentes".',
        suspicion: 60
    }
];

// ============================
// ACERTIJOS / RIDDLES - Pistas de la víctima
// El juego tiene 6 acertijos repartidos por la ciudad.
// Cada uno da una pista para atrapar al asesino.
// Duración objetivo: ~30 minutos total.
// POR AHORA: la respuesta correcta siempre es "a".
// ============================
const RIDDLES = [
    {
        id: 1,
        x: 5, y: 7,        // Frente a la COMISARÍA
        location: 'COMISARÍA',
        question: '¿Cuál es la derivada de f(x) = 3x² + 2x?',
        options: [
            { label: 'a', text: "f'(x) = 6x + 2" },
            { label: 'b', text: "f'(x) = 3x + 2" },
            { label: 'c', text: "f'(x) = 6x² + 2" },
            { label: 'd', text: "f'(x) = 6x" }
        ],
        solved: false,
        clueText: '🔍 Pista 1: La víctima escribió "el asesino siempre lleva guantes negros".'
    },
    {
        id: 2,
        x: 21, y: 7,       // Frente a la TIENDA
        location: 'ESCENA DEL CRIMEN',
        question: '¿Cuál es el valor de la integral ∫ 2x dx?',
        options: [
            { label: 'a', text: 'x² + C' },
            { label: 'b', text: '2x² + C' },
            { label: 'c', text: 'x + C' },
            { label: 'd', text: '2x + C' }
        ],
        solved: false,
        clueText: '🔍 Pista 2: En la nota dice: "busca al que trabaja de noche cerca del hospital".'
    },
    {
        id: 3,
        x: 36, y: 7,       // Frente a la BIBLIOTECA
        location: 'BIBLIOTECA',
        question: '¿Cuál es el límite de (x² - 1)/(x - 1) cuando x → 1?',
        options: [
            { label: 'a', text: '2' },
            { label: 'b', text: '0' },
            { label: 'c', text: '1' },
            { label: 'd', text: 'No existe' }
        ],
        solved: false,
        clueText: '🔍 Pista 3: La víctima anotó: "el arma fue un objeto pesado, no un cuchillo".'
    },
    {
        id: 4,
        x: 5, y: 19,       // Frente a los APARTAMENTOS
        location: 'APARTAMENTOS',
        question: '¿Cuál es la derivada de f(x) = sen(x)?',
        options: [
            { label: 'a', text: "f'(x) = cos(x)" },
            { label: 'b', text: "f'(x) = -cos(x)" },
            { label: 'c', text: "f'(x) = -sen(x)" },
            { label: 'd', text: "f'(x) = tan(x)" }
        ],
        solved: false,
        clueText: '🔍 Pista 4: Encontraste un recibo: "compra de soga - ferretería, 10:45 PM".'
    },
    {
        id: 5,
        x: 21, y: 19,      // Frente al RESTAURANTE
        location: 'RESTAURANTE',
        question: '¿Cuál es el valor de ∫₀² 3x² dx?',
        options: [
            { label: 'a', text: '8' },
            { label: 'b', text: '12' },
            { label: 'c', text: '6' },
            { label: 'd', text: '4' }
        ],
        solved: false,
        clueText: '🔍 Pista 5: La víctima escribió "nos vemos en la casa abandonada a medianoche".'
    },
    {
        id: 6,
        x: 36, y: 19,      // Frente al HOSPITAL
        location: 'HOSPITAL',
        question: '¿Cuál es la segunda derivada de f(x) = x³ + 2x?',
        options: [
            { label: 'a', text: "f''(x) = 6x" },
            { label: 'b', text: "f''(x) = 3x² + 2" },
            { label: 'c', text: "f''(x) = 6x + 2" },
            { label: 'd', text: "f''(x) = 6" }
        ],
        solved: false,
        clueText: '🔍 Pista 6: Última nota: "Carlos Mendez me citó aquí... tengo miedo".'
    }
];

// Tile especial para marcador de evidencia/pista
T.EVIDENCE = 9999;

// Función para colocar marcadores de evidencia en el mapa
function placeRiddleMarkers() {
    for (const riddle of RIDDLES) {
        if (!riddle.solved) {
            // Asegurar que la posición sea caminable y colocar marcador
            mapFloor[riddle.y][riddle.x] = T.SIDEWALK;
            mapObjects[riddle.y][riddle.x] = T.EVIDENCE;
            mapCollision[riddle.y][riddle.x] = COLLISION_TYPES.WALKABLE;
        }
    }
}

// Estado del juego
const gameState = {
    riddlesSolved: 0,
    totalRiddles: 6,
    activeRiddle: null,       // Riddle actualmente mostrado (null = ninguno)
    showingResult: false,     // Mostrando resultado (correcto/incorrecto)
    resultCorrect: false,
    gameComplete: false,      // Juego terminado (todos los acertijos resueltos + final)
    showingFinale: false,     // Mostrando pantalla final
    cluesFound: [],           // Textos de pistas encontradas
    timer: 0,                 // Tiempo de juego en frames
    maxTime: 30 * 60 * 60,   // 30 minutos a 60fps
    // Interior
    isIndoors: false,         // ¿Está dentro de un edificio?
    currentInterior: null,    // ID del interior actual
    outdoorPos: null,         // Posición al salir
};

// ============================
// SISTEMA DE INTERIORES
// ============================
// Mapas de interiores: cada uno tiene sus propias capas floor/objects/collision
const interiorMaps = {};

// Interior de la Escena del Crimen (10x10 tiles)
function generateCrimeSceneInterior() {
    const W = 12;
    const H = 10;
    const floor = [];
    const objects = [];
    const collision = [];

    for (let y = 0; y < H; y++) {
        floor[y] = [];
        objects[y] = [];
        collision[y] = [];
        for (let x = 0; x < W; x++) {
            // Bordes = paredes
            if (y === 0 || y === H - 1 || x === 0 || x === W - 1) {
                floor[y][x] = T.FLOOR_TILE;
                objects[y][x] = T.WALL_INT;
                collision[y][x] = COLLISION_TYPES.SOLID;
            } else {
                // Piso de madera con variación
                floor[y][x] = (x + y) % 3 === 0 ? T.FLOOR_TILE : T.FLOOR_WOOD;
                objects[y][x] = T.EMPTY;
                collision[y][x] = COLLISION_TYPES.WALKABLE;
            }
        }
    }

    // Puerta de salida (centro abajo)
    const doorX = Math.floor(W / 2);
    objects[H - 1][doorX] = T.DOOR_INT;
    collision[H - 1][doorX] = COLLISION_TYPES.INTERACTIVE;

    // Ventanas en la pared de arriba
    objects[0][3] = T.WINDOW;
    objects[0][5] = T.WINDOW;
    objects[0][8] = T.WINDOW;

    // === MOSTRADOR / CAJA REGISTRADORA (arriba-izq) ===
    objects[1][1] = T.COUNTER;
    collision[1][1] = COLLISION_TYPES.SOLID;
    objects[1][2] = T.COUNTER;
    collision[1][2] = COLLISION_TYPES.SOLID;
    objects[1][3] = T.CASH_REGISTER;
    collision[1][3] = COLLISION_TYPES.SOLID;

    // === ESTANTES (lado derecho) ===
    objects[1][9] = T.SHELF;
    collision[1][9] = COLLISION_TYPES.SOLID;
    objects[1][10] = T.SHELF;
    collision[1][10] = COLLISION_TYPES.SOLID;
    objects[2][10] = T.SHELF;
    collision[2][10] = COLLISION_TYPES.SOLID;
    objects[3][10] = T.SHELF;
    collision[3][10] = COLLISION_TYPES.SOLID;

    // === ESTANTE VOLCADO (señal de lucha) ===
    objects[4][9] = T.OVERTURNED;
    collision[4][9] = COLLISION_TYPES.SOLID;

    // === MESA Y SILLAS (centro) ===
    objects[4][4] = T.TABLE;
    collision[4][4] = COLLISION_TYPES.SOLID;
    objects[4][5] = T.TABLE;
    collision[4][5] = COLLISION_TYPES.SOLID;
    objects[3][4] = T.CHAIR;
    collision[3][4] = COLLISION_TYPES.SOLID;
    objects[5][5] = T.CHAIR;  // Silla volcada (cerca de la sangre)
    collision[5][5] = COLLISION_TYPES.SOLID;

    // === SANGRE (zona del crimen, centro-izq) ===
    objects[5][3] = T.BLOOD;
    objects[6][3] = T.BLOOD;
    objects[6][4] = T.BLOOD2;  // Salpicadura
    objects[5][2] = T.BLOOD2;

    // === EVIDENCIA ===
    // Vidrio roto cerca de la ventana
    objects[1][6] = T.BROKEN_GLASS;

    // Huellas que van hacia la puerta trasera
    objects[7][3] = T.FOOTPRINT;
    objects[7][5] = T.FOOTPRINT;
    objects[8][6] = T.FOOTPRINT;

    // Marcadores de evidencia numéricos (policía)
    objects[5][1] = T.MARKER_NUM;
    objects[6][5] = T.MARKER_NUM;
    objects[1][7] = T.MARKER_NUM;

    // Papel/nota tirado
    objects[7][7] = T.PAPER;

    // Planta volcada
    objects[2][1] = T.PLANT_INT;
    collision[2][1] = COLLISION_TYPES.SOLID;

    // Lámpara interior
    objects[3][8] = T.LAMP_INT;
    collision[3][8] = COLLISION_TYPES.SOLID;

    // Alfombra manchada
    objects[6][6] = T.RUG;
    objects[6][7] = T.RUG;
    objects[7][6] = T.RUG;
    objects[7][7] = T.RUG; // Nota encima de la alfombra

    interiorMaps['crimeScene'] = {
        width: W,
        height: H,
        floor: floor,
        objects: objects,
        collision: collision,
        playerStart: { x: doorX, y: H - 2 },
        label: 'ESCENA DEL CRIMEN - Interior',
        buildingRef: 'ESCENA DEL CRIMEN', // Para saber a qué puerta volver
        outsideDoor: { x: 21, y: 6 },     // Posición afuera al salir (frente a la puerta)
    };
}

// Posición inicial del jugador (en la calle, cerca de la comisaría)
const PLAYER_START = { x: 8, y: 10 };
