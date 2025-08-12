
// ===== MODULE DE GESTION DU MARCHÉ =====

class MarketManager {
    constructor() {
        this.game = null;
        this.marketPrices = new Map();
        this.priceHistory = new Map();
        this.contracts = new Map();
        this.nextContractId = 1;
        this.lastPriceUpdate = Date.now();
        this.marketDemand = new Map();
        this.marketSupply = new Map();
        
        // Clients et contrats spéciaux
        this.clients = {
            supermarket_chain: {
                name: 'Chaîne de supermarchés',
                emoji: '🏪',
                reliability: 0.95,
                paymentDelay: 7, // jours
                preferredProducts: ['flour', 'processed_milk', 'processed_meat'],
                volumeMultiplier: 2.0,
                priceMultiplier: 0.9
            },
            restaurant_group: {
                name: 'Groupe de restaurants',
                emoji: '🍽️',
                reliability: 0.88,
                paymentDelay: 14,
                preferredProducts: ['wheat', 'cow_meat', 'chicken_meat'],
                volumeMultiplier: 1.5,
                priceMultiplier: 1.1
            },
            export_company: {
                name: 'Société d\'exportation',
                emoji: '🚢',
                reliability: 0.92,
                paymentDelay: 30,
                preferredProducts: ['corn', 'soybean', 'vegetable_oil'],
                volumeMultiplier: 3.0,
                priceMultiplier: 1.2
            },
            local_coop: {
                name: 'Coopérative locale',
                emoji: '🤝',
                reliability: 0.98,
                paymentDelay: 3,
                preferredProducts: ['cow_milk', 'eggs', 'chicken_meat'],
                volumeMultiplier: 1.2,
                priceMultiplier: 1.0
            }
        };
        
        // Prix de base et volatilité
        this.baseMarketData = {
            // Cultures
            wheat: { basePrice: 0.25, volatility: 0.15, seasonal: true },
            corn: { basePrice: 0.22, volatility: 0.18, seasonal: true },
            soybean: { basePrice: 0.45, volatility: 0.20, seasonal: true },
            potato: { basePrice: 0.15, volatility: 0.12, seasonal: true },
            
            // Produits animaux
            cow_milk: { basePrice: 0.8, volatility: 0.08, seasonal: false },
            eggs: { basePrice: 0.3, volatility: 0.12, seasonal: false },
            cow_meat: { basePrice: 15, volatility: 0.10, seasonal: false },
            chicken_meat: { basePrice: 8, volatility: 0.15, seasonal: false },
            pig_meat: { basePrice: 12, volatility: 0.12, seasonal: false },
            
            // Produits transformés
            flour: { basePrice: 1.5, volatility: 0.10, seasonal: false },
            processed_milk: { basePrice: 1.2, volatility: 0.08, seasonal: false },
            processed_meat: { basePrice: 20, volatility: 0.12, seasonal: false },
            vegetable_oil: { basePrice: 3.0, volatility: 0.18, seasonal: false }
        };
        
        this.initializeMarket();
        console.log('💹 MarketManager initialisé');
    }
    
    // Initialisation du marché
    initializeMarket() {
        // Initialiser les prix avec les valeurs de base
        for (const [product, data] of Object.entries(this.baseMarketData)) {
            this.marketPrices.set(product, data.basePrice);
            this.priceHistory.set(product, [data.basePrice]);
            this.marketDemand.set(product, Math.random() * 100 + 50);
            this.marketSupply.set(product, Math.random() * 100 + 50);
        }
    }
    
    // Initialisation du module
    init(gameInstance) {
        this.game = gameInstance;
        this.setupUI();
        this.generateRandomContracts();
        console.log('✅ Module Marché initialisé');
    }
    
