// Settings page JavaScript

let currentSettings = {};

// Initialize settings page
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const isAuthenticated = await auth.requireAuth();
    if (!isAuthenticated) return;

    // Load user info
    await loadUserInfo();
    
    // Load user settings
    await loadUserSettings();
    
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

// Load user settings
async function loadUserSettings() {
    try {
        const settings = await api.get('/api/user/settings');
        currentSettings = settings;
        populateSettingsForm(settings);
        
    } catch (error) {
        console.error('Error loading settings:', error);
        ui.showAlert('Failed to load settings', 'error');
    }
}

// Populate settings form
function populateSettingsForm(settings) {
    // Theme settings
    const darkModeToggle = document.getElementById('darkMode');
    if (darkModeToggle) {
        darkModeToggle.checked = settings.darkMode || false;
    }

    // Notification settings
    const notificationsToggle = document.getElementById('notifications');
    if (notificationsToggle) {
        notificationsToggle.checked = settings.notifications !== false;
    }

    // Currency settings
    const currencySelect = document.getElementById('currency');
    if (currencySelect) {
        currencySelect.value = settings.currency || 'USD';
    }

    // Language settings
    const languageSelect = document.getElementById('language');
    if (languageSelect) {
        languageSelect.value = settings.language || 'en';
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Settings form submission
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsUpdate);
    }

    // Dark mode toggle (immediate effect)
    const darkModeToggle = document.getElementById('darkMode');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            const isDark = e.target.checked;
            theme.set(isDark ? 'dark' : 'light');
        });
    }

    // Export data button
    const exportBtn = document.getElementById('exportData');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleDataExport);
    }

    // Delete account button
    const deleteAccountBtn = document.getElementById('deleteAccount');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    }

    // Reset settings button
    const resetBtn = document.getElementById('resetSettings');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleResetSettings);
    }
}

// Handle settings update
async function handleSettingsUpdate(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> Saving...';
    
    const formData = new FormData(e.target);
    const settingsData = {
        darkMode: formData.get('darkMode') === 'on',
        notifications: formData.get('notifications') === 'on',
        currency: formData.get('currency'),
        language: formData.get('language')
    };

    try {
        const updatedSettings = await api.put('/api/user/settings', settingsData);
        currentSettings = updatedSettings;
        
        ui.showAlert('Settings saved successfully!', 'success');
        
    } catch (error) {
        ui.showAlert(error.message || 'Failed to save settings', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Handle data export
async function handleDataExport() {
    const exportBtn = document.getElementById('exportData');
    const originalText = exportBtn.textContent;
    
    try {
        exportBtn.disabled = true;
        exportBtn.innerHTML = '<div class="spinner"></div> Exporting...';
        
        const response = await fetch('/api/user/export/csv');
        
        if (!response.ok) {
            throw new Error('Export failed');
        }
        
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `portfolio-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        ui.showAlert('Portfolio data exported successfully!', 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        ui.showAlert('Failed to export data', 'error');
    } finally {
        exportBtn.disabled = false;
        exportBtn.textContent = originalText;
    }
}

// Handle account deletion
function handleDeleteAccount() {
    const confirmed = confirm(
        'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.'
    );
    
    if (!confirmed) return;
    
    const doubleConfirmed = confirm(
        'This is your final warning. Deleting your account will permanently remove:\n\n' +
        '• All your portfolio data\n' +
        '• Transaction history\n' +
        '• Watchlist items\n' +
        '• Account settings\n\n' +
        'Type "DELETE" in the next prompt to confirm.'
    );
    
    if (!doubleConfirmed) return;
    
    const confirmation = prompt('Type "DELETE" to confirm account deletion:');
    
    if (confirmation === 'DELETE') {
        performAccountDeletion();
    } else {
        ui.showAlert('Account deletion cancelled', 'info');
    }
}

// Perform account deletion
async function performAccountDeletion() {
    const deleteBtn = document.getElementById('deleteAccount');
    const originalText = deleteBtn.textContent;
    
    try {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<div class="spinner"></div> Deleting...';
        
        // Note: This would need to be implemented in the backend
        // await api.delete('/api/user/account');
        
        // For now, just show a message
        ui.showAlert('Account deletion feature will be available soon', 'info');
        
    } catch (error) {
        ui.showAlert(error.message || 'Failed to delete account', 'error');
    } finally {
        deleteBtn.disabled = false;
        deleteBtn.textContent = originalText;
    }
}

// Handle settings reset
function handleResetSettings() {
    const confirmed = confirm('Are you sure you want to reset all settings to default values?');
    
    if (!confirmed) return;
    
    // Reset to default settings
    const defaultSettings = {
        darkMode: false,
        notifications: true,
        currency: 'USD',
        language: 'en'
    };
    
    populateSettingsForm(defaultSettings);
    theme.set('light'); // Reset theme immediately
    
    ui.showAlert('Settings reset to default values. Click "Save Settings" to apply.', 'info');
}

// Initialize theme based on saved settings
document.addEventListener('DOMContentLoaded', function() {
    // The theme is already initialized in main.js, but we can sync it with user settings
    const savedTheme = theme.get();
    const darkModeToggle = document.getElementById('darkMode');
    
    if (darkModeToggle) {
        darkModeToggle.checked = savedTheme === 'dark';
    }
});