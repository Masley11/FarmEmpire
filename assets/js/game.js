
// ===== MODULE PRINCIPAL DU JEU =====

class Game {
    constructor() {
        this.isInitialized = false;
        this.isPaused = false;
        this.canvas = null;
        this.ctx = null;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // État du jeu
        this.gameState = {
            money: 50000,
            day: 1,
            score: 0,
            production: 0,
            weather: 'Ensoleillé'
        };
        
        // Système de caméra
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            minZoom: 0.5,
            maxZoom: 2.0
        };
        
        // Grille de jeu (terrain agricole)
        this.gridSize = 32;
        this.mapWidth = 50;
        this.mapHeight = 50;
        
        console.log('🎮 Classe Game initialisée');
    }
    
    // Initialisation du jeu
    init() {
        try {
            console.log('🚀 Initialisation du jeu...');
            
            // Récupération du canvas
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('Canvas non trouvé');
            }
            
            this.ctx = this.canvas.getContext('2d');
            
            // Redimensionner le canvas
            this.resizeCanvas();
            
            // Initialiser les modules
            this.initializeModules();
            
            // Configurer les contrôles
            this.setupControls();
            
            // Marquer comme initialisé
            this.isInitialized = true;
            
            console.log('✅ Jeu initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            throw error;
        }
    }
    
    // Initialiser tous les modules du jeu
    initializeModules() {
        console.log('🔧 Initialisation des modules...');
        
        // Initialiser les managers avec vérification
        try {
            if (typeof CropsManager !== 'undefined') {
                this.cropsManager = new CropsManager();
                this.cropsManager.init(this);
                console.log('✅ CropsManager initialisé');
            } else if (window.Crops) {
                this.cropsManager = window.Crops;
                this.cropsManager.init(this);
                console.log('✅ Crops (global) initialisé');
            }
            
            if (typeof LivestockManager !== 'undefined') {
                this.livestockManager = new LivestockManager();
                this.livestockManager.init(this);
                console.log('✅ LivestockManager initialisé');
            } else if (window.Livestock) {
                this.livestockManager = window.Livestock;
                this.livestockManager.init(this);
                console.log('✅ Livestock (global) initialisé');
            }
            
            if (typeof MachinesManager !== 'undefined') {
                this.machinesManager = new MachinesManager();
                this.machinesManager.init(this);
                console.log('✅ MachinesManager initialisé');
            } else if (window.Machines) {
                this.machinesManager = window.Machines;
                this.machinesManager.init(this);
                console.log('✅ Machines (global) initialisé');
            }
            
            if (typeof ProductionManager !== 'undefined') {
                this.productionManager = new ProductionManager();
                this.productionManager.init(this);
                console.log('✅ ProductionManager initialisé');
            } else if (window.Production) {
                this.productionManager = window.Production;
                this.productionManager.init(this);
                console.log('✅ Production (global) initialisé');
            }
            
            if (typeof MarketManager !== 'undefined') {
                this.marketManager = new MarketManager();
                this.marketManager.init(this);
                console.log('✅ MarketManager initialisé');
            } else if (window.Market) {
                this.marketManager = window.Market;
                this.marketManager.init(this);
                console.log('✅ Market (global) initialisé');
            }
            
            if (typeof WeatherManager !== 'undefined') {
                this.weatherManager = new WeatherManager();
                this.weatherManager.init(this);
                console.log('✅ WeatherManager initialisé');
            } else if (window.Weather) {
                this.weatherManager = window.Weather;
                this.weatherManager.init(this);
                console.log('✅ Weather (global) initialisé');
            }
            
            if (typeof FinanceManager !== 'undefined') {
                this.financeManager = new FinanceManager();
                this.financeManager.init(this);
                console.log('✅ FinanceManager initialisé');
            } else if (window.Finance) {
                this.financeManager = window.Finance;
                this.financeManager.init(this);
                console.log('✅ Finance (global) initialisé');
            }
            
            if (typeof SaveManager !== 'undefined') {
                this.saveManager = new SaveManager();
                this.saveManager.init(this);
                console.log('✅ SaveManager initialisé');
            } else if (window.Save) {
                this.saveManager = window.Save;
                this.saveManager.init(this);
                console.log('✅ Save (global) initialisé');
            }
            
            if (window.UI) {
                this.uiManager = window.UI;
                this.uiManager.init(this);
                console.log('✅ UI initialisé');
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation des modules:', error);
        }
    }
    
    // Redimensionner le canvas
    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }
    
    // Configurer les contrôles
    setupControls() {
        // Contrôles de zoom
        const zoomInBtn = document.getElementById('zoomIn');
        const zoomOutBtn = document.getElementById('zoomOut');
        const resetViewBtn = document.getElementById('resetView');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => this.zoomIn());
        }
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => this.resetView());
        }
        
        // Contrôles clavier
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Contrôles souris
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    }
    
    // Gestion des touches
    handleKeyDown(event) {
        switch(event.key) {
            case 'Escape':
                this.togglePause();
                break;
            case '+':
                this.zoomIn();
                break;
            case '-':
                this.zoomOut();
                break;
        }
    }
    
    // Gestion des clics sur le canvas
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Convertir en coordonnées du monde
        const worldX = (x / this.camera.zoom) + this.camera.x;
        const worldY = (y / this.camera.zoom) + this.camera.y;
        
        // Convertir en coordonnées de grille
        const gridX = Math.floor(worldX / this.gridSize);
        const gridY = Math.floor(worldY / this.gridSize);
        
        console.log(`Clic sur la grille: ${gridX}, ${gridY}`);
        
        // Déléguer aux modules appropriés
        if (window.Crops) {
            window.Crops.handleGridClick(gridX, gridY);
        }
    }
    
    // Gestion de la molette
    handleWheel(event) {
        event.preventDefault();
        
        if (event.deltaY < 0) {
            this.zoomIn();
        } else {
            this.zoomOut();
        }
    }
    
    // Zoom avant
    zoomIn() {
        this.camera.zoom = Math.min(this.camera.zoom * 1.1, this.camera.maxZoom);
    }
    
    // Zoom arrière
    zoomOut() {
        this.camera.zoom = Math.max(this.camera.zoom * 0.9, this.camera.minZoom);
    }
    
    // Réinitialiser la vue
    resetView() {
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.zoom = 1;
    }
    
    // Basculer pause
    togglePause() {
        this.isPaused = !this.isPaused;
        console.log(this.isPaused ? '⏸️ Jeu en pause' : '▶️ Jeu repris');
    }
    
    // Boucle principale de rendu
    render(currentTime) {
        if (!this.isInitialized || !this.ctx) return;
        
        // Calculer deltaTime
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Effacer le canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Sauvegarder le contexte pour les transformations
        this.ctx.save();
        
        // Appliquer les transformations de caméra
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Dessiner la grille de base
        this.drawGrid();
        
        // Dessiner les cultures
        if (this.cropsManager) {
            this.cropsManager.render(this.ctx);
        }
        
        // Dessiner l'élevage
        if (this.livestockManager) {
            this.livestockManager.render(this.ctx);
        }
        
        // Dessiner les machines
        if (this.machinesManager) {
            this.machinesManager.render(this.ctx);
        }
        
        // Dessiner la production
        if (this.productionManager) {
            this.productionManager.render(this.ctx);
        }
        
        // Restaurer le contexte
        this.ctx.restore();
        
        // Dessiner l'interface utilisateur (pas affectée par la caméra)
        this.drawUI();
    }
    
    // Dessiner la grille
    drawGrid() {
        this.ctx.strokeStyle = '#E0E0E0';
        this.ctx.lineWidth = 1;
        
        // Lignes verticales
        for (let x = 0; x <= this.mapWidth; x++) {
            const xPos = x * this.gridSize;
            this.ctx.beginPath();
            this.ctx.moveTo(xPos, 0);
            this.ctx.lineTo(xPos, this.mapHeight * this.gridSize);
            this.ctx.stroke();
        }
        
        // Lignes horizontales
        for (let y = 0; y <= this.mapHeight; y++) {
            const yPos = y * this.gridSize;
            this.ctx.beginPath();
            this.ctx.moveTo(0, yPos);
            this.ctx.lineTo(this.mapWidth * this.gridSize, yPos);
            this.ctx.stroke();
        }
    }
    
    // Dessiner l'interface utilisateur
    drawUI() {
        // Afficher les informations de debug si activé
        if (GAME_CONFIG.DEBUG) {
            this.ctx.fillStyle = 'black';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`FPS: ${Math.round(1000 / this.deltaTime)}`, 10, 30);
            this.ctx.fillText(`Zoom: ${this.camera.zoom.toFixed(2)}`, 10, 50);
        }
    }
    
    // Mise à jour du jeu
    update(deltaTime) {
        if (this.isPaused) return;
        
        // Mettre à jour les modules
        if (this.cropsManager) {
            this.cropsManager.update(deltaTime);
        }
        if (this.livestockManager) {
            this.livestockManager.update(deltaTime);
        }
        if (this.machinesManager) {
            this.machinesManager.update(deltaTime);
        }
        if (this.productionManager) {
            this.productionManager.update(deltaTime);
        }
        if (this.marketManager) {
            this.marketManager.update(deltaTime);
        }
        if (this.weatherManager) {
            this.weatherManager.update(deltaTime);
        }
        if (this.financeManager) {
            this.financeManager.update(deltaTime);
        }
        if (this.saveManager) {
            this.saveManager.update(deltaTime);
        }
        if (this.uiManager) {
            this.uiManager.update(deltaTime);
        }
        
        // Mettre à jour l'interface utilisateur
        this.updateUI();
    }
    
    // Mettre à jour l'interface utilisateur
    updateUI() {
        // Mettre à jour les statistiques affichées
        const moneyElement = document.getElementById('money');
        const productionElement = document.getElementById('production');
        const weatherElement = document.getElementById('weather');
        const dayElement = document.getElementById('day');
        const scoreElement = document.getElementById('score');
        
        if (moneyElement) {
            moneyElement.textContent = `${this.gameState.money.toLocaleString()}€`;
        }
        if (productionElement) {
            productionElement.textContent = `${this.gameState.production} t/j`;
        }
        if (weatherElement) {
            weatherElement.textContent = this.gameState.weather;
        }
        if (dayElement) {
            dayElement.textContent = this.gameState.day;
        }
        if (scoreElement) {
            scoreElement.textContent = this.gameState.score.toLocaleString();
        }
    }
    
    // Dépenser de l'argent
    spendMoney(amount) {
        if (this.gameState.money >= amount) {
            this.gameState.money -= amount;
            return true;
        }
        return false;
    }
    
    // Gagner de l'argent
    earnMoney(amount) {
        this.gameState.money += amount;
        this.gameState.score += Math.floor(amount * 0.1);
    }
    
    // Ajouter de l'argent (alias pour earnMoney)
    addMoney(amount) {
        this.earnMoney(amount);
    }
}

// Exporter la classe Game
window.Game = Game;

console.log('✅ Module Game.js chargé');
