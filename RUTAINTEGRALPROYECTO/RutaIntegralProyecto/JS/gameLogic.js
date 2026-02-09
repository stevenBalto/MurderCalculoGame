// 1. REFERENCIAS AL DOM (Originales)
const progressBar = document.getElementById("progressBar");
const obstacle = document.getElementById("obstacle");
const decisionPanel = document.getElementById("decisionPanel");
const feedback = document.getElementById("feedback");
const options = document.querySelectorAll(".option-btn");
const character = document.getElementById("character");

// PERSONAJES - Config con idle de espaldas
const imgBase = '../assets/img/personajes/';
const characterSpriteSets = {
    'estudiante': {
        idle: imgBase + 'Male person/PNG/Poses/character_malePerson_back.png',
        idleFallback: imgBase + 'Male person/PNG/Poses/character_malePerson_idle.png',
    },
    'matematico': {
        idle: imgBase + 'Female person/PNG/Poses/character_femalePerson_back.png',
        idleFallback: imgBase + 'Female person/PNG/Poses/character_femalePerson_idle.png',
    },
    'ingeniero':  {
        idle: imgBase + 'Male adventurer/PNG/Poses/character_maleAdventurer_back.png',
        idleFallback: imgBase + 'Male adventurer/PNG/Poses/character_maleAdventurer_idle.png',
    },
    'cientifico': {
        idle: imgBase + 'Female adventurer/PNG/Poses/character_femaleAdventurer_back.png',
        idleFallback: imgBase + 'Female adventurer/PNG/Poses/character_femaleAdventurer_idle.png',
    },
    'genio':      {
        idle: imgBase + 'Zombie/PNG/Poses/character_zombie_back.png',
        idleFallback: imgBase + 'Zombie/PNG/Poses/character_zombie_idle.png',
    },
    'robot':      {
        idle: imgBase + 'Robot/PNG/Poses/character_robot_back.png',
        idleFallback: imgBase + 'Robot/PNG/Poses/character_robot_idle.png',
    }
};

function applyCharacterFrame(spriteUrl) {
    if (!character) return;
    character.style.backgroundImage = `url(${spriteUrl})`;
    character.style.backgroundSize = 'contain';
    character.style.backgroundRepeat = 'no-repeat';
    character.style.backgroundPosition = 'center bottom';
    character.innerHTML = '';
    const img = document.createElement('img');
    img.src = spriteUrl;
    img.alt = 'Personaje';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.imageRendering = 'pixelated';
    character.appendChild(img);
}

// Cargar personaje seleccionado desde localStorage
function loadSelectedCharacter() {
    const selectedCharacterId = localStorage.getItem('selectedCharacter') || 'estudiante';
    const setConfig = characterSpriteSets[selectedCharacterId] || characterSpriteSets['estudiante'];
    const idleSprite = setConfig.idle;
    const fallback = setConfig.idleFallback;

    console.log('Intentando cargar personaje:', selectedCharacterId);
    console.log('Sprite idle:', idleSprite);

    // Mostrar frame idle de espaldas de inmediato
    applyCharacterFrame(idleSprite);

    // Si falla el sprite de espalda, usar fallback frontal
    const imgTest = new Image();
    imgTest.src = idleSprite;
    imgTest.onerror = () => {
        console.warn('No se encontró sprite de espalda, usando fallback frontal');
        applyCharacterFrame(fallback);
    };
    imgTest.onload = () => {
        // Activar animación de bobbing (CSS)
        if (character) character.classList.add('running');
    };
}

// 2. CONFIGURACIÓN DE AUDIO (Integrada)
// Usamos ../ porque game.html está dentro de la carpeta Pages
const bgMusic = new Audio('../assets/sound/audio2.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.4;

// 3. VARIABLES DE ESTADO (Originales)
let progress = 0;
let progressInterval = null;
const checkpoints = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
let currentCheckpointIndex = 0;

// 4. FUNCIONES DE AUDIO
const habilitarAudio = () => {
    if (bgMusic.paused) {
        bgMusic.play().catch(e => console.log("Interacción necesaria para sonar."));
    }
};

// 5. LÓGICA DE PROGRESO (Original)
function startProgress() {
    progressInterval = setInterval(() => {
        const currentStop = checkpoints[currentCheckpointIndex];

        if (progress < currentStop) {
            progress += 1;
            progressBar.style.width = progress + "%";
        } else {
            stopProgress();
            showObstacle();
            showDecision();
        }
    }, 300);
}

function stopProgress() {
    clearInterval(progressInterval);
}

function showObstacle() {
    obstacle.classList.add("active");
}

function showDecision() {
    decisionPanel.classList.add("active");
    feedback.textContent = "";
}

// 6. MANEJO DE OPCIONES (Original + Activación de Audio)
options.forEach(option => {
    option.addEventListener("click", () => {
        // Aprovechamos el clic en la opción para asegurar que el audio suene
        habilitarAudio();

        const isCorrect = option.dataset.correct === "true";

        if (isCorrect) {
            decisionPanel.classList.remove("active");
            obstacle.classList.remove("active");

            currentCheckpointIndex++;

            if (currentCheckpointIndex < checkpoints.length) {
                resumeProgress();
            } else {
                finishGame();
            }
        } else {
            feedback.textContent = "Incorrecto. Intenta otra opción.";
        }
    });
});

function resumeProgress() {
    startProgress();
}

function finishGame() {
    feedback.textContent = "¡Has completado la Ruta Integral!";
    // Opcional: bajar volumen al terminar
    bgMusic.volume = 0.2; 
}

// 7. INICIO AL CARGAR (Con manejo de Autoplay)
window.addEventListener("load", () => {
    // Cargar el personaje seleccionado
    loadSelectedCharacter();
    
    // Intentar sonar apenas carga (funciona si el clic en index.html fue suficiente)
    bgMusic.play().catch(() => {
        console.log("El navegador bloqueó el autoplay. Sonará al interactuar.");
        // Respaldo: Activar con el primer clic en cualquier parte si falla lo anterior
        document.addEventListener('click', habilitarAudio, { once: true });
    });
    
    startProgress();
});