    // Configuration de l'interface utilisateur
    setupUI() {
        // Gestionnaire pour vendre des produits
        const sellBtn = document.getElementById('sellOnMarket');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                const productType = document.getElementById('sellProduct')?.value;
                const quantity = parseFloat(document.getElementById('sellQuantity')?.value) || 0;
                
                if (productType && quantity > 0) {
                    this.sellProduct(productType, quantity);
                }
            });
        }
        
        // Gestionnaire pour accepter des contrats
        const acceptContractBtn = document.getElementById('acceptContract');
        if (acceptContractBtn) {
            acceptContractBtn.addEventListener('click', () => {
                const contractId = document.getElementById('contractSelect')?.value;
                if (contractId) {
                    this.acceptContract(contractId);
                }
            });
        }
    }
    
    // Vendre des produits sur le marché
    sellProduct(productType, quantity) {
        // Vérifier la disponibilité
        let availableQuantity = 0;
        
        // Vérifier dans les cultures
        if (this.game.cropsManager) {
            const cropInventory = this.game.cropsManager.getInventory();
            availableQuantity += cropInventory.get(productType) || 0;
        }
        
        // Vérifier dans l'élevage
        if (this.game.livestockManager) {
            const livestockInventory = this.game.livestockManager.getInventory();
            availableQuantity += livestockInventory.get(productType) || 0;
        }
        
        // Vérifier dans la production
        if (this.game.productionManager) {
            const productionInventory = this.game.productionManager.getInventory();
            availableQuantity += productionInventory.get(productType) || 0;
        }
        
        if (availableQuantity < quantity) {
            console.log(`❌ Pas assez de ${productType} disponible (demandé: ${quantity}, disponible: ${availableQuantity})`);
            return false;
        }
        
        // Calculer le prix avec les effets du marché
        const basePrice = this.marketPrices.get(productType) || 1;
        const marketEffect = this.calculateMarketEffect(productType, quantity);
        const finalPrice = basePrice * marketEffect;
        const totalRevenue = quantity * finalPrice;
        
        // Consommer les produits
        this.consumeProductFromInventories(productType, quantity);
        
        // Ajouter l'argent
        this.game.addMoney(totalRevenue);
        
        // Mettre à jour l'offre et la demande
        this.updateMarketSupply(productType, quantity);
        
        console.log(`💰 Vendu ${quantity} ${productType} à ${finalPrice.toFixed(2)}€/unité (total: ${totalRevenue.toFixed(2)}€)`);
        this.updateUI();
        
        return totalRevenue;
    }
    
    // Consommer des produits des inventaires
    consumeProductFromInventories(productType, quantity) {
        let remaining = quantity;
        
        // Consommer des cultures en premier
        if (this.game.cropsManager && remaining > 0) {
            const cropInventory = this.game.cropsManager.getInventory();
            const available = cropInventory.get(productType) || 0;
            const consumed = Math.min(available, remaining);
            
            if (consumed > 0) {
                cropInventory.set(productType, available - consumed);
                remaining -= consumed;
            }
        }
        
        // Consommer des produits d'élevage
        if (this.game.livestockManager && remaining > 0) {
            const livestockInventory = this.game.livestockManager.getInventory();
            const available = livestockInventory.get(productType) || 0;
            const consumed = Math.min(available, remaining);
            
            if (consumed > 0) {
                livestockInventory.set(productType, available - consumed);
                remaining -= consumed;
            }
        }
        
        // Consommer des produits transformés
        if (this.game.productionManager && remaining > 0) {
            const productionInventory = this.game.productionManager.getInventory();
            const available = productionInventory.get(productType) || 0;
            const consumed = Math.min(available, remaining);
            
            if (consumed > 0) {
                productionInventory.set(productType, available - consumed);
                remaining -= consumed;
            }
        }
    }
    
    // Calculer l'effet du marché sur le prix
    calculateMarketEffect(productType, quantity) {
        const demand = this.marketDemand.get(productType) || 100;
        const supply = this.marketSupply.get(productType) || 100;
        
        // Effet de l'offre et de la demande
        const demandSupplyRatio = demand / supply;
        let priceMultiplier = Math.sqrt(demandSupplyRatio);
        
        // Effet de la quantité vendue (plus on vend, plus le prix baisse)
        const quantityEffect = Math.max(0.8, 1 - (quantity / 1000));
        priceMultiplier *= quantityEffect;
        
        // Effet saisonnier
        const seasonalEffect = this.getSeasonalEffect(productType);
        priceMultiplier *= seasonalEffect;
        
        // Effet météorologique
        const weatherEffect = this.getWeatherEffect(productType);
        priceMultiplier *= weatherEffect;
        
        return Math.max(0.5, Math.min(2.0, priceMultiplier));
    }
    
    // Obtenir l'effet saisonnier
    getSeasonalEffect(productType) {
        if (!this.game.weatherManager) return 1.0;
        
        const season = this.game.weatherManager.getCurrentSeason();
        const productData = this.baseMarketData[productType];
        
        if (!productData || !productData.seasonal) return 1.0;
        
        // Les cultures ont des prix plus élevés hors saison
        const seasonalMultipliers = {
            spring: { wheat: 1.1, corn: 0.9, soybean: 1.0, potato: 1.2 },
            summer: { wheat: 0.8, corn: 1.2, soybean: 1.1, potato: 0.9 },
            autumn: { wheat: 0.9, corn: 0.8, soybean: 0.8, potato: 0.8 },
            winter: { wheat: 1.2, corn: 1.1, soybean: 1.1, potato: 1.1 }
        };
        
        return seasonalMultipliers[season]?.[productType] || 1.0;
    }
    
    // Obtenir l'effet météorologique
    getWeatherEffect(productType) {
        if (!this.game.weatherManager) return 1.0;
        
        const weather = this.game.weatherManager.getCurrentWeather();
        const productData = this.baseMarketData[productType];
        
        if (!productData) return 1.0;
        
        // Mauvais temps = prix plus élevés pour les cultures
        const weatherMultipliers = {
            drought: { wheat: 1.3, corn: 1.4, soybean: 1.2, potato: 1.5 },
            storm: { wheat: 1.2, corn: 1.3, soybean: 1.1, potato: 1.2 },
            rain: { wheat: 0.95, corn: 0.95, soybean: 0.95, potato: 0.95 },
            sunny: { wheat: 1.0, corn: 1.0, soybean: 1.0, potato: 1.0 }
        };
        
        return weatherMultipliers[weather.type]?.[productType] || 1.0;
    }
    
    // Mettre à jour l'offre du marché
    updateMarketSupply(productType, quantitySold) {
        const currentSupply = this.marketSupply.get(productType) || 100;
        const newSupply = Math.min(200, currentSupply + quantitySold * 0.1);
        this.marketSupply.set(productType, newSupply);
    }
    
    // Générer des contrats aléatoires
    generateRandomContracts() {
        // Générer 2-4 contrats disponibles
        const contractCount = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 0; i < contractCount; i++) {
            this.generateContract();
        }
    }
    
    // Générer un contrat
    generateContract() {
        const clientKeys = Object.keys(this.clients);
        const clientKey = clientKeys[Math.floor(Math.random() * clientKeys.length)];
        const client = this.clients[clientKey];
        
        const productType = client.preferredProducts[Math.floor(Math.random() * client.preferredProducts.length)];
        const basePrice = this.marketPrices.get(productType) || 1;
        const quantity = Math.floor(Math.random() * 500) + 100;
        const contractPrice = basePrice * client.priceMultiplier;
        
        const contract = {
            id: this.nextContractId++,
            clientKey,
            productType,
            quantity,
            price: contractPrice,
            totalValue: quantity * contractPrice,
            deadline: Date.now() + (Math.random() * 14 + 7) * 24 * 60 * 60 * 1000, // 7-21 jours
            isActive: false,
            createdAt: Date.now()
        };
        
        this.contracts.set(contract.id.toString(), contract);
        console.log(`📋 Nouveau contrat généré: ${quantity} ${productType} pour ${client.name}`);
    }
    
    // Accepter un contrat
    acceptContract(contractId) {
        const contract = this.contracts.get(contractId.toString());
        if (!contract || contract.isActive) return false;
        
        // Vérifier la disponibilité du produit
        const availableQuantity = this.getAvailableProduct(contract.productType);
        if (availableQuantity < contract.quantity) {
            console.log(`❌ Pas assez de ${contract.productType} pour le contrat (demandé: ${contract.quantity}, disponible: ${availableQuantity})`);
            return false;
        }
        
        // Activer le contrat
        contract.isActive = true;
        contract.acceptedAt = Date.now();
        
        // Consommer les produits
        this.consumeProductFromInventories(contract.productType, contract.quantity);
        
        // Programmer le paiement
        const client = this.clients[contract.clientKey];
        const paymentDelay = client.paymentDelay * 24 * 60 * 60 * 1000;
        
        setTimeout(() => {
            if (Math.random() < client.reliability) {
                this.game.addMoney(contract.totalValue);
                console.log(`💰 Paiement reçu pour contrat ${contractId}: ${contract.totalValue.toFixed(2)}€`);
            } else {
                console.log(`❌ Paiement en retard pour contrat ${contractId}`);
                // Paiement avec retard et pénalités
                setTimeout(() => {
                    this.game.addMoney(contract.totalValue * 0.9);
                    console.log(`💰 Paiement tardif reçu: ${(contract.totalValue * 0.9).toFixed(2)}€`);
                }, paymentDelay);
            }
        }, paymentDelay);
        
        console.log(`✅ Contrat ${contractId} accepté avec ${client.name}`);
        this.updateUI();
        return true;
    }
    
    // Obtenir la quantité disponible d'un produit
    getAvailableProduct(productType) {
        let total = 0;
        
        if (this.game.cropsManager) {
            const cropInventory = this.game.cropsManager.getInventory();
            total += cropInventory.get(productType) || 0;
        }
        
        if (this.game.livestockManager) {
            const livestockInventory = this.game.livestockManager.getInventory();
            total += livestockInventory.get(productType) || 0;
        }
        
        if (this.game.productionManager) {
            const productionInventory = this.game.productionManager.getInventory();
            total += productionInventory.get(productType) || 0;
        }
        
        return total;
    }
    
    // Mise à jour du marché
    update(deltaTime) {
        const currentTime = Date.now();
        
        // Mettre à jour les prix toutes les 30 secondes
        if (currentTime - this.lastPriceUpdate > 30000) {
            this.updateMarketPrices();
            this.lastPriceUpdate = currentTime;
        }
        
        // Nettoyer les contrats expirés
        this.cleanupExpiredContracts();
        
        // Générer de nouveaux contrats périodiquement
        if (Math.random() < 0.01) { // 1% de chance par frame
            this.generateContract();
        }
    }
    
    // Mettre à jour les prix du marché
    updateMarketPrices() {
        for (const [product, baseData] of Object.entries(this.baseMarketData)) {
            const currentPrice = this.marketPrices.get(product);
            const demand = this.marketDemand.get(product) || 100;
            const supply = this.marketSupply.get(product) || 100;
            
            // Variation naturelle des prix
            const randomVariation = (Math.random() - 0.5) * baseData.volatility;
            
            // Effet de l'offre et de la demande
            const demandSupplyEffect = (demand - supply) / 1000;
            
            // Nouveau prix
            let newPrice = currentPrice * (1 + randomVariation + demandSupplyEffect);
            
            // Maintenir dans une fourchette raisonnable
            const minPrice = baseData.basePrice * 0.5;
            const maxPrice = baseData.basePrice * 2.0;
            newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
            
            this.marketPrices.set(product, newPrice);
            
            // Mettre à jour l'historique
            const history = this.priceHistory.get(product) || [];
            history.push(newPrice);
            if (history.length > 100) history.shift(); // Garder seulement les 100 derniers prix
            this.priceHistory.set(product, history);
            
            // Faire évoluer la demande naturellement
            const demandChange = (Math.random() - 0.5) * 10;
            this.marketDemand.set(product, Math.max(20, Math.min(200, demand + demandChange)));
            
            // Faire diminuer l'offre naturellement
            this.marketSupply.set(product, Math.max(20, supply * 0.99));
        }
    }
    
    // Nettoyer les contrats expirés
    cleanupExpiredContracts() {
        const currentTime = Date.now();
        
        this.contracts.forEach((contract, contractId) => {
            if (!contract.isActive && currentTime > contract.deadline) {
                this.contracts.delete(contractId);
                console.log(`📋 Contrat ${contractId} expiré`);
            }
        });
    }
    
    // Mettre à jour l'interface utilisateur
    updateUI() {
        // Mettre à jour les prix du marché
        const marketPrices = document.getElementById('marketPrices');
        if (marketPrices) {
            let html = '<div class="market-prices"><h4>💹 Prix du marché</h4>';
            
            this.marketPrices.forEach((price, product) => {
                const demand = this.marketDemand.get(product) || 100;
                const supply = this.marketSupply.get(product) || 100;
                const trend = demand > supply ? '📈' : '📉';
                
                html += `<div class="price-item">
                    <span>${product}:</span>
                    <span>${price.toFixed(2)}€ ${trend}</span>
                </div>`;
            });
            
            html += '</div>';
            marketPrices.innerHTML = html;
        }
        
        // Mettre à jour les contrats disponibles
        const contractsList = document.getElementById('availableContracts');
        if (contractsList) {
            let html = '<div class="contracts-list"><h4>📋 Contrats disponibles</h4>';
            
            this.contracts.forEach((contract, contractId) => {
                if (!contract.isActive) {
                    const client = this.clients[contract.clientKey];
                    const deadline = new Date(contract.deadline).toLocaleDateString();
                    
                    html += `<div class="contract-item">
                        <div>${client.emoji} ${client.name}</div>
                        <div>${contract.quantity} ${contract.productType}</div>
                        <div>${contract.totalValue.toFixed(2)}€</div>
                        <div>Échéance: ${deadline}</div>
                        <button onclick="window.game.marketManager.acceptContract('${contractId}')">Accepter</button>
                    </div>`;
                }
            });
            
            html += '</div>';
            contractsList.innerHTML = html;
        }
    }
    
    // Obtenir les prix actuels
    getCurrentPrices() {
        return new Map(this.marketPrices);
    }
    
    // Obtenir l'historique des prix
    getPriceHistory(product) {
        return this.priceHistory.get(product) || [];
    }
    
    // Obtenir les contrats actifs
    getActiveContracts() {
        const activeContracts = new Map();
        this.contracts.forEach((contract, id) => {
            if (contract.isActive) {
                activeContracts.set(id, contract);
            }
        });
        return activeContracts;
    }
}

// Exporter le module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarketManager;
}
