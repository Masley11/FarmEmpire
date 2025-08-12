
// ===== MODULE DE GESTION DES CULTURES =====

class CropsManager {
    constructor() {
        this.crops = new Map(); // Map des cultures plantées (key: "x,y", value: crop object)
        this.inventory = new Map(); // Inventaire des récoltes
        this.selectedCropType = 'wheat';
        this.game = null;
        
        // Définition des types de cultures
        this.cropTypes = {
            wheat: {
                name: 'Blé',
                cost: 100,
                growthTime: 5000, // 5 secondes pour test (en millisecondes)
                baseYield: 3, // tonnes par parcelle
                sellPrice: 180,
                emoji: '🌾',
                color: '#DAA520',
                weatherMultiplier: {
                    'Ensoleillé': 1.2,
                    'Nuageux': 1.0,
                    'Pluvieux': 0.8,
                    'Orageux': 0.6
                }
            },
            corn: {
                name: 'Maïs',
                cost: 150,
                growthTime: 7000, // 7 secondes pour test
                baseYield: 4,
                sellPrice: 220,
                emoji: '🌽',
                color: '#FFD700',
                weatherMultiplier: {
                    'Ensoleillé': 1.3,
                    'Nuageux': 1.0,
                    'Pluvieux': 1.1,
                    'Orageux': 0.5
                }
            },
            soybean: {
                name: 'Soja',
                cost: 200,
                growthTime: 6000, // 6 secondes pour test
                baseYield: 2.5,
                sellPrice: 300,
                emoji: '🌱',
                color: '#228B22',
                weatherMultiplier: {
                    'Ensoleillé': 1.1,
                    'Nuageux': 1.2,
                    'Pluvieux': 1.3,
                    'Orageux': 0.7
                }
            },
            rapeseed: {
                name: 'Colza',
                cost: 180,
                growthTime: 8000, // 8 secondes pour test
                baseYield: 2.8,
                sellPrice: 280,
                emoji: '🌻',
                color: '#FFD700',
                weatherMultiplier: {
                    'Ensoleillé': 1.0,
                    'Nuageux': 1.1,
                    'Pluvieux': 0.9,
                    'Orageux': 0.6
                }
            }
        };
        
        console.log('🌾 CropsManager initialisé');
    }
    
    // Initialisation du module
    init(gameInstance) {
        this.game = gameInstance;
        this.setupUI();
        
        // Initialiser l'inventaire
        for (const cropType in this.cropTypes) {
            this.inventory.set(cropType, 0);
        }
        
        console.log('✅ Module Cultures initialisé');
    }
    
    // Configuration de l'interface utilisateur
    setupUI() {
        // Gestionnaire pour le bouton de plantation
        const plantButton = document.getElementById('plantCrop');
        if (plantButton) {
            plantButton.addEventListener('click', () => {
                console.log('🌱 Mode plantation activé');
                // Le mode plantation sera géré par les clics sur la grille
            });
        }
        
        // Gestionnaire pour la sélection du type de culture
        const cropSelect = document.getElementById('cropType');
        if (cropSelect) {
            cropSelect.addEventListener('change', (e) => {
                this.selectedCropType = e.target.value;
                console.log(`🌾 Type de culture sélectionné: ${this.selectedCropType}`);
            });
        }
        
        this.updateUI();
    }
    
    // Gestion des clics sur la grille
    handleGridClick(gridX, gridY) {
        const key = `${gridX},${gridY}`;
        
        // Vérifier si une culture existe déjà
        if (this.crops.has(key)) {
            const crop = this.crops.get(key);
            
            // Si la culture est prête, la récolter
            if (crop.isReady) {
                this.harvestCrop(gridX, gridY);
            } else {
                console.log(`🌱 Culture en cours de croissance (${Math.round(crop.growthProgress * 100)}%)`);
            }
        } else {
            // Planter une nouvelle culture
            this.plantCrop(gridX, gridY, this.selectedCropType);
        }
    }
    
