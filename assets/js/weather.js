
// ===== MODULE DE GESTION DE LA MÉTÉO =====

class WeatherManager {
    constructor() {
        this.game = null;
        this.currentWeather = null;
        this.currentSeason = 'spring';
        this.weatherHistory = [];
        this.lastWeatherChange = Date.now();
        this.seasonStartTime = Date.now();
        this.weatherDuration = 300000; // 5 minutes par météo
        this.seasonDuration = 1200000; // 20 minutes par saison
        
        // Types de météo avec leurs caractéristiques
        this.weatherTypes = {
            sunny: {
                name: 'Ensoleillé',
                emoji: '☀️',
                description: 'Temps clair et ensoleillé',
                cropGrowthMultiplier: 1.2,
                animalProductivityMultiplier: 1.1,
                machineEfficiencyMultiplier: 1.0,
                marketPriceMultiplier: 1.0,
                probability: {
                    spring: 0.3,
                    summer: 0.5,
                    autumn: 0.2,
                    winter: 0.1
                },
                canTransitionTo: ['cloudy', 'rain', 'windy'],
                temperature: { min: 15, max: 30 },
                humidity: { min: 30, max: 60 }
            },
            cloudy: {
                name: 'Nuageux',
                emoji: '☁️',
                description: 'Temps nuageux',
                cropGrowthMultiplier: 1.0,
                animalProductivityMultiplier: 1.0,
                machineEfficiencyMultiplier: 1.0,
                marketPriceMultiplier: 1.0,
                probability: {
                    spring: 0.3,
                    summer: 0.2,
                    autumn: 0.4,
                    winter: 0.3
                },
                canTransitionTo: ['sunny', 'rain', 'storm'],
                temperature: { min: 10, max: 25 },
                humidity: { min: 50, max: 80 }
            },
            rain: {
                name: 'Pluvieux',
                emoji: '🌧️',
                description: 'Pluie modérée',
                cropGrowthMultiplier: 1.5,
                animalProductivityMultiplier: 0.9,
                machineEfficiencyMultiplier: 0.8,
                marketPriceMultiplier: 0.95,
                probability: {
                    spring: 0.4,
                    summer: 0.2,
                    autumn: 0.4,
                    winter: 0.3
                },
                canTransitionTo: ['cloudy', 'storm', 'sunny'],
                temperature: { min: 8, max: 20 },
                humidity: { min: 70, max: 95 }
            },
            storm: {
                name: 'Orageux',
                emoji: '⛈️',
                description: 'Orage violent',
                cropGrowthMultiplier: 0.7,
                animalProductivityMultiplier: 0.6,
                machineEfficiencyMultiplier: 0.5,
                marketPriceMultiplier: 1.3,
                probability: {
                    spring: 0.1,
                    summer: 0.3,
                    autumn: 0.2,
                    winter: 0.1
                },
                canTransitionTo: ['rain', 'cloudy'],
                temperature: { min: 12, max: 25 },
                humidity: { min: 80, max: 100 },
                damages: true
            },
            drought: {
                name: 'Sécheresse',
                emoji: '🏜️',
                description: 'Temps très sec',
                cropGrowthMultiplier: 0.5,
                animalProductivityMultiplier: 0.7,
                machineEfficiencyMultiplier: 1.1,
                marketPriceMultiplier: 1.8,
                probability: {
                    spring: 0.05,
                    summer: 0.2,
                    autumn: 0.1,
                    winter: 0.02
                },
                canTransitionTo: ['sunny', 'windy'],
                temperature: { min: 25, max: 40 },
                humidity: { min: 10, max: 30 },
                damages: true
            },
            windy: {
                name: 'Venteux',
                emoji: '💨',
                description: 'Vent fort',
                cropGrowthMultiplier: 0.9,
                animalProductivityMultiplier: 0.85,
                machineEfficiencyMultiplier: 0.9,
                marketPriceMultiplier: 1.1,
                probability: {
                    spring: 0.2,
                    summer: 0.1,
                    autumn: 0.3,
                    winter: 0.4
                },
                canTransitionTo: ['sunny', 'cloudy', 'storm'],
                temperature: { min: 5, max: 20 },
                humidity: { min: 40, max: 70 }
            },
            snow: {
                name: 'Neigeux',
                emoji: '❄️',
                description: 'Chute de neige',
                cropGrowthMultiplier: 0.3,
                animalProductivityMultiplier: 0.8,
                machineEfficiencyMultiplier: 0.6,
                marketPriceMultiplier: 1.5,
                probability: {
                    spring: 0.02,
                    summer: 0.0,
                    autumn: 0.05,
                    winter: 0.6
                },
                canTransitionTo: ['cloudy', 'windy'],
                temperature: { min: -5, max: 5 },
                humidity: { min: 60, max: 90 },
                damages: true
            },
            frost: {
                name: 'Gelée',
                emoji: '🧊',
                description: 'Gelée matinale',
                cropGrowthMultiplier: 0.1,
                animalProductivityMultiplier: 0.7,
                machineEfficiencyMultiplier: 0.7,
                marketPriceMultiplier: 2.0,
                probability: {
                    spring: 0.1,
                    summer: 0.0,
                    autumn: 0.15,
                    winter: 0.3
                },
                canTransitionTo: ['sunny', 'cloudy'],
                temperature: { min: -10, max: 2 },
                humidity: { min: 70, max: 95 },
                damages: true
            }
        };
        
        // Caractéristiques des saisons
        this.seasons = {
            spring: {
                name: 'Printemps',
                emoji: '🌸',
                description: 'Saison de croissance',
                cropGrowthBonus: 1.3,
                animalProductivityBonus: 1.1,
                weatherTendency: ['sunny', 'rain', 'cloudy'],
                averageTemperature: 15,
                dayLength: 12
            },
            summer: {
                name: 'Été',
                emoji: '☀️',
                description: 'Saison chaude',
                cropGrowthBonus: 1.0,
                animalProductivityBonus: 0.9,
                weatherTendency: ['sunny', 'storm', 'drought'],
                averageTemperature: 25,
                dayLength: 16
            },
            autumn: {
                name: 'Automne',
                emoji: '🍂',
                description: 'Saison de récolte',
                cropGrowthBonus: 0.8,
                animalProductivityBonus: 1.0,
                weatherTendency: ['cloudy', 'rain', 'windy'],
                averageTemperature: 12,
                dayLength: 10
            },
            winter: {
                name: 'Hiver',
                emoji: '❄️',
                description: 'Saison froide',
                cropGrowthBonus: 0.3,
                animalProductivityBonus: 0.8,
                weatherTendency: ['snow', 'frost', 'windy'],
                averageTemperature: 2,
                dayLength: 8
            }
        };
        
        // Initialiser la météo
        this.initializeWeather();
        
        console.log('🌤️ WeatherManager initialisé');
    }
    
