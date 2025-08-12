
// ===== MODULE DE GESTION DE L'ÉLEVAGE =====

class LivestockManager {
    constructor() {
        this.animals = new Map(); // Map des animaux (key: "animalId", value: animal object)
        this.inventory = new Map(); // Inventaire des produits animaux
        this.selectedAnimalType = 'cow';
        this.game = null;
        this.nextAnimalId = 1;
        this.dailyFeedCost = 0;
        
        // Définition des types d'animaux
        this.animalTypes = {
            cow: {
                name: 'Vache',
                purchaseCost: 1500,
                dailyFeedCost: 25,
                maxHealth: 100,
                maturityAge: 30, // jours (30 secondes pour test)
                lifespan: 180, // jours
                products: {
                    milk: {
                        name: 'Lait',
                        emoji: '🥛',
                        dailyProduction: 25, // litres/jour
                        sellPrice: 0.8, // €/litre
                        requiresMaturity: true
                    },
                    meat: {
                        name: 'Viande bovine',
                        emoji: '🥩',
                        productionOnDeath: 400, // kg
                        sellPrice: 15 // €/kg
                    }
                },
                emoji: '🐄',
                color: '#8B4513',
                healthDecayRate: 2 // points/jour sans nourriture
            },
            chicken: {
                name: 'Poule',
                purchaseCost: 50,
                dailyFeedCost: 2,
                maxHealth: 100,
                maturityAge: 7, // jours
                lifespan: 60, // jours
                products: {
                    eggs: {
                        name: 'Œufs',
                        emoji: '🥚',
                        dailyProduction: 0.8, // œufs/jour
                        sellPrice: 0.3, // €/œuf
                        requiresMaturity: true
                    },
                    meat: {
                        name: 'Viande de poulet',
                        emoji: '🍗',
                        productionOnDeath: 2, // kg
                        sellPrice: 8 // €/kg
                    }
                },
                emoji: '🐔',
                color: '#FFD700',
                healthDecayRate: 5 // points/jour sans nourriture
            },
            pig: {
                name: 'Cochon',
                purchaseCost: 800,
                dailyFeedCost: 15,
                maxHealth: 100,
                maturityAge: 20, // jours
                lifespan: 120, // jours
                products: {
                    meat: {
                        name: 'Viande de porc',
                        emoji: '🥓',
                        productionOnDeath: 120, // kg
                        sellPrice: 12 // €/kg
                    }
                },
                emoji: '🐷',
                color: '#FFB6C1',
                healthDecayRate: 3 // points/jour sans nourriture
            }
        };
        
        // Initialiser l'inventaire
        for (const animalType in this.animalTypes) {
            const products = this.animalTypes[animalType].products;
            for (const productType in products) {
                this.inventory.set(`${animalType}_${productType}`, 0);
            }
        }
        
        console.log('🐄 LivestockManager initialisé');
    }
    
    // Initialisation du module
    init(gameInstance) {
        this.game = gameInstance;
        this.setupUI();
        console.log('✅ Module Élevage initialisé');
    }
    
    // Configuration de l'interface utilisateur
    setupUI() {
        // Gestionnaire pour l'achat d'animaux
        const buyButton = document.getElementById('buyLivestock');
        if (buyButton) {
            buyButton.addEventListener('click', () => {
                this.buyAnimal(this.selectedAnimalType);
            });
        }
        
        // Gestionnaire pour la sélection du type d'animal
        const animalSelect = document.getElementById('livestockType');
        if (animalSelect) {
            animalSelect.addEventListener('change', (e) => {
                this.selectedAnimalType = e.target.value;
                console.log(`🐄 Type d'animal sélectionné: ${this.selectedAnimalType}`);
            });
        }
        
        // Bouton pour nourrir tous les animaux
        const feedAllButton = document.createElement('button');
        feedAllButton.textContent = 'Nourrir tous les animaux';
        feedAllButton.className = 'action-btn';
        feedAllButton.addEventListener('click', () => {
            this.feedAllAnimals();
        });
        
        // Ajouter le bouton à l'interface
        const livestockTab = document.getElementById('livestock-tab');
        if (livestockTab) {
            const feedSection = document.createElement('div');
            feedSection.className = 'feed-section';
            feedSection.innerHTML = `
                <h4>Alimentation</h4>
                <div class="feed-info">
                    <p>Coût quotidien: <span id="dailyFeedCost">0€</span></p>
                </div>
            `;
            feedSection.appendChild(feedAllButton);
            livestockTab.appendChild(feedSection);
        }
        
        this.updateUI();
    }
    