    // Planter une culture
    plantCrop(x, y, cropType) {
        const cropInfo = this.cropTypes[cropType];
        if (!cropInfo) {
            console.error(`❌ Type de culture inconnu: ${cropType}`);
            return false;
        }
        
        // Vérifier si le joueur a assez d'argent
        if (!this.game.spendMoney(cropInfo.cost)) {
            console.log(`💰 Pas assez d'argent pour planter ${cropInfo.name} (coût: ${cropInfo.cost}€)`);
            return false;
        }
        
        // Créer la nouvelle culture
        const crop = {
            type: cropType,
            x: x,
            y: y,
            plantedAt: Date.now(),
            growthTime: cropInfo.growthTime,
            growthProgress: 0,
            isReady: false,
            weatherMultiplier: 1.0
        };
        
        // Ajouter à la map des cultures
        const key = `${x},${y}`;
        this.crops.set(key, crop);
        
        console.log(`🌱 ${cropInfo.name} planté en (${x}, ${y}) pour ${cropInfo.cost}€`);
        this.updateUI();
        
        return true;
    }
    
    // Récolter une culture
    harvestCrop(x, y) {
        const key = `${x},${y}`;
        const crop = this.crops.get(key);
        
        if (!crop || !crop.isReady) {
            console.log('❌ Aucune culture prête à récolter ici');
            return false;
        }
        
        const cropInfo = this.cropTypes[crop.type];
        
        // Calculer le rendement (influencé par la météo)
        const baseYield = cropInfo.baseYield;
        const weatherMultiplier = crop.weatherMultiplier;
        const finalYield = Math.round(baseYield * weatherMultiplier * 10) / 10;
        
        // Ajouter à l'inventaire
        const currentAmount = this.inventory.get(crop.type) || 0;
        this.inventory.set(crop.type, currentAmount + finalYield);
        
        // Supprimer la culture de la grille
        this.crops.delete(key);
        
        console.log(`🚜 Récolte: ${finalYield}t de ${cropInfo.name} (multiplicateur météo: ${weatherMultiplier})`);
        this.updateUI();
        
        return finalYield;
    }
    
    // Vendre des récoltes
    sellCrop(cropType, quantity) {
        const cropInfo = this.cropTypes[cropType];
        if (!cropInfo) {
            console.error(`❌ Type de culture inconnu: ${cropType}`);
            return false;
        }
        
        const currentAmount = this.inventory.get(cropType) || 0;
        if (currentAmount < quantity) {
            console.log(`❌ Pas assez de ${cropInfo.name} en stock (demandé: ${quantity}, stock: ${currentAmount})`);
            return false;
        }
        
        // Calculer le prix de vente (peut être influencé par le marché)
        let sellPrice = cropInfo.sellPrice;
        if (window.Market && window.Market.getPriceMultiplier) {
            sellPrice *= window.Market.getPriceMultiplier(cropType);
        }
        
        const totalPrice = Math.round(quantity * sellPrice);
        
        // Mettre à jour l'inventaire et l'argent
        this.inventory.set(cropType, currentAmount - quantity);
        this.game.earnMoney(totalPrice);
        
        console.log(`💰 Vendu ${quantity}t de ${cropInfo.name} pour ${totalPrice}€`);
        this.updateUI();
        
        return totalPrice;
    }
    
    // Mise à jour des cultures (appelée dans la boucle de jeu)
    update(deltaTime) {
        const currentTime = Date.now();
        const weatherMultiplier = this.getWeatherMultiplier();
        
        // Mettre à jour chaque culture
        this.crops.forEach((crop, key) => {
            if (!crop.isReady) {
                // Calculer le progrès de croissance
                const elapsed = currentTime - crop.plantedAt;
                crop.growthProgress = Math.min(elapsed / crop.growthTime, 1.0);
                
                // Appliquer l'effet météo
                crop.weatherMultiplier = weatherMultiplier;
                
                // Vérifier si la culture est prête
                if (crop.growthProgress >= 1.0) {
                    crop.isReady = true;
                    const cropInfo = this.cropTypes[crop.type];
                    console.log(`🌾 ${cropInfo.name} en (${crop.x}, ${crop.y}) est prêt à être récolté!`);
                }
            }
        });
        
        // Mettre à jour la production totale
        this.updateProductionStats();
    }
    
    // Obtenir le multiplicateur météo actuel
    getWeatherMultiplier() {
        if (this.game && this.game.gameState.weather) {
            const weather = this.game.gameState.weather;
            // Prendre la moyenne des multiplicateurs de toutes les cultures
            let totalMultiplier = 0;
            let count = 0;
            
            for (const cropType in this.cropTypes) {
                const multiplier = this.cropTypes[cropType].weatherMultiplier[weather] || 1.0;
                totalMultiplier += multiplier;
                count++;
            }
            
            return count > 0 ? totalMultiplier / count : 1.0;
        }
        return 1.0;
    }
    
