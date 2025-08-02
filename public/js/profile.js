// Profile page JavaScript

let currentUser = null;

// Initialize profile page
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const isAuthenticated = await auth.requireAuth();
    if (!isAuthenticated) return;

    // Load user profile
    await loadUserProfile();
    
    // Initialize event listeners
    initializeEventListeners();
});

// Load user profile
async function loadUserProfile() {
    try {
        const [user, profile] = await Promise.all([
            auth.getCurrentUser(),
            api.get('/api/user/profile')
        ]);
        
        currentUser = profile;
        populateProfileForm(profile);
        updateGreeting(user);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        ui.showAlert('Failed to load profile data', 'error');
    }
}

// Update greeting
function updateGreeting(user) {
    const greeting = document.getElementById('userGreeting');
    if (greeting && user) {
        greeting.textContent = `Welcome, ${user.firstName}!`;
    }
}

// Populate profile form
function populateProfileForm(profile) {
    document.getElementById('firstName').value = profile.firstName || '';
    document.getElementById('lastName').value = profile.lastName || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('dateOfBirth').value = profile.dateOfBirth || '';
    document.getElementById('address').value = profile.address || '';
    
    // Update account info
    document.getElementById('memberSince').textContent = utils.formatDate(profile.createdAt);
    document.getElementById('accountEmail').textContent = profile.email;
}

// Initialize event listeners
function initializeEventListeners() {
    // Profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Password form submission
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }

    // Cancel buttons
    const cancelButtons = document.querySelectorAll('[data-action="cancel"]');
    cancelButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (btn.closest('#profileForm')) {
                populateProfileForm(currentUser);
            } else if (btn.closest('#passwordForm')) {
                document.getElementById('passwordForm').reset();
            }
        });
    });

    // Real-time validation
    setupFormValidation();
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> Updating...';
    
    const formData = new FormData(e.target);
    const profileData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phone: formData.get('phone'),
        dateOfBirth: formData.get('dateOfBirth'),
        address: formData.get('address')
    };

    try {
        const updatedProfile = await api.put('/api/user/profile', profileData);
        currentUser = updatedProfile;
        
        ui.showAlert('Profile updated successfully!', 'success');
        
        // Update greeting in navigation
        const navGreeting = document.getElementById('userGreeting');
        if (navGreeting) {
            navGreeting.textContent = `Welcome, ${updatedProfile.firstName}!`;
        }
        
    } catch (error) {
        ui.showAlert(error.message || 'Failed to update profile', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Handle password change
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Clear previous errors
    validation.clearAllErrors('passwordForm');
    
    const formData = new FormData(e.target);
    const passwordData = {
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword'),
        confirmPassword: formData.get('confirmPassword')
    };

    // Validation
    let hasErrors = false;

    if (!passwordData.currentPassword) {
        validation.showFieldError('currentPassword', 'Current password is required');
        hasErrors = true;
    }

    if (!passwordData.newPassword) {
        validation.showFieldError('newPassword', 'New password is required');
        hasErrors = true;
    } else {
        const strength = validation.getPasswordStrength(passwordData.newPassword);
        if (strength.score < 3) {
            validation.showFieldError('newPassword', 'New password is too weak');
            hasErrors = true;
        }
    }

    if (!passwordData.confirmPassword) {
        validation.showFieldError('confirmPassword', 'Please confirm your new password');
        hasErrors = true;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
        validation.showFieldError('confirmPassword', 'Passwords do not match');
        hasErrors = true;
    }

    if (hasErrors) return;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> Changing Password...';

    try {
        await api.put('/api/user/password', passwordData);
        
        ui.showAlert('Password changed successfully!', 'success');
        e.target.reset();
        
    } catch (error) {
        ui.showAlert(error.message || 'Failed to change password', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Setup form validation
function setupFormValidation() {
    // Email validation (read-only, but good to show it's validated)
    const emailField = document.getElementById('email');
    if (emailField) {
        emailField.addEventListener('blur', () => {
            const email = emailField.value.trim();
            if (email && !validation.isValidEmail(email)) {
                validation.showFieldError('email', 'Please enter a valid email address');
            } else {
                validation.clearFieldError('email');
            }
        });
    }

    // Phone validation
    const phoneField = document.getElementById('phone');
    if (phoneField) {
        phoneField.addEventListener('blur', () => {
            const phone = phoneField.value.trim();
            if (phone && !/^[+]?[\d\s\-\(\)]+$/.test(phone)) {
                validation.showFieldError('phone', 'Please enter a valid phone number');
            } else {
                validation.clearFieldError('phone');
            }
        });
    }

    // Date of birth validation
    const dobField = document.getElementById('dateOfBirth');
    if (dobField) {
        dobField.addEventListener('blur', () => {
            const dob = dobField.value;
            if (dob) {
                const birthDate = new Date(dob);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                
                if (age < 13 || age > 120) {
                    validation.showFieldError('dateOfBirth', 'Please enter a valid date of birth');
                } else {
                    validation.clearFieldError('dateOfBirth');
                }
            }
        });
    }

    // Password strength indicator for new password
    const newPasswordField = document.getElementById('newPassword');
    if (newPasswordField) {
        newPasswordField.addEventListener('input', () => {
            const password = newPasswordField.value;
            if (password) {
                const strength = validation.getPasswordStrength(password);
                updatePasswordStrengthIndicator(strength);
            } else {
                clearPasswordStrengthIndicator();
            }
        });
    }

    // Confirm password validation
    const confirmPasswordField = document.getElementById('confirmPassword');
    if (confirmPasswordField) {
        confirmPasswordField.addEventListener('input', () => {
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = confirmPasswordField.value;
            
            validation.clearFieldError('confirmPassword');
            
            if (confirmPassword && newPassword !== confirmPassword) {
                validation.showFieldError('confirmPassword', 'Passwords do not match');
            }
        });
    }
}

// Update password strength indicator
function updatePasswordStrengthIndicator(strength) {
    const indicator = document.getElementById('passwordStrengthIndicator');
    if (!indicator) return;

    const strengthBar = indicator.querySelector('.password-strength-fill');
    const strengthText = indicator.querySelector('.password-strength-text');
    
    if (strengthBar) {
        strengthBar.className = `password-strength-fill ${strength.strength}`;
        const widths = { weak: '25%', fair: '50%', good: '75%', strong: '100%' };
        strengthBar.style.width = widths[strength.strength] || '0%';
    }
    
    if (strengthText) {
        strengthText.textContent = strength.strength.charAt(0).toUpperCase() + strength.strength.slice(1);
        strengthText.className = `password-strength-text ${strength.strength}`;
    }
    
    indicator.style.display = 'block';
}

// Clear password strength indicator
function clearPasswordStrengthIndicator() {
    const indicator = document.getElementById('passwordStrengthIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}