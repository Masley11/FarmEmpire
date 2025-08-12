
// ===== MODULE DE GESTION DE LA PRODUCTION =====

class ProductionManager {
    constructor() {
        this.game = null;
        this.warehouses = new Map(); // Entrepôts de stockage
        this.factories = new Map(); // Usines de transformation
        this.inventory = new Map(); // Inventaire des produits finis
        this.productionQueue = []; // File d'attente de production
        this.nextFactoryId = 1;
        this.nextWarehouseId = 1;
        
        // Types d'usines disponibles
        this.factoryTypes = {
            mill: {
                name: 'Moulin',
                emoji: '🏭',
                buildCost: 25000,
                capacity: 100, // tonnes/jour
                maintenanceCost: 200, // €/jour
                inputTypes: ['wheat', 'corn'],
                outputType: 'flour',
                conversionRate: 0.8, // 1t de blé = 0.8t de farine
                processingTime: 2000, // 2 secondes
                powerConsumption: 50 // kWh/jour
            },
            dairy: {
                name: 'Laiterie',
                emoji: '🥛',
                buildCost: 35000,
                capacity: 500, // litres/jour
                maintenanceCost: 300,
                inputTypes: ['cow_milk'],
                outputType: 'processed_milk',
                conversionRate: 0.95,
                processingTime: 1500,
                powerConsumption: 75
            },
            meat_plant: {
                name: 'Abattoir',
                emoji: '🏗️',
                buildCost: 50000,
                capacity: 50, // kg/jour
                maintenanceCost: 500,
                inputTypes: ['cow_meat', 'chicken_meat', 'pig_meat'],
                outputType: 'processed_meat',
                conversionRate: 0.9,
                processingTime: 3000,
                powerConsumption: 100
            },
            oil_press: {
                name: 'Pressoir à huile',
                emoji: '🛢️',
                buildCost: 20000,
                capacity: 80,
                maintenanceCost: 150,
                inputTypes: ['soybean'],
                outputType: 'vegetable_oil',
                conversionRate: 0.4,
                processingTime: 2500,
                powerConsumption: 40
            }
        };
        
        // Types d'entrepôts
        this.warehouseTypes = {
            basic: {
                name: 'Entrepôt basique',
                emoji: '📦',
                buildCost: 10000,
                capacity: 500, // tonnes
                maintenanceCost: 100,
                temperatureControlled: false
            },
            refrigerated: {
                name: 'Entrepôt frigorifique',
                emoji: '❄️',
                buildCost: 25000,
                capacity: 300,
                maintenanceCost: 250,
                temperatureControlled: true,
                powerConsumption: 80
            },
            silo: {
                name: 'Silo à grains',
                emoji: '🌾',
                buildCost: 15000,
                capacity: 1000,
                maintenanceCost: 75,
                temperatureControlled: false,
                grainOnly: true
            }
        };
        
        console.log('🏭 ProductionManager initialisé');
    }
    
    // Initialisation du module
    init(gameInstance) {
        this.game = gameInstance;
        this.setupUI();
        console.log('✅ Module Production initialisé');
    }
    
    // Configuration de l'interface utilisateur
    setupUI() {
        // Gestionnaires d'événements pour la construction
        const buildFactoryBtn = document.getElementById('buildFactory');
        const buildWarehouseBtn = document.getElementById('buildWarehouse');
        
        if (buildFactoryBtn) {
            buildFactoryBtn.addEventListener('click', () => {
                const factoryType = document.getElementById('factoryType')?.value;
                if (factoryType) {
                    this.buildFactory(factoryType);
                }
            });
        }
        
        if (buildWarehouseBtn) {
            buildWarehouseBtn.addEventListener('click', () => {
                const warehouseType = document.getElementById('warehouseType')?.value;
                if (warehouseType) {
                    this.buildWarehouse(warehouseType);
                }
            });
        }
    }
    
    // Construire une usine
    buildFactory(factoryType) {
        const factoryInfo = this.factoryTypes[factoryType];
        if (!factoryInfo) return false;
        
        // Vérifier les fonds
        if (!this.game.spendMoney(factoryInfo.buildCost)) {
            console.log(`💰 Pas assez d'argent pour construire ${factoryInfo.name} (coût: ${factoryInfo.buildCost}€)`);
            return false;
        }
        
        const factory = {
            id: this.nextFactoryId++,
            type: factoryType,
            level: 1,
            isOperational: true,
            efficiency: 1.0,
            lastMaintenance: Date.now(),
            currentProduction: null,
            totalProduced: 0,
            buildDate: Date.now(),
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100
        };
        
        this.factories.set(factory.id.toString(), factory);
        console.log(`🏭 ${factoryInfo.name} construite (ID: ${factory.id})`);
        this.updateUI();
        return true;
    }
    
