// Configuration and Constants
const CONFIG = {
    // Authentication PINs
    PINS: {
        STUDENT: 'BPS2025',
        ADMIN: 'ANUBHaw@12'
    },
    
    // API Configuration
    API: {
        GEMINI_KEY: 'AIzaSyCBYV-RNMGdIB1RL9fxHGNGdWgKrudyo7U',
        CLERK_KEY: 'pk_test_Zmxvd2luZy1zY29ycGlvbi01MC5jbGVyay5hY2NvdW50cy5kZXYk',
        GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
    },
    
    // Session Configuration
    SESSION: {
        TIMEOUT: 30 * 60 * 1000, // 30 minutes
        WARNING_TIME: 5 * 60 * 1000, // 5 minutes before timeout
        MAX_ATTEMPTS: 3,
        LOCKOUT_TIME: 15 * 60 * 1000 // 15 minutes lockout
    },
    
    // Rate Limiting
    RATE_LIMIT: {
        QUESTIONS_PER_HOUR: 50,
        PHOTOS_PER_HOUR: 20,
        TESTS_PER_DAY: 10
    },
    
    // Supported Languages
    LANGUAGES: {
        EN: 'English',
        HI: 'हिंदी'
    },
    
    // Subjects Configuration
    SUBJECTS: {
        mathematics: {
            name: 'Mathematics',
            nameHi: 'गणित',
            icon: 'fas fa-calculator',
            color: '#3b82f6',
            topics: [
                'Number Systems',
                'Polynomials',
                'Coordinate Geometry',
                'Linear Equations',
                'Introduction to Euclid\'s Geometry',
                'Lines and Angles',
                'Triangles',
                'Quadrilaterals',
                'Areas of Parallelograms and Triangles',
                'Circles',
                'Constructions',
                'Heron\'s Formula',
                'Surface Areas and Volumes',
                'Statistics',
                'Probability'
            ]
        },
        science: {
            name: 'Science',
            nameHi: 'विज्ञान',
            icon: 'fas fa-flask',
            color: '#10b981',
            topics: [
                'Matter in Our Surroundings',
                'Is Matter Around Us Pure',
                'Atoms and Molecules',
                'Structure of the Atom',
                'The Fundamental Unit of Life',
                'Tissues',
                'Diversity in Living Organisms',
                'Motion',
                'Force and Laws of Motion',
                'Gravitation',
                'Work and Energy',
                'Sound',
                'Why Do We Fall Ill',
                'Natural Resources',
                'Improvement in Food Resources'
            ]
        },
        'social-studies': {
            name: 'Social Studies',
            nameHi: 'सामाजिक अध्ययन',
            icon: 'fas fa-globe',
            color: '#f59e0b',
            topics: [
                'The French Revolution',
                'Socialism in Europe and the Russian Revolution',
                'Nazism and the Rise of Hitler',
                'Forest Society and Colonialism',
                'Pastoralists in the Modern World',
                'Peasants and Farmers',
                'History and Sport',
                'Clothing: A Social History',
                'India - Size and Location',
                'Physical Features of India',
                'Drainage',
                'Climate',
                'Natural Vegetation and Wildlife',
                'Population',
                'What is Democracy?',
                'Constitutional Design',
                'Electoral Politics',
                'Working of Institutions',
                'Democratic Rights'
            ]
        },
        english: {
            name: 'English',
            nameHi: 'अंग्रेजी',
            icon: 'fas fa-book',
            color: '#8b5cf6',
            topics: [
                'Reading Comprehension',
                'Writing Skills',
                'Grammar',
                'Literature',
                'Poetry',
                'Prose',
                'Drama',
                'Vocabulary',
                'Speaking Skills',
                'Listening Skills'
            ]
        },
        hindi: {
            name: 'Hindi',
            nameHi: 'हिंदी',
            icon: 'fas fa-language',
            color: '#ef4444',
            topics: [
                'गद्य',
                'पद्य',
                'व्याकरण',
                'रचना',
                'पत्र लेखन',
                'निबंध',
                'कहानी',
                'कविता',
                'नाटक',
                'भाषा कौशल'
            ]
        }
    },
    
    // Difficulty Levels
    DIFFICULTY: {
        EASY: 'easy',
        MEDIUM: 'medium',
        HARD: 'hard'
    },
    
    // Question Types
    QUESTION_TYPES: {
        MCQ: 'multiple-choice',
        SHORT: 'short-answer',
        LONG: 'long-answer',
        NUMERICAL: 'numerical',
        TRUE_FALSE: 'true-false'
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        SESSION: 'cbse_ai_session',
        USER_PROGRESS: 'cbse_ai_progress',
        SETTINGS: 'cbse_ai_settings',
        NOTES: 'cbse_ai_notes',
        TEST_HISTORY: 'cbse_ai_test_history',
        ACHIEVEMENTS: 'cbse_ai_achievements'
    },
    
    // Error Messages
    ERRORS: {
        INVALID_PIN: 'Invalid PIN. Please try again.',
        SESSION_EXPIRED: 'Your session has expired. Please login again.',
        RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
        NETWORK_ERROR: 'Network error. Please check your connection.',
        AI_ERROR: 'AI service temporarily unavailable. Please try again.',
        CAMERA_ERROR: 'Camera access denied or unavailable.',
        FILE_TOO_LARGE: 'File size too large. Please choose a smaller image.',
        INVALID_FILE_TYPE: 'Invalid file type. Please upload an image.',
        MICROPHONE_ERROR: 'Microphone access denied or unavailable.'
    },
    
    // Success Messages
    SUCCESS: {
        LOGIN: 'Welcome to CBSE AI SmartPath!',
        QUESTION_SOLVED: 'Question solved successfully!',
        NOTE_GENERATED: 'Smart notes generated!',
        TEST_COMPLETED: 'Test completed successfully!',
        PROGRESS_UPDATED: 'Progress updated!',
        SETTINGS_SAVED: 'Settings saved successfully!'
    },
    
    // File Upload Limits
    FILE_LIMITS: {
        MAX_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
        MAX_FILES: 5
    },
    
    // Audio Recording Limits
    AUDIO_LIMITS: {
        MAX_DURATION: 60, // seconds
        SAMPLE_RATE: 44100,
        CHANNELS: 1
    },
    
    // Gamification
    POINTS: {
        QUESTION_SOLVED: 10,
        TEST_COMPLETED: 50,
        DAILY_LOGIN: 5,
        STREAK_BONUS: 20,
        ACHIEVEMENT_UNLOCK: 100
    },
    
    // Achievements
    ACHIEVEMENTS: {
        FIRST_QUESTION: {
            id: 'first_question',
            name: 'First Steps',
            description: 'Solve your first question',
            icon: 'fas fa-baby',
            points: 50
        },
        STREAK_7: {
            id: 'streak_7',
            name: '7-Day Streak',
            description: 'Study for 7 consecutive days',
            icon: 'fas fa-fire',
            points: 100
        },
        TOP_PERFORMER: {
            id: 'top_performer',
            name: 'Top Performer',
            description: 'Score above 90% in 5 tests',
            icon: 'fas fa-star',
            points: 200
        },
        QUICK_LEARNER: {
            id: 'quick_learner',
            name: 'Quick Learner',
            description: 'Complete 10 lessons in a day',
            icon: 'fas fa-brain',
            points: 150
        },
        MATH_MASTER: {
            id: 'math_master',
            name: 'Math Master',
            description: 'Score 95%+ in 3 math tests',
            icon: 'fas fa-trophy',
            points: 300
        },
        SPEED_SOLVER: {
            id: 'speed_solver',
            name: 'Speed Solver',
            description: 'Solve 50 questions in an hour',
            icon: 'fas fa-rocket',
            points: 250
        },
        KNOWLEDGE_KING: {
            id: 'knowledge_king',
            name: 'Knowledge King',
            description: 'Master all subjects',
            icon: 'fas fa-crown',
            points: 500
        }
    },
    
    // Default Settings
    DEFAULT_SETTINGS: {
        language: 'EN',
        theme: 'light',
        notifications: true,
        sound: true,
        autoSave: true,
        difficulty: 'medium',
        explanationLevel: 'detailed'
    },
    
    // Animation Durations
    ANIMATIONS: {
        FAST: 150,
        NORMAL: 250,
        SLOW: 350,
        PAGE_TRANSITION: 500
    },
    
    // Breakpoints (for JavaScript responsive logic)
    BREAKPOINTS: {
        XS: 576,
        SM: 768,
        MD: 992,
        LG: 1200,
        XL: 1400
    }
};