    // Initialisation de la météo
    initializeWeather() {
        this.currentWeather = this.generateWeather();
        this.updateWeatherData();
    }
    
    // Initialisation du module
    init(gameInstance) {
        this.game = gameInstance;
        this.setupUI();
        console.log('✅ Module Météo initialisé');
    }
    
    // Configuration de l'interface utilisateur
    setupUI() {
        // Pas d'interface interactive pour la météo, elle est automatique
        // Mais on peut ajouter des contrôles de debug si nécessaire
    }
    
    // Générer une nouvelle météo
    generateWeather() {
        const seasonWeathers = this.getSeasonalWeathers();
        const weatherTypes = Object.keys(this.weatherTypes);
        
        // Si on a une météo actuelle, favoriser les transitions naturelles
        if (this.currentWeather) {
            const currentWeatherData = this.weatherTypes[this.currentWeather.type];
            const possibleTransitions = currentWeatherData.canTransitionTo.filter(
                weather => seasonWeathers.includes(weather)
            );
            
            if (possibleTransitions.length > 0 && Math.random() < 0.7) {
                const newWeatherType = possibleTransitions[Math.floor(Math.random() * possibleTransitions.length)];
                return this.createWeatherObject(newWeatherType);
            }
        }
        
        // Sinon, choisir aléatoirement selon les probabilités saisonnières
        const weights = seasonWeathers.map(weather => 
            this.weatherTypes[weather].probability[this.currentSeason]
        );
        
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < seasonWeathers.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return this.createWeatherObject(seasonWeathers[i]);
            }
        }
        
        // Fallback
        return this.createWeatherObject('sunny');
    }
    
    // Obtenir les météos possibles pour la saison
    getSeasonalWeathers() {
        return Object.keys(this.weatherTypes).filter(weather => 
            this.weatherTypes[weather].probability[this.currentSeason] > 0
        );
    }
    
    // Créer un objet météo
    createWeatherObject(weatherType) {
        const weatherData = this.weatherTypes[weatherType];
        const seasonData = this.seasons[this.currentSeason];
        
        return {
            type: weatherType,
            name: weatherData.name,
            emoji: weatherData.emoji,
            description: weatherData.description,
            startTime: Date.now(),
            duration: this.calculateWeatherDuration(),
            temperature: this.calculateTemperature(weatherData, seasonData),
            humidity: this.calculateHumidity(weatherData),
            windSpeed: Math.random() * 20 + 5, // 5-25 km/h
            cropGrowthMultiplier: weatherData.cropGrowthMultiplier * seasonData.cropGrowthBonus,
            animalProductivityMultiplier: weatherData.animalProductivityMultiplier * seasonData.animalProductivityBonus,
            machineEfficiencyMultiplier: weatherData.machineEfficiencyMultiplier,
            marketPriceMultiplier: weatherData.marketPriceMultiplier,
            damages: weatherData.damages || false
        };
    }
    
    // Calculer la durée de la météo
    calculateWeatherDuration() {
        const baseTime = this.weatherDuration;
        const variation = 0.5; // ±50% de variation
        return baseTime * (1 + (Math.random() - 0.5) * variation);
    }
    
    // Calculer la température
    calculateTemperature(weatherData, seasonData) {
        const tempRange = weatherData.temperature;
        const seasonalAvg = seasonData.averageTemperature;
        
        // Température de base selon la météo
        const baseTemp = tempRange.min + Math.random() * (tempRange.max - tempRange.min);
        
        // Ajustement saisonnier
        const seasonalAdjustment = (seasonalAvg - 15) * 0.5; // Référence 15°C
        
        return Math.round(baseTemp + seasonalAdjustment);
    }
    
    // Calculer l'humidité
    calculateHumidity(weatherData) {
        const humidityRange = weatherData.humidity;
        return Math.round(humidityRange.min + Math.random() * (humidityRange.max - humidityRange.min));
    }
    
    // Changer de saison
    changeSeason() {
        const seasons = ['spring', 'summer', 'autumn', 'winter'];
        const currentIndex = seasons.indexOf(this.currentSeason);
        const nextIndex = (currentIndex + 1) % seasons.length;
        
        this.currentSeason = seasons[nextIndex];
        this.seasonStartTime = Date.now();
        
        console.log(`🌍 Nouvelle saison: ${this.seasons[this.currentSeason].name}`);
        
        // Forcer un changement de météo pour la nouvelle saison
        this.changeWeather();
        
        // Notifier le changement de saison
        if (this.game.uiManager) {
            this.game.uiManager.showNotification(
                `🌍 ${this.seasons[this.currentSeason].name} commence !`,
                'season'
            );
        }
    }
    
    // Changer la météo
    changeWeather() {
        this.currentWeather = this.generateWeather();
        this.lastWeatherChange = Date.now();
        
        // Ajouter à l'historique
        this.weatherHistory.push({
            weather: { ...this.currentWeather },
            timestamp: Date.now()
        });
        
        // Limiter l'historique
        if (this.weatherHistory.length > 50) {
            this.weatherHistory.shift();
        }
        
        this.updateWeatherData();
        
        console.log(`🌤️ Météo changée: ${this.currentWeather.name} (${this.currentWeather.temperature}°C)`);
        
        // Notifier le changement
        if (this.game.uiManager) {
            this.game.uiManager.showNotification(
                `🌤️ ${this.currentWeather.name}`,
                'weather'
            );
        }
        
        // Appliquer les dégâts si nécessaire
        if (this.currentWeather.damages) {
            this.applyWeatherDamages();
        }
    }
    
    // Mettre à jour les données météo dans l'état du jeu
    updateWeatherData() {
        if (this.game) {
            this.game.gameState.weather = this.currentWeather.type;
            this.game.gameState.season = this.currentSeason;
            this.game.gameState.temperature = this.currentWeather.temperature;
            this.game.gameState.humidity = this.currentWeather.humidity;
        }
    }
    
    // Appliquer les dégâts météorologiques
    applyWeatherDamages() {
        let damageMessage = '';
        
        switch (this.currentWeather.type) {
            case 'storm':
                // Dégâts aux machines
                if (this.game.machinesManager) {
                    this.game.machinesManager.applyWeatherDamage(0.1); // 10% de chance de panne
                    damageMessage = '⚡ L\'orage endommage certaines machines !';
                }
                break;
                
            case 'drought':
                // Augmentation des coûts d'irrigation
                if (this.game.financeManager) {
                    const extraCost = 500;
                    this.game.spendMoney(extraCost);
                    this.game.financeManager.recordExpense(extraCost, 'utilities', 'Irrigation d\'urgence (sécheresse)');
                    damageMessage = '🏜️ La sécheresse force l\'irrigation d\'urgence !';
                }
                break;
                
            case 'frost':
                // Dégâts aux cultures sensibles
                if (this.game.cropsManager) {
                    this.game.cropsManager.applyFrostDamage(0.3); // 30% de dégâts
                    damageMessage = '🧊 La gelée endommage certaines cultures !';
                }
                break;
                
            case 'snow':
                // Ralentissement des opérations
                if (this.game.machinesManager) {
                    this.game.machinesManager.applySnowSlowdown(0.5); // 50% plus lent
                    damageMessage = '❄️ La neige ralentit les opérations !';
                }
                break;
        }
        
        if (damageMessage && this.game.uiManager) {
            this.game.uiManager.showNotification(damageMessage, 'warning');
        }
    }
    
    // Mise à jour de la météo
    update(deltaTime) {
        const currentTime = Date.now();
        
        // Vérifier si il faut changer la météo
        if (this.currentWeather && 
            currentTime - this.currentWeather.startTime > this.currentWeather.duration) {
            this.changeWeather();
        }
        
        // Vérifier si il faut changer de saison
        if (currentTime - this.seasonStartTime > this.seasonDuration) {
            this.changeSeason();
        }
        
        // Mettre à jour l'interface utilisateur
        this.updateUI();
    }
    
    // Mettre à jour l'interface utilisateur
    updateUI() {
        // Mettre à jour la météo dans la barre de stats
        const weatherDisplay = document.getElementById('weather');
        if (weatherDisplay && this.currentWeather) {
            weatherDisplay.textContent = `${this.currentWeather.emoji} ${this.currentWeather.temperature}°C`;
        }
        
        // Mettre à jour la saison
        const seasonDisplay = document.getElementById('season');
        if (seasonDisplay) {
            const seasonData = this.seasons[this.currentSeason];
            seasonDisplay.textContent = `${seasonData.emoji} ${seasonData.name}`;
        }
        
        // Mettre à jour les détails météo
        const weatherDetails = document.getElementById('weatherDetails');
        if (weatherDetails && this.currentWeather) {
            const remainingTime = Math.max(0, 
                this.currentWeather.startTime + this.currentWeather.duration - Date.now()
            );
            const remainingMinutes = Math.ceil(remainingTime / 60000);
            
            let html = `<div class="weather-info">
                <h4>🌤️ Conditions météorologiques</h4>
                <div class="weather-current">
                    <span class="weather-icon">${this.currentWeather.emoji}</span>
                    <div class="weather-text">
                        <div class="weather-name">${this.currentWeather.name}</div>
                        <div class="weather-description">${this.currentWeather.description}</div>
                    </div>
                </div>
                <div class="weather-stats">
                    <div class="stat-row">
                        <span>Température:</span>
                        <span>${this.currentWeather.temperature}°C</span>
                    </div>
                    <div class="stat-row">
                        <span>Humidité:</span>
                        <span>${this.currentWeather.humidity}%</span>
                    </div>
                    <div class="stat-row">
                        <span>Vent:</span>
                        <span>${this.currentWeather.windSpeed.toFixed(1)} km/h</span>
                    </div>
                    <div class="stat-row">
                        <span>Durée restante:</span>
                        <span>${remainingMinutes} min</span>
                    </div>
                </div>
                <div class="weather-effects">
                    <h5>Effets sur la production:</h5>
                    <div class="effect-row">
                        <span>Cultures:</span>
                        <span class="${this.currentWeather.cropGrowthMultiplier >= 1 ? 'positive' : 'negative'}">
                            ${(this.currentWeather.cropGrowthMultiplier * 100).toFixed(0)}%
                        </span>
                    </div>
                    <div class="effect-row">
                        <span>Animaux:</span>
                        <span class="${this.currentWeather.animalProductivityMultiplier >= 1 ? 'positive' : 'negative'}">
                            ${(this.currentWeather.animalProductivityMultiplier * 100).toFixed(0)}%
                        </span>
                    </div>
                    <div class="effect-row">
                        <span>Machines:</span>
                        <span class="${this.currentWeather.machineEfficiencyMultiplier >= 1 ? 'positive' : 'negative'}">
                            ${(this.currentWeather.machineEfficiencyMultiplier * 100).toFixed(0)}%
                        </span>
                    </div>
                </div>
            </div>`;
            
            weatherDetails.innerHTML = html;
        }
    }
    
    // Obtenir la météo actuelle
    getCurrentWeather() {
        return this.currentWeather;
    }
    
    // Obtenir la saison actuelle
    getCurrentSeason() {
        return this.currentSeason;
    }
    
    // Obtenir les multiplicateurs pour un type de production
    getProductionMultipliers() {
        return {
            cropGrowth: this.currentWeather?.cropGrowthMultiplier || 1.0,
            animalProductivity: this.currentWeather?.animalProductivityMultiplier || 1.0,
            machineEfficiency: this.currentWeather?.machineEfficiencyMultiplier || 1.0,
            marketPrice: this.currentWeather?.marketPriceMultiplier || 1.0
        };
    }
    
    // Obtenir l'historique météo
    getWeatherHistory() {
        return [...this.weatherHistory];
    }
    
    // Prédire la prochaine météo (pour l'interface)
    predictNextWeather() {
        if (!this.currentWeather) return null;
        
        const currentWeatherData = this.weatherTypes[this.currentWeather.type];
        const possibleNext = currentWeatherData.canTransitionTo;
        
        // Calculer les probabilités pour chaque météo possible
        const predictions = possibleNext.map(weather => {
            const weatherData = this.weatherTypes[weather];
            const seasonalProb = weatherData.probability[this.currentSeason];
            
            return {
                type: weather,
                name: weatherData.name,
                emoji: weatherData.emoji,
                probability: seasonalProb
            };
        });
        
        // Trier par probabilité
        predictions.sort((a, b) => b.probability - a.probability);
        
        return predictions.slice(0, 3); // Retourner les 3 plus probables
    }
    
    // Obtenir les statistiques météo de la saison
    getSeasonStats() {
        const seasonWeathers = this.weatherHistory.filter(entry => {
            // Approximation: les 25 dernières entrées pour la saison actuelle
            return this.weatherHistory.length - this.weatherHistory.indexOf(entry) <= 25;
        });
        
        const weatherCounts = {};
        seasonWeathers.forEach(entry => {
            const type = entry.weather.type;
            weatherCounts[type] = (weatherCounts[type] || 0) + 1;
        });
        
        return weatherCounts;
    }
}

// Exporter le module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherManager;
}