    // Construire un entrepôt
    buildWarehouse(warehouseType) {
        const warehouseInfo = this.warehouseTypes[warehouseType];
        if (!warehouseInfo) return false;
        
        if (!this.game.spendMoney(warehouseInfo.buildCost)) {
            console.log(`💰 Pas assez d'argent pour construire ${warehouseInfo.name} (coût: ${warehouseInfo.buildCost}€)`);
            return false;
        }
        
        const warehouse = {
            id: this.nextWarehouseId++,
            type: warehouseType,
            level: 1,
            currentCapacity: 0,
            storedItems: new Map(),
            buildDate: Date.now(),
            x: Math.random() * 400 + 500,
            y: Math.random() * 300 + 100
        };
        
        this.warehouses.set(warehouse.id.toString(), warehouse);
        console.log(`📦 ${warehouseInfo.name} construit (ID: ${warehouse.id})`);
        this.updateUI();
        return true;
    }
    
    // Démarrer la production dans une usine
    startProduction(factoryId, inputType, quantity) {
        const factory = this.factories.get(factoryId.toString());
        if (!factory || !factory.isOperational) return false;
        
        const factoryInfo = this.factoryTypes[factory.type];
        if (!factoryInfo.inputTypes.includes(inputType)) return false;
        
        // Vérifier si nous avons assez de matières premières
        const availableInput = this.getAvailableInput(inputType);
        if (availableInput < quantity) {
            console.log(`❌ Pas assez de ${inputType} disponible (demandé: ${quantity}, disponible: ${availableInput})`);
            return false;
        }
        
        // Calculer la production
        const outputQuantity = quantity * factoryInfo.conversionRate * factory.efficiency;
        const processingTime = factoryInfo.processingTime / factory.efficiency;
        
        // Consommer les matières premières
        this.consumeInput(inputType, quantity);
        
        // Démarrer la production
        factory.currentProduction = {
            inputType,
            inputQuantity: quantity,
            outputType: factoryInfo.outputType,
            outputQuantity,
            startTime: Date.now(),
            completionTime: Date.now() + processingTime
        };
        
        console.log(`🏭 Production démarrée dans usine ${factoryId}: ${quantity} ${inputType} → ${outputQuantity.toFixed(2)} ${factoryInfo.outputType}`);
        return true;
    }
    
    // Obtenir les matières premières disponibles
    getAvailableInput(inputType) {
        let total = 0;
        
        // Vérifier dans les cultures
        if (this.game.cropsManager) {
            const cropInventory = this.game.cropsManager.getInventory();
            total += cropInventory.get(inputType) || 0;
        }
        
        // Vérifier dans l'élevage
        if (this.game.livestockManager) {
            const livestockInventory = this.game.livestockManager.getInventory();
            total += livestockInventory.get(inputType) || 0;
        }
        
        return total;
    }
    
    // Consommer les matières premières
    consumeInput(inputType, quantity) {
        let remaining = quantity;
        
        // Consommer des cultures en premier
        if (this.game.cropsManager && remaining > 0) {
            const cropInventory = this.game.cropsManager.getInventory();
            const available = cropInventory.get(inputType) || 0;
            const consumed = Math.min(available, remaining);
            
            if (consumed > 0) {
                cropInventory.set(inputType, available - consumed);
                remaining -= consumed;
            }
        }
        
        // Consommer des produits d'élevage si nécessaire
        if (this.game.livestockManager && remaining > 0) {
            const livestockInventory = this.game.livestockManager.getInventory();
            const available = livestockInventory.get(inputType) || 0;
            const consumed = Math.min(available, remaining);
            
            if (consumed > 0) {
                livestockInventory.set(inputType, available - consumed);
                remaining -= consumed;
            }
        }
    }
    
