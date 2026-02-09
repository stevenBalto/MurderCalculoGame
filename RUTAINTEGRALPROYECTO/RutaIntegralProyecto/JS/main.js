// JS/main.js
const startSfx = new Audio('assets/sound/start_button.mp3');

// Variables para selección de personaje
let selectedCharacter = 'estudiante';
const imgBase = 'assets/img/personajes/';
const characters = {
    'estudiante': { name: 'Estudiante Básico', description: 'Personaje ideal para comenzar tu aventura matemática', img: imgBase + 'Male person/PNG/Poses/character_malePerson_idle.png' },
    'matematico': { name: 'Matemático', description: 'Experto en cálculos y fórmulas avanzadas', img: imgBase + 'Female person/PNG/Poses/character_femalePerson_idle.png' },
    'ingeniero':  { name: 'Ingeniero', description: 'Resuelve problemas complejos con precisión', img: imgBase + 'Male adventurer/PNG/Poses/character_maleAdventurer_idle.png' },
    'cientifico': { name: 'Científico', description: 'Maestro de las fórmulas y ecuaciones', img: imgBase + 'Female adventurer/PNG/Poses/character_femaleAdventurer_idle.png' },
    'genio':      { name: 'Genio Matemático', description: 'El maestro supremo de las matemáticas', img: imgBase + 'Zombie/PNG/Poses/character_zombie_idle.png' },
    'robot':      { name: 'IA Calculator', description: 'Inteligencia artificial matemática', img: imgBase + 'Robot/PNG/Poses/character_robot_idle.png' }
};

// Referencias DOM
const btnStart = document.getElementById("btnStart");
const btnInfo = document.getElementById("btnInfo");
const btnBack = document.getElementById("btnBack");
const characterPlatform = document.querySelector('.character-platform');
const characterModal = document.getElementById('characterModal');
const closeModal = document.getElementById('closeModal');
const confirmSelection = document.getElementById('confirmSelection');
const characterName = document.getElementById('characterName');
const characterDesc = document.getElementById('characterDesc');
const selectedCharacterElement = document.getElementById('selectedCharacter');

// Inicializar pantalla
function initializeCharacterScreen() {
    updateCharacterDisplay();
    setupEventListeners();
}

// Actualizar display del personaje seleccionado
function updateCharacterDisplay() {
    const char = characters[selectedCharacter];
    if (char) {
        if (characterName) characterName.textContent = char.name;
        if (characterDesc) characterDesc.textContent = char.description;
        const avatar = document.querySelector('.character-avatar');
        if (avatar) {
            avatar.innerHTML = `<img src="${char.img}" alt="${char.name}" class="max-w-full max-h-full object-contain scale-110">`;
        }
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Botón de iniciar juego
    if (btnStart) {
        btnStart.addEventListener("click", (e) => {
            e.preventDefault();
            
            // Ejecución del efecto de sonido
            startSfx.play().catch(err => console.error("Error de audio inicial:", err));

            // Guardar personaje seleccionado en localStorage
            localStorage.setItem('selectedCharacter', selectedCharacter);

            // Retraso técnico para permitir la reproducción del SFX antes de navegar
            setTimeout(() => {
                window.location.href = "Pages/game.html";
            }, 300);
        });
    }

    // Botón de información
    if (btnInfo) {
        btnInfo.addEventListener("click", () => {
            window.location.href = "Pages/info.html";
        });
    }

    // Botón de volver (para página de info)
    if (btnBack) {
        btnBack.addEventListener("click", () => {
            window.location.href = "../index.html";
        });
    }

    // Abrir modal de selección de personaje
    if (characterPlatform) {
        characterPlatform.addEventListener('click', () => {
            openCharacterModal();
        });
    }

    // Cerrar modal
    if (closeModal) {
        closeModal.addEventListener('click', closeCharacterModal);
    }

    // Cerrar modal haciendo clic fuera
    if (characterModal) {
        characterModal.addEventListener('click', (e) => {
            if (e.target === characterModal) {
                closeCharacterModal();
            }
        });
    }

    // Confirmar selección
    if (confirmSelection) {
        confirmSelection.addEventListener('click', () => {
            const selected = document.querySelector('.character-card.selected');
            if (selected) {
                const characterId = selected.dataset.character;
                selectedCharacter = characterId;
                updateCharacterDisplay();
                closeCharacterModal();
                
                // Efecto visual de confirmación
                showSelectionFeedback();
            }
        });
    }

    // Selección de cartas de personaje
    const characterCards = document.querySelectorAll('.character-card');
    characterCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remover selección anterior
            characterCards.forEach(c => c.classList.remove('selected'));
            // Agregar selección actual
            card.classList.add('selected');
            
            // Habilitar botón de confirmación
            if (confirmSelection) {
                confirmSelection.style.opacity = '1';
                confirmSelection.style.pointerEvents = 'auto';
            }
        });
    });
}

// Abrir modal de selección
function openCharacterModal() {
    console.log('Abriendo modal de personajes...');
    if (characterModal) {
        characterModal.classList.remove('hidden');
        characterModal.classList.add('flex');
        console.log('Modal activado');
        
        // Marcar personaje actual como seleccionado
        const currentCard = document.querySelector(`[data-character="${selectedCharacter}"]`);
        if (currentCard) {
            currentCard.classList.add('selected');
            console.log('Personaje actual seleccionado:', selectedCharacter);
            if (confirmSelection) {
                confirmSelection.style.opacity = '1';
                confirmSelection.style.pointerEvents = 'auto';
            }
        }
    } else {
        console.error('Modal no encontrado');
    }
}

// Cerrar modal
function closeCharacterModal() {
    if (characterModal) {
        characterModal.classList.add('hidden');
        characterModal.classList.remove('flex');
        
        // Limpiar selecciones
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        if (confirmSelection) {
            confirmSelection.style.opacity = '0.5';
            confirmSelection.style.pointerEvents = 'none';
        }
    }
}

// Mostrar feedback de selección
function showSelectionFeedback() {
    const platform = document.querySelector('.character-platform');
    if (platform) {
        platform.style.transform = 'scale(1.2)';
        platform.style.boxShadow = '0 0 50px rgba(0, 198, 255, 0.8)';
        
        setTimeout(() => {
            platform.style.transform = 'scale(1)';
            platform.style.boxShadow = '0 0 30px rgba(0, 198, 255, 0.4)';
        }, 300);
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página principal (tiene el modal de personajes)
    if (document.getElementById('characterModal')) {
        initializeCharacterScreen();
    }
    
    // Botón de volver (funciona en cualquier página)
    const btnBack = document.getElementById("btnBack");
    if (btnBack) {
        btnBack.addEventListener("click", () => {
            window.location.href = "../index.html";
        });
    }
});