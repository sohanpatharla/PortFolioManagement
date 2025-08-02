// Dashboard JavaScript

// Global variables
let performanceChart;
let allocationChart;
let portfolioData = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const isAuthenticated = await auth.requireAuth();
    if (!isAuthenticated) return;

    // Load user info
    await loadUserInfo();
    
    // Load dashboard data
    await loadDashboardData();
    
    // Initialize charts
    initializeCharts();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load recent activity
    loadRecentActivity();
    
    // Load top performers
    loadTopPerformers();
    
    // Load market summary
    loadMarketSummary();
});

// Load user information
async function loadUserInfo() {
    try {
        const user = await auth.getCurrentUser();
        if (user) {
            const greeting = document.getElementById('userGreeting');
            if (greeting) {
                const currentHour = new Date().getHours();
                let timeGreeting = 'Good evening';
                if (currentHour < 12) timeGreeting = 'Good morning';
                else if (currentHour < 18) timeGreeting = 'Good afternoon';
                
                greeting.textContent = `${timeGreeting}, ${user.firstName}!`;
            }
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load portfolio summary
        const summary = await api.get('/api/portfolio/summary');
        updatePortfolioSummary(summary);
        
        // Load holdings for allocation chart
        const holdings = await api.get('/api/portfolio/holdings');
        portfolioData.holdings = holdings;
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        ui.showAlert('Failed to load portfolio data', 'error');
    }
}

// Update portfolio summary cards
function updatePortfolioSummary(summary) {
    // Update total investment
    const totalInvestmentEl = document.getElementById('totalInvestment');
    if (totalInvestmentEl) {
        totalInvestmentEl.textContent = utils.formatCurrency(summary.totalInvestment);
    }
    
    // Update current value
    const currentValueEl = document.getElementById('currentValue');
    if (currentValueEl) {
        currentValueEl.textContent = utils.formatCurrency(summary.currentValue);
    }
    
    // Update profit/loss
    const totalPLEl = document.getElementById('totalProfitLoss');
    const plChangeEl = document.getElementById('plChange');
    if (totalPLEl && plChangeEl) {
        const pl = parseFloat(summary.totalProfitLoss);
        const plPercent = parseFloat(summary.totalProfitLossPercentage);
        
        totalPLEl.textContent = utils.formatCurrency(pl);
        plChangeEl.innerHTML = `<span>${pl >= 0 ? '⬆️' : '⬇️'}</span> ${utils.formatPercentage(plPercent)}`;
        
        // Update classes based on P&L
        const statCard = totalPLEl.closest('.stat-card');
        if (statCard) {
            statCard.classList.remove('profit', 'loss', 'neutral');
            if (pl > 0) statCard.classList.add('profit');
            else if (pl < 0) statCard.classList.add('loss');
            else statCard.classList.add('neutral');
        }
        
        plChangeEl.classList.remove('positive', 'negative', 'neutral');
        if (pl > 0) plChangeEl.classList.add('positive');
        else if (pl < 0) plChangeEl.classList.add('negative');
        else plChangeEl.classList.add('neutral');
    }
    
    // Update holdings count
    const holdingsCountEl = document.getElementById('holdingsCount');
    if (holdingsCountEl) {
        holdingsCountEl.textContent = summary.holdingsCount || 0;
    }
}

// Initialize charts
function initializeCharts() {
    initPerformanceChart();
    initAllocationChart();
}

// Initialize performance chart
function initPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    // Generate dummy performance data
    const performanceData = generatePerformanceData();

    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: performanceData.labels,
            datasets: [{
                label: 'Portfolio Value',
                data: performanceData.values,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#2563eb',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return 'Value: ' + utils.formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return utils.formatCurrency(value);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Initialize allocation chart
function initAllocationChart() {
    const ctx = document.getElementById('allocationChart');
    if (!ctx) return;

    // Generate allocation data from holdings
    const allocationData = generateAllocationData();

    allocationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: allocationData.labels,
            datasets: [{
                data: allocationData.values,
                backgroundColor: allocationData.colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${utils.formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Generate dummy performance data
function generatePerformanceData() {
    const labels = [];
    const values = [];
    const baseValue = 200000;
    let currentValue = baseValue;

    // Generate data for the last 30 days
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Random walk with slight upward trend
        const change = (Math.random() - 0.48) * 0.02;
        currentValue *= (1 + change);
        values.push(Math.round(currentValue));
    }

    return { labels, values };
}

// Generate allocation data
function generateAllocationData() {
    if (!portfolioData.holdings || portfolioData.holdings.length === 0) {
        return {
            labels: ['No Holdings'],
            values: [1],
            colors: ['#e2e8f0']
        };
    }

    const labels = [];
    const values = [];
    const colors = [];

    portfolioData.holdings.forEach((holding, index) => {
        labels.push(holding.symbol);
        values.push(holding.totalValue);
        colors.push(utils.getRandomColor());
    });

    return { labels, values, colors };
}

// Initialize event listeners
function initializeEventListeners() {
    // Refresh data button
    const refreshBtn = document.getElementById('refreshData');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            ui.showLoading(refreshBtn);
            await loadDashboardData();
            ui.hideLoading(refreshBtn);
            ui.showAlert('Data refreshed successfully', 'success');
        });
    }

    // Add holding button
    const addHoldingBtn = document.getElementById('addHolding');
    if (addHoldingBtn) {
        addHoldingBtn.addEventListener('click', () => {
            ui.showModal('addStockModal');
            // Set today's date as default
            const today = new Date().toISOString().split('T')[0];
            const dateField = document.getElementById('purchaseDate');
            if (dateField) {
                dateField.value = today;
            }
        });
    }
    // Close modal button
const closeModalBtn = document.getElementById('closeModal');
if (closeModalBtn) {
    console.log("Close modal button found");
    closeModalBtn.addEventListener('click', () => {
        console.log("Closing modal");
        
        ui.hideModal('addStockModal');
    });
}


    // Add stock form
    const addStockForm = document.getElementById('addStockForm');
    if (addStockForm) {
        addStockForm.addEventListener('submit', handleAddStock);
    }

    // Chart period buttons
    const periodButtons = document.querySelectorAll('.period-btn');
    periodButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            periodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update chart data based on period
            const period = btn.dataset.period;
            updatePerformanceChart(period);
        });
    });

    // Refresh performers button
    const refreshPerformersBtn = document.getElementById('refreshPerformers');
    if (refreshPerformersBtn) {
        refreshPerformersBtn.addEventListener('click', loadTopPerformers);
    }
}