    // Stocker des produits dans un entrepôt
    storeProduct(warehouseId, productType, quantity) {
        const warehouse = this.warehouses.get(warehouseId.toString());
        if (!warehouse) return false;
        
        const warehouseInfo = this.warehouseTypes[warehouse.type];
        const currentStored = warehouse.storedItems.get(productType) || 0;
        
        // Vérifier la capacité
        if (warehouse.currentCapacity + quantity > warehouseInfo.capacity) {
            console.log(`📦 Entrepôt ${warehouseId} plein`);
            return false;
        }
        
        warehouse.storedItems.set(productType, currentStored + quantity);
        warehouse.currentCapacity += quantity;
        
        console.log(`📦 Stocké ${quantity} ${productType} dans entrepôt ${warehouseId}`);
        return true;
    }
    
    // Mise à jour de la production
    update(deltaTime) {
        this.updateFactories();
        this.updateWarehouses();
        this.updateProductionStats();
    }
    
    // Mettre à jour les usines
    updateFactories() {
        const currentTime = Date.now();
        
        this.factories.forEach((factory, factoryId) => {
            if (!factory.isOperational) return;
            
            const factoryInfo = this.factoryTypes[factory.type];
            
            // Vérifier si la production est terminée
            if (factory.currentProduction && currentTime >= factory.currentProduction.completionTime) {
                this.completeProduction(factoryId, factory);
            }
            
            // Calculer l'usure et la maintenance
            const timeSinceMaintenance = currentTime - factory.lastMaintenance;
            const daysSinceMaintenance = timeSinceMaintenance / (24 * 60 * 60 * 1000);
            
            // Diminuer l'efficacité au fil du temps
            if (daysSinceMaintenance > 7) {
                factory.efficiency = Math.max(0.5, 1.0 - (daysSinceMaintenance - 7) * 0.02);
            }
            
            // Coût de maintenance quotidien
            if (daysSinceMaintenance >= 1) {
                const maintenanceCost = factoryInfo.maintenanceCost;
                if (this.game.spendMoney(maintenanceCost)) {
                    factory.lastMaintenance = currentTime;
                    factory.efficiency = Math.min(1.0, factory.efficiency + 0.1);
                } else {
                    factory.isOperational = false;
                    console.log(`🏭 Usine ${factoryId} fermée par manque de maintenance`);
                }
            }
        });
    }
    
    // Terminer une production
    completeProduction(factoryId, factory) {
        const production = factory.currentProduction;
        if (!production) return;
        
        // Ajouter le produit fini à l'inventaire
        const currentAmount = this.inventory.get(production.outputType) || 0;
        this.inventory.set(production.outputType, currentAmount + production.outputQuantity);
        
        factory.totalProduced += production.outputQuantity;
        factory.currentProduction = null;
        
        console.log(`✅ Production terminée: ${production.outputQuantity.toFixed(2)} ${production.outputType}`);
        
        // Essayer de stocker automatiquement
        this.autoStore(production.outputType, production.outputQuantity);
    }
    
    // Stockage automatique
    autoStore(productType, quantity) {
        for (const [warehouseId, warehouse] of this.warehouses) {
            const warehouseInfo = this.warehouseTypes[warehouse.type];
            
            // Vérifier la compatibilité
            if (warehouseInfo.grainOnly && !['flour', 'wheat', 'corn', 'soybean'].includes(productType)) {
                continue;
            }
            
            if (warehouseInfo.temperatureControlled || !['processed_milk', 'processed_meat'].includes(productType)) {
                const spaceAvailable = warehouseInfo.capacity - warehouse.currentCapacity;
                const toStore = Math.min(quantity, spaceAvailable);
                
                if (toStore > 0) {
                    this.storeProduct(warehouseId, productType, toStore);
                    quantity -= toStore;
                }
                
                if (quantity <= 0) break;
            }
        }
    }
    
    // Mettre à jour les entrepôts
    updateWarehouses() {
        this.warehouses.forEach((warehouse, warehouseId) => {
            const warehouseInfo = this.warehouseTypes[warehouse.type];
            
            // Coût de maintenance
            if (warehouseInfo.maintenanceCost > 0) {
                const dailyCost = warehouseInfo.maintenanceCost / (24 * 60 * 60 * 1000); // par milliseconde
                this.game.spendMoney(dailyCost);
            }
        });
    }
    
    // Mettre à jour les statistiques de production
    updateProductionStats() {
        let totalProductionValue = 0;
        
        this.inventory.forEach((quantity, productType) => {
            // Estimer la valeur des produits finis
            let productValue = 0;
            switch (productType) {
                case 'flour': productValue = 1.5; break;
                case 'processed_milk': productValue = 1.2; break;
                case 'processed_meat': productValue = 20; break;
                case 'vegetable_oil': productValue = 3.0; break;
                default: productValue = 1.0;
            }
            
            totalProductionValue += quantity * productValue;
        });
        
        if (this.game) {
            this.game.gameState.industrialProduction = Math.round(totalProductionValue);
        }
    }
    
