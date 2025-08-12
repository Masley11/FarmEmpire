
// ===== FERME INDUSTRIELLE - MAIN.JS =====
// Fichier principal d'initialisation du jeu

// Variables globales
let game = null;
let gameLoop = null;
let canvas = null;
let ctx = null;
let lastTime = 0;

// Configuration du jeu
const GAME_CONFIG = {
    FPS: 60,
    FRAME_TIME: 1000 / 60,
    DEBUG: false
};

// ===== CHARGEMENT DES MODULES =====
async function loadGameModules() {
    try {
        console.log('🎮 Chargement des modules du jeu...');
        
        // Chargement dynamique de tous les modules de jeu
        const modules = [
            'game.js',
            'crops.js', 
            'livestock.js',
            'machines.js',
            'production.js',
            'market.js',
            'weather.js',
            'finance.js',
            'ui.js',
            'save.js'
        ];

        // Charger tous les modules en parallèle
        const modulePromises = modules.map(async (module) => {
            try {
                console.log(`📦 Chargement du module: ${module}`);
                const script = document.createElement('script');
                script.src = `assets/js/${module}`;
                script.async = true;
                
                return new Promise((resolve, reject) => {
                    script.onload = () => {
                        console.log(`✅ Module chargé: ${module}`);
                        resolve(module);
                    };
                    script.onerror = () => {
                        console.error(`❌ Erreur de chargement: ${module}`);
                        reject(new Error(`Impossible de charger ${module}`));
                    };
                    document.head.appendChild(script);
                });
            } catch (error) {
                console.error(`❌ Erreur lors du chargement de ${module}:`, error);
                throw error;
            }
        });

        await Promise.all(modulePromises);
        console.log('🎉 Tous les modules ont été chargés avec succès!');
        
    } catch (error) {
        console.error('💥 Erreur lors du chargement des modules:', error);
        showError('Erreur de chargement des modules du jeu');
        throw error;
    }
}

// ===== INITIALISATION DU JEU =====
async function initializeGame() {
    try {
        console.log('🚀 Initialisation du jeu...');
        
        // Récupération du canvas
        canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('Canvas de jeu non trouvé!');
        }
        
        ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Impossible d\'obtenir le contexte 2D du canvas!');
        }

        // Configuration du canvas
        setupCanvas();
        
        // Initialisation des modules de jeu
        if (typeof Game !== 'undefined') {
            game = new Game(canvas, ctx);
            await game.init();
            console.log('✅ Game.init() terminé avec succès');
        } else {
            throw new Error('Module Game non disponible');
        }
        
        // Initialisation de l\'interface utilisateur
        if (typeof UI !== 'undefined') {
            UI.init(game);
            console.log('✅ UI.init() terminé avec succès');
        } else if (window.UI) {
            window.UI.init(game);
            console.log('✅ window.UI.init() terminé avec succès');
        }
        
        // Démarrage de la boucle de jeu
        startGameLoop();
        
        // Masquer l\'écran de chargement
        hideLoadingScreen();
        
        console.log('🎮 Jeu initialisé et prêt!');
        
    } catch (error) {
        console.error('💥 Erreur lors de l\'initialisation du jeu:', error);
        showError('Erreur d\'initialisation du jeu');
        throw error;
    }
}

// ===== CONFIGURATION DU CANVAS =====
function setupCanvas() {
    // Adapter la taille du canvas à son conteneur
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        // Redessiner si le jeu est initialisé
        if (game && game.render) {
            game.render();
        }
    }
    
    // Redimensionner initialement
    resizeCanvas();
    
    // Écouter les changements de taille
    window.addEventListener('resize', resizeCanvas);
    
    // Configuration des événements de souris et tactiles
    setupCanvasEvents();
}

// ===== ÉVÉNEMENTS DU CANVAS =====
function setupCanvasEvents() {
    let isMouseDown = false;
    let lastMousePos = { x: 0, y: 0 };
    
    // Événements souris
    canvas.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        lastMousePos = { x: e.clientX, y: e.clientY };
        if (game && game.handleMouseDown) {
            game.handleMouseDown(e);
        }
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (game && game.handleMouseMove) {
            game.handleMouseMove(e, isMouseDown);
        }
        lastMousePos = { x: e.clientX, y: e.clientY };
    });
    
    canvas.addEventListener('mouseup', (e) => {
        isMouseDown = false;
        if (game && game.handleMouseUp) {
            game.handleMouseUp(e);
        }
    });
    
    // Événements tactiles pour mobile
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        canvas.dispatchEvent(mouseEvent);
    });
    
    // Scroll pour zoom
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (game && game.handleWheel) {
            game.handleWheel(e);
        }
    });
}

