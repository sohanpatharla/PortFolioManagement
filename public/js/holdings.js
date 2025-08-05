// Holdings page JavaScript

let holdingsData = [];
let currentEditId = null;

// Initialize holdings page
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const isAuthenticated = await auth.requireAuth();
    if (!isAuthenticated) return;

    // Load user info
    await loadUserInfo();
    
    // Load holdings data
    await loadHoldings();
    
    // Initialize event listeners
    initializeEventListeners();
    // Wallet Modal Button
document.getElementById('openWallet')?.addEventListener('click', async () => {
    try {
        const res = await api.get('/api/wallet');
        document.getElementById('walletBalance').textContent = utils.formatCurrency(res.balance);
        ui.showModal('walletModal');
    } catch (err) {
        ui.showAlert('Failed to fetch wallet balance', 'error');
    }
});

// Wallet Deposit Form
document.getElementById('depositForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('depositAmount').value);
    try {
        await api.post('/api/wallet/deposit', { amount });
        ui.showAlert('Deposited successfully!', 'success');
        ui.hideModal('walletModal');
    } catch (err) {
        ui.showAlert('Deposit failed', 'error');
    }
});

window.openTradeModal = function(type, symbol, company, price) {
    document.getElementById('tradeType').value = type;
    document.getElementById('tradeSymbol').value = symbol;
    document.getElementById('tradeCompany').textContent = company;
    document.getElementById('tradePrice').textContent = `$${price.toFixed(2)}`;
    document.getElementById('tradeQuantity').value = '';
    ui.showModal('tradeModal');
};


// Trade Form Submission
document.getElementById('tradeForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const type = document.getElementById('tradeType').value;
    const symbol = document.getElementById('tradeSymbol').value;
    const quantity = parseFloat(document.getElementById('tradeQuantity').value);

    try {
        await api.post('/api/portfolio/trade', { type, symbol, quantity });
        ui.showAlert(`${type} successful`, 'success');
        ui.hideModal('tradeModal');
        await loadHoldings();
    } catch (err) {
        ui.showAlert(err.message || `${type} failed`, 'error');
    }
});

});

