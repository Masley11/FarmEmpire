
// ===== MODULE DE GESTION FINANCIÈRE =====

class FinanceManager {
    constructor() {
        this.game = null;
        this.monthlyReports = [];
        this.transactions = [];
        this.expenses = new Map();
        this.revenues = new Map();
        this.budgets = new Map();
        this.loans = new Map();
        this.nextLoanId = 1;
        this.lastMonthlyReport = Date.now();
        
        // Catégories de dépenses
        this.expenseCategories = {
            seeds: { name: 'Semences', emoji: '🌱', color: '#4CAF50' },
            feed: { name: 'Alimentation animale', emoji: '🌾', color: '#FF9800' },
            maintenance: { name: 'Maintenance', emoji: '🔧', color: '#607D8B' },
            fuel: { name: 'Carburant', emoji: '⛽', color: '#F44336' },
            labor: { name: 'Main d\'œuvre', emoji: '👷', color: '#9C27B0' },
            construction: { name: 'Construction', emoji: '🏗️', color: '#795548' },
            insurance: { name: 'Assurance', emoji: '🛡️', color: '#3F51B5' },
            taxes: { name: 'Taxes', emoji: '💼', color: '#E91E63' },
            utilities: { name: 'Services publics', emoji: '⚡', color: '#00BCD4' },
            other: { name: 'Autres', emoji: '📊', color: '#757575' }
        };
        
        // Catégories de revenus
        this.revenueCategories = {
            crop_sales: { name: 'Vente de cultures', emoji: '🌾', color: '#4CAF50' },
            livestock_sales: { name: 'Vente de produits animaux', emoji: '🥛', color: '#FF9800' },
            processed_sales: { name: 'Vente de produits transformés', emoji: '🏭', color: '#607D8B' },
            contracts: { name: 'Contrats', emoji: '📋', color: '#9C27B0' },
            subsidies: { name: 'Subventions', emoji: '🏛️', color: '#3F51B5' },
            other: { name: 'Autres', emoji: '💰', color: '#757575' }
        };
        
        // Initialiser les catégories
        this.initializeCategories();
        
        console.log('💰 FinanceManager initialisé');
    }
    
    // Initialisation des catégories
    initializeCategories() {
        Object.keys(this.expenseCategories).forEach(category => {
            this.expenses.set(category, 0);
        });
        
        Object.keys(this.revenueCategories).forEach(category => {
            this.revenues.set(category, 0);
        });
    }
    
    // Initialisation du module
    init(gameInstance) {
        this.game = gameInstance;
        this.setupUI();
        console.log('✅ Module Finance initialisé');
    }
    
    // Configuration de l'interface utilisateur
    setupUI() {
        // Gestionnaire pour demander un prêt
        const loanBtn = document.getElementById('requestLoan');
        if (loanBtn) {
            loanBtn.addEventListener('click', () => {
                const amount = parseFloat(document.getElementById('loanAmount')?.value) || 0;
                if (amount > 0) {
                    this.requestLoan(amount);
                }
            });
        }
        
        // Gestionnaire pour rembourser un prêt
        const repayBtn = document.getElementById('repayLoan');
        if (repayBtn) {
            repayBtn.addEventListener('click', () => {
                const loanId = document.getElementById('loanSelect')?.value;
                const amount = parseFloat(document.getElementById('repayAmount')?.value) || 0;
                if (loanId && amount > 0) {
                    this.repayLoan(loanId, amount);
                }
            });
        }
    }
    
    // Enregistrer une transaction
    recordTransaction(amount, category, type, description) {
        const transaction = {
            id: Date.now() + Math.random(),
            amount: Math.abs(amount),
            category,
            type, // 'income' ou 'expense'
            description,
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0]
        };
        
        this.transactions.push(transaction);
        
        // Mettre à jour les totaux
        if (type === 'expense') {
            const currentExpense = this.expenses.get(category) || 0;
            this.expenses.set(category, currentExpense + amount);
        } else if (type === 'income') {
            const currentRevenue = this.revenues.get(category) || 0;
            this.revenues.set(category, currentRevenue + amount);
        }
        
        console.log(`💰 Transaction enregistrée: ${type} ${amount}€ (${category})`);
        
