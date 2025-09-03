// Authentication Management
class AuthManager {
    constructor() {
        this.user = null;
        this.initialized = false;
        this.init();
    }

    async init() {
        try {
            // Wait for Firebase to be available
            let attempts = 0;
            while (!window.firebaseService && attempts < 20) {
                console.log('Waiting for Firebase service... attempt', attempts + 1);
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (window.firebaseService && window.firebaseService.isInitialized()) {
                this.firebase = window.firebaseService;
                this.setupAuthListener();
                this.initialized = true;
                console.log('Auth manager initialized successfully');
            } else {
                throw new Error('Firebase service not available');
            }
        } catch (error) {
            console.error('Auth manager initialization failed:', error);
            this.showError('Authentication system failed to initialize');
        }
    }

    setupAuthListener() {
        firebase.auth().onAuthStateChanged(user => {
            this.user = user;
            if (user) {
                console.log('User signed in:', user.email);
                this.redirectToCalendar();
            } else {
                console.log('User signed out');
                this.user = null;
            }
        });
    }

    async signIn(email, password) {
        if (!this.initialized) {
            throw new Error('Authentication not initialized');
        }

        try {
            this.showLoading(true);
            this.clearErrors();

            const result = await firebase.auth().signInWithEmailAndPassword(email, password);
            console.log('Sign in successful:', result.user.email);
            return result.user;
        } catch (error) {
            console.error('Sign in error:', error);
            this.handleAuthError(error);
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    async signOut() {
        try {
            await firebase.auth().signOut();
            console.log('User signed out successfully');
            this.redirectToLogin();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }

    getCurrentUser() {
        return this.user;
    }

    isAuthenticated() {
        return !!this.user;
    }

    redirectToCalendar() {
        window.location.href = 'index.html';
    }

    redirectToLogin() {
        window.location.href = 'login.html';
    }

    showLoading(show) {
        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn.querySelector('.btn-text');
        const btnSpinner = loginBtn.querySelector('.btn-spinner');

        if (show) {
            loginBtn.disabled = true;
            btnText.style.display = 'none';
            btnSpinner.style.display = 'flex';
        } else {
            loginBtn.disabled = false;
            btnText.style.display = 'block';
            btnSpinner.style.display = 'none';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('authError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    clearErrors() {
        document.getElementById('authError').style.display = 'none';
        document.getElementById('emailError').textContent = '';
        document.getElementById('passwordError').textContent = '';
        
        // Remove error styling
        document.getElementById('email').classList.remove('error');
        document.getElementById('password').classList.remove('error');
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    handleAuthError(error) {
        let message = 'An error occurred during authentication';
        
        switch (error.code) {
            case 'auth/user-not-found':
                message = 'No account found with this email address';
                this.showFieldError('email', 'Account not found');
                break;
            case 'auth/wrong-password':
                message = 'Incorrect password';
                this.showFieldError('password', 'Incorrect password');
                break;
            case 'auth/invalid-email':
                message = 'Invalid email address';
                this.showFieldError('email', 'Invalid email format');
                break;
            case 'auth/user-disabled':
                message = 'This account has been disabled';
                break;
            case 'auth/too-many-requests':
                message = 'Too many failed attempts. Please try again later';
                break;
            case 'auth/network-request-failed':
                message = 'Network error. Please check your internet connection';
                break;
            default:
                message = error.message || 'Authentication failed';
                break;
        }
        
        this.showError(message);
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');
        
        field.classList.add('error');
        errorElement.textContent = message;
    }

    validateForm(email, password) {
        let isValid = true;
        this.clearErrors();

        if (!email.trim()) {
            this.showFieldError('email', 'Email is required');
            isValid = false;
        } else if (!this.validateEmail(email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        }

        if (!password.trim()) {
            this.showFieldError('password', 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            this.showFieldError('password', 'Password must be at least 6 characters');
            isValid = false;
        }

        return isValid;
    }
}

// Initialize authentication manager
let authManager;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing authentication...');
    authManager = new AuthManager();

    // Set up form submission
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        // Validate form
        if (!authManager.validateForm(email, password)) {
            return;
        }

        try {
            await authManager.signIn(email, password);
            // Redirect will happen automatically through auth state listener
        } catch (error) {
            // Error handling is done in signIn method
        }
    });

    // Check if user is already signed in
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // User is already signed in, redirect to calendar
            authManager.redirectToCalendar();
        }
    });
});

// Make auth manager globally available
window.authManager = authManager;