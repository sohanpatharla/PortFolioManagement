// Transactions page JavaScript

let transactionsData = [];
let currentPage = 1;
const rowsPerPage = 10;


// Initialize transactions page
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const isAuthenticated = await auth.requireAuth();
    if (!isAuthenticated) return;

    // Load user info
    await loadUserInfo();
    
    // Load transactions data
    await loadTransactions();
    
    // Initialize event listeners
    initializeEventListeners();
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

// Load transactions data
async function loadTransactions() {
    try {
        const transactions = await api.get('/api/portfolio/transactions');
        transactionsData = transactions;
        
        updateSummaryCards(transactions);
        renderTransactionsTable(transactions);
        
    } catch (error) {
        console.error('Error loading transactions:', error);
        ui.showAlert('Failed to load transactions data', 'error');
    }
}

// Update summary cards
function updateSummaryCards(transactions) {
    
    
    let totalBuys = 0;
    let totalSells = 0;
    let totalVolume = 0;
    let totalFees = 0;

    transactions.forEach(transaction => {
        if (transaction.type === 'BUY') {
            totalBuys++;
        } else if (transaction.type === 'SELL') {
            totalSells++;
        }
       
        
        totalVolume +=  parseFloat(transaction.total) || 0;
        totalFees += transaction.fees || 0;
    });
    
    

    document.getElementById('totalBuys').textContent = totalBuys;
    document.getElementById('totalSells').textContent = totalSells;
    document.getElementById('totalVolume').textContent = utils.formatCurrency(totalVolume);
    document.getElementById('totalFees').textContent = utils.formatCurrency(totalFees);
}
function updatePaginationControls(totalRows) {
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

// Render transactions table
function renderTransactionsTable(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;

    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center p-8">
                    <div class="text-secondary">
                        <p class="mb-2">📋 No transactions found</p>
                        <p>Your transaction history will appear here once you start trading</p>
                    </div>
                </td>
            </tr>
        `;
        document.getElementById('pagination').style.display = 'none';
        return;
    }

    // Pagination logic
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedTransactions = transactions.slice(start, end);

    tbody.innerHTML = paginatedTransactions.map(transaction => {
        const isBuy = transaction.type === 'BUY';
        const typeClass = isBuy ? 'text-success' : 'text-danger';
        const typeIcon = isBuy ? '📈' : '📉';
        const netAmount = isBuy ? 
            -(transaction.total + (transaction.fees || 0)) : 
            (transaction.total - (transaction.fees || 0));
        
        return `
            <tr>
                <td>${utils.formatDate(transaction.date)}</td>
                <td class="${typeClass} font-semibold">${typeIcon} ${transaction.type}</td>
                <td class="font-semibold">${transaction.symbol}</td>
                <td>${transaction.quantity}</td>
                <td>${utils.formatCurrency(transaction.price)}</td>
                <td class="font-semibold">${utils.formatCurrency(transaction.total)}</td>
                <td class="text-warning">${utils.formatCurrency(transaction.fees || 0)}</td>
                <td class="font-semibold ${netAmount >= 0 ? 'text-success' : 'text-danger'}">
                    ${netAmount >= 0 ? '+' : ''}${utils.formatCurrency(netAmount)}
                </td>
            </tr>
        `;
    }).join('');

    updatePaginationControls(transactions.length);
}

// Initialize event listeners
function initializeEventListeners() {


    // Pagination buttons
document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderTransactionsTable(transactionsData);
    }
});
document.getElementById('nextPage').addEventListener('click', () => {
    const totalPages = Math.ceil(transactionsData.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTransactionsTable(transactionsData);
    }
});

    // Refresh transactions
    const refreshBtn = document.getElementById('refreshTransactions');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            ui.showLoading(refreshBtn);
            await loadTransactions();
            ui.hideLoading(refreshBtn);
            ui.showAlert('Transactions refreshed successfully', 'success');
        });
    }

    // Export transactions
    const exportBtn = document.getElementById('exportTransactions');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportTransactions);
    }

    // Search transactions
    const searchInput = document.getElementById('searchTransactions');
    if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(filterTransactions, 300));
    }

    // Filter by type
    const filterSelect = document.getElementById('filterType');
    if (filterSelect) {
        filterSelect.addEventListener('change', filterTransactions);
    }

    // Sort transactions
    const sortSelect = document.getElementById('sortTransactions');
    if (sortSelect) {
        sortSelect.addEventListener('change', sortTransactions);
    }
}

// Filter transactions
function filterTransactions() {
    const searchTerm = document.getElementById('searchTransactions').value.toLowerCase();
    const filterType = document.getElementById('filterType').value;
    
    let filteredTransactions = transactionsData.filter(transaction => {
        const matchesSearch = 
            transaction.symbol.toLowerCase().includes(searchTerm) ||
            transaction.type.toLowerCase().includes(searchTerm);
        
        const matchesType = filterType === 'all' || transaction.type === filterType;
        
        return matchesSearch && matchesType;
    });
    
    renderTransactionsTable(filteredTransactions);
}

// Sort transactions
function sortTransactions() {
    const sortBy = document.getElementById('sortTransactions').value;
    let sortedTransactions = [...transactionsData];
    
    switch (sortBy) {
        case 'date':
            sortedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'symbol':
            sortedTransactions.sort((a, b) => a.symbol.localeCompare(b.symbol));
            break;
        case 'amount':
            sortedTransactions.sort((a, b) => b.total - a.total);
            break;
        case 'type':
            sortedTransactions.sort((a, b) => a.type.localeCompare(b.type));
            break;
    }
    
    renderTransactionsTable(sortedTransactions);
}

// Export transactions to CSV
async function exportTransactions() {
    try {
        // Create CSV content
        const csvHeaders = ['Date', 'Type', 'Symbol', 'Quantity', 'Price', 'Total Amount', 'Fees', 'Net Amount'];
        const csvRows = transactionsData.map(transaction => {
            const isBuy = transaction.type === 'BUY';
            const netAmount = isBuy ? 
                -(transaction.total + (transaction.fees || 0)) : 
                (transaction.total - (transaction.fees || 0));
            
            return [
                transaction.date,
                transaction.type,
                transaction.symbol,
                transaction.quantity,
                transaction.price,
                transaction.total,
                transaction.fees || 0,
                netAmount
            ].join(',');
        });
        
        const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'transactions-export.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        ui.showAlert('Transactions exported successfully', 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        ui.showAlert('Failed to export transactions', 'error');
    }
}