// Main JavaScript utilities and common functions

// Utility functions
const utils = {
    // Format currency
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    },

    // Format percentage
    formatPercentage: (value, decimals = 2) => {
        return `${parseFloat(value).toFixed(decimals)}%`;
    },

    // Format large numbers
    formatNumber: (num) => {
        if (num >= 1e9) {
            return (num / 1e9).toFixed(1) + 'B';
        } else if (num >= 1e6) {
            return (num / 1e6).toFixed(1) + 'M';
        } else if (num >= 1e3) {
            return (num / 1e3).toFixed(1) + 'K';
        }
        return num.toString();
    },

    // Format date
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Get relative time
    getRelativeTime: (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return utils.formatDate(dateString);
    },

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Generate random color
    getRandomColor: () => {
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
            '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
};

// API helper functions
const api = {
    // Base API call function
    call: async (endpoint, options = {}) => {
        const token = localStorage.getItem('JWT_TOKEN');
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${localStorage.getItem('JWT_TOKEN') || ''}`
            }
        };
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }

        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(endpoint, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // GET request
    get: (endpoint) => api.call(endpoint),

    // POST request
    post: (endpoint, data) => api.call(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    // PUT request
    put: (endpoint, data) => api.call(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    // DELETE request
    delete: (endpoint) => api.call(endpoint, {
        method: 'DELETE'
    })
};

// Authentication helper
const auth = {
    // Check if user is authenticated
    isAuthenticated: async () => {
        try {
            const response = await api.get('/api/auth/status');
            return response.authenticated;
        } catch (error) {
            return false;
        }
    },

    // Get current user
    getCurrentUser: async () => {
        try {
            const response = await api.get('/api/auth/status');
            return response.user || null;
        } catch (error) {
            return null;
        }
    },

    // Logout user
    logout: async () => {
        try {
            await api.post('/api/auth/logout');
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    // Redirect if not authenticated
    requireAuth: async () => {
        const isAuth = await auth.isAuthenticated();
        if (!isAuth) {
            window.location.href = '/login';
            return false;
        }
        return true;
    }
};

// UI helper functions
const ui = {
    // Show loading spinner
    showLoading: (element) => {
        const spinner = element.querySelector('.spinner');
        if (spinner) {
            spinner.classList.remove('hidden');
        }
        element.disabled = true;
    },

    // Hide loading spinner
    hideLoading: (element) => {
        const spinner = element.querySelector('.spinner');
        if (spinner) {
            spinner.classList.add('hidden');
        }
        element.disabled = false;
    },

    // Show alert
    showAlert: (message, type = 'info', container = 'alert-container') => {
        const alertContainer = document.getElementById(container);
        if (!alertContainer) return;

        const alertDiv = document.createElement('div');
        alertDiv.className = `auth-alert ${type}`;
        alertDiv.innerHTML = `
            <span>${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
            ${message}
        `;

        alertContainer.innerHTML = '';
        alertContainer.appendChild(alertDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    },

    // Clear alerts
    clearAlerts: (container = 'alert-container') => {
        const alertContainer = document.getElementById(container);
        if (alertContainer) {
            alertContainer.innerHTML = '';
        }
    },

    // Show modal
    showModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    // Hide modal
    hideModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    },

    // Animate element
    animate: (element, animationClass, duration = 1000) => {
        element.classList.add(animationClass);
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, duration);
    }
};

// Theme management
const theme = {
    // Get current theme
    get: () => {
        return localStorage.getItem('theme') || 'light';
    },

    // Set theme
    set: (themeName) => {
        localStorage.setItem('theme', themeName);
        document.documentElement.setAttribute('data-theme', themeName);
        
        // Update theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = themeName === 'dark' ? '☀️' : '🌙';
        }
    },

    // Toggle theme
    toggle: () => {
        const currentTheme = theme.get();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        theme.set(newTheme);
    },

    // Initialize theme
    init: () => {
        const savedTheme = theme.get();
        theme.set(savedTheme);
    }
};

// Form validation helpers
const validation = {
    // Email validation
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Password strength check
    getPasswordStrength: (password) => {
        let score = 0;
        let feedback = [];

        if (password.length >= 8) score++;
        else feedback.push('At least 8 characters');

        if (/[a-z]/.test(password)) score++;
        else feedback.push('Lowercase letter');

        if (/[A-Z]/.test(password)) score++;
        else feedback.push('Uppercase letter');

        if (/[0-9]/.test(password)) score++;
        else feedback.push('Number');

        if (/[^A-Za-z0-9]/.test(password)) score++;
        else feedback.push('Special character');

        const strength = ['weak', 'weak', 'fair', 'good', 'strong'][score];
        return { strength, score, feedback };
    },

    // Show field error
    showFieldError: (fieldId, message) => {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');
        
        if (field) {
            field.classList.add('error');
        }
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'flex';
        }
    },

    // Clear field error
    clearFieldError: (fieldId) => {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');
        
        if (field) {
            field.classList.remove('error');
        }
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    },

    // Clear all errors
    clearAllErrors: (formId) => {
        const form = document.getElementById(formId);
        if (form) {
            const errorElements = form.querySelectorAll('.error-message');
            const fieldElements = form.querySelectorAll('.form-control.error');
            
            errorElements.forEach(el => {
                el.textContent = '';
                el.style.display = 'none';
            });
            
            fieldElements.forEach(el => {
                el.classList.remove('error');
            });
        }
    }
};

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    theme.init();

    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', theme.toggle);
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('JWT_TOKEN');
                window.location.href = '/';
            }
        });
    }

    // Close modal functionality
    const closeModalBtns = document.querySelectorAll('.modal-close');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = btn.closest('.modal');
            if (modal) {
                ui.hideModal(modal.id);
            }
        });
    });

    // Close modal on backdrop click
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                ui.hideModal(modal.id);
            }
        });
    });

    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Export utilities for use in other scripts
window.utils = utils;
window.api = api;
window.auth = auth;
window.ui = ui;
window.theme = theme;
window.validation = validation;