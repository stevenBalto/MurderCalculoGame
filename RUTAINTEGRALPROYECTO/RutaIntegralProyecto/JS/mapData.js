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

    // Tiles de comisaría
    DESK: tileId(5, 7),              // Escritorio de oficina
    FILING_CABINET: tileId(6, 7),    // Archivero
    BULLETIN_BOARD: tileId(7, 7),    // Tablero de pistas/evidencia
    JAIL_BARS: tileId(0, 8),         // Barrotes de celda
    COFFEE_MACHINE: tileId(1, 8),    // Cafetera
    WANTED_POSTER: tileId(2, 8),     // Cartel de "Se busca"
    COMPUTER: tileId(3, 8),          // Computadora
    RADIO: tileId(4, 8),             // Radio policial
    WHITEBOARD: tileId(5, 8),        // Pizarrón blanco
    CLOCK: tileId(6, 8),             // Reloj de pared
    FLAG: tileId(7, 8),              // Bandera
    JAIL_FLOOR: tileId(0, 9),        // Piso de celda
    BENCH_INT: tileId(1, 9),         // Banca interior

    // Tiles de apartamentos
    BED: tileId(2, 9),               // Cama
    STOVE: tileId(3, 9),             // Estufa
    FRIDGE: tileId(4, 9),            // Refrigerador
    TV: tileId(5, 9),                // Televisor
    SOFA: tileId(6, 9),              // Sofá
    SINK: tileId(7, 9),              // Fregadero/lavabo
    PICTURE: tileId(0, 10),          // Cuadro en pared
    BOOKSHELF: tileId(1, 10),        // Librero
    STAIRS: tileId(2, 10),           // Escaleras
    WALL_DIV: tileId(3, 10),         // Pared divisoria interior
    DOOR_APT: tileId(4, 10),         // Puerta de apartamento (decorativa)
    CARPET: tileId(5, 10),           // Alfombra de apartamento
    TOWEL: tileId(6, 10),            // Toalla/perchero

    // Tiles de restaurante
    BAR_COUNTER: tileId(7, 10),      // Barra del bar
    BAR_STOOL: tileId(0, 11),        // Banquillo de barra
    WINE_RACK: tileId(1, 11),        // Estante de vinos
    MENU_BOARD: tileId(2, 11),       // Pizarrón de menú
    PLATES: tileId(3, 11),           // Platos en mesa
    KITCHEN_HOOD: tileId(4, 11),     // Campana de cocina
    FLOOR_CHECKER: tileId(5, 11),    // Piso ajedrezado
    CANDLE: tileId(6, 11),           // Vela en mesa

    // Tiles de hospital
    HOSPITAL_BED: tileId(7, 11),     // Cama de hospital
    CURTAIN: tileId(0, 12),          // Cortina divisoria
    MEDICINE_CABINET: tileId(1, 12), // Gabinete de medicinas
    IV_STAND: tileId(2, 12),         // Soporte de suero
    MONITOR: tileId(3, 12),          // Monitor cardíaco
    STRETCHER: tileId(4, 12),        // Camilla
    RECEPTION_DESK: tileId(5, 12),   // Escritorio de recepción
    WHEELCHAIR: tileId(6, 12),       // Silla de ruedas
    MEDICAL_CROSS: tileId(7, 12),    // Cruz médica (decoración pared)
    FLOOR_HOSPITAL: tileId(0, 13),   // Piso de hospital (linóleo)

    // Tiles de casa sospechosa
    FLOOR_DARK: tileId(1, 13),        // Piso oscuro desgastado
    WALL_DARK: tileId(2, 13),         // Pared oscura con grietas
    COBWEB: tileId(3, 13),            // Telaraña
    BARREL: tileId(4, 13),            // Barril
    CRATE: tileId(5, 13),             // Caja/cajón
    CANDELABRA: tileId(6, 13),        // Candelabro de pie
    NEWSPAPER: tileId(7, 13),         // Periódicos apilados
    ROPE: tileId(0, 14),              // Soga
    MIRROR: tileId(1, 14),            // Espejo roto
    FIREPLACE: tileId(2, 14),         // Chimenea
    TROPHY: tileId(3, 14),            // Trofeo/objeto sospechoso

    // Tiles de biblioteca
    BOOKSHELF_TALL: tileId(4, 14),    // Estante alto de libros
    READING_DESK: tileId(5, 14),      // Mesa de lectura
    GLOBE: tileId(6, 14),             // Globo terráqueo
    STUDY_LAMP: tileId(7, 14),        // Lámpara de escritorio
    CARD_CATALOG: tileId(0, 15),      // Fichero/catálogo
    FLOOR_CARPET: tileId(1, 15),      // Piso alfombrado
    BOOK_PILE: tileId(2, 15),         // Pila de libros
    ATLAS: tileId(3, 15),             // Atlas/mapa en pared
    ARMCHAIR: tileId(4, 15),          // Sillón de lectura

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
    placeBuilding(34, 26, 5, 3, "CASA EMBRUJADA");

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

// === Marcar NPCs como INTERACTIVE (después de generar el mapa) ===
if (window.npcs) {
    for (const npc of window.npcs) {
        if (
            npc.y >= 0 && npc.y < MAP_HEIGHT &&
            npc.x >= 0 && npc.x < MAP_WIDTH
        ) {
            mapCollision[npc.y][npc.x] = COLLISION_TYPES.SOLID;

        }
    }
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
    {
        id: 'npc1',
        name: 'Don Roberto',            // o el nombre que quieras
        type: NPC_TYPES.WITNESS,        // da igual, por ahora
        x: 10, y: 10,          // cerca de APARTAMENTOS (podés ajustar)
        sprite: 'male',
        color: '#4a9eff',
        dialogues: [
            {
                text: 'Detective… tengo información, pero primero asegúrate de estar listo.',
                options: [
                    { text: 'Estoy listo.', response: 'Bien. Vuelve conmigo y te diré dónde buscar la siguiente pista.' },
                    { text: '¿Qué sabes?', response: 'Solo hablaré cuando sea el momento. Regresa cuando necesites otra pista.' }
                ]
            }
        ],
        clue: 'NPC ÚNICO: entrega ubicaciones de pistas (sistema nuevo).'
    }
];

// Exponer NPCs al engine.js
window.npcs = npcs;