    // Mettre à jour l'interface utilisateur
    updateUI() {
        // Mettre à jour les statistiques de production
        const productionStats = document.getElementById('productionStats');
        if (productionStats) {
            let html = '<div class="production-overview">';
            html += `<h4>🏭 Usines (${this.factories.size})</h4>`;
            
            this.factories.forEach((factory, factoryId) => {
                const factoryInfo = this.factoryTypes[factory.type];
                const status = factory.isOperational ? '✅' : '❌';
                const efficiency = Math.round(factory.efficiency * 100);
                
                html += `<div class="factory-item">
                    <span>${factoryInfo.emoji} ${factoryInfo.name} ${status}</span>
                    <span>Efficacité: ${efficiency}%</span>
                </div>`;
            });
            
            html += `<h4>📦 Entrepôts (${this.warehouses.size})</h4>`;
            
            this.warehouses.forEach((warehouse, warehouseId) => {
                const warehouseInfo = this.warehouseTypes[warehouse.type];
                const capacity = Math.round((warehouse.currentCapacity / warehouseInfo.capacity) * 100);
                
                html += `<div class="warehouse-item">
                    <span>${warehouseInfo.emoji} ${warehouseInfo.name}</span>
                    <span>Capacité: ${capacity}%</span>
                </div>`;
            });
            
            html += '<h4>📋 Produits finis</h4>';
            this.inventory.forEach((quantity, productType) => {
                html += `<div class="product-item">
                    <span>${productType}:</span>
                    <span>${quantity.toFixed(1)}</span>
                </div>`;
            });
            
            html += '</div>';
            productionStats.innerHTML = html;
        }
    }
    
    // Obtenir les statistiques de production
    getProductionStats() {
        return {
            factories: this.factories.size,
            warehouses: this.warehouses.size,
            totalProduction: this.inventory,
            factoryEfficiency: this.getAverageEfficiency()
        };
    }
    
    // Obtenir l'efficacité moyenne des usines
    getAverageEfficiency() {
        if (this.factories.size === 0) return 0;
        
        let totalEfficiency = 0;
        this.factories.forEach(factory => {
            totalEfficiency += factory.efficiency;
        });
        
        return totalEfficiency / this.factories.size;
    }
    
    // Obtenir l'inventaire des produits finis
    getInventory() {
        return new Map(this.inventory);
    }
    
    // Vendre des produits finis
    sellProduct(productType, quantity) {
        const currentAmount = this.inventory.get(productType) || 0;
        if (currentAmount < quantity) return 0;
        
        // Prix de base des produits finis
        const basePrices = {
            flour: 1.5,
            processed_milk: 1.2,
            processed_meat: 20,
            vegetable_oil: 3.0
        };
        
        const price = basePrices[productType] || 1.0;
        const totalPrice = quantity * price;
        
        this.inventory.set(productType, currentAmount - quantity);
        this.game.addMoney(totalPrice);
        
        console.log(`💰 Vendu ${quantity} ${productType} pour ${totalPrice}€`);
        this.updateUI();
        
        return totalPrice;
    }
    
    // Rendu sur le canvas
    render(ctx) {
        // Dessiner les usines
        this.factories.forEach((factory, factoryId) => {
            const factoryInfo = this.factoryTypes[factory.type];
            
            ctx.fillStyle = factory.isOperational ? '#4CAF50' : '#F44336';
            ctx.fillRect(factory.x, factory.y, 40, 30);
            
            ctx.fillStyle = '#000';
            ctx.font = '16px Arial';
            ctx.fillText(factoryInfo.emoji, factory.x + 5, factory.y + 20);
        });
        
        // Dessiner les entrepôts
        this.warehouses.forEach((warehouse, warehouseId) => {
            const warehouseInfo = this.warehouseTypes[warehouse.type];
            
            ctx.fillStyle = '#9E9E9E';
            ctx.fillRect(warehouse.x, warehouse.y, 35, 25);
            
            ctx.fillStyle = '#000';
            ctx.font = '14px Arial';
            ctx.fillText(warehouseInfo.emoji, warehouse.x + 5, warehouse.y + 18);
        });
    }
}

// Exporter le module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductionManager;
}
