
// ===== MODULE D'INTERFACE UTILISATEUR =====

class UIManager {
    constructor() {
        this.game = null;
        this.isInitialized = false;
        this.currentTab = 'crops';
        this.notifications = [];
        this.sidebarCollapsed = false;
        
        console.log('🖥️ UIManager initialisé');
    }
    
    // Initialisation du module
    init(gameInstance) {
        this.game = gameInstance;
        this.setupEventListeners();
        this.setupTabs();
        this.setupSidebar();
        this.setupNotifications();
        this.isInitialized = true;
        console.log('✅ Module UI initialisé');
    }
    
    // Configuration des écouteurs d'événements
    setupEventListeners() {
        console.log('⚙️ Configuration des événements UI...');
        
        // Bouton de pause
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.togglePause();
                    this.updatePauseButton();
                }
            });
        }
        
        // Gestionnaires pour les cultures
        const plantCropBtn = document.getElementById('plantCrop');
        if (plantCropBtn) {
            plantCropBtn.addEventListener('click', () => {
                const cropType = document.getElementById('cropType')?.value;
                if (cropType && this.game && this.game.cropsManager) {
                    this.game.cropsManager.plantCrop(cropType);
                }
            });
        }
        
        // Gestionnaires pour l'élevage
        const buyLivestockBtn = document.getElementById('buyLivestock');
        if (buyLivestockBtn) {
            buyLivestockBtn.addEventListener('click', () => {
                const animalType = document.getElementById('livestockType')?.value;
                if (animalType && this.game && this.game.livestockManager) {
                    this.game.livestockManager.buyAnimal(animalType);
                }
            });
        }
        
        // Gestionnaires pour les machines
        const buyMachineBtn = document.getElementById('buyMachine');
        if (buyMachineBtn) {
            buyMachineBtn.addEventListener('click', () => {
                const machineType = document.getElementById('machineType')?.value;
                if (machineType && this.game && this.game.machinesManager) {
                    this.game.machinesManager.buyMachine(machineType);
                }
            });
        }
        
        // Gestionnaires pour les ventes
        const sellBtn = document.getElementById('sellButton');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                const product = document.getElementById('sellProduct')?.value;
                const quantity = parseInt(document.getElementById('sellQuantity')?.value) || 0;
                
                if (product && quantity > 0 && this.game) {
                    if (this.game.cropsManager && this.game.cropsManager.sellCrop) {
                        this.game.cropsManager.sellCrop(product, quantity);
                    } else if (this.game.livestockManager && this.game.livestockManager.sellProduct) {
                        this.game.livestockManager.sellProduct(product, quantity);
                    }
                }
            });
        }
        
        // Menu de pause
        const resumeBtn = document.getElementById('resumeGame');
        const saveBtn = document.getElementById('saveGame');
        const loadBtn = document.getElementById('loadGame');
        const restartBtn = document.getElementById('restartGame');
        
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.hidePauseMenu();
                if (this.game) {
                    this.game.isPaused = false;
                }
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (this.game && this.game.saveManager) {
                    this.game.saveManager.saveGame();
                }
            });
        }
        
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                if (this.game && this.game.saveManager) {
                    this.game.saveManager.loadGame();
                }
            });
        }
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (confirm('Êtes-vous sûr de vouloir recommencer ?')) {
                    if (this.game && this.game.saveManager) {
                        this.game.saveManager.newGame();
                    }
                }
            });
        }
        
        // Événements clavier globaux
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
    }
    
    // Configuration des onglets
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }
    
    // Configuration de la barre latérale
    setupSidebar() {
        const toggleBtn = document.getElementById('toggleSidebar');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
    }
    
    // Configuration du système de notifications
    setupNotifications() {
        // Créer le conteneur de notifications s'il n'existe pas
        let notificationContainer = document.getElementById('notifications');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notifications';
            notificationContainer.className = 'notifications';
            document.body.appendChild(notificationContainer);
        }
    }
    
    // Basculer entre les onglets
    switchTab(tabName) {
        // Désactiver tous les onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Activer l'onglet sélectionné
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        const tabPanel = document.getElementById(`${tabName}-tab`);
        
        if (tabButton && tabPanel) {
            tabButton.classList.add('active');
            tabPanel.classList.add('active');
            this.currentTab = tabName;
        }
        
        // Mettre à jour le contenu de l'onglet
        this.updateTabContent(tabName);
    }
    
    // Mettre à jour le contenu d'un onglet
    updateTabContent(tabName) {
        switch (tabName) {
            case 'crops':
                this.updateCropsTab();
                break;
            case 'livestock':
                this.updateLivestockTab();
                break;
            case 'machines':
                this.updateMachinesTab();
                break;
            case 'market':
                this.updateMarketTab();
                break;
            case 'finance':
                this.updateFinanceTab();
                break;
        }
    }
    
    // Mettre à jour l'onglet cultures
    updateCropsTab() {
        const cropStats = document.getElementById('cropStats');
        if (cropStats && this.game && this.game.cropsManager) {
            const stats = this.game.cropsManager.getCropStats();
            let html = '<div class="crop-statistics">';
            
            if (stats.totalCrops > 0) {
                html += `<div class="stat-item">Total de cultures: ${stats.totalCrops}</div>`;
                html += `<div class="stat-item">En croissance: ${stats.growing}</div>`;
                html += `<div class="stat-item">Prêtes à récolter: ${stats.ready}</div>`;
                html += `<div class="stat-item">Production estimée: ${stats.estimatedYield} tonnes</div>`;
            } else {
                html += '<div class="no-data">Aucune culture plantée</div>';
            }
            
            html += '</div>';
            cropStats.innerHTML = html;
        }
    }
    
    // Mettre à jour l'onglet élevage
    updateLivestockTab() {
        const livestockStats = document.getElementById('livestockStats');
        if (livestockStats && this.game && this.game.livestockManager) {
            const stats = this.game.livestockManager.getLivestockStats();
            let html = '<div class="livestock-statistics">';
            
            if (stats.totalAnimals > 0) {
                html += `<div class="stat-item">Total d'animaux: ${stats.totalAnimals}</div>`;
                html += `<div class="stat-item">Production quotidienne: ${stats.dailyProduction}</div>`;
                html += `<div class="stat-item">Coût d'alimentation: ${stats.feedCost}€/jour</div>`;
            } else {
                html += '<div class="no-data">Aucun animal dans l\'élevage</div>';
            }
            
            html += '</div>';
            livestockStats.innerHTML = html;
        }
    }
    
    // Mettre à jour l'onglet machines
    updateMachinesTab() {
        const machineStats = document.getElementById('machineStats');
        if (machineStats && this.game && this.game.machinesManager) {
            const stats = this.game.machinesManager.getMachineStats();
            let html = '<div class="machine-statistics">';
            
            if (stats.totalMachines > 0) {
                html += `<div class="stat-item">Total de machines: ${stats.totalMachines}</div>`;
                html += `<div class="stat-item">Efficacité moyenne: ${stats.averageEfficiency}%</div>`;
                html += `<div class="stat-item">Coût de maintenance: ${stats.maintenanceCost}€/jour</div>`;
            } else {
                html += '<div class="no-data">Aucune machine achetée</div>';
            }
            
            html += '</div>';
            machineStats.innerHTML = html;
        }
    }
    
    // Mettre à jour l'onglet marché
    updateMarketTab() {
        const marketPrices = document.getElementById('marketPrices');
        if (marketPrices && this.game && this.game.marketManager) {
            const prices = this.game.marketManager.getCurrentPrices();
            let html = '<div class="market-prices-list">';
            
            prices.forEach((price, product) => {
                html += `<div class="price-item">
                    <span>${product}:</span>
                    <span>${price.toFixed(2)}€</span>
                </div>`;
            });
            
            html += '</div>';
            marketPrices.innerHTML = html;
        }
    }
    
    // Mettre à jour l'onglet finance
    updateFinanceTab() {
        const financeStats = document.getElementById('financeStats');
        if (financeStats && this.game && this.game.financeManager) {
            const stats = this.game.financeManager.getFinancialStats();
            let html = '<div class="finance-overview">';
            
            html += `<div class="stat-item">
                <span>Revenus totaux:</span>
                <span class="positive">${stats.totalRevenue.toFixed(2)}€</span>
            </div>`;
            html += `<div class="stat-item">
                <span>Dépenses totales:</span>
                <span class="negative">${stats.totalExpenses.toFixed(2)}€</span>
            </div>`;
            html += `<div class="stat-item">
                <span>Profit net:</span>
                <span class="${stats.netProfit >= 0 ? 'positive' : 'negative'}">${stats.netProfit.toFixed(2)}€</span>
            </div>`;
            
            html += '</div>';
            financeStats.innerHTML = html;
        }
    }
    
    // Basculer la barre latérale
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('toggleSidebar');
        
        if (sidebar && toggleBtn) {
            this.sidebarCollapsed = !this.sidebarCollapsed;
            
            if (this.sidebarCollapsed) {
                sidebar.classList.add('collapsed');
                toggleBtn.textContent = '▶';
            } else {
                sidebar.classList.remove('collapsed');
                toggleBtn.textContent = '◀';
            }
        }
    }
    
    // Afficher une notification
    showNotification(message, type = 'info', duration = 3000) {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: Date.now()
        };
        
        this.notifications.push(notification);
        this.renderNotification(notification);
        
        // Auto-suppression
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, duration);
    }
    
    // Rendre une notification
    renderNotification(notification) {
        const container = document.getElementById('notifications');
        if (!container) return;
        
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification notification-${notification.type}`;
        notificationEl.id = `notification-${notification.id}`;
        
        const iconMap = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            weather: '🌤️',
            season: '🌍'
        };
        
        const icon = iconMap[notification.type] || 'ℹ️';
        
        notificationEl.innerHTML = `
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${notification.message}</span>
            <button class="notification-close" onclick="window.game.uiManager.removeNotification(${notification.id})">×</button>
        `;
        
        container.appendChild(notificationEl);
        
        // Animation d'entrée
        setTimeout(() => {
            notificationEl.classList.add('show');
        }, 10);
    }
    
    // Supprimer une notification
    removeNotification(id) {
        const notificationEl = document.getElementById(`notification-${id}`);
        if (notificationEl) {
            notificationEl.classList.add('hide');
            setTimeout(() => {
                notificationEl.remove();
            }, 300);
        }
        
        this.notifications = this.notifications.filter(n => n.id !== id);
    }
    
    // Afficher le menu de pause
    showPauseMenu() {
        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) {
            pauseMenu.classList.remove('hidden');
        }
    }
    
    // Masquer le menu de pause
    hidePauseMenu() {
        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) {
            pauseMenu.classList.add('hidden');
        }
    }
    
    // Mettre à jour le bouton de pause
    updatePauseButton() {
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn && this.game) {
            pauseBtn.textContent = this.game.isPaused ? '▶️' : '⏸️';
            pauseBtn.title = this.game.isPaused ? 'Reprendre' : 'Pause';
        }
    }
    
    // Gestion des touches
    handleKeyDown(event) {
        switch (event.key) {
            case 'Escape':
                if (this.game && this.game.isPaused) {
                    this.hidePauseMenu();
                    this.game.isPaused = false;
                } else {
                    this.showPauseMenu();
                    if (this.game) {
                        this.game.isPaused = true;
                    }
                }
                break;
                
            case '1':
                this.switchTab('crops');
                break;
            case '2':
                this.switchTab('livestock');
                break;
            case '3':
                this.switchTab('machines');
                break;
            case '4':
                this.switchTab('market');
                break;
            case '5':
                this.switchTab('finance');
                break;
        }
    }
    
    // Mise à jour de l'interface
    update(deltaTime) {
        if (!this.isInitialized) return;
        
        // Mettre à jour le contenu de l'onglet actuel
        this.updateTabContent(this.currentTab);
        
        // Nettoyer les notifications expirées
        this.cleanupNotifications();
    }
    
    // Nettoyer les notifications expirées
    cleanupNotifications() {
        const now = Date.now();
        this.notifications = this.notifications.filter(notification => {
            return now - notification.timestamp < 10000; // 10 secondes max
        });
    }
    
    // Mettre à jour l'interface utilisateur principale
    updateUI() {
        this.updateTabContent(this.currentTab);
    }
}

// Créer une instance globale
if (typeof window !== 'undefined') {
    window.UI = new UIManager();
}

// Exporter le module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}

console.log('✅ Module UI.js chargé');