// Utility Functions for Configuration
const ConfigUtils = {
    // Get current language
    getCurrentLanguage() {
        return localStorage.getItem('language') || CONFIG.DEFAULT_SETTINGS.language;
    },
    
    // Get localized text
    getText(key, lang = null) {
        const currentLang = lang || this.getCurrentLanguage();
        // This would typically load from a translations file
        return key; // Simplified for now
    },
    
    // Check if feature is enabled
    isFeatureEnabled(feature) {
        const settings = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS) || '{}');
        return settings[feature] !== false;
    },
    
    // Get user settings
    getUserSettings() {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
        return stored ? { ...CONFIG.DEFAULT_SETTINGS, ...JSON.parse(stored) } : CONFIG.DEFAULT_SETTINGS;
    },
    
    // Save user settings
    saveUserSettings(settings) {
        const current = this.getUserSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    },
    
    // Check rate limits
    checkRateLimit(action) {
        const key = `rate_limit_${action}`;
        const data = JSON.parse(localStorage.getItem(key) || '{"count": 0, "timestamp": 0}');
        const now = Date.now();
        const hourAgo = now - (60 * 60 * 1000);
        const dayAgo = now - (24 * 60 * 60 * 1000);
        
        // Reset if time window passed
        if (action.includes('hour') && data.timestamp < hourAgo) {
            data.count = 0;
            data.timestamp = now;
        } else if (action.includes('day') && data.timestamp < dayAgo) {
            data.count = 0;
            data.timestamp = now;
        }
        
        // Check limits
        const limits = {
            'questions_hour': CONFIG.RATE_LIMIT.QUESTIONS_PER_HOUR,
            'photos_hour': CONFIG.RATE_LIMIT.PHOTOS_PER_HOUR,
            'tests_day': CONFIG.RATE_LIMIT.TESTS_PER_DAY
        };
        
        if (data.count >= (limits[action] || 100)) {
            return false;
        }
        
        // Increment and save
        data.count++;
        data.timestamp = data.timestamp || now;
        localStorage.setItem(key, JSON.stringify(data));
        
        return true;
    },
    
    // Get subject configuration
    getSubject(subjectId) {
        return CONFIG.SUBJECTS[subjectId] || null;
    },
    
    // Get all subjects
    getAllSubjects() {
        return Object.keys(CONFIG.SUBJECTS).map(id => ({
            id,
            ...CONFIG.SUBJECTS[id]
        }));
    },
    
    // Format points
    formatPoints(points) {
        if (points >= 1000) {
            return `${(points / 1000).toFixed(1)}k`;
        }
        return points.toString();
    },
    
    // Get achievement by ID
    getAchievement(achievementId) {
        return CONFIG.ACHIEVEMENTS[achievementId] || null;
    },
    
    // Check if mobile device
    isMobile() {
        return window.innerWidth <= CONFIG.BREAKPOINTS.SM;
    },
    
    // Check if tablet device
    isTablet() {
        return window.innerWidth > CONFIG.BREAKPOINTS.SM && window.innerWidth <= CONFIG.BREAKPOINTS.MD;
    },
    
    // Check if desktop device
    isDesktop() {
        return window.innerWidth > CONFIG.BREAKPOINTS.MD;
    },
    
    // Debounce function
    debounce(func, wait) {
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
    
    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Export for use in other modules
window.CONFIG = CONFIG;
window.ConfigUtils = ConfigUtils;