// ===== BOUCLE PRINCIPALE DU JEU =====
function startGameLoop() {
    console.log('🔄 Démarrage de la boucle de jeu...');
    
    function gameLoopFunction(currentTime) {
        // Calculer le delta time
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        // Limiter le delta time pour éviter les gros sauts
        const clampedDelta = Math.min(deltaTime, GAME_CONFIG.FRAME_TIME * 2);
        
        // Mettre à jour le jeu
        if (game && game.update) {
            game.update(clampedDelta);
        }
        
        // Nettoyer le canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Rendre le jeu
        if (game && game.render) {
            game.render(ctx);
        }
        
        // Afficher les FPS en mode debug
        if (GAME_CONFIG.DEBUG) {
            displayFPS(deltaTime);
        }
        
        // Continuer la boucle
        gameLoop = requestAnimationFrame(gameLoopFunction);
    }
    
    // Démarrer la boucle
    gameLoop = requestAnimationFrame(gameLoopFunction);
}

// ===== GESTION DES ERREURS =====
function showError(message) {
    console.error('🚨 Erreur:', message);
    
    // Afficher une notification d'erreur
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <div class="error-content">
            <h3>❌ Erreur</h3>
            <p>${message}</p>
            <button onclick="location.reload()">Recharger la page</button>
        </div>
    `;
    errorDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        color: white;
        font-family: Arial, sans-serif;
    `;
    
    document.body.appendChild(errorDiv);
}

// ===== UTILITAIRES =====
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}

function displayFPS(deltaTime) {
    const fps = Math.round(1000 / deltaTime);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(10, 10, 100, 30);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`FPS: ${fps}`, 20, 30);
}

// Fonction pour arrêter la boucle de jeu
function stopGameLoop() {
    if (gameLoop) {
        cancelAnimationFrame(gameLoop);
        gameLoop = null;
        console.log('⏹️ Boucle de jeu arrêtée');
    }
}

// Fonction pour redémarrer le jeu
function restartGame() {
    stopGameLoop();
    if (game && game.reset) {
        game.reset();
    }
    startGameLoop();
    console.log('🔄 Jeu redémarré');
}

// ===== GESTION DES ÉVÉNEMENTS GLOBAUX =====
function setupGlobalEvents() {
    // Gestion de la visibilité de la page
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pause automatique quand la page n'est plus visible
            if (game && game.pause) {
                game.pause();
            }
        } else {
            // Reprendre quand la page redevient visible
            if (game && game.resume) {
                game.resume();
            }
        }
    });
    
    // Gestion des erreurs JavaScript globales
    window.addEventListener('error', (e) => {
        console.error('💥 Erreur JavaScript:', e.error);
        showError(`Erreur inattendue: ${e.message}`);
    });
    
    // Gestion des promesses rejetées
    window.addEventListener('unhandledrejection', (e) => {
        console.error('💥 Promesse rejetée:', e.reason);
        showError(`Erreur de chargement: ${e.reason}`);
    });
}

// ===== POINT D'ENTRÉE PRINCIPAL =====
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🎯 DOM chargé, initialisation du jeu...');
        
        // Configuration des événements globaux
        setupGlobalEvents();
        
        // Chargement des modules
        await loadGameModules();
        
        // Attendre un court délai pour s'assurer que tous les modules sont prêts
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Initialisation du jeu
        await initializeGame();
        
    } catch (error) {
        console.error('💥 Erreur fatale lors du démarrage:', error);
        showError('Impossible de démarrer le jeu');
    }
});

// Exposition des fonctions globales pour le debugging
window.gameDebug = {
    game,
    stopGameLoop,
    startGameLoop,
    restartGame,
    GAME_CONFIG
};

console.log('📝 Main.js chargé et prêt!');
