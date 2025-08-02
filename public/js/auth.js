// Authentication JavaScript

// Initialize authentication page
function initAuthPage(pageType) {
    if (pageType === 'login') {
        initLoginPage();
    } else if (pageType === 'signup') {
        initSignupPage();
    }

    // Common initialization
    initPasswordToggle();
    initFormValidation(pageType);
}

// Initialize login page
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        validation.clearAllErrors('loginForm');
        ui.clearAlerts();

        // Get form data
        const formData = new FormData(loginForm);
        const email = formData.get('email');
        const password = formData.get('password');

        // Basic validation
        let hasErrors = false;

        if (!email) {
            validation.showFieldError('email', 'Email is required');
            hasErrors = true;
        } else if (!validation.isValidEmail(email)) {
            validation.showFieldError('email', 'Please enter a valid email address');
            hasErrors = true;
        }

        if (!password) {
            validation.showFieldError('password', 'Password is required');
            hasErrors = true;
        }

        if (hasErrors) return;

        // Show loading state
        submitBtn.disabled = true;
        submitText.textContent = 'Signing In...';
        submitSpinner.classList.remove('hidden');

        try {
            const response = await api.post('/api/auth/login', {
                email,
                password
            });

            ui.showAlert('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);

        } catch (error) {
            ui.showAlert(error.message || 'Login failed. Please try again.', 'error');
            
            // Shake animation for error
            ui.animate(loginForm, 'shake', 500);
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitText.textContent = 'Sign In';
            submitSpinner.classList.add('hidden');
        }
    });

    // Forgot password handler
    const forgotPasswordLink = document.getElementById('forgotPassword');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            ui.showAlert('Password reset functionality will be available soon.', 'info');
        });
    }
}

// Initialize signup page
function initSignupPage() {
    const signupForm = document.getElementById('signupForm');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirmPassword');

    // Password strength indicator
    if (passwordField) {
        passwordField.addEventListener('input', updatePasswordStrength);
    }

    // Real-time password confirmation validation
    if (confirmPasswordField) {
        confirmPasswordField.addEventListener('input', validatePasswordConfirmation);
    }

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        validation.clearAllErrors('signupForm');
        ui.clearAlerts();

        // Get form data
        const formData = new FormData(signupForm);
        const firstName = formData.get('firstName').trim();
        const lastName = formData.get('lastName').trim();
        const email = formData.get('email').trim();
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const agreeTerms = formData.get('agreeTerms');

        // Validation
        let hasErrors = false;

        if (!firstName) {
            validation.showFieldError('firstName', 'First name is required');
            hasErrors = true;
        }

        if (!lastName) {
            validation.showFieldError('lastName', 'Last name is required');
            hasErrors = true;
        }

        if (!email) {
            validation.showFieldError('email', 'Email is required');
            hasErrors = true;
        } else if (!validation.isValidEmail(email)) {
            validation.showFieldError('email', 'Please enter a valid email address');
            hasErrors = true;
        }

        if (!password) {
            validation.showFieldError('password', 'Password is required');
            hasErrors = true;
        } else {
            const strength = validation.getPasswordStrength(password);
            if (strength.score < 3) {
                validation.showFieldError('password', 'Password is too weak. Please choose a stronger password.');
                hasErrors = true;
            }
        }

        if (!confirmPassword) {
            validation.showFieldError('confirmPassword', 'Please confirm your password');
            hasErrors = true;
        } else if (password !== confirmPassword) {
            validation.showFieldError('confirmPassword', 'Passwords do not match');
            hasErrors = true;
        }

        if (!agreeTerms) {
            ui.showAlert('Please agree to the Terms of Service and Privacy Policy', 'error');
            hasErrors = true;
        }

        if (hasErrors) return;

        // Show loading state
        submitBtn.disabled = true;
        submitText.textContent = 'Creating Account...';
        submitSpinner.classList.remove('hidden');

        try {
            const response = await api.post('/api/auth/signup', {
                firstName,
                lastName,
                email,
                password,
                confirmPassword
            });

            ui.showAlert('Account created successfully! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);

        } catch (error) {
            ui.showAlert(error.message || 'Registration failed. Please try again.', 'error');
            
            // Shake animation for error
            ui.animate(signupForm, 'shake', 500);
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitText.textContent = 'Create Account';
            submitSpinner.classList.add('hidden');
        }
    });
}

// Initialize password toggle functionality
function initPasswordToggle() {
    const toggleButtons = document.querySelectorAll('.password-toggle');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const passwordField = button.parentElement.querySelector('input[type="password"], input[type="text"]');
            const icon = button.querySelector('span');
            
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                icon.textContent = '🙈';
            } else {
                passwordField.type = 'password';
                icon.textContent = '👁️';
            }
        });
    });
}

// Initialize form validation
function initFormValidation(pageType) {
    const form = document.getElementById(pageType + 'Form');
    if (!form) return;

    // Real-time validation for email
    const emailField = document.getElementById('email');
    if (emailField) {
        emailField.addEventListener('blur', () => {
            const email = emailField.value.trim();
            validation.clearFieldError('email');
            
            if (email && !validation.isValidEmail(email)) {
                validation.showFieldError('email', 'Please enter a valid email address');
            }
        });

        emailField.addEventListener('input', () => {
            if (emailField.classList.contains('error')) {
                validation.clearFieldError('email');
            }
        });
    }

    // Real-time validation for other fields
    const requiredFields = form.querySelectorAll('input[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', () => {
            if (!field.value.trim()) {
                const fieldName = field.name.charAt(0).toUpperCase() + field.name.slice(1);
                validation.showFieldError(field.id, `${fieldName} is required`);
            }
        });

        field.addEventListener('input', () => {
            if (field.classList.contains('error')) {
                validation.clearFieldError(field.id);
            }
        });
    });
}

// Update password strength indicator
function updatePasswordStrength() {
    const passwordField = document.getElementById('password');
    const strengthFill = document.getElementById('strengthFill');
    
    if (!passwordField || !strengthFill) return;

    const password = passwordField.value;
    const strength = validation.getPasswordStrength(password);
    
    strengthFill.className = `password-strength-fill ${strength.strength}`;
    
    // Update width based on strength
    const widths = { weak: '25%', fair: '50%', good: '75%', strong: '100%' };
    strengthFill.style.width = widths[strength.strength] || '0%';
}

// Validate password confirmation
function validatePasswordConfirmation() {
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirmPassword');
    
    if (!passwordField || !confirmPasswordField) return;

    const password = passwordField.value;
    const confirmPassword = confirmPasswordField.value;
    
    validation.clearFieldError('confirmPassword');
    
    if (confirmPassword && password !== confirmPassword) {
        validation.showFieldError('confirmPassword', 'Passwords do not match');
    }
}

// Check if user is already authenticated on auth pages
document.addEventListener('DOMContentLoaded', async () => {
    // Only check on auth pages
    if (window.location.pathname === '/login' || window.location.pathname === '/signup') {
        const isAuthenticated = await auth.isAuthenticated();
        if (isAuthenticated) {
            window.location.href = '/dashboard';
        }
    }
});