// Load user information
async function loadUserInfo() {
    try {
        const user = await auth.getCurrentUser();
        if (user) {
            const greeting = document.getElementById('userGreeting');
            if (greeting) {
                greeting.textContent = `Welcome, ${user.firstName}!`;
            }
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Load holdings data
async function loadHoldings() {
    try {
        const [holdings, summary] = await Promise.all([
            api.get('/api/portfolio/holdings'),
            api.get('/api/portfolio/summary')
        ]);
        //     holdings.forEach(holding => {
        //     holding.totalValue = holding.currentPrice * holding.quantity;
        //     holding.profitLoss = (holding.currentPrice - holding.buyPrice) * holding.quantity;
        //     holding.profitLossPercentage = ((holding.currentPrice - holding.buyPrice) / holding.buyPrice) * 100;
        // });
        console.log(holdings);
        
        holdingsData = holdings;
        updateSummaryCards(summary);
        renderHoldingsTable(holdings);
        
    } catch (error) {
        console.error('Error loading holdings:', error);
        ui.showAlert('Failed to load holdings data', 'error');
    }
}

// Update summary cards
function updateSummaryCards(summary) {
    document.getElementById('totalInvestment').textContent = utils.formatCurrency(summary.totalInvestment);
    document.getElementById('currentValue').textContent = utils.formatCurrency(summary.currentValue);
    document.getElementById('totalProfitLoss').textContent = utils.formatCurrency(summary.totalProfitLoss);
    document.getElementById('holdingsCount').textContent = summary.holdingsCount;
    
    const plPercentage = document.getElementById('plPercentage');
    const pl = parseFloat(summary.totalProfitLoss);
    const plPercent = parseFloat(summary.totalProfitLossPercentage);
    
    plPercentage.textContent = utils.formatPercentage(plPercent);
    plPercentage.className = `stat-change ${pl >= 0 ? 'positive' : 'negative'}`;
    
    // Update P&L card class
    const plCard = document.getElementById('totalProfitLoss').closest('.stat-card');
    plCard.className = `stat-card ${pl > 0 ? 'profit' : pl < 0 ? 'loss' : 'neutral'}`;
}

// Render holdings table
function renderHoldingsTable(holdings) {
    const tbody = document.getElementById('holdingsTableBody');
    console.log(holdings);
    
    if (!tbody) return;

    if (holdings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center p-8">
                    <div class="text-secondary">
                        <p class="mb-2">📊 No holdings found</p>
                        <p>Start building your portfolio by adding your first stock</p>
                        <button class="btn btn-primary mt-4" onclick="ui.showModal('stockModal')">Add Stock</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = holdings.map(holding => {
        const pl = holding.profitLoss;
        const plPercent = holding.profitLossPercentage;
        const plClass = pl >= 0 ? 'text-success' : 'text-danger';
        
        return `
            <tr>
                <td class="font-semibold">${holding.symbol}</td>
                <td>${holding.companyName}</td>
                <td>${holding.quantity}</td>
                <td>${utils.formatCurrency(holding.buyPrice)}</td>
                <td>${utils.formatCurrency(holding.currentPrice)}</td>
                <td class="font-semibold">${utils.formatCurrency(holding.totalValue)}</td>
                <td class="font-semibold ${plClass}">
                    ${pl >= 0 ? '+' : ''}${utils.formatCurrency(pl)}
                </td>
                <td class="font-semibold ${plClass}">
                    ${pl >= 0 ? '+' : ''}${utils.formatPercentage(plPercent)}
                </td>
                <td>
                    <div class="flex space-x-2">
                       <button class="btn btn-sm btn-success" onclick="openTradeModal('BUY', '${holding.symbol}', '${holding.companyName}', ${holding.currentPrice})">Buy</button>
        <button class="btn btn-sm btn-danger" onclick="openTradeModal('SELL', '${holding.symbol}', '${holding.companyName}', ${holding.currentPrice})">Sell</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Initialize event listeners
function initializeEventListeners() {
    // Refresh holdings
    const refreshBtn = document.getElementById('refreshHoldings');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            ui.showLoading(refreshBtn);
            await loadHoldings();
            ui.hideLoading(refreshBtn);
            ui.showAlert('Holdings refreshed successfully', 'success');
        });
    }
    
    // Export holdings
    const exportBtn = document.getElementById('exportHoldings');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportHoldings);
    }

    // Add holding
    const addBtn = document.getElementById('addHolding');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openStockModal();
        });
    }

    // Stock form submission
    const stockForm = document.getElementById('stockForm');
    if (stockForm) {
        stockForm.addEventListener('submit', handleStockFormSubmit);
    }

    // Search holdings
    const searchInput = document.getElementById('searchHoldings');
    if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(filterHoldings, 300));
    }

    // Sort holdings
    const sortSelect = document.getElementById('sortHoldings');
    if (sortSelect) {
        sortSelect.addEventListener('change', sortHoldings);
    }

    // Delete confirmation
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);
    }

    const cancelDeleteBtn = document.getElementById('cancelDelete');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            ui.hideModal('deleteModal');
        });
    }
}

// Open stock modal for adding/editing
function openStockModal(holding = null) {
    const modal = document.getElementById('stockModal');
    const modalTitle = document.getElementById('modalTitle');
    const submitText = document.getElementById('submitText');
    const form = document.getElementById('stockForm');
    
    if (holding) {
        // Edit mode
        modalTitle.textContent = 'Edit Stock';
        submitText.textContent = 'Update Stock';
        
        document.getElementById('holdingId').value = holding.id;
        document.getElementById('stockSymbol').value = holding.symbol;
        document.getElementById('companyName').value = holding.companyName;
        document.getElementById('quantity').value = holding.quantity;
        document.getElementById('buyPrice').value = holding.buyPrice;
        document.getElementById('purchaseDate').value = holding.purchaseDate;
        
        currentEditId = holding.id;
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Stock';
        submitText.textContent = 'Add to Portfolio';
        
        form.reset();
        
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('purchaseDate').value = today;
        
        currentEditId = null;
    }
    
    ui.showModal('stockModal');
}

// Handle stock form submission
async function handleStockFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    
    const formData = new FormData(e.target);
    const stockData = {
        symbol: formData.get('symbol').toUpperCase(),
        companyName: formData.get('companyName'),
        quantity: parseFloat(formData.get('quantity')),
        buyPrice: parseFloat(formData.get('buyPrice')),
        purchaseDate: formData.get('purchaseDate')
    };

    // Show loading state
    submitBtn.disabled = true;
    submitText.textContent = currentEditId ? 'Updating...' : 'Adding...';
    submitSpinner.classList.remove('hidden');

    try {
        let response;
        if (currentEditId) {
            // Update existing holding
            response = await api.put(`/api/portfolio/holdings/${currentEditId}`, stockData);
            ui.showAlert('Stock updated successfully!', 'success');
        } else {
            // Add new holding
            response = await api.post('/api/portfolio/holdings', stockData);
            ui.showAlert('Stock added successfully!', 'success');
        }
        
        ui.hideModal('stockModal');
        await loadHoldings();
        
    } catch (error) {
        ui.showAlert(error.message || 'Failed to save stock', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitText.textContent = currentEditId ? 'Update Stock' : 'Add to Portfolio';
        submitSpinner.classList.add('hidden');
    }
}

// Edit holding
function editHolding(holdingId) {
    const holding = holdingsData.find(h => h.id === holdingId);
    if (holding) {
        openStockModal(holding);
    }
}

// Delete holding
function deleteHolding(holdingId) {
    currentEditId = holdingId;
    ui.showModal('deleteModal');
}

// Handle delete confirmation
async function handleDeleteConfirm() {
    if (!currentEditId) return;
    
    const deleteBtn = document.getElementById('confirmDelete');
    const deleteText = document.getElementById('deleteText');
    const deleteSpinner = document.getElementById('deleteSpinner');
    
    // Show loading state
    deleteBtn.disabled = true;
    deleteText.textContent = 'Deleting...';
    deleteSpinner.classList.remove('hidden');
    
    try {
        await api.delete(`/api/portfolio/holdings/${currentEditId}`);
        
        ui.showAlert('Holding deleted successfully', 'success');
        ui.hideModal('deleteModal');
        await loadHoldings();
        
    } catch (error) {
        ui.showAlert(error.message || 'Failed to delete holding', 'error');
    } finally {
        // Reset button state
        deleteBtn.disabled = false;
        deleteText.textContent = 'Delete';
        deleteSpinner.classList.add('hidden');
        currentEditId = null;
    }
}

// Filter holdings based on search
function filterHoldings() {
    const searchTerm = document.getElementById('searchHoldings').value.toLowerCase();
    
    const filteredHoldings = holdingsData.filter(holding => 
        holding.symbol.toLowerCase().includes(searchTerm) ||
        holding.companyName.toLowerCase().includes(searchTerm)
    );
    
    renderHoldingsTable(filteredHoldings);
}

// Sort holdings
function sortHoldings() {
    const sortBy = document.getElementById('sortHoldings').value;
    let sortedHoldings = [...holdingsData];
    
    switch (sortBy) {
        case 'symbol':
            sortedHoldings.sort((a, b) => a.symbol.localeCompare(b.symbol));
            break;
        case 'value':
            sortedHoldings.sort((a, b) => b.totalValue - a.totalValue);
            break;
        case 'pl':
            sortedHoldings.sort((a, b) => b.profitLoss - a.profitLoss);
            break;
        case 'plPercent':
            sortedHoldings.sort((a, b) => b.profitLossPercentage - a.profitLossPercentage);
            break;
    }
    
    renderHoldingsTable(sortedHoldings);
}

// Export holdings to CSV
async function exportHoldings() {
    try {
        const response = await fetch('/api/user/export/csv');
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'portfolio-holdings.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        ui.showAlert('Portfolio exported successfully', 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        ui.showAlert('Failed to export portfolio', 'error');
    }
}