// Handle add stock form submission
async function handleAddStock(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const stockData = {
        symbol: formData.get('symbol').toUpperCase(),
        companyName: formData.get('companyName'),
        quantity: parseFloat(formData.get('quantity')),
        buyPrice: parseFloat(formData.get('buyPrice')),
        purchaseDate: formData.get('purchaseDate')
    };

    try {
        const response = await api.post('/api/portfolio/holdings', stockData);
        
        ui.showAlert('Stock added successfully!', 'success');
        ui.hideModal('addStockModal');
        
        // Reset form
        e.target.reset();
        
        // Refresh dashboard data
        await loadDashboardData();
        
        // Update allocation chart
        const allocationData = generateAllocationData();
        allocationChart.data.labels = allocationData.labels;
        allocationChart.data.datasets[0].data = allocationData.values;
        allocationChart.data.datasets[0].backgroundColor = allocationData.colors;
        allocationChart.update();
        
    } catch (error) {
        ui.showAlert(error.message || 'Failed to add stock', 'error');
    }
}

// Update performance chart based on period
function updatePerformanceChart(period) {
    const performanceData = generatePerformanceData(period);
    
    performanceChart.data.labels = performanceData.labels;
    performanceChart.data.datasets[0].data = performanceData.values;
    performanceChart.update();
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const transactions = await api.get('/api/portfolio/transactions');
        console.log("Recent transactions:", transactions);
        
        const recentTransactions = transactions.slice(0, 5); // Get last 5 transactions
        
        const activityList = document.getElementById('recentActivity');
        if (!activityList) return;

        activityList.innerHTML = recentTransactions.map(transaction => `
            <div class="activity-item">
                <div class="activity-icon ${transaction.type.toLowerCase()}">
                    ${transaction.type === 'BUY' ? '📈' : '📉'}
                </div>
                <div class="activity-details">
                    <div class="activity-main">
                        ${transaction.type} ${transaction.quantity} ${transaction.symbol}
                    </div>
                    <div class="activity-sub">
                        ${utils.formatCurrency(transaction.price)} per share
                    </div>
                </div>
                <div class="activity-time">
                    ${utils.getRelativeTime(transaction.date)}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Load top performers
async function loadTopPerformers() {
    try {
        const holdings = await api.get('/api/portfolio/holdings');
        
        // Sort by profit/loss percentage
        const topPerformers = holdings
            .sort((a, b) => b.profitLossPercentage - a.profitLossPercentage)
            .slice(0, 5);
        
        const performersContainer = document.getElementById('topPerformers');
        if (!performersContainer) return;

        performersContainer.innerHTML = topPerformers.map(holding => `
            <div class="performer-item">
                <div class="performer-info">
                    <div class="performer-symbol">${holding.symbol}</div>
                    <div class="performer-name">${holding.companyName}</div>
                </div>
                <div class="performer-change">
                    <div class="performer-price">${utils.formatCurrency(holding.currentPrice)}</div>
                    <div class="performer-percent ${holding.profitLossPercentage >= 0 ? 'positive' : 'negative'}">
                        ${holding.profitLossPercentage >= 0 ? '+' : ''}${utils.formatPercentage(holding.profitLossPercentage)}
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading top performers:', error);
    }
}

// Load market summary
function loadMarketSummary() {
    // Dummy market data
    const marketData = [
        { name: 'S&P 500', price: 4567.89, change: 1.23 },
        { name: 'NASDAQ', price: 14234.56, change: -0.85 },
        { name: 'DOW', price: 34567.12, change: 0.45 },
        { name: 'Russell 2000', price: 2123.45, change: 2.10 }
    ];

    const marketIndices = document.getElementById('marketIndices');
    if (!marketIndices) return;

    marketIndices.innerHTML = marketData.map(index => `
        <div class="market-index">
            <div class="index-name">${index.name}</div>
            <div class="index-value">
                <div class="index-price">${utils.formatNumber(index.price)}</div>
                <div class="index-change ${index.change >= 0 ? 'positive' : 'negative'}">
                    ${index.change >= 0 ? '+' : ''}${utils.formatPercentage(index.change)}
                </div>
            </div>
        </div>
    `).join('');
}