    // Acheter un animal
    buyAnimal(animalType) {
        const animalInfo = this.animalTypes[animalType];
        if (!animalInfo) {
            console.error(`❌ Type d'animal inconnu: ${animalType}`);
            return false;
        }
        
        // Vérifier si le joueur a assez d'argent
        if (!this.game.spendMoney(animalInfo.purchaseCost)) {
            console.log(`💰 Pas assez d'argent pour acheter ${animalInfo.name} (coût: ${animalInfo.purchaseCost}€)`);
            return false;
        }
        
        // Créer le nouvel animal
        const animal = {
            id: this.nextAnimalId++,
            type: animalType,
            age: 0, // en jours
            health: animalInfo.maxHealth,
            lastFed: Date.now(),
            purchaseDate: Date.now(),
            isAlive: true,
            totalProduction: {}
        };
        
        // Initialiser la production totale
        for (const productType in animalInfo.products) {
            animal.totalProduction[productType] = 0;
        }
        
        // Ajouter à la map des animaux
        this.animals.set(animal.id.toString(), animal);
        
        console.log(`🐄 ${animalInfo.name} acheté pour ${animalInfo.purchaseCost}€ (ID: ${animal.id})`);
        this.updateDailyFeedCost();
        this.updateUI();
        
        return true;
    }
    
    // Nourrir un animal spécifique
    feedAnimal(animalId) {
        const animal = this.animals.get(animalId.toString());
        if (!animal || !animal.isAlive) {
            console.log('❌ Animal introuvable ou mort');
            return false;
        }
        
        const animalInfo = this.animalTypes[animal.type];
        const feedCost = animalInfo.dailyFeedCost;
        
        // Vérifier si le joueur a assez d'argent
        if (!this.game.spendMoney(feedCost)) {
            console.log(`💰 Pas assez d'argent pour nourrir l'animal (coût: ${feedCost}€)`);
            return false;
        }
        
        // Nourrir l'animal
        animal.lastFed = Date.now();
        animal.health = Math.min(animal.health + 10, animalInfo.maxHealth);
        
        console.log(`🌾 Animal ${animalId} nourri pour ${feedCost}€`);
        this.updateUI();
        
        return true;
    }
    
    // Nourrir tous les animaux
    feedAllAnimals() {
        let totalCost = 0;
        let fedCount = 0;
        
        // Calculer le coût total
        this.animals.forEach(animal => {
            if (animal.isAlive) {
                const animalInfo = this.animalTypes[animal.type];
                totalCost += animalInfo.dailyFeedCost;
            }
        });
        
        // Vérifier si le joueur a assez d'argent
        if (!this.game.spendMoney(totalCost)) {
            console.log(`💰 Pas assez d'argent pour nourrir tous les animaux (coût: ${totalCost}€)`);
            return false;
        }
        
        // Nourrir tous les animaux
        this.animals.forEach(animal => {
            if (animal.isAlive) {
                const animalInfo = this.animalTypes[animal.type];
                animal.lastFed = Date.now();
                animal.health = Math.min(animal.health + 15, animalInfo.maxHealth);
                fedCount++;
            }
        });
        
        console.log(`🌾 ${fedCount} animaux nourris pour ${totalCost}€`);
        this.updateUI();
        
        return true;
    }
    
    // Vendre des produits animaux
    sellProduct(productKey, quantity) {
        const currentAmount = this.inventory.get(productKey) || 0;
        if (currentAmount < quantity) {
            console.log(`❌ Pas assez de produit en stock (demandé: ${quantity}, stock: ${currentAmount})`);
            return false;
        }
        
        // Trouver les informations du produit
        let productInfo = null;
        let animalType = null;
        
        for (const type in this.animalTypes) {
            for (const product in this.animalTypes[type].products) {
                if (productKey === `${type}_${product}`) {
                    productInfo = this.animalTypes[type].products[product];
                    animalType = type;
                    break;
                }
            }
            if (productInfo) break;
        }
        
        if (!productInfo) {
            console.error(`❌ Produit inconnu: ${productKey}`);
            return false;
        }
        
        // Calculer le prix de vente
        let sellPrice = productInfo.sellPrice;
        if (window.Market && window.Market.getPriceMultiplier) {
            sellPrice *= window.Market.getPriceMultiplier(productKey);
        }
        
        const totalPrice = Math.round(quantity * sellPrice * 100) / 100;
        
        // Mettre à jour l'inventaire et l'argent
        this.inventory.set(productKey, currentAmount - quantity);
        this.game.earnMoney(totalPrice);
        
        console.log(`💰 Vendu ${quantity} ${productInfo.name} pour ${totalPrice}€`);
        this.updateUI();
        
        return totalPrice;
    }
    
    // Mise à jour des animaux (appelée dans la boucle de jeu)
    update(deltaTime) {
        const currentTime = Date.now();
        const dayDuration = 1000; // 1 seconde = 1 jour pour test
        
        this.animals.forEach((animal, animalId) => {
            if (!animal.isAlive) return;
            
            const animalInfo = this.animalTypes[animal.type];
            
            // Mise à jour de l'âge
            const ageInMs = currentTime - animal.purchaseDate;
            animal.age = Math.floor(ageInMs / dayDuration);
            
            // Vérifier si l'animal est mort de vieillesse
            if (animal.age >= animalInfo.lifespan) {
                this.killAnimal(animalId, 'vieillesse');
                return;
            }
            
            // Mise à jour de la santé (diminue si pas nourri)
            const timeSinceLastFed = currentTime - animal.lastFed;
            const daysSinceLastFed = timeSinceLastFed / dayDuration;
            
            if (daysSinceLastFed > 1) {
                const healthLoss = animalInfo.healthDecayRate * (daysSinceLastFed - 1);
                animal.health = Math.max(0, animal.health - healthLoss);
                
                // Vérifier si l'animal est mort de malnutrition
                if (animal.health <= 0) {
                    this.killAnimal(animalId, 'malnutrition');
                    return;
                }
            }
            
            // Production si l'animal est mature et en bonne santé
            if (animal.age >= animalInfo.maturityAge && animal.health > 50) {
                this.produceFromAnimal(animal, animalInfo, deltaTime);
            }
        });
        
        this.updateProductionStats();
    }
    
