// Authentication Module
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = null;
        this.warningTimeout = null;
        this.attemptCount = 0;
        this.lockoutTime = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.checkExistingSession();
        this.setupSessionManagement();
    }
    
    bindEvents() {
        const pinForm = document.getElementById('pin-form');
        const togglePin = document.getElementById('toggle-pin');
        const logoutBtn = document.getElementById('logout-btn');
        const adminLogout = document.getElementById('admin-logout');
        
        if (pinForm) {
            pinForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (togglePin) {
            togglePin.addEventListener('click', () => this.togglePinVisibility());
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        if (adminLogout) {
            adminLogout.addEventListener('click', () => this.logout());
        }
        
        // Handle session warnings
        document.addEventListener('sessionWarning', () => this.showSessionWarning());
        document.addEventListener('sessionExpired', () => this.handleSessionExpiry());
    }
    
    async handleLogin(event) {
        event.preventDefault();
        
        // Check if locked out
        if (this.isLockedOut()) {
            this.showError('Too many failed attempts. Please try again later.');
            return;
        }
        
        const pinInput = document.getElementById('pin-input');
        const pin = pinInput.value.trim();
        
        if (!pin) {
            this.showError('Please enter a PIN');
            return;
        }
        
        this.showLoading('Authenticating...');
        
        try {
            // Simulate authentication delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const result = await this.validatePin(pin);
            
            if (result.success) {
                this.attemptCount = 0;
                this.lockoutTime = null;
                await this.createSession(result.userType, pin);
                this.redirectToDashboard(result.userType);
                this.showSuccess(CONFIG.SUCCESS.LOGIN);
            } else {
                this.handleFailedAttempt();
                this.showError(CONFIG.ERRORS.INVALID_PIN);
            }
        } catch (error) {
            console.error('Authentication error:', error);
            this.showError(CONFIG.ERRORS.NETWORK_ERROR);
        } finally {
            this.hideLoading();
        }
    }
    
    async validatePin(pin) {
        // In a real implementation, this would validate against a secure backend
        if (pin === CONFIG.PINS.STUDENT) {
            return { success: true, userType: 'student' };
        } else if (pin === CONFIG.PINS.ADMIN) {
            return { success: true, userType: 'admin' };
        }
        
        return { success: false };
    }
    
    async createSession(userType, pin) {
        const sessionData = {
            userType,
            loginTime: Date.now(),
            lastActivity: Date.now(),
            sessionId: this.generateSessionId(),
            // Don't store the actual PIN for security
            pinHash: await this.hashPin(pin)
        };
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
        this.currentUser = sessionData;
        
        // Start session timeout
        this.startSessionTimeout();
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async hashPin(pin) {
        // Simple hash for demo - use proper hashing in production
        const encoder = new TextEncoder();
        const data = encoder.encode(pin + 'salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    redirectToDashboard(userType) {
        const pinAuth = document.getElementById('pin-auth');
        const studentDashboard = document.getElementById('student-dashboard');
        const adminPanel = document.getElementById('admin-panel');
        
        pinAuth.style.display = 'none';
        
        if (userType === 'student') {
            studentDashboard.style.display = 'flex';
            adminPanel.style.display = 'none';
        } else if (userType === 'admin') {
            adminPanel.style.display = 'block';
            studentDashboard.style.display = 'none';
        }
        
        // Initialize dashboard
        if (window.DashboardManager) {
            window.DashboardManager.init();
        }
    }
    
    handleFailedAttempt() {
        this.attemptCount++;
        
        if (this.attemptCount >= CONFIG.SESSION.MAX_ATTEMPTS) {
            this.lockoutTime = Date.now() + CONFIG.SESSION.LOCKOUT_TIME;
            localStorage.setItem('lockout_time', this.lockoutTime.toString());
        }
    }
    
    isLockedOut() {
        if (!this.lockoutTime) {
            const stored = localStorage.getItem('lockout_time');
            this.lockoutTime = stored ? parseInt(stored) : null;
        }
        
        if (this.lockoutTime && Date.now() < this.lockoutTime) {
            return true;
        }
        
        if (this.lockoutTime && Date.now() >= this.lockoutTime) {
            this.lockoutTime = null;
            localStorage.removeItem('lockout_time');
            this.attemptCount = 0;
        }
        
        return false;
    }
    
    checkExistingSession() {
        const sessionData = localStorage.getItem(CONFIG.STORAGE_KEYS.SESSION);
        
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const now = Date.now();
                
                // Check if session is still valid
                if (now - session.lastActivity < CONFIG.SESSION.TIMEOUT) {
                    this.currentUser = session;
                    this.updateLastActivity();
                    this.redirectToDashboard(session.userType);
                    this.startSessionTimeout();
                    return;
                }
            } catch (error) {
                console.error('Invalid session data:', error);
            }
        }
        
        // No valid session, show login
        this.showLogin();
    }
    
    showLogin() {
        const pinAuth = document.getElementById('pin-auth');
        const studentDashboard = document.getElementById('student-dashboard');
        const adminPanel = document.getElementById('admin-panel');
        
        pinAuth.style.display = 'flex';
        studentDashboard.style.display = 'none';
        adminPanel.style.display = 'none';
    }
    
    setupSessionManagement() {
        // Update activity on user interaction
        const events = ['click', 'keypress', 'scroll', 'mousemove'];
        const throttledUpdate = ConfigUtils.throttle(() => this.updateLastActivity(), 30000);
        
        events.forEach(event => {
            document.addEventListener(event, throttledUpdate, { passive: true });
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.checkSessionValidity();
            }
        });
    }
    
    updateLastActivity() {
        if (this.currentUser) {
            this.currentUser.lastActivity = Date.now();
            localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION, JSON.stringify(this.currentUser));
        }
    }
    
    startSessionTimeout() {
        this.clearTimeouts();
        
        // Warning timeout
        this.warningTimeout = setTimeout(() => {
            document.dispatchEvent(new CustomEvent('sessionWarning'));
        }, CONFIG.SESSION.TIMEOUT - CONFIG.SESSION.WARNING_TIME);
        
        // Session expiry timeout
        this.sessionTimeout = setTimeout(() => {
            document.dispatchEvent(new CustomEvent('sessionExpired'));
        }, CONFIG.SESSION.TIMEOUT);
    }
    
    clearTimeouts() {
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
            this.sessionTimeout = null;
        }
        
        if (this.warningTimeout) {
            clearTimeout(this.warningTimeout);
            this.warningTimeout = null;
        }
    }
    
    checkSessionValidity() {
        if (!this.currentUser) return;
        
        const now = Date.now();
        const timeSinceActivity = now - this.currentUser.lastActivity;
        
        if (timeSinceActivity >= CONFIG.SESSION.TIMEOUT) {
            this.handleSessionExpiry();
        } else {
            // Restart timeout with remaining time
            const remainingTime = CONFIG.SESSION.TIMEOUT - timeSinceActivity;
            this.clearTimeouts();
            
            if (remainingTime > CONFIG.SESSION.WARNING_TIME) {
                this.warningTimeout = setTimeout(() => {
                    document.dispatchEvent(new CustomEvent('sessionWarning'));
                }, remainingTime - CONFIG.SESSION.WARNING_TIME);
            }
            
            this.sessionTimeout = setTimeout(() => {
                document.dispatchEvent(new CustomEvent('sessionExpired'));
            }, remainingTime);
        }
    }
    
    showSessionWarning() {
        if (window.NotificationManager) {
            window.NotificationManager.show(
                'Session expiring soon. Your session will expire in 5 minutes.',
                'warning',
                10000
            );
        }
    }
    
    handleSessionExpiry() {
        this.logout();
        this.showError(CONFIG.ERRORS.SESSION_EXPIRED);
    }
    
    logout() {
        this.clearTimeouts();
        this.currentUser = null;
        localStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION);
        
        // Clear sensitive data
        this.clearSensitiveData();
        
        // Redirect to login
        this.showLogin();
        
        // Clear form
        const pinInput = document.getElementById('pin-input');
        if (pinInput) {
            pinInput.value = '';
        }
        
        if (window.NotificationManager) {
            window.NotificationManager.show('Logged out successfully', 'success');
        }
    }
    
    clearSensitiveData() {
        // Clear any sensitive cached data
        const keysToKeep = [
            CONFIG.STORAGE_KEYS.SETTINGS,
            CONFIG.STORAGE_KEYS.ACHIEVEMENTS
        ];
        
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('cbse_ai_') && !keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });
    }
    
    togglePinVisibility() {
        const pinInput = document.getElementById('pin-input');
        const toggleBtn = document.getElementById('toggle-pin');
        const icon = toggleBtn.querySelector('i');
        
        if (pinInput.type === 'password') {
            pinInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            pinInput.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }
    
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        const text = document.getElementById('loading-text');
        
        if (overlay && text) {
            text.textContent = message;
            overlay.style.display = 'flex';
        }
    }
    
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    showError(message) {
        const errorDiv = document.getElementById('auth-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
        
        if (window.NotificationManager) {
            window.NotificationManager.show(message, 'error');
        }
    }
    
    showSuccess(message) {
        if (window.NotificationManager) {
            window.NotificationManager.show(message, 'success');
        }
    }
    
    // Public methods
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    getUserType() {
        return this.currentUser ? this.currentUser.userType : null;
    }
    
    extendSession() {
        if (this.currentUser) {
            this.updateLastActivity();
            this.startSessionTimeout();
        }
    }
    
    // Security methods
    validateSecureContext() {
        // Check if running in secure context (HTTPS)
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            console.warn('Application should be served over HTTPS for security');
        }
    }
    
    // Rate limiting for authentication attempts
    canAttemptLogin() {
        const key = 'auth_attempts';
        const data = JSON.parse(localStorage.getItem(key) || '{"count": 0, "timestamp": 0}');
        const now = Date.now();
        const hourAgo = now - (60 * 60 * 1000);
        
        if (data.timestamp < hourAgo) {
            data.count = 0;
            data.timestamp = now;
        }
        
        if (data.count >= 10) { // Max 10 attempts per hour
            return false;
        }
        
        data.count++;
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    }
}

// Initialize authentication manager
window.AuthManager = new AuthManager();