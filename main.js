// Main Application Controller
class DashboardManager {
    constructor() {
        this.currentSection = 'home';
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        this.bindEvents();
        this.setupLanguageToggle();
        this.setupResponsiveHandling();
        this.setupAccessibility();
        this.setupPerformanceMonitoring();
        
        this.isInitialized = true;
    }
    
    bindEvents() {
        // Navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                if (section) {
                    this.navigateToSection(section);
                }
            });
        });
        
        // Feature cards navigation
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.addEventListener('click', () => {
                const feature = card.dataset.feature;
                if (feature) {
                    this.navigateToSection(feature);
                }
            });
        });
        
        // Language toggle
        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => this.toggleLanguage());
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Window events
        window.addEventListener('resize', ConfigUtils.debounce(() => {
            this.handleResize();
        }, 250));
        
        window.addEventListener('beforeunload', (e) => {
            this.handleBeforeUnload(e);
        });
        
        // Online/offline status
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
    }
    
    navigateToSection(sectionName) {
        // Update navigation state
        this.currentSection = sectionName;
        
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionName);
        });
        
        // Show/hide sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.toggle('active', section.id === `${sectionName}-section`);
        });
        
        // Update URL without page reload
        const url = new URL(window.location);
        url.searchParams.set('section', sectionName);
        window.history.pushState({ section: sectionName }, '', url);
        
        // Initialize section-specific functionality
        this.initializeSection(sectionName);
        
        // Announce navigation to screen readers
        Utils.announceToScreenReader(`Navigated to ${sectionName} section`);
        
        // Track navigation
        this.trackNavigation(sectionName);
    }
    
    initializeSection(sectionName) {
        switch (sectionName) {
            case 'home':
                this.initializeHomeSection();
                break;
            case 'doubt-solver':
                this.initializeDoubtSolverSection();
                break;
            case 'homework':
                this.initializeHomeworkSection();
                break;
            case 'notes':
                this.initializeNotesSection();
                break;
            case 'tests':
                this.initializeTestsSection();
                break;
            case 'progress':
                this.initializeProgressSection();
                break;
        }
    }
    
    initializeHomeSection() {
        // Update recent activity
        this.updateRecentActivity();
        
        // Update quick stats
        this.updateQuickStats();
        
        // Check for daily achievements
        this.checkDailyAchievements();
    }
    
    initializeDoubtSolverSection() {
        // Initialize doubt solver if not already done
        if (window.DoubtSolver) {
            // Reset to default state
            window.DoubtSolver.switchMethod('text');
        }
    }
    
    initializeHomeworkSection() {
        // Initialize homework assistant
        if (window.HomeworkAssistant) {
            window.HomeworkAssistant.switchMethod('camera');
        }
    }
    
    initializeNotesSection() {
        // Refresh notes display
        if (window.SmartNotes) {
            window.SmartNotes.updateNotesDisplay();
        }
    }
    
    initializeTestsSection() {
        // Update test history
        if (window.TestManager) {
            window.TestManager.updateHistoryDisplay();
        }
    }
    
    initializeProgressSection() {
        // Update progress displays
        if (window.ProgressManager) {
            window.ProgressManager.updateProgressDisplay();
        }
    }
    
    updateRecentActivity() {
        // Get recent activities from various sources
        const activities = [];
        
        // Recent questions
        const questionStats = Utils.getStorage('question_stats', {});
        if (questionStats.lastSolved) {
            activities.push({
                type: 'question',
                description: 'Solved doubt in Mathematics - Quadratic Equations',
                timestamp: questionStats.lastSolved,
                icon: 'fas fa-question-circle'
            });
        }
        
        // Recent tests
        const testHistory = Utils.getStorage(CONFIG.STORAGE_KEYS.TEST_HISTORY, []);
        if (testHistory.length > 0) {
            const lastTest = testHistory[0];
            activities.push({
                type: 'test',
                description: `Completed ${lastTest.title}`,
                timestamp: lastTest.completedAt,
                icon: 'fas fa-clipboard-check'
            });
        }
        
        // Recent notes
        const notes = Utils.getStorage(CONFIG.STORAGE_KEYS.NOTES, []);
        if (notes.length > 0) {
            const lastNote = notes[0];
            activities.push({
                type: 'note',
                description: `Generated notes for ${lastNote.title}`,
                timestamp: lastNote.updatedAt,
                icon: 'fas fa-brain'
            });
        }
        
        // Sort by timestamp and display
        activities.sort((a, b) => b.timestamp - a.timestamp);
        this.displayRecentActivity(activities.slice(0, 3));
    }
    
    displayRecentActivity(activities) {
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;
        
        if (activities.length === 0) {
            activityList.innerHTML = `
                <div class="empty-activity">
                    <p>No recent activity. Start learning to see your progress here!</p>
                </div>
            `;
            return;
        }
        
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <i class="${activity.icon}"></i>
                <div class="activity-content">
                    <p>${activity.description}</p>
                    <span class="activity-time">${Utils.getTimeAgo(activity.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }
    
    updateQuickStats() {
        const progress = Utils.getStorage(CONFIG.STORAGE_KEYS.USER_PROGRESS, {});
        
        // Update streak
        const streakNumber = document.querySelector('.stat-number');
        if (streakNumber && progress.overall) {
            streakNumber.textContent = progress.overall.loginStreak || 0;
        }
        
        // Update points
        const pointsElements = document.querySelectorAll('.stat-number');
        if (pointsElements.length > 1 && progress.overall) {
            pointsElements[1].textContent = ConfigUtils.formatPoints(progress.overall.totalPoints || 0);
        }
        
        // Update average
        if (pointsElements.length > 2 && progress.overall) {
            pointsElements[2].textContent = `${progress.overall.averageScore || 0}%`;
        }
    }
    
    checkDailyAchievements() {
        // Check if user should be congratulated for daily goals
        const progress = Utils.getStorage(CONFIG.STORAGE_KEYS.USER_PROGRESS, {});
        const today = new Date().toDateString();
        
        if (progress.daily && progress.daily.date === today) {
            const { questionsToday, timeToday, pointsToday } = progress.daily;
            
            // Daily goals
            const goals = {
                questions: 10,
                time: 1800, // 30 minutes
                points: 100
            };
            
            // Check and show congratulations
            if (questionsToday >= goals.questions && !this.hasShownDailyGoal('questions')) {
                this.showDailyGoalAchievement('Questions', questionsToday, goals.questions);
                this.markDailyGoalShown('questions');
            }
            
            if (timeToday >= goals.time && !this.hasShownDailyGoal('time')) {
                this.showDailyGoalAchievement('Study Time', Utils.formatDuration(timeToday), Utils.formatDuration(goals.time));
                this.markDailyGoalShown('time');
            }
            
            if (pointsToday >= goals.points && !this.hasShownDailyGoal('points')) {
                this.showDailyGoalAchievement('Points', pointsToday, goals.points);
                this.markDailyGoalShown('points');
            }
        }
    }
    
    hasShownDailyGoal(type) {
        const shown = Utils.getStorage('daily_goals_shown', {});
        const today = new Date().toDateString();
        return shown[today] && shown[today].includes(type);
    }
    
    markDailyGoalShown(type) {
        const shown = Utils.getStorage('daily_goals_shown', {});
        const today = new Date().toDateString();
        
        if (!shown[today]) shown[today] = [];
        shown[today].push(type);
        
        Utils.setStorage('daily_goals_shown', shown);
    }
    
    showDailyGoalAchievement(type, achieved, goal) {
        if (window.NotificationManager) {
            window.NotificationManager.show(
                `🎯 Daily Goal Achieved! ${type}: ${achieved}/${goal}`,
                'success',
                5000
            );
        }
    }
    
    setupLanguageToggle() {
        this.currentLanguage = ConfigUtils.getCurrentLanguage();
        this.updateLanguageDisplay();
    }
    
    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'EN' ? 'HI' : 'EN';
        ConfigUtils.saveUserSettings({ language: this.currentLanguage });
        this.updateLanguageDisplay();
        this.updateUILanguage();
    }
    
    updateLanguageDisplay() {
        const langBtn = document.querySelector('.lang-btn span');
        if (langBtn) {
            langBtn.textContent = this.currentLanguage;
        }
    }
    
    updateUILanguage() {
        // Update UI text based on selected language
        // This would typically load from a translations file
        if (this.currentLanguage === 'HI') {
            this.applyHindiTranslations();
        } else {
            this.applyEnglishTranslations();
        }
    }
    
    applyHindiTranslations() {
        // Apply Hindi translations to UI elements
        const translations = {
            'Home': 'होम',
            'Doubt Solver': 'संदेह समाधान',
            'Homework': 'गृहकार्य',
            'Smart Notes': 'स्मार्ट नोट्स',
            'Tests': 'परीक्षा',
            'Progress': 'प्रगति'
        };
        
        // Apply translations to navigation
        document.querySelectorAll('.nav-item span').forEach(span => {
            const english = span.textContent.trim();
            if (translations[english]) {
                span.textContent = translations[english];
            }
        });
    }
    
    applyEnglishTranslations() {
        // Reset to English text
        const navItems = [
            { selector: '[data-section="home"] span', text: 'Home' },
            { selector: '[data-section="doubt-solver"] span', text: 'Doubt Solver' },
            { selector: '[data-section="homework"] span', text: 'Homework' },
            { selector: '[data-section="notes"] span', text: 'Smart Notes' },
            { selector: '[data-section="tests"] span', text: 'Tests' },
            { selector: '[data-section="progress"] span', text: 'Progress' }
        ];
        
        navItems.forEach(item => {
            const element = document.querySelector(item.selector);
            if (element) element.textContent = item.text;
        });
    }
    
    setupResponsiveHandling() {
        // Handle responsive behavior
        this.handleResize();
        
        // Setup mobile navigation if needed
        if (ConfigUtils.isMobile()) {
            this.setupMobileNavigation();
        }
    }
    
    setupMobileNavigation() {
        // Add mobile-specific navigation behavior
        const header = document.querySelector('.dashboard-header');
        if (header) {
            header.classList.add('mobile-header');
        }
        
        // Create mobile menu toggle if needed
        this.createMobileMenuToggle();
    }
    
    createMobileMenuToggle() {
        const headerLeft = document.querySelector('.header-left');
        if (!headerLeft) return;
        
        const menuToggle = Utils.createElement('button', 'mobile-menu-toggle');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        menuToggle.addEventListener('click', () => this.toggleMobileMenu());
        
        headerLeft.appendChild(menuToggle);
    }
    
    toggleMobileMenu() {
        const mainNav = document.querySelector('.main-nav');
        if (mainNav) {
            mainNav.classList.toggle('mobile-open');
        }
    }
    
    handleResize() {
        // Handle window resize events
        const isMobile = ConfigUtils.isMobile();
        const isTablet = ConfigUtils.isTablet();
        
        // Update layout classes
        document.body.classList.toggle('mobile', isMobile);
        document.body.classList.toggle('tablet', isTablet);
        document.body.classList.toggle('desktop', ConfigUtils.isDesktop());
        
        // Adjust grid layouts
        this.adjustGridLayouts();
    }
    
    adjustGridLayouts() {
        // Adjust grid layouts based on screen size
        const grids = document.querySelectorAll('.dashboard-grid, .notes-grid, .test-categories');
        
        grids.forEach(grid => {
            if (ConfigUtils.isMobile()) {
                grid.style.gridTemplateColumns = '1fr';
            } else if (ConfigUtils.isTablet()) {
                grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            } else {
                grid.style.gridTemplateColumns = ''; // Reset to CSS default
            }
        });
    }
    
    setupAccessibility() {
        // Setup accessibility features
        this.setupKeyboardNavigation();
        this.setupScreenReaderSupport();
        this.setupHighContrastMode();
        this.setupReducedMotion();
    }
    
    setupKeyboardNavigation() {
        // Ensure all interactive elements are keyboard accessible
        const interactiveElements = document.querySelectorAll(
            'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        interactiveElements.forEach(element => {
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
        });
    }
    
    setupScreenReaderSupport() {
        // Add ARIA labels and descriptions
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const section = item.dataset.section;
            item.setAttribute('aria-label', `Navigate to ${section} section`);
        });
        
        // Add live regions for dynamic content
        const liveRegion = Utils.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.position = 'absolute';
        liveRegion.style.left = '-10000px';
        liveRegion.id = 'live-region';
        
        document.body.appendChild(liveRegion);
    }
    
    setupHighContrastMode() {
        // Detect high contrast preference
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
        }
        
        // Listen for changes
        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            document.body.classList.toggle('high-contrast', e.matches);
        });
    }
    
    setupReducedMotion() {
        // Detect reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
        }
        
        // Listen for changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            document.body.classList.toggle('reduced-motion', e.matches);
        });
    }
    
    setupPerformanceMonitoring() {
        // Monitor performance metrics
        this.startPerformanceMonitoring();
        
        // Setup error tracking
        this.setupErrorTracking();
    }
    
    startPerformanceMonitoring() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                
                const metrics = {
                    loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                    firstPaint: this.getFirstPaint(),
                    timestamp: Date.now()
                };
                
                this.logPerformanceMetrics(metrics);
            }, 0);
        });
    }
    
    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : 0;
    }
    
    logPerformanceMetrics(metrics) {
        // Log performance metrics for analysis
        const perfHistory = Utils.getStorage('performance_history', []);
        perfHistory.push(metrics);
        
        // Keep only last 10 entries
        if (perfHistory.length > 10) {
            perfHistory.splice(0, perfHistory.length - 10);
        }
        
        Utils.setStorage('performance_history', perfHistory);
        
        // Log slow performance
        if (metrics.loadTime > 3000) {
            console.warn('Slow page load detected:', metrics);
        }
    }
    
    setupErrorTracking() {
        // Global error handler
        window.addEventListener('error', (e) => {
            this.logError({
                type: 'javascript',
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                stack: e.error?.stack,
                timestamp: Date.now()
            });
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            this.logError({
                type: 'promise',
                message: e.reason?.message || 'Unhandled promise rejection',
                stack: e.reason?.stack,
                timestamp: Date.now()
            });
        });
    }
    
    logError(error) {
        // Log errors for debugging
        const errorHistory = Utils.getStorage('error_history', []);
        errorHistory.push(error);
        
        // Keep only last 20 errors
        if (errorHistory.length > 20) {
            errorHistory.splice(0, errorHistory.length - 20);
        }
        
        Utils.setStorage('error_history', errorHistory);
        
        console.error('Application error:', error);
    }
    
    handleKeyboardShortcuts(e) {
        // Handle global keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.navigateToSection('home');
                    break;
                case '2':
                    e.preventDefault();
                    this.navigateToSection('doubt-solver');
                    break;
                case '3':
                    e.preventDefault();
                    this.navigateToSection('homework');
                    break;
                case '4':
                    e.preventDefault();
                    this.navigateToSection('notes');
                    break;
                case '5':
                    e.preventDefault();
                    this.navigateToSection('tests');
                    break;
                case '6':
                    e.preventDefault();
                    this.navigateToSection('progress');
                    break;
                case 'l':
                    e.preventDefault();
                    this.toggleLanguage();
                    break;
            }
        }
        
        // Escape key to close modals
        if (e.key === 'Escape') {
            const modal = document.querySelector('.modal-overlay');
            if (modal) {
                modal.remove();
            }
        }
    }
    
    handleBeforeUnload(e) {
        // Warn user if they have unsaved work
        if (this.hasUnsavedWork()) {
            e.preventDefault();
            e.returnValue = 'You have unsaved work. Are you sure you want to leave?';
            return e.returnValue;
        }
    }
    
    hasUnsavedWork() {
        // Check if user has unsaved work
        const questionText = document.getElementById('question-text');
        const homeworkText = document.querySelector('#homework-text-input textarea');
        
        return (questionText && questionText.value.trim()) ||
               (homeworkText && homeworkText.value.trim()) ||
               (window.TestManager && window.TestManager.currentTest);
    }
    
    handleOnlineStatus(isOnline) {
        // Handle online/offline status changes
        document.body.classList.toggle('offline', !isOnline);
        
        if (isOnline) {
            window.NotificationManager.show('Connection restored', 'success', 3000);
            this.syncOfflineData();
        } else {
            window.NotificationManager.show('You are offline. Some features may be limited.', 'warning', 5000);
        }
    }
    
    syncOfflineData() {
        // Sync any offline data when connection is restored
        const offlineData = Utils.getStorage('offline_data', []);
        
        if (offlineData.length > 0) {
            // Process offline data
            offlineData.forEach(data => {
                this.processOfflineData(data);
            });
            
            // Clear offline data
            Utils.removeStorage('offline_data');
            
            window.NotificationManager.show('Offline data synced successfully', 'success');
        }
    }
    
    processOfflineData(data) {
        // Process individual offline data items
        switch (data.type) {
            case 'question':
                // Re-submit question when online
                break;
            case 'test_result':
                // Sync test results
                break;
            case 'progress':
                // Sync progress data
                break;
        }
    }
    
    trackNavigation(section) {
        // Track navigation for analytics
        const navigationData = {
            section,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            referrer: document.referrer
        };
        
        // Store navigation history
        const navHistory = Utils.getStorage('navigation_history', []);
        navHistory.push(navigationData);
        
        // Keep only last 100 entries
        if (navHistory.length > 100) {
            navHistory.splice(0, navHistory.length - 100);
        }
        
        Utils.setStorage('navigation_history', navHistory);
    }
    
    // Public API methods
    getCurrentSection() {
        return this.currentSection;
    }
    
    showSection(sectionName) {
        this.navigateToSection(sectionName);
    }
    
    refreshCurrentSection() {
        this.initializeSection(this.currentSection);
    }
    
    // Theme management
    setTheme(theme) {
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${theme}-theme`);
        
        ConfigUtils.saveUserSettings({ theme });
    }
    
    toggleTheme() {
        const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
    
    // Cleanup methods
    cleanup() {
        // Cleanup when user logs out or leaves
        if (window.HomeworkAssistant) {
            window.HomeworkAssistant.cleanup();
        }
        
        if (window.TestManager && window.TestManager.timerInterval) {
            clearInterval(window.TestManager.timerInterval);
        }
        
        // Clear any active timers or intervals
        this.clearAllTimers();
    }
    
    clearAllTimers() {
        // Clear any application timers
        const highestTimeoutId = setTimeout(() => {}, 0);
        for (let i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
        }
        
        const highestIntervalId = setInterval(() => {}, 0);
        for (let i = 0; i < highestIntervalId; i++) {
            clearInterval(i);
        }
    }
}

// Initialize Dashboard Manager
window.DashboardManager = new DashboardManager();

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already authenticated
    if (window.AuthManager && window.AuthManager.isAuthenticated()) {
        window.DashboardManager.init();
    }
    
    // Setup global error handling
    window.addEventListener('error', (e) => {
        Utils.handleError(e.error, 'Global Error Handler');
    });
    
    // Setup service worker for offline support (if available)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
    
    // Initialize performance observer
    if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.entryType === 'largest-contentful-paint') {
                    console.log('LCP:', entry.startTime);
                }
            });
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
    
    // Show welcome message for first-time users
    const isFirstVisit = !Utils.getStorage('has_visited', false);
    if (isFirstVisit) {
        Utils.setStorage('has_visited', true);
        
        setTimeout(() => {
            if (window.NotificationManager) {
                window.NotificationManager.show(
                    'Welcome to CBSE AI SmartPath! 🎉 Start your learning journey today.',
                    'success',
                    8000
                );
            }
        }, 2000);
    }
});

// Export for global access
window.DashboardManager = window.DashboardManager;