    // Production d'un animal
    produceFromAnimal(animal, animalInfo, deltaTime) {
        const productionInterval = 5000; // Production toutes les 5 secondes
        const now = Date.now();
        
        if (!animal.lastProduction) {
            animal.lastProduction = now;
        }
        
        if (now - animal.lastProduction >= productionInterval) {
            for (const productType in animalInfo.products) {
                const product = animalInfo.products[productType];
                
                if (product.dailyProduction && product.requiresMaturity) {
                    // Production quotidienne (lait, œufs)
                    const productionAmount = product.dailyProduction * (productionInterval / 86400000); // Production proportionnelle
                    const inventoryKey = `${animal.type}_${productType}`;
                    
                    const currentAmount = this.inventory.get(inventoryKey) || 0;
                    this.inventory.set(inventoryKey, currentAmount + productionAmount);
                    
                    animal.totalProduction[productType] += productionAmount;
                    
                    console.log(`${animalInfo.emoji} Animal ${animal.id} a produit ${productionAmount.toFixed(2)} ${product.name}`);
                }
            }
            
            animal.lastProduction = now;
        }
    }
    
    // Tuer un animal (vieillesse, maladie, abattage)
    killAnimal(animalId, cause = 'abattage') {
        const animal = this.animals.get(animalId.toString());
        if (!animal || !animal.isAlive) return;
        
        const animalInfo = this.animalTypes[animal.type];
        animal.isAlive = false;
        
        // Production de viande
        for (const productType in animalInfo.products) {
            const product = animalInfo.products[productType];
            
            if (product.productionOnDeath) {
                const inventoryKey = `${animal.type}_${productType}`;
                const currentAmount = this.inventory.get(inventoryKey) || 0;
                this.inventory.set(inventoryKey, currentAmount + product.productionOnDeath);
                
                console.log(`💀 Animal ${animalId} mort (${cause}) - Production: ${product.productionOnDeath}kg de ${product.name}`);
            }
        }
        
        this.updateDailyFeedCost();
        this.updateUI();
    }
    
    // Mettre à jour le coût quotidien d'alimentation
    updateDailyFeedCost() {
        this.dailyFeedCost = 0;
        
        this.animals.forEach(animal => {
            if (animal.isAlive) {
                const animalInfo = this.animalTypes[animal.type];
                this.dailyFeedCost += animalInfo.dailyFeedCost;
            }
        });
        
        // Mettre à jour l'affichage
        const feedCostElement = document.getElementById('dailyFeedCost');
        if (feedCostElement) {
            feedCostElement.textContent = `${this.dailyFeedCost}€`;
        }
    }
    
    // Mettre à jour les statistiques de production
    updateProductionStats() {
        let totalAnimalProduction = 0;
        
        // Calculer la valeur totale de la production potentielle
        this.inventory.forEach((quantity, productKey) => {
            const [animalType, productType] = productKey.split('_');
            const animalInfo = this.animalTypes[animalType];
            
            if (animalInfo && animalInfo.products[productType]) {
                const product = animalInfo.products[productType];
                totalAnimalProduction += quantity * product.sellPrice;
            }
        });
        
        // Mettre à jour l'état du jeu
        if (this.game) {
            this.game.gameState.animalProduction = Math.round(totalAnimalProduction);
        }
    }
    
