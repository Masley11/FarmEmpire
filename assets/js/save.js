
// ===== MODULE DE SAUVEGARDE =====

class SaveManager {
    constructor() {
        this.game = null;
        this.autoSaveInterval = 60000; // Auto-sauvegarde toutes les minutes
        this.lastAutoSave = Date.now();
        this.saveSlots = 3; // 3 emplacements de sauvegarde
        this.currentSaveSlot = 1;
        
        console.log('💾 SaveManager initialisé');
    }
    
    // Initialisation du module
    init(gameInstance) {
        this.game = gameInstance;
        this.setupUI();
        this.loadAutoSave();
        console.log('✅ Module Sauvegarde initialisé');
    }
    
    // Configuration de l'interface utilisateur
    setupUI() {
        // Gestionnaire pour sauvegarder
        const saveBtn = document.getElementById('saveGame');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const slot = parseInt(document.getElementById('saveSlot')?.value) || 1;
                this.saveGame(slot);
            });
        }
        
        // Gestionnaire pour charger
        const loadBtn = document.getElementById('loadGame');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                const slot = parseInt(document.getElementById('loadSlot')?.value) || 1;
                this.loadGame(slot);
            });
        }
        
        // Gestionnaire pour nouveau jeu
        const newGameBtn = document.getElementById('newGame');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                if (confirm('Êtes-vous sûr de vouloir commencer un nouveau jeu ? Toute progression non sauvegardée sera perdue.')) {
                    this.newGame();
                }
            });
        }
        
        // Gestionnaire pour export
        const exportBtn = document.getElementById('exportSave');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportSave();
            });
        }
        
        // Gestionnaire pour import
        const importBtn = document.getElementById('importSave');
        const importFile = document.getElementById('importFile');
        
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => {
                importFile.click();
            });
            
            importFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.importSave(file);
                }
            });
        }
    }
    
    // Sauvegarder le jeu
    saveGame(slot = this.currentSaveSlot, isAutoSave = false) {
        try {
            const saveData = this.createSaveData();
            const saveKey = isAutoSave ? 'farmGame_autoSave' : `farmGame_save_${slot}`;
            
            // Compresser les données pour économiser l'espace
            const compressedData = this.compressSaveData(saveData);
            
            localStorage.setItem(saveKey, JSON.stringify(compressedData));
            
            if (!isAutoSave) {
                console.log(`💾 Jeu sauvegardé dans l'emplacement ${slot}`);
                this.showNotification(`Jeu sauvegardé dans l'emplacement ${slot}`, 'success');
            }
            
            this.updateSaveList();
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
            return false;
        }
    }
    
    // Créer les données de sauvegarde
    createSaveData() {
        const saveData = {
            version: '1.0.0',
            timestamp: Date.now(),
            playTime: this.game.gameState.playTime || 0,
            gameState: {
                money: this.game.gameState.money,
                level: this.game.gameState.level,
                experience: this.game.gameState.experience,
                weather: this.game.gameState.weather,
                season: this.game.gameState.season,
                day: this.game.gameState.day,
                cropProduction: this.game.gameState.cropProduction,
                animalProduction: this.game.gameState.animalProduction,
                industrialProduction: this.game.gameState.industrialProduction
            }
        };
        
        // Sauvegarder les cultures
        if (this.game.cropsManager) {
            saveData.crops = {
                crops: this.mapToObject(this.game.cropsManager.crops),
                inventory: this.mapToObject(this.game.cropsManager.inventory),
                nextCropId: this.game.cropsManager.nextCropId
            };
        }
        
        // Sauvegarder l'élevage
        if (this.game.livestockManager) {
            saveData.livestock = {
                animals: this.mapToObject(this.game.livestockManager.animals),
                inventory: this.mapToObject(this.game.livestockManager.inventory),
                nextAnimalId: this.game.livestockManager.nextAnimalId,
                dailyFeedCost: this.game.livestockManager.dailyFeedCost
            };
        }
        
        // Sauvegarder les machines
        if (this.game.machinesManager) {
            saveData.machines = {
                machines: this.mapToObject(this.game.machinesManager.machines),
                nextMachineId: this.game.machinesManager.nextMachineId
            };
        }
        
        // Sauvegarder la production
        if (this.game.productionManager) {
            saveData.production = {
                warehouses: this.mapToObject(this.game.productionManager.warehouses),
                factories: this.mapToObject(this.game.productionManager.factories),
                inventory: this.mapToObject(this.game.productionManager.inventory),
                nextFactoryId: this.game.productionManager.nextFactoryId,
                nextWarehouseId: this.game.productionManager.nextWarehouseId
            };
        }
        
        // Sauvegarder le marché
        if (this.game.marketManager) {
            saveData.market = {
                marketPrices: this.mapToObject(this.game.marketManager.marketPrices),
                priceHistory: this.mapToObject(this.game.marketManager.priceHistory),
                contracts: this.mapToObject(this.game.marketManager.contracts),
                nextContractId: this.game.marketManager.nextContractId,
                marketDemand: this.mapToObject(this.game.marketManager.marketDemand),
                marketSupply: this.mapToObject(this.game.marketManager.marketSupply)
            };
        }
        
        // Sauvegarder la météo
        if (this.game.weatherManager) {
            saveData.weather = {
                currentWeather: this.game.weatherManager.currentWeather,
                currentSeason: this.game.weatherManager.currentSeason,
                weatherHistory: this.game.weatherManager.weatherHistory,
                lastWeatherChange: this.game.weatherManager.lastWeatherChange,
                seasonStartTime: this.game.weatherManager.seasonStartTime
            };
        }
        
        // Sauvegarder les finances
        if (this.game.financeManager) {
            saveData.finance = {
                monthlyReports: this.game.financeManager.monthlyReports,
                transactions: this.game.financeManager.transactions.slice(-100), // Garder seulement les 100 dernières
                expenses: this.mapToObject(this.game.financeManager.expenses),
                revenues: this.mapToObject(this.game.financeManager.revenues),
                loans: this.mapToObject(this.game.financeManager.loans),
                nextLoanId: this.game.financeManager.nextLoanId,
                lastMonthlyReport: this.game.financeManager.lastMonthlyReport
            };
        }
        
        return saveData;
    }
    
    // Charger le jeu
    loadGame(slot = this.currentSaveSlot) {
        try {
            const saveKey = `farmGame_save_${slot}`;
            const savedData = localStorage.getItem(saveKey);
            
            if (!savedData) {
                console.log(`❌ Aucune sauvegarde trouvée dans l'emplacement ${slot}`);
                this.showNotification(`Aucune sauvegarde dans l'emplacement ${slot}`, 'error');
                return false;
            }
            
            const saveData = this.decompressSaveData(JSON.parse(savedData));
            this.applySaveData(saveData);
            
            console.log(`💾 Jeu chargé depuis l'emplacement ${slot}`);
            this.showNotification(`Jeu chargé depuis l'emplacement ${slot}`, 'success');
            
            return true;
        } catch (error) {
            console.error('❌ Erreur lors du chargement:', error);
            this.showNotification('Erreur lors du chargement', 'error');
            return false;
        }
    }
    
    // Appliquer les données de sauvegarde
    applySaveData(saveData) {
        // Valider la version
        if (saveData.version !== '1.0.0') {
            console.warn('⚠️ Version de sauvegarde différente, migration possible nécessaire');
        }
        
        // Restaurer l'état du jeu
        if (saveData.gameState) {
            Object.assign(this.game.gameState, saveData.gameState);
        }
        
        // Restaurer les cultures
        if (saveData.crops && this.game.cropsManager) {
            this.game.cropsManager.crops = this.objectToMap(saveData.crops.crops);
            this.game.cropsManager.inventory = this.objectToMap(saveData.crops.inventory);
            this.game.cropsManager.nextCropId = saveData.crops.nextCropId || 1;
        }
        
        // Restaurer l'élevage
        if (saveData.livestock && this.game.livestockManager) {
            this.game.livestockManager.animals = this.objectToMap(saveData.livestock.animals);
            this.game.livestockManager.inventory = this.objectToMap(saveData.livestock.inventory);
            this.game.livestockManager.nextAnimalId = saveData.livestock.nextAnimalId || 1;
            this.game.livestockManager.dailyFeedCost = saveData.livestock.dailyFeedCost || 0;
        }
        
        // Restaurer les machines
        if (saveData.machines && this.game.machinesManager) {
            this.game.machinesManager.machines = this.objectToMap(saveData.machines.machines);
            this.game.machinesManager.nextMachineId = saveData.machines.nextMachineId || 1;
        }
        
        // Restaurer la production
        if (saveData.production && this.game.productionManager) {
            this.game.productionManager.warehouses = this.objectToMap(saveData.production.warehouses);
            this.game.productionManager.factories = this.objectToMap(saveData.production.factories);
            this.game.productionManager.inventory = this.objectToMap(saveData.production.inventory);
            this.game.productionManager.nextFactoryId = saveData.production.nextFactoryId || 1;
            this.game.productionManager.nextWarehouseId = saveData.production.nextWarehouseId || 1;
        }
        
        // Restaurer le marché
        if (saveData.market && this.game.marketManager) {
            this.game.marketManager.marketPrices = this.objectToMap(saveData.market.marketPrices);
            this.game.marketManager.priceHistory = this.objectToMap(saveData.market.priceHistory);
            this.game.marketManager.contracts = this.objectToMap(saveData.market.contracts);
            this.game.marketManager.nextContractId = saveData.market.nextContractId || 1;
            this.game.marketManager.marketDemand = this.objectToMap(saveData.market.marketDemand);
            this.game.marketManager.marketSupply = this.objectToMap(saveData.market.marketSupply);
        }
        
        // Restaurer la météo
        if (saveData.weather && this.game.weatherManager) {
            this.game.weatherManager.currentWeather = saveData.weather.currentWeather;
            this.game.weatherManager.currentSeason = saveData.weather.currentSeason;
            this.game.weatherManager.weatherHistory = saveData.weather.weatherHistory || [];
            this.game.weatherManager.lastWeatherChange = saveData.weather.lastWeatherChange || Date.now();
            this.game.weatherManager.seasonStartTime = saveData.weather.seasonStartTime || Date.now();
        }
        
        // Restaurer les finances
        if (saveData.finance && this.game.financeManager) {
            this.game.financeManager.monthlyReports = saveData.finance.monthlyReports || [];
            this.game.financeManager.transactions = saveData.finance.transactions || [];
            this.game.financeManager.expenses = this.objectToMap(saveData.finance.expenses);
            this.game.financeManager.revenues = this.objectToMap(saveData.finance.revenues);
            this.game.financeManager.loans = this.objectToMap(saveData.finance.loans);
            this.game.financeManager.nextLoanId = saveData.finance.nextLoanId || 1;
            this.game.financeManager.lastMonthlyReport = saveData.finance.lastMonthlyReport || Date.now();
        }
        
        // Mettre à jour toutes les interfaces
        this.updateAllManagers();
    }
    
    // Charger la sauvegarde automatique
    loadAutoSave() {
        try {
            const autoSaveData = localStorage.getItem('farmGame_autoSave');
            if (autoSaveData) {
                const saveData = this.decompressSaveData(JSON.parse(autoSaveData));
                this.applySaveData(saveData);
                console.log('💾 Sauvegarde automatique chargée');
            }
        } catch (error) {
            console.warn('⚠️ Impossible de charger la sauvegarde automatique:', error);
        }
    }
    
    // Commencer un nouveau jeu
    newGame() {
        // Réinitialiser tous les managers
        if (this.game.cropsManager) {
            this.game.cropsManager.crops.clear();
            this.game.cropsManager.inventory.clear();
            this.game.cropsManager.nextCropId = 1;
        }
        
        if (this.game.livestockManager) {
            this.game.livestockManager.animals.clear();
            this.game.livestockManager.inventory.clear();
            this.game.livestockManager.nextAnimalId = 1;
            this.game.livestockManager.dailyFeedCost = 0;
        }
        
        if (this.game.machinesManager) {
            this.game.machinesManager.machines.clear();
            this.game.machinesManager.nextMachineId = 1;
        }
        
        if (this.game.productionManager) {
            this.game.productionManager.warehouses.clear();
            this.game.productionManager.factories.clear();
            this.game.productionManager.inventory.clear();
            this.game.productionManager.nextFactoryId = 1;
            this.game.productionManager.nextWarehouseId = 1;
        }
        
        if (this.game.marketManager) {
            this.game.marketManager.initializeMarket();
            this.game.marketManager.contracts.clear();
            this.game.marketManager.nextContractId = 1;
        }
        
        if (this.game.financeManager) {
            this.game.financeManager.monthlyReports = [];
            this.game.financeManager.transactions = [];
            this.game.financeManager.initializeCategories();
            this.game.financeManager.loans.clear();
            this.game.financeManager.nextLoanId = 1;
        }
        
        // Réinitialiser l'état du jeu
        this.game.gameState = {
            money: 10000,
            level: 1,
            experience: 0,
            weather: 'sunny',
            season: 'spring',
            day: 1,
            cropProduction: 0,
            animalProduction: 0,
            industrialProduction: 0,
            playTime: 0
        };
        
        console.log('🎮 Nouveau jeu démarré');
        this.showNotification('Nouveau jeu démarré', 'success');
        
        this.updateAllManagers();
    }
    
    // Exporter la sauvegarde
    exportSave() {
        try {
            const saveData = this.createSaveData();
            const jsonString = JSON.stringify(saveData, null, 2);
            
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `ferme_industrielle_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            console.log('💾 Sauvegarde exportée');
            this.showNotification('Sauvegarde exportée avec succès', 'success');
        } catch (error) {
            console.error('❌ Erreur lors de l\'export:', error);
            this.showNotification('Erreur lors de l\'export', 'error');
        }
    }
    
    // Importer une sauvegarde
    importSave(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const saveData = JSON.parse(e.target.result);
                
                if (confirm('Êtes-vous sûr de vouloir charger cette sauvegarde ? Votre progression actuelle sera remplacée.')) {
                    this.applySaveData(saveData);
                    console.log('💾 Sauvegarde importée');
                    this.showNotification('Sauvegarde importée avec succès', 'success');
                }
            } catch (error) {
                console.error('❌ Erreur lors de l\'import:', error);
                this.showNotification('Fichier de sauvegarde invalide', 'error');
            }
        };
        
        reader.readAsText(file);
    }
    
    // Compresser les données de sauvegarde
    compressSaveData(data) {
        // Simple compression par suppression des propriétés vides
        return JSON.parse(JSON.stringify(data, (key, value) => {
            if (value === null || value === undefined || value === '' || 
                (Array.isArray(value) && value.length === 0) ||
                (typeof value === 'object' && Object.keys(value).length === 0)) {
                return undefined;
            }
            return value;
        }));
    }
    
    // Décompresser les données de sauvegarde
    decompressSaveData(data) {
        // Pour l'instant, pas de décompression nécessaire
        return data;
    }
    
    // Convertir Map en Object pour la sérialisation
    mapToObject(map) {
        if (!map || !(map instanceof Map)) return {};
        
        const obj = {};
        map.forEach((value, key) => {
            obj[key] = value;
        });
        return obj;
    }
    
    // Convertir Object en Map
    objectToMap(obj) {
        if (!obj || typeof obj !== 'object') return new Map();
        
        const map = new Map();
        Object.entries(obj).forEach(([key, value]) => {
            map.set(key, value);
        });
        return map;
    }
    
    // Mettre à jour tous les managers
    updateAllManagers() {
        if (this.game.cropsManager) this.game.cropsManager.updateUI();
        if (this.game.livestockManager) this.game.livestockManager.updateUI();
        if (this.game.machinesManager) this.game.machinesManager.updateUI();
        if (this.game.productionManager) this.game.productionManager.updateUI();
        if (this.game.marketManager) this.game.marketManager.updateUI();
        if (this.game.financeManager) this.game.financeManager.updateUI();
        if (this.game.weatherManager) this.game.weatherManager.updateUI();
        if (this.game.uiManager) this.game.uiManager.updateUI();
    }
    
    // Mise à jour (auto-sauvegarde)
    update(deltaTime) {
        const currentTime = Date.now();
        
        // Auto-sauvegarde
        if (currentTime - this.lastAutoSave > this.autoSaveInterval) {
            this.saveGame(1, true); // Auto-sauvegarde dans l'emplacement spécial
            this.lastAutoSave = currentTime;
        }
    }
    
    // Mettre à jour la liste des sauvegardes
    updateSaveList() {
        const saveList = document.getElementById('saveList');
        if (!saveList) return;
        
        let html = '<div class="save-slots"><h4>💾 Emplacements de sauvegarde</h4>';
        
        for (let i = 1; i <= this.saveSlots; i++) {
            const saveKey = `farmGame_save_${i}`;
            const savedData = localStorage.getItem(saveKey);
            
            if (savedData) {
                try {
                    const saveInfo = JSON.parse(savedData);
                    const date = new Date(saveInfo.timestamp).toLocaleString();
                    const money = saveInfo.gameState?.money || 0;
                    
                    html += `<div class="save-slot filled">
                        <span>Emplacement ${i}</span>
                        <span>${date}</span>
                        <span>${money}€</span>
                        <button onclick="window.game.saveManager.loadGame(${i})">Charger</button>
                        <button onclick="window.game.saveManager.deleteSave(${i})">Supprimer</button>
                    </div>`;
                } catch (error) {
                    html += `<div class="save-slot corrupted">
                        <span>Emplacement ${i}</span>
                        <span>Sauvegarde corrompue</span>
                        <button onclick="window.game.saveManager.deleteSave(${i})">Supprimer</button>
                    </div>`;
                }
            } else {
                html += `<div class="save-slot empty">
                    <span>Emplacement ${i}</span>
                    <span>Vide</span>
                    <button onclick="window.game.saveManager.saveGame(${i})">Sauvegarder</button>
                </div>`;
            }
        }
        
        html += '</div>';
        saveList.innerHTML = html;
    }
    
    // Supprimer une sauvegarde
    deleteSave(slot) {
        if (confirm(`Êtes-vous sûr de vouloir supprimer la sauvegarde de l'emplacement ${slot} ?`)) {
            localStorage.removeItem(`farmGame_save_${slot}`);
            console.log(`💾 Sauvegarde de l'emplacement ${slot} supprimée`);
            this.showNotification(`Sauvegarde ${slot} supprimée`, 'success');
            this.updateSaveList();
        }
    }
    
    // Afficher une notification
    showNotification(message, type = 'info') {
        if (this.game.uiManager) {
            this.game.uiManager.showNotification(message, type);
        } else {
            console.log(`📢 ${message}`);
        }
    }
    
    // Obtenir des informations sur le stockage
    getStorageInfo() {
        try {
            const totalSize = new TextEncoder().encode(JSON.stringify(localStorage)).length;
            const saveSize = new TextEncoder().encode(JSON.stringify(this.createSaveData())).length;
            
            return {
                totalStorageUsed: totalSize,
                saveDataSize: saveSize,
                estimatedSpace: 5000000 - totalSize, // 5MB limite estimée
                canSave: totalSize < 4000000 // Garder une marge de sécurité
            };
        } catch (error) {
            return {
                totalStorageUsed: 0,
                saveDataSize: 0,
                estimatedSpace: 5000000,
                canSave: true
            };
        }
    }
}

// Exporter le module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaveManager;
}
