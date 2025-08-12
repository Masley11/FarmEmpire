
// ===== MODULE DE GESTION DES MACHINES AGRICOLES =====

class MachinesManager {
    constructor() {
        this.game = null;
        this.machines = new Map();
        this.nextMachineId = 1;
        this.lastMaintenanceCheck = Date.now();
        
        // Types de machines disponibles
        this.machineTypes = {
            tractor: {
                name: 'Tracteur',
                emoji: '🚜',
                buyCost: 25000,
                maintenanceCost: 200, // €/mois
                fuelCost: 15, // €/heure d'utilisation
                efficiency: 1.5, // multiplicateur de vitesse
                capacity: 100, // hectares/jour
                durability: 100, // points de durabilité max
                repairCost: 500, // coût de réparation complète
                uses: ['planting', 'harvesting', 'plowing'],
                weatherResistance: 0.8,
                upgradeOptions: {
                    engine: { cost: 5000, efficiency: +0.2, fuel: +0.1 },
                    transmission: { cost: 3000, capacity: +20 },
                    cabin: { cost: 2000, weatherResistance: +0.1 }
                }
            },
            harvester: {
                name: 'Moissonneuse-batteuse',
                emoji: '🌾',
                buyCost: 80000,
                maintenanceCost: 500,
                fuelCost: 30,
                efficiency: 2.0,
                capacity: 50,
                durability: 100,
                repairCost: 2000,
                uses: ['harvesting'],
                weatherResistance: 0.6,
                upgradeOptions: {
                    cutting_system: { cost: 10000, efficiency: +0.3 },
                    storage: { cost: 8000, capacity: +15 },
                    automation: { cost: 15000, fuelCost: -0.2 }
                }
            },
            sprayer: {
                name: 'Pulvérisateur',
                emoji: '💨',
                buyCost: 15000,
                maintenanceCost: 150,
                fuelCost: 8,
                efficiency: 1.8,
                capacity: 200,
                durability: 100,
                repairCost: 300,
                uses: ['fertilizing', 'pest_control'],
                weatherResistance: 0.9,
                upgradeOptions: {
                    nozzles: { cost: 2000, efficiency: +0.2 },
                    tank: { cost: 3000, capacity: +50 },
                    precision: { cost: 5000, fuelCost: -0.15 }
                }
            },
            seeder: {
                name: 'Semoir',
                emoji: '🌱',
                buyCost: 20000,
                maintenanceCost: 180,
                fuelCost: 12,
                efficiency: 1.6,
                capacity: 80,
                durability: 100,
                repairCost: 400,
                uses: ['planting'],
                weatherResistance: 0.7,
                upgradeOptions: {
                    precision_system: { cost: 6000, efficiency: +0.25 },
                    seed_monitor: { cost: 4000, accuracy: +0.1 },
                    fertilizer_attachment: { cost: 3000, bonus: 'fertilizer' }
                }
            },
            irrigation: {
                name: 'Système d\'irrigation',
                emoji: '💧',
                buyCost: 12000,
                maintenanceCost: 100,
                fuelCost: 0, // Électrique
                efficiency: 1.0,
                capacity: 150,
                durability: 100,
                repairCost: 250,
                uses: ['watering'],
                weatherResistance: 1.0,
                powerConsumption: 50, // kWh/jour
                upgradeOptions: {
                    smart_sensors: { cost: 3000, efficiency: +0.3 },
                    drip_system: { cost: 4000, waterSaving: 0.4 },
                    automation: { cost: 5000, powerConsumption: -10 }
                }
            }
        };
        
        console.log('🚜 MachinesManager initialisé');
    }
    
    // Initialisation du module
    init(gameInstance) {
        this.game = gameInstance;
        this.setupUI();
        console.log('✅ Module Machines initialisé');
    }
    
