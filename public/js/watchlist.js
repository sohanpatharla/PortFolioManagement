// Watchlist page JavaScript

let watchlistData = [];

// Initialize watchlist page
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const isAuthenticated = await auth.requireAuth();
    if (!isAuthenticated) return;

    // Load user info
    await loadUserInfo();
    
    // Load watchlist data
    await loadWatchlist();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Auto-refresh prices every 30 seconds (when real API is connected)
    // setInterval(refreshPrices, 30000);
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

// Load watchlist data
async function loadWatchlist() {
    try {
        const watchlist = await api.get('/api/portfolio/watchlist');
        watchlistData = watchlist;
        console.log('Watchlist data loaded:', watchlistData);
        
        renderWatchlist(watchlist);
        
    } catch (error) {
        console.error('Error loading watchlist:', error);
        ui.showAlert('Failed to load watchlist data', 'error');
    }
}

// Render watchlist
function renderWatchlist(watchlist) {
    const container = document.getElementById('watchlistContainer');
    if (!container) return;

    if (watchlist.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="card-body text-center p-8">
                    <div class="text-secondary">
                        <p class="mb-2">👁️ Your watchlist is empty</p>
                        <p>Add stocks you're interested in to monitor their performance</p>
                        <button class="btn btn-primary mt-4" onclick="ui.showModal('addStockModal')">
                            Add Stock to Watchlist
                        </button>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = watchlist.map(stock => {
        const changeClass = stock.changePercent >= 0 ? 'text-success' : 'text-danger';
        const changeIcon = stock.changePercent >= 0 ? '📈' : '📉';
        
        return `
            <div class="card watchlist-item">
                <div class="card-body">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="font-bold text-lg mb-1">${stock.symbol}</h3>
                            <p class="text-secondary text-sm mb-2">${stock.companyName}</p>
                            <div class="text-2xl font-bold mb-2">
                                ${utils.formatCurrency(stock.currentPrice)}
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="${changeClass} font-semibold">
                                    ${changeIcon} ${stock.changePercent >= 0 ? '+' : ''}${utils.formatPercentage(stock.changePercent)}
                                </span>
                                <span class="text-secondary text-sm">
                                    Added ${utils.formatDate(stock.addedDate)}
                                </span>
                            </div>
                        </div>
                        <div class="flex flex-col gap-2">
                            <button class="btn btn-sm btn-success" onclick="addToPortfolio('${stock.symbol}', '${stock.companyName}')">
                                ➕ Add to Portfolio
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="removeFromWatchlist(${stock.id})">
                                🗑️ Remove
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Initialize event listeners
function initializeEventListeners() {
    // Add to watchlist button
    const addBtn = document.getElementById('addToWatchlist');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            ui.showModal('addStockModal');
        });
    }

    // Refresh watchlist
    const refreshBtn = document.getElementById('refreshWatchlist');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            ui.showLoading(refreshBtn);
            await loadWatchlist();
            ui.hideLoading(refreshBtn);
            ui.showAlert('Watchlist refreshed successfully', 'success');
        });
    }

    // Add stock form
    const addStockForm = document.getElementById('addStockForm');
    if (addStockForm) {
        addStockForm.addEventListener('submit', handleAddToWatchlist);
    }

    // Search functionality
    const searchInput = document.getElementById('searchWatchlist');
    if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(searchWatchlist, 300));
    }
}

// Handle add to watchlist
async function handleAddToWatchlist(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const stockData = {
        symbol: formData.get('symbol').toUpperCase(),
        companyName: formData.get('companyName')
    };

    try {
        await api.post('/api/portfolio/watchlist', stockData);
        
        ui.showAlert('Stock added to watchlist successfully!', 'success');
        ui.hideModal('addStockModal');
        
        // Reset form
        e.target.reset();
        
        // Refresh watchlist
        await loadWatchlist();
        
    } catch (error) {
        ui.showAlert(error.message || 'Failed to add stock to watchlist', 'error');
    }
}

// Remove from watchlist
async function removeFromWatchlist(stockId) {
    if (!confirm('Are you sure you want to remove this stock from your watchlist?')) {
        return;
    }

    try {
        await api.delete(`/api/portfolio/watchlist/${stockId}`);
        
        ui.showAlert('Stock removed from watchlist', 'success');
        await loadWatchlist();
        
    } catch (error) {
        ui.showAlert(error.message || 'Failed to remove stock from watchlist', 'error');
    }
}

// Add to portfolio (from watchlist)
function addToPortfolio(symbol, companyName) {
    // Redirect to holdings page with pre-filled data
    const params = new URLSearchParams({
        symbol: symbol,
        companyName: companyName,
        action: 'add'
    });
    
    window.location.href = `/holdings?${params.toString()}`;
}

// Search watchlist
function searchWatchlist() {
    const searchTerm = document.getElementById('searchWatchlist').value.toLowerCase();
    
    const filteredWatchlist = watchlistData.filter(stock => 
        stock.symbol.toLowerCase().includes(searchTerm) ||
        stock.companyName.toLowerCase().includes(searchTerm)
    );
    
    renderWatchlist(filteredWatchlist);
}

// Refresh prices (placeholder for real API integration)
async function refreshPrices() {
    try {
        // This would call a real API to update prices
        // For now, just simulate price changes
        watchlistData.forEach(stock => {
            // Random price change between -5% and +5%
            const changePercent = (Math.random() - 0.5) * 10;
            stock.changePercent = changePercent;
            stock.currentPrice *= (1 + changePercent / 100);
        });
        
        renderWatchlist(watchlistData);
        
    } catch (error) {
        console.error('Error refreshing prices:', error);
    }
}