    // Rendu des animaux sur le canvas (optionnel - pour visualisation)
    render(ctx) {
        // Les animaux peuvent être représentés dans des enclos
        // Cette fonction pourrait dessiner des bâtiments d'élevage
        let animalCount = 0;
        const startX = 500; // Position des bâtiments d'élevage
        const startY = 50;
        
        // Dessiner des bâtiments pour chaque type d'animal
        Object.keys(this.animalTypes).forEach((animalType, index) => {
            const animalsOfType = Array.from(this.animals.values()).filter(
                animal => animal.type === animalType && animal.isAlive
            );
            
            if (animalsOfType.length > 0) {
                const x = startX + (index * 80);
                const y = startY;
                const size = 60;
                
                // Dessiner le bâtiment
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(x, y, size, size);
                
                // Bordure
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, size, size);
                
                // Emoji de l'animal
                ctx.font = `${size * 0.4}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#000';
                ctx.fillText(
                    this.animalTypes[animalType].emoji,
                    x + size / 2,
                    y + size / 2 - 5
                );
                
                // Nombre d'animaux
                ctx.font = `${size * 0.2}px Arial`;
                ctx.fillText(
                    animalsOfType.length.toString(),
                    x + size / 2,
                    y + size - 8
                );
            }
        });
    }
    
    // Mettre à jour l'interface utilisateur
    updateUI() {
        // Mettre à jour les statistiques d'élevage
        const livestockStats = document.getElementById('livestockStats');
        if (livestockStats) {
            let html = '<div class="stats-grid">';
            
            // Compteur par type d'animal
            const animalCounts = {};
            const healthStats = {};
            
            this.animals.forEach(animal => {
                if (animal.isAlive) {
                    animalCounts[animal.type] = (animalCounts[animal.type] || 0) + 1;
                    
                    if (!healthStats[animal.type]) {
                        healthStats[animal.type] = { total: 0, count: 0 };
                    }
                    healthStats[animal.type].total += animal.health;
                    healthStats[animal.type].count++;
                }
            });
            
            html += '<h5>Cheptel actuel:</h5>';
            for (const [animalType, count] of Object.entries(animalCounts)) {
                const animalInfo = this.animalTypes[animalType];
                const avgHealth = Math.round(healthStats[animalType].total / healthStats[animalType].count);
                
                html += `<div class="stat-row">
                    <span>${animalInfo.emoji} ${animalInfo.name}:</span>
                    <span>${count} (${avgHealth}% santé)</span>
                </div>`;
            }
            
            // Afficher l'inventaire des produits
            html += '<h5>Produits disponibles:</h5>';
            this.inventory.forEach((quantity, productKey) => {
                if (quantity > 0) {
                    const [animalType, productType] = productKey.split('_');
                    const animalInfo = this.animalTypes[animalType];
                    
                    if (animalInfo && animalInfo.products[productType]) {
                        const product = animalInfo.products[productType];
                        html += `<div class="stat-row">
                            <span>${product.emoji} ${product.name}:</span>
                            <span>${quantity.toFixed(1)}</span>
                        </div>`;
                    }
                }
            });
            
            html += '</div>';
            livestockStats.innerHTML = html;
        }
        
        // Mettre à jour la liste des produits à vendre
        this.updateSellProductsList();
        
        // Mettre à jour le coût d'alimentation
        this.updateDailyFeedCost();
    }
    
    // Mettre à jour la liste des produits à vendre
    updateSellProductsList() {
        const sellSelect = document.getElementById('sellProduct');
        if (!sellSelect) return;
        
        // Sauvegarder la sélection actuelle
        const currentSelection = sellSelect.value;
        sellSelect.innerHTML = '<option value="">Sélectionner un produit</option>';
        
        // Ajouter les produits animaux
        this.inventory.forEach((quantity, productKey) => {
            if (quantity > 0) {
                const [animalType, productType] = productKey.split('_');
                const animalInfo = this.animalTypes[animalType];
                
                if (animalInfo && animalInfo.products[productType]) {
                    const product = animalInfo.products[productType];
                    const option = document.createElement('option');
                    option.value = productKey;
                    option.textContent = `${product.name} (${quantity.toFixed(1)} disponible)`;
                    sellSelect.appendChild(option);
                }
            }
        });
        
        // Restaurer la sélection si elle existe encore
        if (currentSelection && Array.from(sellSelect.options).some(opt => opt.value === currentSelection)) {
            sellSelect.value = currentSelection;
        }
    }
    
    // Obtenir des informations sur un animal
    getAnimalInfo(animalType) {
        return this.animalTypes[animalType];
    }
    
    // Obtenir l'inventaire des produits
    getInventory() {
        return new Map(this.inventory);
    }
    
    // Obtenir les animaux vivants
    getLiveAnimals() {
        const liveAnimals = new Map();
        this.animals.forEach((animal, id) => {
            if (animal.isAlive) {
                liveAnimals.set(id, animal);
            }
        });
        return liveAnimals;
    }
    
    // Obtenir les statistiques d'élevage
    getLivestockStats() {
        const stats = {
            totalAnimals: 0,
            animalsByType: {},
            totalDailyFeedCost: this.dailyFeedCost,
            avgHealth: 0,
            totalHealthPoints: 0
        };
        
        this.animals.forEach(animal => {
            if (animal.isAlive) {
                stats.totalAnimals++;
                stats.animalsByType[animal.type] = (stats.animalsByType[animal.type] || 0) + 1;
                stats.totalHealthPoints += animal.health;
            }
        });
        
        stats.avgHealth = stats.totalAnimals > 0 ? stats.totalHealthPoints / stats.totalAnimals : 0;
        
        return stats;
    }
}

// Exporter la classe
window.Livestock = new LivestockManager();

console.log('✅ Module Livestock.js chargé');
// ===== MODULE DE GESTION DE L'ÉLEVAGE =====

class LivestockManager {
    constructor() {
        this.game = null;
        this.animals = new Map();
        this.inventory = new Map();
        this.nextAnimalId = 1;
        this.dailyFeedCost = 0;
        this.lastFeedTime = Date.now();
        
        // Types d'animaux disponibles
        this.animalTypes = {
            cow: {
                name: 'Vache',
                emoji: '🐄',
                buyCost: 1500,
                feedCost: 25, // €/jour
                maintenanceCost: 10, // €/jour
                maturityTime: 90000, // 1.5 minutes
                lifespanDays: 365,
                health: { min: 80, max: 100 },
                products: {
                    milk: {
                        type: 'cow_milk',
                        baseQuantity: 15, // litres/jour
                        pricePerUnit: 0.8,
                        productionInterval: 43200000 // 12 heures
                    },
                    meat: {
                        type: 'cow_meat',
                        baseQuantity: 200, // kg à l'abattage
                        pricePerUnit: 15,
                        onlyAtSlaughter: true
                    }
                },
                breeding: {
                    gestationTime: 180000, // 3 minutes
                    canBreed: true,
                    offspringCount: 1
                }
            },
            chicken: {
                name: 'Poule',
                emoji: '🐔',
                buyCost: 50,
                feedCost: 2,
                maintenanceCost: 1,
                maturityTime: 30000, // 30 secondes
                lifespanDays: 180,
                health: { min: 70, max: 100 },
                products: {
                    eggs: {
                        type: 'eggs',
                        baseQuantity: 1, // œuf/jour
                        pricePerUnit: 0.3,
                        productionInterval: 86400000 // 24 heures
                    },
                    meat: {
                        type: 'chicken_meat',
                        baseQuantity: 2, // kg à l'abattage
                        pricePerUnit: 8,
                        onlyAtSlaughter: true
                    }
                },
                breeding: {
                    gestationTime: 60000, // 1 minute
                    canBreed: true,
                    offspringCount: 3
                }
            },
            pig: {
                name: 'Cochon',
                emoji: '🐷',
                buyCost: 800,
                feedCost: 15,
                maintenanceCost: 8,
                maturityTime: 60000, // 1 minute
                lifespanDays: 270,
                health: { min: 75, max: 100 },
                products: {
                    meat: {
                        type: 'pig_meat',
                        baseQuantity: 80, // kg à l'abattage
                        pricePerUnit: 12,
                        onlyAtSlaughter: true
                    }
                },
                breeding: {
                    gestationTime: 120000, // 2 minutes
                    canBreed: true,
                    offspringCount: 6
                }
            },
            sheep: {
                name: 'Mouton',
                emoji: '🐑',
                buyCost: 600,
                feedCost: 12,
                maintenanceCost: 6,
                maturityTime: 45000, // 45 secondes
                lifespanDays: 300,
                health: { min: 70, max: 100 },
                products: {
                    wool: {
                        type: 'wool',
                        baseQuantity: 3, // kg/an
                        pricePerUnit: 5,
                        productionInterval: 2592000000 // 30 jours
                    },
                    meat: {
                        type: 'sheep_meat',
                        baseQuantity: 25, // kg à l'abattage
                        pricePerUnit: 18,
                        onlyAtSlaughter: true
                    }
                },
                breeding: {
                    gestationTime: 150000, // 2.5 minutes
                    canBreed: true,
                    offspringCount: 2
                }
            }
        };
        
        this.initializeInventory();
        console.log('🐄 LivestockManager initialisé');
    }
    
    // Initialiser l'inventaire
    initializeInventory() {
        const productTypes = ['cow_milk', 'eggs', 'cow_meat', 'chicken_meat', 'pig_meat', 'sheep_meat', 'wool'];
        productTypes.forEach(type => {
            this.inventory.set(type, 0);
        });
    }
    
    // Initialisation du module
    init(gameInstance) {
        this.game = gameInstance;
        this.setupUI();
        console.log('✅ Module Élevage initialisé');
    }
    
    // Configuration de l'interface utilisateur
    setupUI() {
        // Gestionnaire pour acheter des animaux
        const buyLivestockBtn = document.getElementById('buyLivestock');
        if (buyLivestockBtn) {
            buyLivestockBtn.addEventListener('click', () => {
                const animalType = document.getElementById('livestockType')?.value;
                if (animalType) {
                    this.buyAnimal(animalType);
                }
            });
        }
        
        // Gestionnaire pour nourrir les animaux
        const feedAnimalsBtn = document.getElementById('feedAnimals');
        if (feedAnimalsBtn) {
            feedAnimalsBtn.addEventListener('click', () => {
                this.feedAllAnimals();
            });
        }
        
        // Gestionnaire pour faire reproduire les animaux
        const breedBtn = document.getElementById('breedAnimals');
        if (breedBtn) {
            breedBtn.addEventListener('click', () => {
                this.startBreeding();
            });
        }
        
        // Gestionnaire pour abattre un animal
        const slaughterBtn = document.getElementById('slaughterAnimal');
        if (slaughterBtn) {
            slaughterBtn.addEventListener('click', () => {
                const animalId = document.getElementById('animalSelect')?.value;
                if (animalId) {
                    this.slaughterAnimal(animalId);
                }
            });
        }
    }
    
    // Acheter un animal
    buyAnimal(animalType) {
        const animalInfo = this.animalTypes[animalType];
        if (!animalInfo) return false;
        
        // Vérifier les fonds
        if (!this.game.spendMoney(animalInfo.buyCost)) {
            console.log(`💰 Pas assez d'argent pour acheter ${animalInfo.name} (coût: ${animalInfo.buyCost}€)`);
            return false;
        }
        
        const animal = {
            id: this.nextAnimalId++,
            type: animalType,
            name: `${animalInfo.name} #${this.nextAnimalId - 1}`,
            age: 0,
            health: animalInfo.health.min + Math.random() * (animalInfo.health.max - animalInfo.health.min),
            isMature: false,
            lastFed: Date.now(),
            lastProduction: Date.now(),
            isPregnant: false,
            pregnancyStart: 0,
            totalProduced: 0,
            birthDate: Date.now(),
            x: Math.random() * 300 + 50,
            y: Math.random() * 200 + 50
        };
        
        this.animals.set(animal.id.toString(), animal);
        
        // Enregistrer la dépense
        if (this.game.financeManager) {
            this.game.financeManager.recordExpense(animalInfo.buyCost, 'other', `Achat ${animalInfo.name}`);
        }
        
        console.log(`🐄 ${animalInfo.name} acheté pour ${animalInfo.buyCost}€`);
        this.updateUI();
        return true;
    }
    
    // Nourrir tous les animaux
    feedAllAnimals() {
        let totalCost = 0;
        let fedCount = 0;
        
        this.animals.forEach((animal, animalId) => {
            const animalInfo = this.animalTypes[animal.type];
            const timeSinceLastFed = Date.now() - animal.lastFed;
            
            // Nourrir si ça fait plus de 12 heures
            if (timeSinceLastFed > 43200000) { // 12 heures
                if (this.game.spendMoney(animalInfo.feedCost)) {
                    animal.lastFed = Date.now();
                    animal.health = Math.min(100, animal.health + 10);
                    totalCost += animalInfo.feedCost;
                    fedCount++;
                }
            }
        });
        
        if (fedCount > 0) {
            if (this.game.financeManager) {
                this.game.financeManager.recordExpense(totalCost, 'feed', `Alimentation ${fedCount} animaux`);
            }
            console.log(`🌾 ${fedCount} animaux nourris pour ${totalCost}€`);
        }
        
        this.updateUI();
    }
    
    // Faire reproduire les animaux
    startBreeding() {
        let breedingStarted = 0;
        
        // Grouper les animaux par type
        const animalsByType = {};
        this.animals.forEach(animal => {
            if (!animalsByType[animal.type]) {
                animalsByType[animal.type] = [];
            }
            animalsByType[animal.type].push(animal);
        });
        
        // Pour chaque type, essayer de faire reproduire
        Object.entries(animalsByType).forEach(([type, animalsOfType]) => {
            const animalInfo = this.animalTypes[type];
            if (!animalInfo.breeding.canBreed) return;
            
            // Trouver les animaux matures non enceintes
            const availableAnimals = animalsOfType.filter(animal => 
                animal.isMature && !animal.isPregnant && animal.health > 70
            );
            
            // Faire reproduire par paires
            for (let i = 0; i < availableAnimals.length - 1; i += 2) {
                const female = availableAnimals[i];
                female.isPregnant = true;
                female.pregnancyStart = Date.now();
                breedingStarted++;
            }
        });
        
        if (breedingStarted > 0) {
            console.log(`💕 ${breedingStarted} animal(aux) en gestation`);
        }
        
        this.updateUI();
    }
    
    // Abattre un animal
    slaughterAnimal(animalId) {
        const animal = this.animals.get(animalId.toString());
        if (!animal) return false;
        
        const animalInfo = this.animalTypes[animal.type];
        
        // Produire la viande
        Object.entries(animalInfo.products).forEach(([productName, productInfo]) => {
            if (productInfo.onlyAtSlaughter) {
                const quantity = productInfo.baseQuantity * (animal.health / 100);
                const currentAmount = this.inventory.get(productInfo.type) || 0;
                this.inventory.set(productInfo.type, currentAmount + quantity);
                
                console.log(`🥩 Produit ${quantity} kg de ${productInfo.type}`);
            }
        });
        
        // Supprimer l'animal
        this.animals.delete(animalId.toString());
        
        console.log(`🔪 ${animal.name} abattu`);
        this.updateUI();
        return true;
    }
    
    // Mise à jour des animaux
    update(deltaTime) {
        const currentTime = Date.now();
        
        this.animals.forEach((animal, animalId) => {
            const animalInfo = this.animalTypes[animal.type];
            
            // Vieillissement
            animal.age = currentTime - animal.birthDate;
            
            // Maturation
            if (!animal.isMature && animal.age > animalInfo.maturityTime) {
                animal.isMature = true;
                console.log(`🐄 ${animal.name} a atteint la maturité`);
            }
            
            // Gestion de la santé
            this.updateAnimalHealth(animal, animalInfo, currentTime);
            
            // Production
            if (animal.isMature) {
                this.updateAnimalProduction(animal, animalInfo, currentTime);
            }
            
            // Gestation
            if (animal.isPregnant) {
                this.updatePregnancy(animal, animalInfo, currentTime);
            }
            
            // Mort naturelle
            const ageInDays = animal.age / (24 * 60 * 60 * 1000);
            if (ageInDays > animalInfo.lifespanDays || animal.health <= 0) {
                this.animals.delete(animalId);
                console.log(`💀 ${animal.name} est mort`);
            }
        });
        
        // Coûts automatiques
        this.processAutomaticCosts();
    }
    
    // Mettre à jour la santé d'un animal
    updateAnimalHealth(animal, animalInfo, currentTime) {
        const timeSinceLastFed = currentTime - animal.lastFed;
        
        // Perte de santé si pas nourri
        if (timeSinceLastFed > 86400000) { // 24 heures
            animal.health -= 0.1; // Perte progressive
        }
        
        // Récupération naturelle si bien nourri
        if (timeSinceLastFed < 43200000 && animal.health < 100) { // 12 heures
            animal.health += 0.05;
        }
        
        // Limiter la santé
        animal.health = Math.max(0, Math.min(100, animal.health));
    }
    
    // Mettre à jour la production d'un animal
    updateAnimalProduction(animal, animalInfo, currentTime) {
        Object.entries(animalInfo.products).forEach(([productName, productInfo]) => {
            if (productInfo.onlyAtSlaughter) return;
            
            const timeSinceLastProduction = currentTime - animal.lastProduction;
            
            if (timeSinceLastProduction > productInfo.productionInterval) {
                // Calculer la quantité produite
                const healthMultiplier = animal.health / 100;
                const weatherMultiplier = this.getWeatherMultiplier();
                const quantity = productInfo.baseQuantity * healthMultiplier * weatherMultiplier;
                
                // Ajouter à l'inventaire
                const currentAmount = this.inventory.get(productInfo.type) || 0;
                this.inventory.set(productInfo.type, currentAmount + quantity);
                
                animal.lastProduction = currentTime;
                animal.totalProduced += quantity;
                
                console.log(`🥛 ${animal.name} a produit ${quantity.toFixed(2)} ${productInfo.type}`);
            }
        });
    }
    
    // Mettre à jour la gestation
    updatePregnancy(animal, animalInfo, currentTime) {
        const gestationTime = currentTime - animal.pregnancyStart;
        
        if (gestationTime >= animalInfo.breeding.gestationTime) {
            // Naissance !
            animal.isPregnant = false;
            
            const offspringCount = animalInfo.breeding.offspringCount;
            for (let i = 0; i < offspringCount; i++) {
                const offspring = {
                    id: this.nextAnimalId++,
                    type: animal.type,
                    name: `${animalInfo.name} #${this.nextAnimalId - 1}`,
                    age: 0,
                    health: animalInfo.health.min + Math.random() * (animalInfo.health.max - animalInfo.health.min),
                    isMature: false,
                    lastFed: Date.now(),
                    lastProduction: Date.now(),
                    isPregnant: false,
                    pregnancyStart: 0,
                    totalProduced: 0,
                    birthDate: Date.now(),
                    x: animal.x + (Math.random() - 0.5) * 50,
                    y: animal.y + (Math.random() - 0.5) * 50
                };
                
                this.animals.set(offspring.id.toString(), offspring);
            }
            
            console.log(`👶 ${animal.name} a donné naissance à ${offspringCount} petit(s) !`);
        }
    }
    
    // Obtenir le multiplicateur météo
    getWeatherMultiplier() {
        if (this.game && this.game.weatherManager) {
            return this.game.weatherManager.getProductionMultipliers().animalProductivity;
        }
        return 1.0;
    }
    
    // Traiter les coûts automatiques
    processAutomaticCosts() {
        const currentTime = Date.now();
        
        // Coûts quotidiens (toutes les 24 heures simulées)
        if (currentTime - this.lastFeedTime > 86400000) { // 24 heures
            let totalMaintenanceCost = 0;
            
            this.animals.forEach(animal => {
                const animalInfo = this.animalTypes[animal.type];
                totalMaintenanceCost += animalInfo.maintenanceCost;
            });
            
            if (totalMaintenanceCost > 0) {
                if (this.game.spendMoney(totalMaintenanceCost)) {
                    if (this.game.financeManager) {
                        this.game.financeManager.recordExpense(totalMaintenanceCost, 'maintenance', 'Entretien des animaux');
                    }
                } else {
                    // Pénalité si pas assez d'argent
                    this.animals.forEach(animal => {
                        animal.health -= 5;
                    });
                }
            }
            
            this.lastFeedTime = currentTime;
        }
    }
    
    // Mettre à jour l'interface utilisateur
    updateUI() {
        const livestockStats = document.getElementById('livestockStats');
        if (livestockStats) {
            const stats = this.getLivestockStats();
            
            let html = '<div class="livestock-overview">';
            html += `<h4>🐄 Cheptel (${stats.totalAnimals})</h4>`;
            
            // Statistiques par type
            Object.entries(stats.animalsByType).forEach(([type, count]) => {
                if (count > 0) {
                    const animalInfo = this.animalTypes[type];
                    html += `<div class="animal-type">
                        <span>${animalInfo.emoji} ${animalInfo.name}:</span>
                        <span>${count}</span>
                    </div>`;
                }
            });
            
            html += `<div class="stats-section">
                <div class="stat-item">
                    <span>Production quotidienne:</span>
                    <span>${stats.dailyProduction}€</span>
                </div>
                <div class="stat-item">
                    <span>Coût d'alimentation:</span>
                    <span>${stats.feedCost}€/jour</span>
                </div>
                <div class="stat-item">
                    <span>Santé moyenne:</span>
                    <span>${stats.averageHealth.toFixed(1)}%</span>
                </div>
            </div>`;
            
            // Inventaire des produits
            html += '<h4>📦 Produits animaux</h4>';
            this.inventory.forEach((quantity, productType) => {
                if (quantity > 0) {
                    html += `<div class="product-item">
                        <span>${productType}:</span>
                        <span>${quantity.toFixed(1)}</span>
                    </div>`;
                }
            });
            
            html += '</div>';
            livestockStats.innerHTML = html;
        }
    }
    
    // Obtenir les statistiques de l'élevage
    getLivestockStats() {
        const stats = {
            totalAnimals: this.animals.size,
            animalsByType: {},
            dailyProduction: 0,
            feedCost: 0,
            averageHealth: 0,
            matureAnimals: 0,
            pregnantAnimals: 0
        };
        
        let totalHealth = 0;
        
        this.animals.forEach(animal => {
            const animalInfo = this.animalTypes[animal.type];
            
            // Compter par type
            stats.animalsByType[animal.type] = (stats.animalsByType[animal.type] || 0) + 1;
            
            // Coût d'alimentation
            stats.feedCost += animalInfo.feedCost;
            
            // Santé moyenne
            totalHealth += animal.health;
            
            // Animaux matures
            if (animal.isMature) {
                stats.matureAnimals++;
                
                // Production quotidienne estimée
                Object.values(animalInfo.products).forEach(productInfo => {
                    if (!productInfo.onlyAtSlaughter) {
                        stats.dailyProduction += productInfo.baseQuantity * productInfo.pricePerUnit * (animal.health / 100);
                    }
                });
            }
            
            // Animaux enceintes
            if (animal.isPregnant) {
                stats.pregnantAnimals++;
            }
        });
        
        if (stats.totalAnimals > 0) {
            stats.averageHealth = totalHealth / stats.totalAnimals;
        }
        
        return stats;
    }
    
    // Obtenir l'inventaire
    getInventory() {
        return new Map(this.inventory);
    }
    
    // Vendre des produits animaux
    sellProduct(productType, quantity) {
        const currentAmount = this.inventory.get(productType) || 0;
        if (currentAmount < quantity) return 0;
        
        // Prix de base (sera ajusté par le marché)
        const basePrices = {
            cow_milk: 0.8,
            eggs: 0.3,
            cow_meat: 15,
            chicken_meat: 8,
            pig_meat: 12,
            sheep_meat: 18,
            wool: 5
        };
        
        const price = basePrices[productType] || 1.0;
        const totalPrice = quantity * price;
        
        this.inventory.set(productType, currentAmount - quantity);
        this.game.earnMoney(totalPrice);
        
        if (this.game.financeManager) {
            this.game.financeManager.recordRevenue(totalPrice, 'livestock_sales', `Vente ${productType}`);
        }
        
        console.log(`💰 Vendu ${quantity} ${productType} pour ${totalPrice}€`);
        this.updateUI();
        
        return totalPrice;
    }
    
    // Rendu sur le canvas
    render(ctx) {
        this.animals.forEach(animal => {
            const animalInfo = this.animalTypes[animal.type];
            
            // Couleur selon la santé
            let healthColor = '#4CAF50'; // Vert pour bonne santé
            if (animal.health < 50) healthColor = '#FF9800'; // Orange pour santé moyenne
            if (animal.health < 25) healthColor = '#F44336'; // Rouge pour mauvaise santé
            
            // Dessiner l'animal
            ctx.fillStyle = healthColor;
            ctx.fillRect(animal.x, animal.y, 20, 15);
            
            // Emoji de l'animal
            ctx.font = '16px Arial';
            ctx.fillText(animalInfo.emoji, animal.x + 2, animal.y + 12);
            
            // Indicateur de gestation
            if (animal.isPregnant) {
                ctx.fillStyle = '#E91E63';
                ctx.fillRect(animal.x + 18, animal.y, 4, 4);
            }
            
            // Indicateur de maturité
            if (!animal.isMature) {
                ctx.fillStyle = '#FFC107';
                ctx.fillRect(animal.x, animal.y - 3, 20, 2);
            }
        });
    }
}

// Exporter le module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LivestockManager;
} else if (typeof window !== 'undefined') {
    window.LivestockManager = LivestockManager;
}

console.log('✅ Module Livestock.js chargé');