    // Mettre à jour les statistiques de production
    updateProductionStats() {
        let totalProduction = 0;
        
        // Calculer la production potentielle par jour
        this.crops.forEach(crop => {
            if (crop.isReady) {
                const cropInfo = this.cropTypes[crop.type];
                totalProduction += cropInfo.baseYield * crop.weatherMultiplier;
            }
        });
        
        // Mettre à jour l'état du jeu
        if (this.game) {
            this.game.gameState.production = Math.round(totalProduction * 10) / 10;
        }
    }
    
    // Rendu des cultures sur le canvas
    render(ctx) {
        this.crops.forEach((crop, key) => {
            const cropInfo = this.cropTypes[crop.type];
            const x = crop.x * this.game.gridSize;
            const y = crop.y * this.game.gridSize;
            const size = this.game.gridSize;
            
            // Couleur de fond selon l'état de croissance
            if (crop.isReady) {
                ctx.fillStyle = cropInfo.color;
            } else {
                // Couleur qui s'intensifie avec la croissance
                const intensity = crop.growthProgress;
                const r = Math.round(160 + (255 - 160) * intensity);
                const g = Math.round(200 + (255 - 200) * intensity);
                const b = Math.round(120 + (255 - 120) * intensity);
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            }
            
            // Dessiner la parcelle
            ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
            
            // Bordure
            ctx.strokeStyle = crop.isReady ? '#4CAF50' : '#8BC34A';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
            
            // Emoji de la culture au centre
            ctx.font = `${size * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#333';
            ctx.fillText(
                cropInfo.emoji,
                x + size / 2,
                y + size / 2
            );
            
            // Barre de progression si en cours de croissance
            if (!crop.isReady && crop.growthProgress > 0) {
                const barWidth = size - 8;
                const barHeight = 4;
                const barX = x + 4;
                const barY = y + size - 8;
                
                // Fond de la barre
                ctx.fillStyle = '#E0E0E0';
                ctx.fillRect(barX, barY, barWidth, barHeight);
                
                // Progression
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(barX, barY, barWidth * crop.growthProgress, barHeight);
            }
        });
    }
    
    // Mettre à jour l'interface utilisateur
    updateUI() {
        // Mettre à jour les statistiques des cultures
        const cropStats = document.getElementById('cropStats');
        if (cropStats) {
            let html = '<div class="stats-grid">';
            
            // Afficher les cultures plantées
            const plantedCrops = {};
            this.crops.forEach(crop => {
                plantedCrops[crop.type] = (plantedCrops[crop.type] || 0) + 1;
            });
            
            html += '<h5>Cultures plantées:</h5>';
            for (const [cropType, count] of Object.entries(plantedCrops)) {
                const cropInfo = this.cropTypes[cropType];
                html += `<div class="stat-row">
                    <span>${cropInfo.emoji} ${cropInfo.name}:</span>
                    <span>${count} parcelles</span>
                </div>`;
            }
            
            // Afficher l'inventaire
            html += '<h5>Inventaire:</h5>';
            this.inventory.forEach((quantity, cropType) => {
                if (quantity > 0) {
                    const cropInfo = this.cropTypes[cropType];
                    html += `<div class="stat-row">
                        <span>${cropInfo.emoji} ${cropInfo.name}:</span>
                        <span>${quantity}t</span>
                    </div>`;
                }
            });
            
            html += '</div>';
            cropStats.innerHTML = html;
        }
        
        // Mettre à jour la liste des produits à vendre
        const sellSelect = document.getElementById('sellProduct');
        if (sellSelect) {
            sellSelect.innerHTML = '<option value="">Sélectionner un produit</option>';
            
            this.inventory.forEach((quantity, cropType) => {
                if (quantity > 0) {
                    const cropInfo = this.cropTypes[cropType];
                    const option = document.createElement('option');
                    option.value = cropType;
                    option.textContent = `${cropInfo.name} (${quantity}t disponible)`;
                    sellSelect.appendChild(option);
                }
            });
        }
    }
    
    // Obtenir des informations sur une culture
    getCropInfo(cropType) {
        return this.cropTypes[cropType];
    }
    
    // Obtenir l'inventaire
    getInventory() {
        return new Map(this.inventory);
    }
    
    // Obtenir les cultures plantées
    getPlantedCrops() {
        return new Map(this.crops);
    }
}

// Exporter la classe
window.Crops = new CropsManager();

console.log('✅ Module Crops.js chargé');