        // Limiter l'historique des transactions
        if (this.transactions.length > 1000) {
            this.transactions.shift();
        }
    }
    
    // Enregistrer une dépense
    recordExpense(amount, category, description) {
        this.recordTransaction(amount, category, 'expense', description);
    }
    
    // Enregistrer un revenu
    recordRevenue(amount, category, description) {
        this.recordTransaction(amount, category, 'income', description);
    }
    
    // Demander un prêt
    requestLoan(amount) {
        const interestRate = this.calculateInterestRate(amount);
        const monthlyPayment = this.calculateMonthlyPayment(amount, interestRate, 12); // 12 mois
        
        // Vérifier la solvabilité
        const creditScore = this.calculateCreditScore();
        const maxLoanAmount = this.calculateMaxLoanAmount();
        
        if (amount > maxLoanAmount) {
            console.log(`❌ Montant du prêt trop élevé (max: ${maxLoanAmount}€)`);
            return false;
        }
        
        if (creditScore < 0.5) {
            console.log(`❌ Score de crédit insuffisant (${(creditScore * 100).toFixed(0)}%)`);
            return false;
        }
        
        const loan = {
            id: this.nextLoanId++,
            principal: amount,
            remainingBalance: amount,
            interestRate,
            monthlyPayment,
            termMonths: 12,
            startDate: Date.now(),
            nextPaymentDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
            status: 'active'
        };
        
        this.loans.set(loan.id.toString(), loan);
        this.game.addMoney(amount);
        
        this.recordTransaction(amount, 'other', 'income', `Prêt bancaire #${loan.id}`);
        
        console.log(`🏦 Prêt accordé: ${amount}€ à ${(interestRate * 100).toFixed(1)}%`);
        this.updateUI();
        return true;
    }
    
    // Calculer le taux d'intérêt
    calculateInterestRate(amount) {
        const creditScore = this.calculateCreditScore();
        const baseRate = 0.05; // 5% de base
        const riskAdjustment = (1 - creditScore) * 0.10; // Jusqu'à 10% supplémentaire
        const amountAdjustment = Math.min(amount / 100000, 0.03); // Plus le montant est élevé, plus le taux est élevé
        
        return Math.min(0.25, baseRate + riskAdjustment + amountAdjustment);
    }
    
    // Calculer le score de crédit
    calculateCreditScore() {
        const totalRevenue = Array.from(this.revenues.values()).reduce((sum, value) => sum + value, 0);
        const totalExpenses = Array.from(this.expenses.values()).reduce((sum, value) => sum + value, 0);
        const netProfit = totalRevenue - totalExpenses;
        const currentMoney = this.game.gameState.money;
        
        // Facteurs de crédit
        const profitabilityScore = Math.max(0, Math.min(1, netProfit / 100000));
        const liquidityScore = Math.max(0, Math.min(1, currentMoney / 50000));
        const historyScore = Math.min(1, this.transactions.length / 100);
        
        return (profitabilityScore + liquidityScore + historyScore) / 3;
    }
    
    // Calculer le montant maximum de prêt
    calculateMaxLoanAmount() {
        const monthlyRevenue = this.getMonthlyAverageRevenue();
        const monthlyExpenses = this.getMonthlyAverageExpenses();
        const netMonthlyIncome = monthlyRevenue - monthlyExpenses;
        
        // Ratio dette/revenu maximum de 40%
        return Math.max(0, netMonthlyIncome * 12 * 0.4);
    }
    
    // Calculer le paiement mensuel
    calculateMonthlyPayment(principal, annualRate, termMonths) {
        const monthlyRate = annualRate / 12;
        return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
               (Math.pow(1 + monthlyRate, termMonths) - 1);
    }
    
    // Rembourser un prêt
    repayLoan(loanId, amount) {
        const loan = this.loans.get(loanId.toString());
        if (!loan || loan.status !== 'active') return false;
        
        if (!this.game.spendMoney(amount)) {
            console.log(`💰 Pas assez d'argent pour rembourser ${amount}€`);
            return false;
        }
        
        // Calculer la répartition intérêts/capital
        const interestPayment = loan.remainingBalance * (loan.interestRate / 12);
        const principalPayment = Math.min(amount - interestPayment, loan.remainingBalance);
        
        loan.remainingBalance -= principalPayment;
        
        this.recordExpense(interestPayment, 'other', `Intérêts prêt #${loan.id}`);
        this.recordExpense(principalPayment, 'other', `Remboursement prêt #${loan.id}`);
        
        if (loan.remainingBalance <= 0) {
            loan.status = 'paid';
            console.log(`✅ Prêt #${loan.id} entièrement remboursé`);
        }
        
        console.log(`🏦 Remboursement prêt #${loan.id}: ${amount}€ (capital: ${principalPayment.toFixed(2)}€, intérêts: ${interestPayment.toFixed(2)}€)`);
        this.updateUI();
        return true;
    }
    
    // Obtenir la moyenne mensuelle des revenus
    getMonthlyAverageRevenue() {
        const last30Days = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recentRevenues = this.transactions
            .filter(t => t.type === 'income' && t.timestamp > last30Days)
            .reduce((sum, t) => sum + t.amount, 0);
        
        return recentRevenues;
    }
    
    // Obtenir la moyenne mensuelle des dépenses
    getMonthlyAverageExpenses() {
        const last30Days = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recentExpenses = this.transactions
            .filter(t => t.type === 'expense' && t.timestamp > last30Days)
            .reduce((sum, t) => sum + t.amount, 0);
        
        return recentExpenses;
    }
    
    // Générer un rapport mensuel
    generateMonthlyReport() {
        const now = Date.now();
        const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
        
        // Calculer les totaux du mois
        const monthlyTransactions = this.transactions.filter(t => t.timestamp > oneMonthAgo);
        
        const monthlyRevenues = new Map();
        const monthlyExpenses = new Map();
        
        monthlyTransactions.forEach(transaction => {
            if (transaction.type === 'income') {
                const current = monthlyRevenues.get(transaction.category) || 0;
                monthlyRevenues.set(transaction.category, current + transaction.amount);
            } else {
                const current = monthlyExpenses.get(transaction.category) || 0;
                monthlyExpenses.set(transaction.category, current + transaction.amount);
            }
        });
        
        const totalRevenue = Array.from(monthlyRevenues.values()).reduce((sum, val) => sum + val, 0);
        const totalExpenses = Array.from(monthlyExpenses.values()).reduce((sum, val) => sum + val, 0);
        const netProfit = totalRevenue - totalExpenses;
        
        const report = {
            date: new Date().toISOString().split('T')[0],
            timestamp: now,
            revenues: monthlyRevenues,
            expenses: monthlyExpenses,
            totalRevenue,
            totalExpenses,
            netProfit,
            cashFlow: this.calculateCashFlow(),
            profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
            roi: this.calculateROI(),
            activeLoans: Array.from(this.loans.values()).filter(loan => loan.status === 'active').length
        };
        
        this.monthlyReports.push(report);
        
        // Garder seulement 12 mois d'historique
        if (this.monthlyReports.length > 12) {
            this.monthlyReports.shift();
        }
        
        console.log(`📊 Rapport mensuel généré - Profit net: ${netProfit.toFixed(2)}€`);
        return report;
    }
    
    // Calculer le flux de trésorerie
    calculateCashFlow() {
        const currentMoney = this.game.gameState.money;
        const lastReport = this.monthlyReports[this.monthlyReports.length - 1];
        const previousMoney = lastReport ? lastReport.cashFlow : 0;
        
        return currentMoney - previousMoney;
    }
    
    // Calculer le retour sur investissement
    calculateROI() {
        const totalInvestment = this.expenses.get('construction') + this.expenses.get('seeds') + this.expenses.get('other');
        const totalRevenue = Array.from(this.revenues.values()).reduce((sum, val) => sum + val, 0);
        
        return totalInvestment > 0 ? ((totalRevenue - totalInvestment) / totalInvestment) * 100 : 0;
    }
    
    // Mise à jour du système financier
    update(deltaTime) {
        const currentTime = Date.now();
        
        // Générer un rapport mensuel
        if (currentTime - this.lastMonthlyReport > 30 * 24 * 60 * 60 * 1000) { // 30 jours
            this.generateMonthlyReport();
            this.lastMonthlyReport = currentTime;
        }
        
        // Vérifier les paiements de prêts
        this.processLoanPayments();
        
        // Calculer les coûts automatiques
        this.processAutomaticExpenses();
    }
    
    // Traiter les paiements de prêts
    processLoanPayments() {
        const currentTime = Date.now();
        
        this.loans.forEach((loan, loanId) => {
            if (loan.status === 'active' && currentTime >= loan.nextPaymentDate) {
                // Prélèvement automatique
                if (this.game.spendMoney(loan.monthlyPayment)) {
                    const interestPayment = loan.remainingBalance * (loan.interestRate / 12);
                    const principalPayment = loan.monthlyPayment - interestPayment;
                    
                    loan.remainingBalance -= principalPayment;
                    loan.nextPaymentDate = currentTime + (30 * 24 * 60 * 60 * 1000);
                    
                    this.recordExpense(interestPayment, 'other', `Intérêts mensuels prêt #${loan.id}`);
                    this.recordExpense(principalPayment, 'other', `Remboursement mensuel prêt #${loan.id}`);
                    
                    if (loan.remainingBalance <= 0) {
                        loan.status = 'paid';
                    }
                    
                    console.log(`🏦 Paiement automatique prêt #${loan.id}: ${loan.monthlyPayment.toFixed(2)}€`);
                } else {
                    console.log(`❌ Impossible de prélever le paiement du prêt #${loan.id}`);
                    // Pénalités de retard
                    loan.remainingBalance *= 1.01; // 1% de pénalité
                }
            }
        });
    }
    
    // Traiter les dépenses automatiques
    processAutomaticExpenses() {
        // Coûts d'électricité, d'assurance, etc.
        const dailyFixedCosts = 50; // €/jour
        
        if (Math.random() < 0.01) { // 1% de chance par frame
            if (this.game.spendMoney(dailyFixedCosts)) {
                this.recordExpense(dailyFixedCosts, 'utilities', 'Coûts quotidiens');
            }
        }
    }
    
    // Mettre à jour l'interface utilisateur
    updateUI() {
        // Mettre à jour le tableau de bord financier
        const financeStats = document.getElementById('financeStats');
        if (financeStats) {
            const totalRevenue = Array.from(this.revenues.values()).reduce((sum, val) => sum + val, 0);
            const totalExpenses = Array.from(this.expenses.values()).reduce((sum, val) => sum + val, 0);
            const netProfit = totalRevenue - totalExpenses;
            const monthlyRevenue = this.getMonthlyAverageRevenue();
            const monthlyExpenses = this.getMonthlyAverageExpenses();
            
            let html = `<div class="finance-dashboard">
                <div class="finance-summary">
                    <h4>💰 Résumé financier</h4>
                    <div class="stat-row">
                        <span>Revenus totaux:</span>
                        <span class="positive">${totalRevenue.toFixed(2)}€</span>
                    </div>
                    <div class="stat-row">
                        <span>Dépenses totales:</span>
                        <span class="negative">${totalExpenses.toFixed(2)}€</span>
                    </div>
                    <div class="stat-row">
                        <span>Profit net:</span>
                        <span class="${netProfit >= 0 ? 'positive' : 'negative'}">${netProfit.toFixed(2)}€</span>
                    </div>
                    <div class="stat-row">
                        <span>Revenus mensuels:</span>
                        <span>${monthlyRevenue.toFixed(2)}€</span>
                    </div>
                    <div class="stat-row">
                        <span>Dépenses mensuelles:</span>
                        <span>${monthlyExpenses.toFixed(2)}€</span>
                    </div>
                </div>`;
            
            // Prêts actifs
            const activeLoans = Array.from(this.loans.values()).filter(loan => loan.status === 'active');
            if (activeLoans.length > 0) {
                html += '<div class="loans-section"><h4>🏦 Prêts actifs</h4>';
                activeLoans.forEach(loan => {
                    html += `<div class="loan-item">
                        <span>Prêt #${loan.id}:</span>
                        <span>${loan.remainingBalance.toFixed(2)}€</span>
                        <span>(${loan.monthlyPayment.toFixed(2)}€/mois)</span>
                    </div>`;
                });
                html += '</div>';
            }
            
            html += '</div>';
            financeStats.innerHTML = html;
        }
        
        // Mettre à jour les graphiques de dépenses
        this.updateExpenseChart();
    }
    
    // Mettre à jour le graphique des dépenses
    updateExpenseChart() {
        const expenseChart = document.getElementById('expenseChart');
        if (expenseChart) {
            let html = '<div class="expense-breakdown"><h4>📊 Répartition des dépenses</h4>';
            
            const totalExpenses = Array.from(this.expenses.values()).reduce((sum, val) => sum + val, 0);
            
            this.expenses.forEach((amount, category) => {
                if (amount > 0) {
                    const percentage = (amount / totalExpenses) * 100;
                    const categoryInfo = this.expenseCategories[category];
                    
                    html += `<div class="expense-item">
                        <span>${categoryInfo.emoji} ${categoryInfo.name}:</span>
                        <span>${amount.toFixed(2)}€ (${percentage.toFixed(1)}%)</span>
                        <div class="expense-bar">
                            <div class="expense-fill" style="width: ${percentage}%; background-color: ${categoryInfo.color}"></div>
                        </div>
                    </div>`;
                }
            });
            
            html += '</div>';
            expenseChart.innerHTML = html;
        }
    }
    
    // Obtenir le dernier rapport mensuel
    getLatestReport() {
        return this.monthlyReports[this.monthlyReports.length - 1] || null;
    }
    
    // Obtenir l'historique des rapports
    getReportsHistory() {
        return [...this.monthlyReports];
    }
    
    // Obtenir les statistiques financières
    getFinancialStats() {
        const totalRevenue = Array.from(this.revenues.values()).reduce((sum, val) => sum + val, 0);
        const totalExpenses = Array.from(this.expenses.values()).reduce((sum, val) => sum + val, 0);
        
        return {
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            monthlyRevenue: this.getMonthlyAverageRevenue(),
            monthlyExpenses: this.getMonthlyAverageExpenses(),
            creditScore: this.calculateCreditScore(),
            activeLoans: Array.from(this.loans.values()).filter(loan => loan.status === 'active').length,
            roi: this.calculateROI()
        };
    }
}

// Exporter le module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinanceManager;
}