    // Configuration de l'interface utilisateur
    setupUI() {
        // Gestionnaire pour acheter des machines
        const buyMachineBtn = document.getElementById('buyMachine');
        if (buyMachineBtn) {
            buyMachineBtn.addEventListener('click', () => {
                const machineType = document.getElementById('machineType')?.value;
                if (machineType) {
                    this.buyMachine(machineType);
                }
            });
        }
        
        // Gestionnaire pour utiliser une machine
        const useMachineBtn = document.getElementById('useMachine');
        if (useMachineBtn) {
            useMachineBtn.addEventListener('click', () => {
                const machineId = document.getElementById('machineSelect')?.value;
                const operation = document.getElementById('operationType')?.value;
                if (machineId && operation) {
                    this.useMachine(machineId, operation);
                }
            });
        }
        
        // Gestionnaire pour réparer une machine
        const repairBtn = document.getElementById('repairMachine');
        if (repairBtn) {
            repairBtn.addEventListener('click', () => {
                const machineId = document.getElementById('repairSelect')?.value;
                if (machineId) {
                    this.repairMachine(machineId);
                }
            });
        }
        
        // Gestionnaire pour améliorer une machine
        const upgradeBtn = document.getElementById('upgradeMachine');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                const machineId = document.getElementById('upgradeSelect')?.value;
                const upgradeType = document.getElementById('upgradeType')?.value;
                if (machineId && upgradeType) {
                    this.upgradeMachine(machineId, upgradeType);
                }
            });
        }
    }
    
    // Acheter une machine
    buyMachine(machineType) {
        const machineInfo = this.machineTypes[machineType];
        if (!machineInfo) return false;
        
        // Vérifier les fonds
        if (!this.game.spendMoney(machineInfo.buyCost)) {
            console.log(`💰 Pas assez d'argent pour acheter ${machineInfo.name} (coût: ${machineInfo.buyCost}€)`);
            return false;
        }
        
        const machine = {
            id: this.nextMachineId++,
            type: machineType,
            name: `${machineInfo.name} #${this.nextMachineId - 1}`,
            durability: machineInfo.durability,
            efficiency: machineInfo.efficiency,
            capacity: machineInfo.capacity,
            fuelCost: machineInfo.fuelCost,
            weatherResistance: machineInfo.weatherResistance,
            upgrades: [],
            totalHours: 0,
            lastMaintenance: Date.now(),
            isOperational: true,
            currentTask: null,
            purchaseDate: Date.now(),
            x: Math.random() * 400 + 200,
            y: Math.random() * 300 + 200
        };
        
        this.machines.set(machine.id.toString(), machine);
        
        // Enregistrer la dépense
        if (this.game.financeManager) {
            this.game.financeManager.recordExpense(machineInfo.buyCost, 'construction', `Achat ${machineInfo.name}`);
        }
        
        console.log(`🚜 ${machineInfo.name} acheté pour ${machineInfo.buyCost}€`);
        this.updateUI();
        return true;
    }
    
    // Utiliser une machine
    useMachine(machineId, operation) {
        const machine = this.machines.get(machineId.toString());
        if (!machine || !machine.isOperational) return false;
        
        const machineInfo = this.machineTypes[machine.type];
        
        // Vérifier si la machine peut faire cette opération
        if (!machineInfo.uses.includes(operation)) {
            console.log(`❌ ${machine.name} ne peut pas effectuer l'opération: ${operation}`);
            return false;
        }
        
        // Calculer le coût d'utilisation
        const hoursOfWork = 1; // 1 heure d'utilisation
        const fuelCost = machine.fuelCost * hoursOfWork;
        
        // Vérifier les fonds pour le carburant
        if (!this.game.spendMoney(fuelCost)) {
            console.log(`⛽ Pas assez d'argent pour le carburant (coût: ${fuelCost}€)`);
            return false;
        }
        
        // Calculer l'efficacité avec les effets météo
        const weatherMultiplier = this.getWeatherEfficiencyMultiplier(machine);
        const actualEfficiency = machine.efficiency * weatherMultiplier;
        
        // Effectuer l'opération
        const result = this.performOperation(operation, actualEfficiency, machine.capacity);
        
        // Usure de la machine
        const durabilityLoss = this.calculateDurabilityLoss(machine, weatherMultiplier);
        machine.durability = Math.max(0, machine.durability - durabilityLoss);
        machine.totalHours += hoursOfWork;
        
        // Machine en panne si durabilité trop faible
        if (machine.durability < 20) {
            machine.isOperational = false;
            console.log(`🔧 ${machine.name} est en panne et nécessite une réparation`);
        }
        
        // Enregistrer les coûts
        if (this.game.financeManager) {
            this.game.financeManager.recordExpense(fuelCost, 'fuel', `Utilisation ${machine.name}`);
        }
        
        console.log(`🚜 ${machine.name} utilisé pour ${operation} - Efficacité: ${(actualEfficiency * 100).toFixed(0)}%`);
        this.updateUI();
        
        return result;
    }
    
    // Effectuer une opération
    performOperation(operation, efficiency, capacity) {
        let result = { success: true, area: 0, bonus: 1.0 };
        
        switch (operation) {
            case 'planting':
                result.area = capacity * efficiency;
                result.bonus = 1.2; // 20% de bonus à la croissance
                if (this.game.cropsManager) {
                    this.game.cropsManager.applyMachineBonus('planting', result.bonus);
                }
                break;
                
            case 'harvesting':
                result.area = capacity * efficiency * 0.8; // Récolte plus lente
                result.bonus = 1.15; // 15% de rendement supplémentaire
                if (this.game.cropsManager) {
                    this.game.cropsManager.applyMachineBonus('harvesting', result.bonus);
                }
                break;
                
            case 'fertilizing':
                result.area = capacity * efficiency;
                result.bonus = 1.3; // 30% de bonus de croissance
                if (this.game.cropsManager) {
                    this.game.cropsManager.applyMachineBonus('fertilizing', result.bonus);
                }
                break;
                
            case 'pest_control':
                result.area = capacity * efficiency;
                result.bonus = 0.9; // Réduction des pertes de 90%
                if (this.game.cropsManager) {
                    this.game.cropsManager.applyMachineBonus('pest_control', result.bonus);
                }
                break;
                
            case 'watering':
                result.area = capacity * efficiency;
                result.bonus = 1.25; // 25% de bonus par temps sec
                if (this.game.cropsManager) {
                    this.game.cropsManager.applyMachineBonus('watering', result.bonus);
                }
                break;
        }
        
        return result;
    }
    
    // Réparer une machine
    repairMachine(machineId) {
        const machine = this.machines.get(machineId.toString());
        if (!machine) return false;
        
        const machineInfo = this.machineTypes[machine.type];
        const repairCost = machineInfo.repairCost;
        
        // Vérifier les fonds
        if (!this.game.spendMoney(repairCost)) {
            console.log(`💰 Pas assez d'argent pour réparer ${machine.name} (coût: ${repairCost}€)`);
            return false;
        }
        
        // Réparer la machine
        machine.durability = machineInfo.durability;
        machine.isOperational = true;
        machine.lastMaintenance = Date.now();
        
        // Enregistrer la dépense
        if (this.game.financeManager) {
            this.game.financeManager.recordExpense(repairCost, 'maintenance', `Réparation ${machine.name}`);
        }
        
        console.log(`🔧 ${machine.name} réparé pour ${repairCost}€`);
        this.updateUI();
        return true;
    }
    
    // Améliorer une machine
    upgradeMachine(machineId, upgradeType) {
        const machine = this.machines.get(machineId.toString());
        if (!machine) return false;
        
        const machineInfo = this.machineTypes[machine.type];
        const upgrade = machineInfo.upgradeOptions[upgradeType];
        
        if (!upgrade) return false;
        
        // Vérifier si l'amélioration n'est pas déjà installée
        if (machine.upgrades.includes(upgradeType)) {
            console.log(`⚠️ Amélioration ${upgradeType} déjà installée sur ${machine.name}`);
            return false;
        }
        
        // Vérifier les fonds
        if (!this.game.spendMoney(upgrade.cost)) {
            console.log(`💰 Pas assez d'argent pour l'amélioration ${upgradeType} (coût: ${upgrade.cost}€)`);
            return false;
        }
        
        // Appliquer l'amélioration
        machine.upgrades.push(upgradeType);
        
        if (upgrade.efficiency) machine.efficiency += upgrade.efficiency;
        if (upgrade.capacity) machine.capacity += upgrade.capacity;
        if (upgrade.fuel) machine.fuelCost *= (1 + upgrade.fuel);
        if (upgrade.weatherResistance) machine.weatherResistance += upgrade.weatherResistance;
        if (upgrade.fuelCost) machine.fuelCost *= (1 + upgrade.fuelCost);
        
        // Enregistrer la dépense
        if (this.game.financeManager) {
            this.game.financeManager.recordExpense(upgrade.cost, 'construction', `Amélioration ${machine.name}: ${upgradeType}`);
        }
        
        console.log(`⬆️ ${machine.name} amélioré avec ${upgradeType} pour ${upgrade.cost}€`);
        this.updateUI();
        return true;
    }
    
    // Calculer l'efficacité avec les effets météo
    getWeatherEfficiencyMultiplier(machine) {
        if (!this.game.weatherManager) return 1.0;
        
        const weather = this.game.weatherManager.getCurrentWeather();
        if (!weather) return 1.0;
        
        let multiplier = 1.0;
        
        // Effets météorologiques de base
        switch (weather.type) {
            case 'rain':
                multiplier *= 0.7; // Difficile de travailler sous la pluie
                break;
            case 'storm':
                multiplier *= 0.3; // Très difficile par orage
                break;
            case 'snow':
                multiplier *= 0.4; // Conditions hivernales difficiles
                break;
            case 'drought':
                multiplier *= 1.1; // Temps sec, bon pour les machines
                break;
            case 'sunny':
                multiplier *= 1.0; // Conditions idéales
                break;
        }
        
        // Résistance aux intempéries de la machine
        const weatherImpact = 1.0 - multiplier;
        const resistedImpact = weatherImpact * (1 - machine.weatherResistance);
        multiplier = 1.0 - resistedImpact;
        
        return Math.max(0.2, Math.min(1.2, multiplier));
    }
    
    // Calculer la perte de durabilité
    calculateDurabilityLoss(machine, weatherMultiplier) {
        let baseLoss = 1.0; // Perte de base par heure
        
        // Perte augmentée par mauvais temps
        baseLoss *= (2.0 - weatherMultiplier);
        
        // Perte augmentée si la machine est vieille
        const ageMonths = (Date.now() - machine.purchaseDate) / (30 * 24 * 60 * 60 * 1000);
        baseLoss *= (1 + ageMonths * 0.1);
        
        // Réduction de perte avec maintenance récente
        const timeSinceMaintenance = Date.now() - machine.lastMaintenance;
        const daysSinceMaintenance = timeSinceMaintenance / (24 * 60 * 60 * 1000);
        if (daysSinceMaintenance > 30) {
            baseLoss *= 1.5; // 50% de perte supplémentaire
        }
        
        return baseLoss;
    }
    
    // Appliquer des dégâts météorologiques
    applyWeatherDamage(damageChance) {
        this.machines.forEach(machine => {
            if (Math.random() < damageChance) {
                const damage = 10 + Math.random() * 20; // 10-30 points de dégâts
                machine.durability = Math.max(0, machine.durability - damage);
                
                if (machine.durability < 20) {
                    machine.isOperational = false;
                }
                
                console.log(`⚡ ${machine.name} endommagé par le mauvais temps (-${damage.toFixed(0)} durabilité)`);
            }
        });
        
        this.updateUI();
    }
    
    // Appliquer un ralentissement dû à la neige
    applySnowSlowdown(slowdownFactor) {
        this.machines.forEach(machine => {
            machine.snowSlowdown = slowdownFactor;
        });
        
        // Le ralentissement se dissipe après quelques heures
        setTimeout(() => {
            this.machines.forEach(machine => {
                delete machine.snowSlowdown;
            });
        }, 3600000); // 1 heure
    }
    
    // Mise à jour des machines
    update(deltaTime) {
        const currentTime = Date.now();
        
        // Vérification de maintenance mensuelle
        if (currentTime - this.lastMaintenanceCheck > 30 * 24 * 60 * 60 * 1000) { // 30 jours
            this.processMonthlyMaintenance();
            this.lastMaintenanceCheck = currentTime;
        }
        
        // Mise à jour de chaque machine
        this.machines.forEach(machine => {
            this.updateMachine(machine, currentTime);
        });
    }
    
    // Mettre à jour une machine individuelle
    updateMachine(machine, currentTime) {
        const machineInfo = this.machineTypes[machine.type];
        
        // Dégradation naturelle
        const hoursSinceLastUpdate = (currentTime - machine.lastMaintenance) / (60 * 60 * 1000);
        if (hoursSinceLastUpdate > 24) { // Une fois par jour
            machine.durability = Math.max(0, machine.durability - 0.1);
            machine.lastMaintenance = currentTime;
        }
        
        // Arrêt automatique si trop endommagée
        if (machine.durability < 10 && machine.isOperational) {
            machine.isOperational = false;
            console.log(`🔧 ${machine.name} s'arrête automatiquement (durabilité critique)`);
        }
    }
    
    // Traitement de la maintenance mensuelle
    processMonthlyMaintenance() {
        let totalCost = 0;
        
        this.machines.forEach(machine => {
            const machineInfo = this.machineTypes[machine.type];
            const maintenanceCost = machineInfo.maintenanceCost;
            
            if (this.game.spendMoney(maintenanceCost)) {
                machine.durability = Math.min(machineInfo.durability, machine.durability + 5);
                totalCost += maintenanceCost;
            } else {
                // Pénalité si pas de maintenance
                machine.durability = Math.max(0, machine.durability - 10);
                if (machine.durability < 20) {
                    machine.isOperational = false;
                }
            }
        });
        
        if (totalCost > 0) {
            if (this.game.financeManager) {
                this.game.financeManager.recordExpense(totalCost, 'maintenance', 'Maintenance mensuelle des machines');
            }
            console.log(`🔧 Maintenance mensuelle: ${totalCost}€`);
        }
    }
    
    // Mettre à jour l'interface utilisateur
    updateUI() {
        const machineStats = document.getElementById('machineStats');
        if (machineStats) {
            const stats = this.getMachineStats();
            
            let html = '<div class="machines-overview">';
            html += `<h4>🚜 Parc de machines (${stats.totalMachines})</h4>`;
            
            // Statistiques par type
            Object.entries(stats.machinesByType).forEach(([type, count]) => {
                if (count > 0) {
                    const machineInfo = this.machineTypes[type];
                    html += `<div class="machine-type">
                        <span>${machineInfo.emoji} ${machineInfo.name}:</span>
                        <span>${count}</span>
                    </div>`;
                }
            });
            
            html += `<div class="stats-section">
                <div class="stat-item">
                    <span>Efficacité moyenne:</span>
                    <span>${stats.averageEfficiency.toFixed(1)}%</span>
                </div>
                <div class="stat-item">
                    <span>Durabilité moyenne:</span>
                    <span>${stats.averageDurability.toFixed(1)}%</span>
                </div>
                <div class="stat-item">
                    <span>Machines opérationnelles:</span>
                    <span>${stats.operationalMachines}/${stats.totalMachines}</span>
                </div>
                <div class="stat-item">
                    <span>Coût de maintenance:</span>
                    <span>${stats.maintenanceCost}€/mois</span>
                </div>
            </div>`;
            
            // Liste des machines avec détails
            if (this.machines.size > 0) {
                html += '<h5>📋 Détails des machines</h5>';
                this.machines.forEach(machine => {
                    const machineInfo = this.machineTypes[machine.type];
                    const status = machine.isOperational ? '✅' : '❌';
                    const durabilityColor = machine.durability > 70 ? 'green' : machine.durability > 30 ? 'orange' : 'red';
                    
                    html += `<div class="machine-detail">
                        <span>${machineInfo.emoji} ${machine.name} ${status}</span>
                        <span style="color: ${durabilityColor}">Durabilité: ${machine.durability.toFixed(0)}%</span>
                        <span>Efficacité: ${(machine.efficiency * 100).toFixed(0)}%</span>
                        <span>Heures: ${machine.totalHours}</span>
                    </div>`;
                });
            }
            
            html += '</div>';
            machineStats.innerHTML = html;
        }
    }
    
    // Obtenir les statistiques des machines
    getMachineStats() {
        const stats = {
            totalMachines: this.machines.size,
            operationalMachines: 0,
            machinesByType: {},
            averageEfficiency: 0,
            averageDurability: 0,
            maintenanceCost: 0,
            totalHours: 0
        };
        
        let totalEfficiency = 0;
        let totalDurability = 0;
        
        this.machines.forEach(machine => {
            const machineInfo = this.machineTypes[machine.type];
            
            // Compter par type
            stats.machinesByType[machine.type] = (stats.machinesByType[machine.type] || 0) + 1;
            
            // Machines opérationnelles
            if (machine.isOperational) {
                stats.operationalMachines++;
            }
            
            // Moyennes
            totalEfficiency += machine.efficiency;
            totalDurability += machine.durability;
            stats.totalHours += machine.totalHours;
            
            // Coût de maintenance
            stats.maintenanceCost += machineInfo.maintenanceCost;
        });
        
        if (stats.totalMachines > 0) {
            stats.averageEfficiency = (totalEfficiency / stats.totalMachines) * 100;
            stats.averageDurability = totalDurability / stats.totalMachines;
        }
        
        return stats;
    }
    
    // Obtenir la liste des machines
    getMachines() {
        return new Map(this.machines);
    }
    
    // Obtenir une machine par ID
    getMachine(machineId) {
        return this.machines.get(machineId.toString());
    }
    
    // Rendu sur le canvas
    render(ctx) {
        this.machines.forEach(machine => {
            const machineInfo = this.machineTypes[machine.type];
            
            // Couleur selon l'état
            let statusColor = machine.isOperational ? '#4CAF50' : '#F44336';
            if (machine.durability < 30) statusColor = '#FF9800';
            
            // Dessiner la machine
            ctx.fillStyle = statusColor;
            ctx.fillRect(machine.x, machine.y, 25, 20);
            
            // Emoji de la machine
            ctx.font = '18px Arial';
            ctx.fillText(machineInfo.emoji, machine.x + 3, machine.y + 15);
            
            // Barre de durabilité
            const barWidth = 25;
            const barHeight = 3;
            const durabilityRatio = machine.durability / 100;
            
            ctx.fillStyle = '#DDDDDD';
            ctx.fillRect(machine.x, machine.y - 5, barWidth, barHeight);
            
            ctx.fillStyle = durabilityRatio > 0.7 ? '#4CAF50' : durabilityRatio > 0.3 ? '#FF9800' : '#F44336';
            ctx.fillRect(machine.x, machine.y - 5, barWidth * durabilityRatio, barHeight);
        });
    }
}

// Exporter le module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MachinesManager;
} else if (typeof window !== 'undefined') {
    window.MachinesManager = MachinesManager;
}

console.log('✅ Module Machines.js chargé');
