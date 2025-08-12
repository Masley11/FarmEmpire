
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