// ============================
// ACERTIJOS / RIDDLES - Pistas de la víctima
// El juego tiene 6 dds repartidos por la ciudad.
// Cada uno da una pista para atrapar al asesino.
// Duración objetivo: ~30 minutos total.
// POR AHORA: la respuesta correcta siempre es "a".
// ============================
const RIDDLES = [
    {
        id: 1,
        interior: 'comisaria',
        x: 4, y: 3,
        location: 'COMISARÍA',
        question: '¿Cuál es la derivada de f(x) = 3x² + 2x?',
        options: [
            { label: 'a', text: "f'(x) = 6x + 2" },
            { label: 'b', text: "f'(x) = 3x + 2" },
            { label: 'c', text: "f'(x) = 6x² + 2" },
            { label: 'd', text: "f'(x) = 6x" }
        ],
        solved: false,
        clueText: '🔍 Pista 3: Encuentras una nota clara: “La persona que me atacó usaba guantes negros".'
    },
    {
        id: 2,
        interior: 'casa',
        x: 8, y: 4,
        location: 'CASA EMBRUJADA',
        question: '¿Cuál es el valor de la integral ∫ 2x dx?',
        options: [
            { label: 'a', text: 'x² + C' },
            { label: 'b', text: '2x² + C' },
            { label: 'c', text: 'x + C' },
            { label: 'd', text: '2x + C' }
        ],
        solved: false,
        clueText: '🔍 Pista 6: La víctima dejó escrito: “Solo alguien que trabaja de noche cerca del hospital podría hacerlo".'
    },
    {
        id: 3,
        interior: 'biblioteca',   // 👈 IMPORTANTE (id del interiorMaps)
        x: 6, y: 4,               // 👈 coordenadas DENTRO del mapa interior (ajustables)
        location: 'BIBLIOTECA',
        question: '¿Cuál es el límite de (x² - 1)/(x - 1) cuando x → 1?',
        options: [
            { label: 'a', text: '2' },
            { label: 'b', text: '0' },
            { label: 'c', text: '1' },
            { label: 'd', text: 'No existe' }
        ],
        solved: false,
        clueText: '🔍 Pista 1: La víctima escribió: “No fue un cuchillo, fue algo pesado".'
    },
    {
        id: 4,
        interior: 'apartamentos',
        x: 4, y: 3,
        location: 'APARTAMENTOS',
        question: '¿Cuál es la derivada de f(x) = sen(x)?',
        options: [
            { label: 'a', text: "f'(x) = cos(x)" },
            { label: 'b', text: "f'(x) = -cos(x)" },
            { label: 'c', text: "f'(x) = -sen(x)" },
            { label: 'd', text: "f'(x) = tan(x)" }
        ],
        solved: false,
        clueText: '🔍 Pista 4: Encuentras un recibo real: “Compra de soga – ferretería – 10:45 p. m.".'
    },
    {
        id: 5,
        interior: 'restaurante',
        x: 4, y: 3,
        location: 'RESTAURANTE',
        question: '¿Cuál es el valor de ∫₀² 3x² dx?',
        options: [
            { label: 'a', text: '8' },
            { label: 'b', text: '12' },
            { label: 'c', text: '6' },
            { label: 'd', text: '4' }
        ],
        solved: false,
        clueText: '🩸 Pista 5: Nota corta: “Carlos es el único que sabía todo”.'

    },
    {
        id: 6,
        interior: 'hospital',
        x: 4, y: 3,
        location: 'HOSPITAL',
        question: '¿Cuál es la segunda derivada de f(x) = x³ + 2x?',
        options: [
            { label: 'a', text: "f''(x) = 6x" },
            { label: 'b', text: "f''(x) = 3x² + 2" },
            { label: 'c', text: "f''(x) = 6x + 2" },
            { label: 'd', text: "f''(x) = 6" }
        ],
        solved: false,
        clueText: '🔍 Pista 2: La nota final dice: “Carlos Méndez me citó aquí… tengo miedo".'
    }
    ,
    {
        id: 7,
        interior: 'apartamentos',
        x: 9,
        y: 7,
        location: 'APARTAMENTOS (PISTA FINAL)',
        question: 'Encuentras una ecuación escrita: 2x + 5 = 17. ¿Cuál es el valor de x?',
        options: [
            { label: 'a', text: 'x = 6' },
            { label: 'b', text: 'x = 7' },
            { label: 'c', text: 'x = 8' },
            { label: 'd', text: 'x = 5' }
        ],
        solved: false,
        clueText: '🔍 PISTA FINAL: ¡Encuentras guantes NEGROS escondidos! Si Carlos usa guantes negros, Pedro usa blancos y Luis no tiene guantes. Ya sé quien es el asesino!'
    }

];


// Tile especial para marcador de evidencia/pista
T.EVIDENCE = 9999;

// Función para colocar marcadores de evidencia en el mapa
function placeRiddleMarkers() {
    for (const riddle of RIDDLES) {
        if (!riddle.solved) {

            // ✅ NUEVO: si la pista es de interior, NO la pongas afuera
            if (riddle.interior) continue;

            mapFloor[riddle.y][riddle.x] = T.SIDEWALK;
            mapObjects[riddle.y][riddle.x] = T.EVIDENCE;
            mapCollision[riddle.y][riddle.x] = COLLISION_TYPES.WALKABLE;
        }
    }
}

function enableRiddleById(id) {
    const r = RIDDLES.find(rr => rr.id === id);
    if (!r || r.solved) return;

    // Si es interior, poner evidencia en el interiorMaps
    if (r.interior && interiorMaps[r.interior]) {
        const im = interiorMaps[r.interior];

        // colocar evidencia dentro del interior
        if (r.y >= 0 && r.y < im.height && r.x >= 0 && r.x < im.width) {
            im.objects[r.y][r.x] = T.EVIDENCE;
            im.collision[r.y][r.x] = COLLISION_TYPES.WALKABLE;
        }

        // Si el jugador YA está dentro de ese interior, reflejarlo en el mapa actual
        if (gameState.isIndoors && gameState.currentInterior === r.interior) {
            mapObjects[r.y][r.x] = T.EVIDENCE;
            mapCollision[r.y][r.x] = COLLISION_TYPES.WALKABLE;
        }
    }
    if (!gameState.enabledRiddleIds.includes(id)) {
        gameState.enabledRiddleIds.push(id);
    }

    // 👇 AGREGAR ESTA LÍNEA
    gameState.enabledRiddleIds.push(id);
}

window.enableRiddleById = enableRiddleById;


// Estado del juego
const gameState = {

    riddlesSolved: 0,
    totalRiddles: 6,
    activeRiddle: null,       // Riddle actualmente mostrado (null = ninguno)
    showingResult: false,     // Mostrando resultado (correcto/incorrecto)
    resultCorrect: false,
    gameComplete: false,      // Juego terminado (todos los acertijos resueltos + final)
    showingFinale: false,     // Mostrando pantalla final

    // NPC / Diálogo
    caseStage: 0,
    showingDialogue: false,
    dialogueTitle: '',
    dialogueBody: '',
    _dialogCloseBtn: null,
    cluesFound: [],           // Textos de pistas encontradas
    timer: 0,                 // Tiempo de juego en frames
    maxTime: 30 * 60 * 60,   // 30 minutos a 60fps

    // Acusación final
    showingAccusation: false,
    accusationResult: null,   // null = no respondió, true = correcto, false = incorrecto
    accusationSpot: null,     // {x, y} posición del marcador de acusación
    _accusationCards: null,   // posiciones de tarjetas para click detection
    _accusationHover: -1,     // índice de tarjeta bajo el mouse

    // Animación de victoria
    showingVictory: false,
    victoryStartTime: 0,
    victoryParticles: [],

    enabledRiddleIds: [], // al iniciar: VACÍO => no hay pistas en el mapa

    caseStage: 0, // 0 = inicio, 1 = biblioteca, 2 = siguiente...


    // Interior
    isIndoors: false,         // ¿Está dentro de un edificio?
    currentInterior: null,    // ID del interior actual
    outdoorPos: null,         // Posición al salir

    showingDialogue: false,
    dialogueTitle: '',
    dialogueBody: '',
    // Sistema de intentos (AGREGAR ESTAS LÍNEAS)
    attempts: 0,
    maxAttempts: 2,
    failedSuspects: [],
    finalClueUnlocked: false,
    needsNpcGuidance: false,
    lastWrongSuspect: '',
    suspects: [
        { id: 'carlos', name: 'CARLOS MENDEZ', isKiller: true },
        { id: 'pedro', name: 'PEDRO RAMIREZ', isKiller: false },
        { id: 'luis', name: 'LUIS TORRES', isKiller: false }
    ]

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

// Interior de la COMISARÍA (14x12 tiles)
function generateComisariaInterior() {
    const W = 14;
    const H = 12;
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
                // Piso de baldosa para comisaría
                floor[y][x] = T.FLOOR_TILE;
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
    objects[0][6] = T.WINDOW;
    objects[0][10] = T.WINDOW;

    // === RECEPCIÓN (frente a la puerta) ===
    // Mostrador de recepción (ancho, centrado)
    objects[9][4] = T.COUNTER;
    collision[9][4] = COLLISION_TYPES.SOLID;
    objects[9][5] = T.COUNTER;
    collision[9][5] = COLLISION_TYPES.SOLID;
    objects[9][6] = T.COUNTER;
    collision[9][6] = COLLISION_TYPES.SOLID;
    objects[9][7] = T.COUNTER;
    collision[9][7] = COLLISION_TYPES.SOLID;
    objects[9][8] = T.COUNTER;
    collision[9][8] = COLLISION_TYPES.SOLID;

    // Computadora en la recepción
    objects[9][5] = T.COMPUTER;
    collision[9][5] = COLLISION_TYPES.SOLID;

    // Radio policial en el mostrador
    objects[9][8] = T.RADIO;
    collision[9][8] = COLLISION_TYPES.SOLID;

    // === ZONA DE ESCRITORIOS (izquierda) ===
    // Escritorio 1 con silla
    objects[3][2] = T.DESK;
    collision[3][2] = COLLISION_TYPES.SOLID;
    objects[3][3] = T.DESK;
    collision[3][3] = COLLISION_TYPES.SOLID;
    objects[4][2] = T.CHAIR;
    collision[4][2] = COLLISION_TYPES.SOLID;

    // Escritorio 2 con silla
    objects[6][2] = T.DESK;
    collision[6][2] = COLLISION_TYPES.SOLID;
    objects[6][3] = T.DESK;
    collision[6][3] = COLLISION_TYPES.SOLID;
    objects[7][2] = T.CHAIR;
    collision[7][2] = COLLISION_TYPES.SOLID;

    // Papeles en los escritorios
    objects[3][3] = T.PAPER;
    collision[3][3] = COLLISION_TYPES.SOLID;

    // === TABLERO DE EVIDENCIA (pared superior, centro) ===
    objects[0][5] = T.BULLETIN_BOARD;
    collision[0][5] = COLLISION_TYPES.SOLID;
    objects[0][7] = T.BULLETIN_BOARD;
    collision[0][7] = COLLISION_TYPES.SOLID;

    // Pizarrón blanco (pared sup derecha)
    objects[0][9] = T.WHITEBOARD;
    collision[0][9] = COLLISION_TYPES.SOLID;

    // Reloj en la pared
    objects[0][12] = T.CLOCK;
    collision[0][12] = COLLISION_TYPES.SOLID;

    // Bandera
    objects[0][1] = T.FLAG;
    collision[0][1] = COLLISION_TYPES.SOLID;

    // === ARCHIVEROS (pared izquierda) ===
    objects[1][1] = T.FILING_CABINET;
    collision[1][1] = COLLISION_TYPES.SOLID;
    objects[2][1] = T.FILING_CABINET;
    collision[2][1] = COLLISION_TYPES.SOLID;

    // === CARTEL SE BUSCA (pared izquierda) ===
    objects[4][0] = T.WANTED_POSTER;
    collision[4][0] = COLLISION_TYPES.SOLID;
    objects[5][0] = T.WANTED_POSTER;
    collision[5][0] = COLLISION_TYPES.SOLID;

    // === CAFETERA (esquina sup derecha) ===
    objects[1][12] = T.COFFEE_MACHINE;
    collision[1][12] = COLLISION_TYPES.SOLID;

    // Mesita con planta al lado de la cafetera
    objects[2][12] = T.PLANT_INT;
    collision[2][12] = COLLISION_TYPES.SOLID;

    // === CELDA (esquina derecha, separada con barrotes) ===
    // Barrotes verticales (columna 10, filas 3-7)
    for (let y = 3; y <= 7; y++) {
        objects[y][10] = T.JAIL_BARS;
        collision[y][10] = COLLISION_TYPES.SOLID;
    }
    // Muro superior de la celda
    objects[2][10] = T.WALL_INT;
    collision[2][10] = COLLISION_TYPES.SOLID;
    objects[2][11] = T.WALL_INT;
    collision[2][11] = COLLISION_TYPES.SOLID;
    objects[2][12] = T.WALL_INT;
    collision[2][12] = COLLISION_TYPES.SOLID;

    // Piso de celda (más oscuro)
    for (let y = 3; y <= 7; y++) {
        for (let x = 11; x <= 12; x++) {
            floor[y][x] = T.JAIL_FLOOR;
        }
    }

    // Banca dentro de la celda
    objects[5][12] = T.BENCH_INT;
    collision[5][12] = COLLISION_TYPES.SOLID;

    // === LÁMPARA (centro) ===
    objects[5][6] = T.LAMP_INT;
    collision[5][6] = COLLISION_TYPES.SOLID;

    // === ALFOMBRA (frente a la puerta) ===
    objects[10][6] = T.RUG;
    objects[10][7] = T.RUG;

    interiorMaps['comisaria'] = {
        width: W,
        height: H,
        floor: floor,
        objects: objects,
        collision: collision,
        playerStart: { x: doorX, y: H - 2 },
        label: 'COMISARÍA - Interior',
        buildingRef: 'COMISARÍA',
        outsideDoor: { x: 5, y: 6 },   // Posición afuera al salir (frente a la puerta de la comisaría)
    };
}

// Interior de los APARTAMENTOS (16x14 tiles)
function generateApartamentosInterior() {
    const W = 16;
    const H = 14;
    const floor = [];
    const objects = [];
    const collision = [];

    for (let y = 0; y < H; y++) {
        floor[y] = [];
        objects[y] = [];
        collision[y] = [];
        for (let x = 0; x < W; x++) {
            if (y === 0 || y === H - 1 || x === 0 || x === W - 1) {
                floor[y][x] = T.FLOOR_TILE;
                objects[y][x] = T.WALL_INT;
                collision[y][x] = COLLISION_TYPES.SOLID;
            } else {
                floor[y][x] = T.FLOOR_TILE;
                objects[y][x] = T.EMPTY;
                collision[y][x] = COLLISION_TYPES.WALKABLE;
            }
        }
    }

    // Puerta de salida (centro abajo)
    const doorX = Math.floor(W / 2);
    objects[H - 1][doorX] = T.DOOR_INT;
    collision[H - 1][doorX] = COLLISION_TYPES.INTERACTIVE;

    // === PASILLO CENTRAL (horizontal, fila 6-7) ===
    for (let x = 1; x < W - 1; x++) {
        floor[6][x] = T.CARPET;
        floor[7][x] = T.CARPET;
    }

    // === PARED DIVISORIA HORIZONTAL (fila 5 y fila 8) ===
    for (let x = 1; x < W - 1; x++) {
        objects[5][x] = T.WALL_DIV;
        collision[5][x] = COLLISION_TYPES.SOLID;
        objects[8][x] = T.WALL_DIV;
        collision[8][x] = COLLISION_TYPES.SOLID;
    }
    // Puertas de apartamentos en el pasillo (ahora son WALKABLE para poder entrar)
    objects[5][4] = T.DOOR_APT;  // APT 1
    collision[5][4] = COLLISION_TYPES.WALKABLE;  // ← CAMBIO AQUÍ
    objects[5][11] = T.DOOR_APT; // APT 2
    collision[5][11] = COLLISION_TYPES.WALKABLE; // ← CAMBIO AQUÍ
    objects[8][4] = T.DOOR_APT;  // APT 3
    collision[8][4] = COLLISION_TYPES.WALKABLE;  // ← CAMBIO AQUÍ
    objects[8][11] = T.DOOR_APT; // APT 4
    collision[8][11] = COLLISION_TYPES.WALKABLE; // ← CAMBIO AQUÍ



    // === ESCALERAS (centro del pasillo) ===
    objects[6][7] = T.STAIRS;
    collision[6][7] = COLLISION_TYPES.SOLID;
    objects[6][8] = T.STAIRS;
    collision[6][8] = COLLISION_TYPES.SOLID;
    objects[7][7] = T.STAIRS;
    collision[7][7] = COLLISION_TYPES.SOLID;
    objects[7][8] = T.STAIRS;
    collision[7][8] = COLLISION_TYPES.SOLID;

    // === APARTAMENTO 1 (arriba-izquierda) ===
    // Piso de madera
    for (let y = 1; y <= 4; y++)
        for (let x = 1; x <= 7; x++)
            floor[y][x] = T.FLOOR_WOOD;

    // Cama
    objects[1][1] = T.BED;
    collision[1][1] = COLLISION_TYPES.SOLID;
    objects[1][2] = T.BED;
    collision[1][2] = COLLISION_TYPES.SOLID;
    // Cuadro sobre la cama
    objects[0][2] = T.PICTURE;
    // Mesita con lámpara
    objects[1][3] = T.LAMP_INT;
    collision[1][3] = COLLISION_TYPES.SOLID;
    // Sofá
    objects[3][1] = T.SOFA;
    collision[3][1] = COLLISION_TYPES.SOLID;
    objects[3][2] = T.SOFA;
    collision[3][2] = COLLISION_TYPES.SOLID;
    // TV frente al sofá
    objects[2][1] = T.TV;
    collision[2][1] = COLLISION_TYPES.SOLID;
    // Cocina (esquina derecha del apt 1)
    objects[1][6] = T.STOVE;
    collision[1][6] = COLLISION_TYPES.SOLID;
    objects[1][7] = T.SINK;
    collision[1][7] = COLLISION_TYPES.SOLID;
    objects[2][7] = T.FRIDGE;
    collision[2][7] = COLLISION_TYPES.SOLID;
    // Mesa
    objects[3][5] = T.TABLE;
    collision[3][5] = COLLISION_TYPES.SOLID;
    objects[4][5] = T.CHAIR;
    collision[4][5] = COLLISION_TYPES.SOLID;
    // Alfombra
    floor[3][3] = T.RUG;
    floor[3][4] = T.RUG;
    floor[4][3] = T.RUG;
    floor[4][4] = T.RUG;

    // === APARTAMENTO 2 (arriba-derecha) ===
    for (let y = 1; y <= 4; y++)
        for (let x = 9; x <= 14; x++)
            floor[y][x] = T.FLOOR_WOOD;

    // Cama
    objects[1][13] = T.BED;
    collision[1][13] = COLLISION_TYPES.SOLID;
    objects[1][14] = T.BED;
    collision[1][14] = COLLISION_TYPES.SOLID;
    // Cuadro
    objects[0][13] = T.PICTURE;
    // Librero
    objects[2][14] = T.BOOKSHELF;
    collision[2][14] = COLLISION_TYPES.SOLID;
    objects[3][14] = T.BOOKSHELF;
    collision[3][14] = COLLISION_TYPES.SOLID;
    // Sofá y TV
    objects[3][10] = T.SOFA;
    collision[3][10] = COLLISION_TYPES.SOLID;
    objects[3][11] = T.SOFA;
    collision[3][11] = COLLISION_TYPES.SOLID;
    objects[2][10] = T.TV;
    collision[2][10] = COLLISION_TYPES.SOLID;
    // Cocina
    objects[1][9] = T.FRIDGE;
    collision[1][9] = COLLISION_TYPES.SOLID;
    objects[1][10] = T.STOVE;
    collision[1][10] = COLLISION_TYPES.SOLID;
    objects[1][11] = T.SINK;
    collision[1][11] = COLLISION_TYPES.SOLID;
    // Planta
    objects[4][14] = T.PLANT_INT;
    collision[4][14] = COLLISION_TYPES.SOLID;
    // Alfombra
    floor[3][12] = T.RUG;
    floor[4][12] = T.RUG;

    // === APARTAMENTO 3 (abajo-izquierda) ===
    for (let y = 9; y <= 12; y++)
        for (let x = 1; x <= 7; x++)
            floor[y][x] = T.FLOOR_WOOD;

    // Cama
    objects[9][1] = T.BED;
    collision[9][1] = COLLISION_TYPES.SOLID;
    objects[9][2] = T.BED;
    collision[9][2] = COLLISION_TYPES.SOLID;
    // Cuadro
    objects[8][2] = T.PICTURE;
    // Escritorio
    objects[10][1] = T.DESK;
    collision[10][1] = COLLISION_TYPES.SOLID;
    objects[11][1] = T.CHAIR;
    collision[11][1] = COLLISION_TYPES.SOLID;
    // Cocina
    objects[9][6] = T.STOVE;
    collision[9][6] = COLLISION_TYPES.SOLID;
    objects[9][7] = T.FRIDGE;
    collision[9][7] = COLLISION_TYPES.SOLID;
    objects[10][7] = T.SINK;
    collision[10][7] = COLLISION_TYPES.SOLID;
    // Sofá
    objects[11][4] = T.SOFA;
    collision[11][4] = COLLISION_TYPES.SOLID;
    objects[11][5] = T.SOFA;
    collision[11][5] = COLLISION_TYPES.SOLID;
    // Toalla en pared
    objects[12][1] = T.TOWEL;
    collision[12][1] = COLLISION_TYPES.SOLID;
    // Alfombra
    floor[10][3] = T.RUG;
    floor[10][4] = T.RUG;
    floor[11][3] = T.RUG;

    // === APARTAMENTO 4 (abajo-derecha) - SOSPECHOSO ===
    for (let y = 9; y <= 12; y++)
        for (let x = 9; x <= 14; x++)
            floor[y][x] = T.FLOOR_WOOD;

    // Cama desordenada
    objects[9][13] = T.BED;
    collision[9][13] = COLLISION_TYPES.SOLID;
    objects[9][14] = T.BED;
    collision[9][14] = COLLISION_TYPES.SOLID;
    // Papeles tirados (sospechoso)
    objects[10][10] = T.PAPER;
    objects[11][12] = T.PAPER;
    objects[12][11] = T.PAPER;
    // Mesa con evidencia
    objects[10][13] = T.TABLE;
    collision[10][13] = COLLISION_TYPES.SOLID;
    objects[10][14] = T.CHAIR;
    collision[10][14] = COLLISION_TYPES.SOLID;
    // Librero
    objects[9][9] = T.BOOKSHELF;
    collision[9][9] = COLLISION_TYPES.SOLID;
    // Huella en el piso
    objects[12][10] = T.FOOTPRINT;
    // Cocina mínima
    objects[12][14] = T.FRIDGE;
    collision[12][14] = COLLISION_TYPES.SOLID;
    // Cuadro torcido
    objects[8][13] = T.PICTURE;

    // === DECORACIÓN DEL PASILLO ===
    // Lámparas en el pasillo
    objects[6][3] = T.LAMP_INT;
    collision[6][3] = COLLISION_TYPES.SOLID;
    objects[6][12] = T.LAMP_INT;
    collision[6][12] = COLLISION_TYPES.SOLID;
    // Planta decorativa
    objects[7][1] = T.PLANT_INT;
    collision[7][1] = COLLISION_TYPES.SOLID;
    objects[7][14] = T.PLANT_INT;
    collision[7][14] = COLLISION_TYPES.SOLID;
    // Alfombra del pasillo a la puerta de salida
    for (let y = 9; y <= 12; y++) {
        floor[y][8] = T.CARPET;
    }
    // Ventanas
    objects[0][4] = T.WINDOW;
    objects[0][7] = T.WINDOW;
    objects[0][10] = T.WINDOW;
    objects[0][13] = T.WINDOW;

    collision[7][9] = COLLISION_TYPES.INTERACTIVE;

    interiorMaps['apartamentos'] = {
        width: W,
        height: H,
        floor: floor,
        objects: objects,
        collision: collision,
        playerStart: { x: doorX, y: H - 2 },
        label: 'APARTAMENTOS - Interior',
        buildingRef: 'APARTAMENTOS',
        outsideDoor: { x: 5, y: 18 },
    };
}

// Interior del RESTAURANTE (14x12 tiles)
function generateRestauranteInterior() {
    const W = 14;
    const H = 12;
    const floor = [];
    const objects = [];
    const collision = [];

    for (let y = 0; y < H; y++) {
        floor[y] = [];
        objects[y] = [];
        collision[y] = [];
        for (let x = 0; x < W; x++) {
            if (y === 0 || y === H - 1 || x === 0 || x === W - 1) {
                floor[y][x] = T.FLOOR_CHECKER;
                objects[y][x] = T.WALL_INT;
                collision[y][x] = COLLISION_TYPES.SOLID;
            } else {
                // Piso ajedrezado elegante
                floor[y][x] = T.FLOOR_CHECKER;
                objects[y][x] = T.EMPTY;
                collision[y][x] = COLLISION_TYPES.WALKABLE;
            }
        }
    }

    // Puerta de salida (centro abajo)
    const doorX = Math.floor(W / 2);
    objects[H - 1][doorX] = T.DOOR_INT;
    collision[H - 1][doorX] = COLLISION_TYPES.INTERACTIVE;

    // Ventanas
    objects[0][3] = T.WINDOW;
    objects[0][6] = T.WINDOW;
    objects[0][10] = T.WINDOW;

    // === BARRA DEL BAR (izquierda, vertical) ===
    for (let y = 2; y <= 6; y++) {
        objects[y][1] = T.BAR_COUNTER;
        collision[y][1] = COLLISION_TYPES.SOLID;
    }
    // Banquillos frente a la barra
    objects[2][2] = T.BAR_STOOL;
    collision[2][2] = COLLISION_TYPES.SOLID;
    objects[4][2] = T.BAR_STOOL;
    collision[4][2] = COLLISION_TYPES.SOLID;
    objects[6][2] = T.BAR_STOOL;
    collision[6][2] = COLLISION_TYPES.SOLID;

    // Estante de vinos detrás de la barra (pared izquierda)
    objects[1][0] = T.WINE_RACK;
    collision[1][0] = COLLISION_TYPES.SOLID;
    objects[2][0] = T.WINE_RACK;
    collision[2][0] = COLLISION_TYPES.SOLID;
    objects[3][0] = T.WINE_RACK;
    collision[3][0] = COLLISION_TYPES.SOLID;

    // === MENÚ EN LA PARED ===
    objects[0][2] = T.MENU_BOARD;
    collision[0][2] = COLLISION_TYPES.SOLID;

    // === ZONA DE COMEDOR (centro-derecha) ===
    // Mesa 1 (4 personas) con vela
    objects[2][5] = T.TABLE;
    collision[2][5] = COLLISION_TYPES.SOLID;
    objects[2][6] = T.TABLE;
    collision[2][6] = COLLISION_TYPES.SOLID;
    objects[1][5] = T.CHAIR;
    collision[1][5] = COLLISION_TYPES.SOLID;
    objects[1][6] = T.CHAIR;
    collision[1][6] = COLLISION_TYPES.SOLID;
    objects[3][5] = T.CHAIR;
    collision[3][5] = COLLISION_TYPES.SOLID;
    objects[3][6] = T.CHAIR;
    collision[3][6] = COLLISION_TYPES.SOLID;
    // Platos y vela en mesa 1
    objects[2][5] = T.CANDLE;
    collision[2][5] = COLLISION_TYPES.SOLID;
    objects[2][6] = T.PLATES;
    collision[2][6] = COLLISION_TYPES.SOLID;

    // Mesa 2 (2 personas)
    objects[2][9] = T.TABLE;
    collision[2][9] = COLLISION_TYPES.SOLID;
    objects[1][9] = T.CHAIR;
    collision[1][9] = COLLISION_TYPES.SOLID;
    objects[3][9] = T.CHAIR;
    collision[3][9] = COLLISION_TYPES.SOLID;
    objects[2][9] = T.CANDLE;
    collision[2][9] = COLLISION_TYPES.SOLID;

    // Mesa 3 (4 personas)
    objects[2][11] = T.TABLE;
    collision[2][11] = COLLISION_TYPES.SOLID;
    objects[2][12] = T.TABLE;
    collision[2][12] = COLLISION_TYPES.SOLID;
    objects[1][11] = T.CHAIR;
    collision[1][11] = COLLISION_TYPES.SOLID;
    objects[1][12] = T.CHAIR;
    collision[1][12] = COLLISION_TYPES.SOLID;
    objects[3][11] = T.CHAIR;
    collision[3][11] = COLLISION_TYPES.SOLID;
    objects[3][12] = T.CHAIR;
    collision[3][12] = COLLISION_TYPES.SOLID;
    objects[2][11] = T.PLATES;
    collision[2][11] = COLLISION_TYPES.SOLID;

    // Mesa 4 (esquina der abajo)
    objects[5][10] = T.TABLE;
    collision[5][10] = COLLISION_TYPES.SOLID;
    objects[5][11] = T.TABLE;
    collision[5][11] = COLLISION_TYPES.SOLID;
    objects[4][10] = T.CHAIR;
    collision[4][10] = COLLISION_TYPES.SOLID;
    objects[6][11] = T.CHAIR;
    collision[6][11] = COLLISION_TYPES.SOLID;
    objects[5][10] = T.CANDLE;
    collision[5][10] = COLLISION_TYPES.SOLID;

    // Mesa 5 (cerca de la puerta)
    objects[8][4] = T.TABLE;
    collision[8][4] = COLLISION_TYPES.SOLID;
    objects[8][5] = T.TABLE;
    collision[8][5] = COLLISION_TYPES.SOLID;
    objects[9][4] = T.CHAIR;
    collision[9][4] = COLLISION_TYPES.SOLID;
    objects[9][5] = T.CHAIR;
    collision[9][5] = COLLISION_TYPES.SOLID;
    objects[8][4] = T.PLATES;
    collision[8][4] = COLLISION_TYPES.SOLID;

    // Mesa 6
    objects[8][9] = T.TABLE;
    collision[8][9] = COLLISION_TYPES.SOLID;
    objects[8][10] = T.TABLE;
    collision[8][10] = COLLISION_TYPES.SOLID;
    objects[9][9] = T.CHAIR;
    collision[9][9] = COLLISION_TYPES.SOLID;
    objects[9][10] = T.CHAIR;
    collision[9][10] = COLLISION_TYPES.SOLID;
    objects[8][10] = T.CANDLE;
    collision[8][10] = COLLISION_TYPES.SOLID;

    // === COCINA (fondo, filas 8-10, izquierda detrás de barra) ===
    // Pared divisoria parcial (separa cocina)
    objects[7][1] = T.WALL_DIV;
    collision[7][1] = COLLISION_TYPES.SOLID;
    objects[7][2] = T.WALL_DIV;
    collision[7][2] = COLLISION_TYPES.SOLID;
    // Puerta de cocina
    objects[7][3] = T.DOOR_APT;
    collision[7][3] = COLLISION_TYPES.SOLID;

    // Estufa industrial
    objects[8][1] = T.STOVE;
    collision[8][1] = COLLISION_TYPES.SOLID;
    objects[8][2] = T.STOVE;
    collision[8][2] = COLLISION_TYPES.SOLID;
    // Campana de cocina (encima)
    objects[7][0] = T.KITCHEN_HOOD;
    collision[7][0] = COLLISION_TYPES.SOLID;

    // Fregadero
    objects[9][1] = T.SINK;
    collision[9][1] = COLLISION_TYPES.SOLID;
    // Refrigerador
    objects[10][1] = T.FRIDGE;
    collision[10][1] = COLLISION_TYPES.SOLID;
    // Mostrador de preparación
    objects[10][2] = T.COUNTER;
    collision[10][2] = COLLISION_TYPES.SOLID;
    objects[10][3] = T.COUNTER;
    collision[10][3] = COLLISION_TYPES.SOLID;

    // === DECORACIÓN ===
    // Plantas decorativas
    objects[10][12] = T.PLANT_INT;
    collision[10][12] = COLLISION_TYPES.SOLID;
    objects[4][12] = T.PLANT_INT;
    collision[4][12] = COLLISION_TYPES.SOLID;

    // Cuadros en las paredes
    objects[0][5] = T.PICTURE;
    objects[0][8] = T.PICTURE;
    objects[0][12] = T.PICTURE;

    // Lámparas de ambiente
    objects[5][6] = T.LAMP_INT;
    collision[5][6] = COLLISION_TYPES.SOLID;

    // Alfombra en la entrada
    objects[10][6] = T.RUG;
    objects[10][7] = T.RUG;

    // Reloj
    objects[0][1] = T.CLOCK;
    collision[0][1] = COLLISION_TYPES.SOLID;

    interiorMaps['restaurante'] = {
        width: W,
        height: H,
        floor: floor,
        objects: objects,
        collision: collision,
        playerStart: { x: doorX, y: H - 2 },
        label: 'RESTAURANTE - Interior',
        buildingRef: 'RESTAURANTE',
        outsideDoor: { x: 21, y: 18 },
    };
}

// Interior del HOSPITAL (16x12 tiles)
function generateHospitalInterior() {
    const W = 16;
    const H = 12;
    const floor = [];
    const objects = [];
    const collision = [];

    for (let y = 0; y < H; y++) {
        floor[y] = [];
        objects[y] = [];
        collision[y] = [];
        for (let x = 0; x < W; x++) {
            if (y === 0 || y === H - 1 || x === 0 || x === W - 1) {
                floor[y][x] = T.FLOOR_HOSPITAL;
                objects[y][x] = T.WALL_INT;
                collision[y][x] = COLLISION_TYPES.SOLID;
            } else {
                floor[y][x] = T.FLOOR_HOSPITAL;
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
    objects[0][7] = T.WINDOW;
    objects[0][12] = T.WINDOW;

    // Cruz médica en la pared
    objects[0][5] = T.MEDICAL_CROSS;
    collision[0][5] = COLLISION_TYPES.SOLID;
    objects[0][10] = T.MEDICAL_CROSS;
    collision[0][10] = COLLISION_TYPES.SOLID;

    // === RECEPCIÓN (parte inferior, frente a la puerta) ===
    objects[9][5] = T.RECEPTION_DESK;
    collision[9][5] = COLLISION_TYPES.SOLID;
    objects[9][6] = T.RECEPTION_DESK;
    collision[9][6] = COLLISION_TYPES.SOLID;
    objects[9][7] = T.RECEPTION_DESK;
    collision[9][7] = COLLISION_TYPES.SOLID;
    objects[9][8] = T.RECEPTION_DESK;
    collision[9][8] = COLLISION_TYPES.SOLID;
    objects[9][9] = T.RECEPTION_DESK;
    collision[9][9] = COLLISION_TYPES.SOLID;

    // Computadora en recepción
    objects[9][7] = T.COMPUTER;
    collision[9][7] = COLLISION_TYPES.SOLID;

    // Silla de recepción
    objects[10][7] = T.CHAIR;
    collision[10][7] = COLLISION_TYPES.SOLID;

    // Silla de ruedas en espera
    objects[10][3] = T.WHEELCHAIR;
    collision[10][3] = COLLISION_TYPES.SOLID;

    // Planta decorativa
    objects[10][11] = T.PLANT_INT;
    collision[10][11] = COLLISION_TYPES.SOLID;

    // === PARED DIVISORIA HORIZONTAL (separa recepción de habitaciones) ===
    for (let x = 1; x < W - 1; x++) {
        if (x !== 4 && x !== 11) { // Dejar pasillos
            objects[7][x] = T.WALL_DIV;
            collision[7][x] = COLLISION_TYPES.SOLID;
        }
    }

    // === HABITACIÓN 1 (arriba-izquierda) ===
    // Pared divisoria vertical
    for (let y = 1; y < 7; y++) {
        if (y !== 4) { // Pasillo
            objects[y][5] = T.WALL_DIV;
            collision[y][5] = COLLISION_TYPES.SOLID;
        }
    }

    // Cama de hospital
    objects[1][1] = T.HOSPITAL_BED;
    collision[1][1] = COLLISION_TYPES.SOLID;
    objects[1][2] = T.HOSPITAL_BED;
    collision[1][2] = COLLISION_TYPES.SOLID;

    // Soporte de suero al lado de la cama
    objects[1][3] = T.IV_STAND;
    collision[1][3] = COLLISION_TYPES.SOLID;

    // Monitor cardíaco
    objects[2][3] = T.MONITOR;
    collision[2][3] = COLLISION_TYPES.SOLID;

    // Cortina divisoria
    objects[3][1] = T.CURTAIN;
    collision[3][1] = COLLISION_TYPES.SOLID;
    objects[3][2] = T.CURTAIN;
    collision[3][2] = COLLISION_TYPES.SOLID;

    // Segunda cama (debajo de la cortina)
    objects[4][1] = T.HOSPITAL_BED;
    collision[4][1] = COLLISION_TYPES.SOLID;
    objects[4][2] = T.HOSPITAL_BED;
    collision[4][2] = COLLISION_TYPES.SOLID;

    // Soporte de suero
    objects[4][3] = T.IV_STAND;
    collision[4][3] = COLLISION_TYPES.SOLID;

    // Mesita con lámpara
    objects[5][1] = T.LAMP_INT;
    collision[5][1] = COLLISION_TYPES.SOLID;

    // === HABITACIÓN 2 (arriba-derecha) ===
    // Pared divisoria vertical
    for (let y = 1; y < 7; y++) {
        if (y !== 4) { // Pasillo
            objects[y][10] = T.WALL_DIV;
            collision[y][10] = COLLISION_TYPES.SOLID;
        }
    }

    // Cama de hospital
    objects[1][11] = T.HOSPITAL_BED;
    collision[1][11] = COLLISION_TYPES.SOLID;
    objects[1][12] = T.HOSPITAL_BED;
    collision[1][12] = COLLISION_TYPES.SOLID;

    // Soporte de suero
    objects[1][13] = T.IV_STAND;
    collision[1][13] = COLLISION_TYPES.SOLID;

    // Monitor cardíaco
    objects[2][13] = T.MONITOR;
    collision[2][13] = COLLISION_TYPES.SOLID;

    // Cortina
    objects[3][11] = T.CURTAIN;
    collision[3][11] = COLLISION_TYPES.SOLID;
    objects[3][12] = T.CURTAIN;
    collision[3][12] = COLLISION_TYPES.SOLID;

    // Camilla
    objects[4][11] = T.STRETCHER;
    collision[4][11] = COLLISION_TYPES.SOLID;
    objects[4][12] = T.STRETCHER;
    collision[4][12] = COLLISION_TYPES.SOLID;

    // Silla de ruedas al lado
    objects[5][14] = T.WHEELCHAIR;
    collision[5][14] = COLLISION_TYPES.SOLID;

    // === PASILLO CENTRAL (entre las divisioneas) ===
    // Gabinete de medicinas en pared central
    objects[1][6] = T.MEDICINE_CABINET;
    collision[1][6] = COLLISION_TYPES.SOLID;
    objects[1][9] = T.MEDICINE_CABINET;
    collision[1][9] = COLLISION_TYPES.SOLID;

    // Camilla en el pasillo
    objects[3][7] = T.STRETCHER;
    collision[3][7] = COLLISION_TYPES.SOLID;
    objects[3][8] = T.STRETCHER;
    collision[3][8] = COLLISION_TYPES.SOLID;

    // Gabinete de medicinas extra
    objects[5][6] = T.MEDICINE_CABINET;
    collision[5][6] = COLLISION_TYPES.SOLID;
    objects[5][9] = T.MEDICINE_CABINET;
    collision[5][9] = COLLISION_TYPES.SOLID;

    // Reloj en la pared
    objects[0][14] = T.CLOCK;
    collision[0][14] = COLLISION_TYPES.SOLID;

    // === SALA DE ESPERA (debajo de la pared divisoria, lados) ===
    // Bancas izquierda
    objects[8][1] = T.BENCH_INT;
    collision[8][1] = COLLISION_TYPES.SOLID;
    objects[8][2] = T.BENCH_INT;
    collision[8][2] = COLLISION_TYPES.SOLID;

    // Bancas derecha  
    objects[8][12] = T.BENCH_INT;
    collision[8][12] = COLLISION_TYPES.SOLID;
    objects[8][13] = T.BENCH_INT;
    collision[8][13] = COLLISION_TYPES.SOLID;



    // Gabinete de emergencia
    objects[7][14] = T.MEDICINE_CABINET;
    collision[7][14] = COLLISION_TYPES.SOLID;

    interiorMaps['hospital'] = {
        width: W,
        height: H,
        floor: floor,
        objects: objects,
        collision: collision,
        playerStart: { x: doorX, y: H - 2 },
        label: 'HOSPITAL - Interior',
        buildingRef: 'HOSPITAL',
        outsideDoor: { x: 36, y: 18 },
    };
}

// Interior de la CASA EMBRUJADA (12x10 tiles)
function generateCasaInterior() {
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
            if (y === 0 || y === H - 1 || x === 0 || x === W - 1) {
                floor[y][x] = T.FLOOR_DARK;
                objects[y][x] = T.WALL_DARK;
                collision[y][x] = COLLISION_TYPES.SOLID;
            } else {
                floor[y][x] = T.FLOOR_DARK;
                objects[y][x] = T.EMPTY;
                collision[y][x] = COLLISION_TYPES.WALKABLE;
            }
        }
    }

    // Puerta de salida (centro abajo)
    const doorX = Math.floor(W / 2);
    objects[H - 1][doorX] = T.DOOR_INT;
    collision[H - 1][doorX] = COLLISION_TYPES.INTERACTIVE;

    // Ventanas (sucias/tapadas)
    objects[0][3] = T.WINDOW;
    objects[0][8] = T.WINDOW;

    // === CHIMENEA (centro pared superior) ===
    objects[0][5] = T.FIREPLACE;
    collision[0][5] = COLLISION_TYPES.SOLID;
    objects[0][6] = T.FIREPLACE;
    collision[0][6] = COLLISION_TYPES.SOLID;

    // === TELARAÑAS (esquinas) ===
    objects[1][1] = T.COBWEB;
    objects[1][10] = T.COBWEB;
    objects[8][1] = T.COBWEB;
    objects[8][10] = T.COBWEB;

    // === SALA PRINCIPAL (izquierda) ===
    // Sofá viejo
    objects[3][1] = T.SOFA;
    collision[3][1] = COLLISION_TYPES.SOLID;
    objects[3][2] = T.SOFA;
    collision[3][2] = COLLISION_TYPES.SOLID;

    // Mesa con periódicos
    objects[4][2] = T.TABLE;
    collision[4][2] = COLLISION_TYPES.SOLID;
    objects[4][3] = T.NEWSPAPER;
    collision[4][3] = COLLISION_TYPES.SOLID;

    // Candelabro de pie
    objects[2][4] = T.CANDELABRA;
    collision[2][4] = COLLISION_TYPES.SOLID;

    // Alfombra vieja
    objects[5][2] = T.RUG;
    objects[5][3] = T.RUG;
    objects[6][2] = T.RUG;
    objects[6][3] = T.RUG;

    // === PARED DIVISORIA ===
    for (let y = 1; y < 7; y++) {
        if (y !== 4) {
            objects[y][6] = T.WALL_DIV;
            collision[y][6] = COLLISION_TYPES.SOLID;
        }
    }

    // === HABITACIÓN SECRETA (derecha) ===
    // Escritorio con papeles sospechosos
    objects[2][8] = T.DESK;
    collision[2][8] = COLLISION_TYPES.SOLID;
    objects[2][9] = T.DESK;
    collision[2][9] = COLLISION_TYPES.SOLID;
    objects[3][8] = T.CHAIR;
    collision[3][8] = COLLISION_TYPES.SOLID;

    // Papeles/notas en el escritorio
    objects[2][9] = T.PAPER;
    collision[2][9] = COLLISION_TYPES.SOLID;

    // Soga (evidencia clave)
    objects[5][8] = T.ROPE;

    // Barriles y cajas
    objects[1][7] = T.BARREL;
    collision[1][7] = COLLISION_TYPES.SOLID;
    objects[1][8] = T.CRATE;
    collision[1][8] = COLLISION_TYPES.SOLID;
    objects[1][9] = T.CRATE;
    collision[1][9] = COLLISION_TYPES.SOLID;

    // Trofeo sospechoso (objeto pesado - coincide con pista 3)
    objects[4][9] = T.TROPHY;
    collision[4][9] = COLLISION_TYPES.SOLID;

    // Espejo roto en la pared derecha
    objects[3][10] = T.MIRROR;
    collision[3][10] = COLLISION_TYPES.SOLID;

    // Manchas de sangre (sutiles)
    objects[6][8] = T.BLOOD2;
    objects[5][9] = T.FOOTPRINT;

    // Librero con documentos
    objects[5][7] = T.BOOKSHELF;
    collision[5][7] = COLLISION_TYPES.SOLID;
    objects[6][7] = T.BOOKSHELF;
    collision[6][7] = COLLISION_TYPES.SOLID;

    // === PASILLO INFERIOR ===
    // Lámpara
    objects[7][3] = T.LAMP_INT;
    collision[7][3] = COLLISION_TYPES.SOLID;

    // Planta marchita
    objects[7][9] = T.PLANT_INT;
    collision[7][9] = COLLISION_TYPES.SOLID;

    // Cuadro siniestro en la pared
    objects[6][0] = T.PICTURE;
    collision[6][0] = COLLISION_TYPES.SOLID;

    // Marcador de evidencia
    objects[5][8] = T.MARKER_NUM;
    objects[6][9] = T.MARKER_NUM;

    interiorMaps['casa'] = {
        width: W,
        height: H,
        floor: floor,
        objects: objects,
        collision: collision,
        playerStart: { x: doorX, y: H - 2 },
        label: 'CASA EMBRUJADA - Interior',
        buildingRef: 'CASA EMBRUJADA',
        outsideDoor: { x: 36, y: 29 },
    };
}

// Interior de la BIBLIOTECA (14x12 tiles)
function generateBibliotecaInterior() {
    const W = 14;
    const H = 12;
    const floor = [];
    const objects = [];
    const collision = [];

    for (let y = 0; y < H; y++) {
        floor[y] = [];
        objects[y] = [];
        collision[y] = [];
        for (let x = 0; x < W; x++) {
            if (y === 0 || y === H - 1 || x === 0 || x === W - 1) {
                floor[y][x] = T.FLOOR_CARPET;
                objects[y][x] = T.WALL_INT;
                collision[y][x] = COLLISION_TYPES.SOLID;
            } else {
                floor[y][x] = T.FLOOR_CARPET;
                objects[y][x] = T.EMPTY;
                collision[y][x] = COLLISION_TYPES.WALKABLE;
            }
        }
    }

    // Puerta de salida (centro abajo)
    const doorX = Math.floor(W / 2);
    objects[H - 1][doorX] = T.DOOR_INT;
    collision[H - 1][doorX] = COLLISION_TYPES.INTERACTIVE;

    // Ventanas
    objects[0][3] = T.WINDOW;
    objects[0][6] = T.WINDOW;
    objects[0][10] = T.WINDOW;

    // === ESTANTES DE LIBROS (filas laterales, pared izquierda) ===
    objects[1][1] = T.BOOKSHELF_TALL;
    collision[1][1] = COLLISION_TYPES.SOLID;
    objects[2][1] = T.BOOKSHELF_TALL;
    collision[2][1] = COLLISION_TYPES.SOLID;
    objects[3][1] = T.BOOKSHELF_TALL;
    collision[3][1] = COLLISION_TYPES.SOLID;
    objects[4][1] = T.BOOKSHELF_TALL;
    collision[4][1] = COLLISION_TYPES.SOLID;
    objects[5][1] = T.BOOKSHELF_TALL;
    collision[5][1] = COLLISION_TYPES.SOLID;

    // === ESTANTES DE LIBROS (pared derecha) ===
    objects[1][12] = T.BOOKSHELF_TALL;
    collision[1][12] = COLLISION_TYPES.SOLID;
    objects[2][12] = T.BOOKSHELF_TALL;
    collision[2][12] = COLLISION_TYPES.SOLID;
    objects[3][12] = T.BOOKSHELF_TALL;
    collision[3][12] = COLLISION_TYPES.SOLID;


    objects[3][4] = T.BOOKSHELF;
    collision[3][4] = COLLISION_TYPES.SOLID;

    // Estante derecho (solo uno)
    objects[3][9] = T.BOOKSHELF;
    collision[3][9] = COLLISION_TYPES.SOLID;

    // === ZONA DE LECTURA (parte inferior) ===
    // Mesa de lectura 1 (izquierda)
    objects[7][2] = T.READING_DESK;
    collision[7][2] = COLLISION_TYPES.SOLID;
    objects[7][3] = T.READING_DESK;
    collision[7][3] = COLLISION_TYPES.SOLID;
    objects[7][4] = T.READING_DESK;
    collision[7][4] = COLLISION_TYPES.SOLID;
    // Lámpara de escritorio encima
    objects[7][3] = T.STUDY_LAMP;
    collision[7][3] = COLLISION_TYPES.SOLID;
    // Sillas
    objects[6][2] = T.CHAIR;
    collision[6][2] = COLLISION_TYPES.SOLID;
    objects[6][4] = T.CHAIR;
    collision[6][4] = COLLISION_TYPES.SOLID;
    objects[8][2] = T.CHAIR;
    collision[8][2] = COLLISION_TYPES.SOLID;
    objects[8][4] = T.CHAIR;
    collision[8][4] = COLLISION_TYPES.SOLID;

    // Mesa de lectura 2 (derecha)
    objects[7][9] = T.READING_DESK;
    collision[7][9] = COLLISION_TYPES.SOLID;
    objects[7][10] = T.READING_DESK;
    collision[7][10] = COLLISION_TYPES.SOLID;
    objects[7][11] = T.READING_DESK;
    collision[7][11] = COLLISION_TYPES.SOLID;
    // Lámpara
    objects[7][10] = T.STUDY_LAMP;
    collision[7][10] = COLLISION_TYPES.SOLID;
    // Sillas
    objects[6][9] = T.CHAIR;
    collision[6][9] = COLLISION_TYPES.SOLID;
    objects[6][11] = T.CHAIR;
    collision[6][11] = COLLISION_TYPES.SOLID;
    objects[8][9] = T.CHAIR;
    collision[8][9] = COLLISION_TYPES.SOLID;
    objects[8][11] = T.CHAIR;
    collision[8][11] = COLLISION_TYPES.SOLID;

    // Pilas de libros en las mesas
    objects[7][2] = T.BOOK_PILE;
    collision[7][2] = COLLISION_TYPES.SOLID;
    objects[7][11] = T.BOOK_PILE;
    collision[7][11] = COLLISION_TYPES.SOLID;

    // === MOSTRADOR DE RECEPCIÓN (centro-abajo) ===
    objects[9][5] = T.COUNTER;
    collision[9][5] = COLLISION_TYPES.SOLID;
    objects[9][6] = T.COUNTER;
    collision[9][6] = COLLISION_TYPES.SOLID;
    objects[9][7] = T.COUNTER;
    collision[9][7] = COLLISION_TYPES.SOLID;
    objects[9][8] = T.COUNTER;
    collision[9][8] = COLLISION_TYPES.SOLID;

    // Computadora en el mostrador
    objects[9][6] = T.COMPUTER;
    collision[9][6] = COLLISION_TYPES.SOLID;

    // === FICHERO / CATÁLOGO (izquierda del mostrador) ===
    objects[9][2] = T.CARD_CATALOG;
    collision[9][2] = COLLISION_TYPES.SOLID;
    objects[9][3] = T.CARD_CATALOG;
    collision[9][3] = COLLISION_TYPES.SOLID;

    // === ZONA ESPECIAL (arriba-centro) ===
    // Globo terráqueo
    objects[1][6] = T.GLOBE;
    collision[1][6] = COLLISION_TYPES.SOLID;

    // Atlas/mapa en la pared superior
    objects[0][4] = T.ATLAS;
    collision[0][4] = COLLISION_TYPES.SOLID;
    objects[0][8] = T.ATLAS;
    collision[0][8] = COLLISION_TYPES.SOLID;

    // === RINCÓN DE LECTURA (arriba-derecha) ===
    objects[1][10] = T.ARMCHAIR;
    collision[1][10] = COLLISION_TYPES.SOLID;
    objects[1][11] = T.LAMP_INT;
    collision[1][11] = COLLISION_TYPES.SOLID;

    // Planta decorativa
    objects[1][3] = T.PLANT_INT;
    collision[1][3] = COLLISION_TYPES.SOLID;

    // Alfombra en zona de lectura
    objects[8][3] = T.RUG;
    objects[8][10] = T.RUG;

    // Reloj en la pared
    objects[0][12] = T.CLOCK;
    collision[0][12] = COLLISION_TYPES.SOLID;

    // Sillón de lectura abajo
    objects[10][1] = T.ARMCHAIR;
    collision[10][1] = COLLISION_TYPES.SOLID;
    objects[10][12] = T.ARMCHAIR;
    collision[10][12] = COLLISION_TYPES.SOLID;

    interiorMaps['biblioteca'] = {
        width: W,
        height: H,
        floor: floor,
        objects: objects,
        collision: collision,
        playerStart: { x: doorX, y: H - 2 },
        label: 'BIBLIOTECA - Interior',
        buildingRef: 'BIBLIOTECA',
        outsideDoor: { x: 36, y: 6 },
    };
}

// Posición inicial del jugador (en la calle, cerca de la comisaría)
const PLAYER_START = { x: 8, y: 10 };
