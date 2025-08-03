// Progress Tracking Module
class ProgressManager {
    constructor() {
        this.userProgress = {};
        this.achievements = [];
        this.currentStreak = 0;
        this.totalPoints = 0;
        
        this.init();
    }
    
    init() {
        this.loadProgress();
        this.updateProgressDisplay();
        this.checkDailyLogin();
    }
    
    loadProgress() {
        // Load user progress from localStorage
        const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROGRESS);
        this.userProgress = stored ? JSON.parse(stored) : this.getDefaultProgress();
        
        // Load achievements
        const storedAchievements = localStorage.getItem(CONFIG.STORAGE_KEYS.ACHIEVEMENTS);
        this.achievements = storedAchievements ? JSON.parse(storedAchievements) : [];
        
        this.calculateTotals();
    }
    
    getDefaultProgress() {
        return {
            subjects: {
                mathematics: {
                    totalQuestions: 45,
                    correctAnswers: 35,
                    testsCompleted: 8,
                    averageScore: 78,
                    timeSpent: 12600, // seconds
                    lastActivity: Date.now() - 86400000,
                    topicsCompleted: ['Number Systems', 'Polynomials', 'Linear Equations'],
                    weakAreas: ['Coordinate Geometry', 'Triangles'],
                    strongAreas: ['Algebra', 'Number Systems']
                },
                science: {
                    totalQuestions: 52,
                    correctAnswers: 44,
                    testsCompleted: 6,
                    averageScore: 85,
                    timeSpent: 9800,
                    lastActivity: Date.now() - 172800000,
                    topicsCompleted: ['Matter', 'Atoms and Molecules', 'Motion'],
                    weakAreas: ['Sound', 'Gravitation'],
                    strongAreas: ['Chemistry', 'Biology']
                },
                'social-studies': {
                    totalQuestions: 38,
                    correctAnswers: 35,
                    testsCompleted: 5,
                    averageScore: 92,
                    timeSpent: 7200,
                    lastActivity: Date.now() - 259200000,
                    topicsCompleted: ['French Revolution', 'Democracy', 'Constitutional Design'],
                    weakAreas: ['Geography'],
                    strongAreas: ['History', 'Civics']
                }
            },
            overall: {
                totalQuestions: 135,
                correctAnswers: 114,
                testsCompleted: 19,
                averageScore: 85,
                totalTimeSpent: 29600,
                loginStreak: 7,
                lastLogin: Date.now() - 86400000,
                totalPoints: 1250,
                level: 5,
                joinDate: Date.now() - 2592000000 // 30 days ago
            },
            daily: {
                questionsToday: 8,
                timeToday: 1800,
                pointsToday: 120,
                date: new Date().toDateString()
            }
        };
    }
    
    calculateTotals() {
        this.totalPoints = this.userProgress.overall?.totalPoints || 0;
        this.currentStreak = this.userProgress.overall?.loginStreak || 0;
    }
    
    updateProgressDisplay() {
        this.updateOverallStats();
        this.updateSubjectProgress();
        this.updateAchievements();
        this.updateStreakDisplay();
    }
    
    updateOverallStats() {
        // Update overall performance circle
        const chartValue = document.querySelector('.chart-value');
        const chartCircle = document.querySelector('.chart-circle circle:last-child');
        
        if (chartValue && this.userProgress.overall) {
            chartValue.textContent = `${this.userProgress.overall.averageScore}%`;
        }
        
        if (chartCircle && this.userProgress.overall) {
            const circumference = 283; // 2 * π * 45
            const offset = circumference - (circumference * this.userProgress.overall.averageScore / 100);
            chartCircle.style.strokeDashoffset = offset;
        }
        
        // Update points display
        const pointsNumber = document.querySelector('.points-number');
        if (pointsNumber) {
            pointsNumber.textContent = ConfigUtils.formatPoints(this.totalPoints);
        }
        
        // Update streak display
        const streakNumber = document.querySelector('.streak-number');
        if (streakNumber) {
            streakNumber.textContent = this.currentStreak;
        }
    }
    
    updateSubjectProgress() {
        const subjectItems = document.querySelectorAll('.subject-item');
        
        subjectItems.forEach(item => {
            const subjectIcon = item.querySelector('.subject-icon');
            if (!subjectIcon) return;
            
            let subject = '';
            if (subjectIcon.classList.contains('math')) subject = 'mathematics';
            else if (subjectIcon.classList.contains('science')) subject = 'science';
            else if (subjectIcon.classList.contains('social')) subject = 'social-studies';
            
            const subjectData = this.userProgress.subjects[subject];
            if (!subjectData) return;
            
            const progressFill = item.querySelector('.progress-fill');
            const progressText = item.querySelector('.progress-text');
            
            if (progressFill && progressText) {
                const completionPercentage = this.calculateSubjectCompletion(subject);
                progressFill.style.width = `${completionPercentage}%`;
                progressText.textContent = `${completionPercentage}% Complete`;
            }
        });
    }
    
    calculateSubjectCompletion(subject) {
        const subjectData = this.userProgress.subjects[subject];
        if (!subjectData) return 0;
        
        const subjectConfig = CONFIG.SUBJECTS[subject];
        if (!subjectConfig) return 0;
        
        const totalTopics = subjectConfig.topics.length;
        const completedTopics = subjectData.topicsCompleted?.length || 0;
        
        return Math.round((completedTopics / totalTopics) * 100);
    }
    
    updateAchievements() {
        const badgesGrid = document.querySelector('.badges-grid');
        if (!badgesGrid) return;
        
        const allAchievements = Object.values(CONFIG.ACHIEVEMENTS);
        
        badgesGrid.innerHTML = allAchievements.map(achievement => {
            const isEarned = this.achievements.some(a => a.id === achievement.id);
            
            return `
                <div class="badge ${isEarned ? 'earned' : 'locked'}" data-achievement="${achievement.id}">
                    <i class="${achievement.icon}"></i>
                    <span>${achievement.name}</span>
                    ${isEarned ? '<div class="earned-date">Earned!</div>' : ''}
                </div>
            `;
        }).join('');
        
        // Add click handlers for achievement details
        this.bindAchievementEvents();
    }
    
    bindAchievementEvents() {
        const badges = document.querySelectorAll('.badge');
        badges.forEach(badge => {
            badge.addEventListener('click', () => {
                const achievementId = badge.dataset.achievement;
                this.showAchievementDetails(achievementId);
            });
        });
    }
    
    showAchievementDetails(achievementId) {
        const achievement = CONFIG.ACHIEVEMENTS[achievementId];
        if (!achievement) return;
        
        const isEarned = this.achievements.some(a => a.id === achievementId);
        const earnedData = this.achievements.find(a => a.id === achievementId);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay achievement-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Achievement Details</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="achievement-details ${isEarned ? 'earned' : 'locked'}">
                        <div class="achievement-icon">
                            <i class="${achievement.icon}"></i>
                        </div>
                        <h4>${achievement.name}</h4>
                        <p>${achievement.description}</p>
                        <div class="achievement-points">
                            <i class="fas fa-star"></i>
                            ${achievement.points} Points
                        </div>
                        ${isEarned ? `
                            <div class="earned-info">
                                <i class="fas fa-check-circle"></i>
                                Earned on ${new Date(earnedData.earnedAt).toLocaleDateString()}
                            </div>
                        ` : `
                            <div class="progress-info">
                                ${this.getAchievementProgress(achievementId)}
                            </div>
                        `}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="action-btn primary modal-close-btn">Close</button>
                </div>
            </div>
        `;
        
        // Add close functionality
        const closeButtons = modal.querySelectorAll('.modal-close, .modal-close-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        document.body.appendChild(modal);
    }
    
    getAchievementProgress(achievementId) {
        // Return progress towards achievement
        switch (achievementId) {
            case 'STREAK_7':
                return `Current streak: ${this.currentStreak}/7 days`;
            case 'TOP_PERFORMER':
                const highScoreTests = this.getHighScoreTestCount();
                return `High score tests: ${highScoreTests}/5`;
            case 'MATH_MASTER':
                const mathHighScores = this.getMathHighScoreCount();
                return `Math high scores: ${mathHighScores}/3`;
            default:
                return 'Keep learning to unlock this achievement!';
        }
    }
    
    updateStreakDisplay() {
        // Update streak fire animation
        const streakFire = document.querySelector('.streak-fire');
        if (streakFire && this.currentStreak >= 7) {
            streakFire.style.animation = 'bounce 2s infinite';
        }
    }
    
    // Progress tracking methods
    awardPoints(points, reason) {
        this.totalPoints += points;
        this.userProgress.overall.totalPoints = this.totalPoints;
        
        // Update daily points
        const today = new Date().toDateString();
        if (this.userProgress.daily.date === today) {
            this.userProgress.daily.pointsToday += points;
        } else {
            this.userProgress.daily = {
                questionsToday: 0,
                timeToday: 0,
                pointsToday: points,
                date: today
            };
        }
        
        this.saveProgress();
        this.updateProgressDisplay();
        
        // Show points notification
        this.showPointsNotification(points, reason);
        
        // Check for level up
        this.checkLevelUp();
    }
    
    showPointsNotification(points, reason) {
        if (window.NotificationManager) {
            window.NotificationManager.show(
                `+${points} points for ${reason}!`,
                'success',
                3000
            );
        }
    }
    
    checkLevelUp() {
        const currentLevel = this.userProgress.overall.level || 1;
        const newLevel = Math.floor(this.totalPoints / 500) + 1; // 500 points per level
        
        if (newLevel > currentLevel) {
            this.userProgress.overall.level = newLevel;
            this.saveProgress();
            
            // Show level up notification
            this.showLevelUpNotification(newLevel);
            
            // Award bonus points
            this.awardPoints(100, 'Level Up Bonus');
        }
    }
    
    showLevelUpNotification(level) {
        if (window.NotificationManager) {
            window.NotificationManager.show(
                `🎉 Level Up! You're now Level ${level}!`,
                'success',
                5000
            );
        }
    }
    
    trackQuestionSolved(subject, isCorrect, timeSpent = 0) {
        if (!this.userProgress.subjects[subject]) {
            this.userProgress.subjects[subject] = {
                totalQuestions: 0,
                correctAnswers: 0,
                testsCompleted: 0,
                averageScore: 0,
                timeSpent: 0,
                lastActivity: Date.now(),
                topicsCompleted: [],
                weakAreas: [],
                strongAreas: []
            };
        }
        
        const subjectData = this.userProgress.subjects[subject];
        
        subjectData.totalQuestions++;
        if (isCorrect) subjectData.correctAnswers++;
        subjectData.timeSpent += timeSpent;
        subjectData.lastActivity = Date.now();
        
        // Recalculate average score
        subjectData.averageScore = Math.round((subjectData.correctAnswers / subjectData.totalQuestions) * 100);
        
        // Update overall stats
        this.userProgress.overall.totalQuestions++;
        if (isCorrect) this.userProgress.overall.correctAnswers++;
        this.userProgress.overall.totalTimeSpent += timeSpent;
        this.userProgress.overall.averageScore = Math.round(
            (this.userProgress.overall.correctAnswers / this.userProgress.overall.totalQuestions) * 100
        );
        
        // Update daily stats
        const today = new Date().toDateString();
        if (this.userProgress.daily.date === today) {
            this.userProgress.daily.questionsToday++;
            this.userProgress.daily.timeToday += timeSpent;
        } else {
            this.userProgress.daily = {
                questionsToday: 1,
                timeToday: timeSpent,
                pointsToday: 0,
                date: today
            };
        }
        
        this.saveProgress();
        this.updateProgressDisplay();
    }
    
    trackTestCompleted(testResults) {
        const subject = testResults.subject || 'mixed';
        
        if (subject !== 'mixed' && this.userProgress.subjects[subject]) {
            this.userProgress.subjects[subject].testsCompleted++;
            this.userProgress.subjects[subject].lastActivity = Date.now();
        }
        
        this.userProgress.overall.testsCompleted++;
        
        // Update weak and strong areas based on test results
        if (testResults.questionResults) {
            this.analyzeTestPerformance(testResults);
        }
        
        this.saveProgress();
        this.updateProgressDisplay();
    }
    
    analyzeTestPerformance(testResults) {
        const subjectPerformance = {};
        const topicPerformance = {};
        
        testResults.questionResults.forEach(result => {
            // Subject performance
            if (!subjectPerformance[result.subject]) {
                subjectPerformance[result.subject] = { correct: 0, total: 0 };
            }
            subjectPerformance[result.subject].total++;
            if (result.isCorrect) subjectPerformance[result.subject].correct++;
            
            // Topic performance
            if (result.topic) {
                if (!topicPerformance[result.topic]) {
                    topicPerformance[result.topic] = { correct: 0, total: 0, subject: result.subject };
                }
                topicPerformance[result.topic].total++;
                if (result.isCorrect) topicPerformance[result.topic].correct++;
            }
        });
        
        // Update weak and strong areas
        Object.entries(topicPerformance).forEach(([topic, perf]) => {
            const accuracy = perf.correct / perf.total;
            const subjectData = this.userProgress.subjects[perf.subject];
            
            if (!subjectData) return;
            
            if (accuracy < 0.6) {
                // Weak area
                if (!subjectData.weakAreas.includes(topic)) {
                    subjectData.weakAreas.push(topic);
                }
                // Remove from strong areas if present
                subjectData.strongAreas = subjectData.strongAreas.filter(t => t !== topic);
            } else if (accuracy >= 0.8) {
                // Strong area
                if (!subjectData.strongAreas.includes(topic)) {
                    subjectData.strongAreas.push(topic);
                }
                // Remove from weak areas if present
                subjectData.weakAreas = subjectData.weakAreas.filter(t => t !== topic);
                
                // Add to completed topics if not already there
                if (!subjectData.topicsCompleted.includes(topic)) {
                    subjectData.topicsCompleted.push(topic);
                }
            }
        });
    }
    
    checkDailyLogin() {
        const today = new Date().toDateString();
        const lastLogin = this.userProgress.overall.lastLogin;
        const lastLoginDate = new Date(lastLogin).toDateString();
        
        if (lastLoginDate !== today) {
            // New day login
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            
            if (lastLoginDate === yesterday) {
                // Consecutive day
                this.currentStreak++;
                this.userProgress.overall.loginStreak = this.currentStreak;
            } else {
                // Streak broken
                this.currentStreak = 1;
                this.userProgress.overall.loginStreak = 1;
            }
            
            this.userProgress.overall.lastLogin = Date.now();
            
            // Award daily login points
            this.awardPoints(CONFIG.POINTS.DAILY_LOGIN, 'Daily Login');
            
            // Award streak bonus
            if (this.currentStreak >= 7) {
                this.awardPoints(CONFIG.POINTS.STREAK_BONUS, `${this.currentStreak}-Day Streak`);
            }
            
            this.saveProgress();
            this.updateProgressDisplay();
            
            // Check streak achievements
            this.checkStreakAchievements();
        }
    }
    
    checkStreakAchievements() {
        if (this.currentStreak >= 7 && !this.hasAchievement('STREAK_7')) {
            this.unlockAchievement('STREAK_7');
        }
    }
    
    hasAchievement(achievementId) {
        return this.achievements.some(a => a.id === achievementId);
    }
    
    unlockAchievement(achievementId) {
        const achievement = CONFIG.ACHIEVEMENTS[achievementId];
        if (!achievement || this.hasAchievement(achievementId)) return;
        
        const earnedAchievement = {
            ...achievement,
            earnedAt: Date.now()
        };
        
        this.achievements.push(earnedAchievement);
        this.saveAchievements();
        
        // Award points
        this.awardPoints(achievement.points, `Achievement: ${achievement.name}`);
        
        // Show achievement notification
        this.showAchievementNotification(achievement);
        
        this.updateAchievements();
    }
    
    showAchievementNotification(achievement) {
        // Create special achievement notification
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">
                    <i class="${achievement.icon}"></i>
                </div>
                <div class="achievement-text">
                    <h4>Achievement Unlocked!</h4>
                    <p>${achievement.name}</p>
                    <span>+${achievement.points} points</span>
                </div>
            </div>
        `;
        
        const container = document.getElementById('notification-container');
        if (container) {
            container.appendChild(notification);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    }
    
    // Analytics methods
    getStudyAnalytics() {
        const analytics = {
            totalStudyTime: this.userProgress.overall.totalTimeSpent,
            averageSessionTime: this.calculateAverageSessionTime(),
            mostActiveSubject: this.getMostActiveSubject(),
            weakestSubject: this.getWeakestSubject(),
            strongestSubject: this.getStrongestSubject(),
            improvementTrend: this.getImprovementTrend(),
            weeklyProgress: this.getWeeklyProgress()
        };
        
        return analytics;
    }
    
    calculateAverageSessionTime() {
        const totalSessions = this.userProgress.overall.testsCompleted + 
                             Object.values(this.userProgress.subjects).reduce((sum, subject) => sum + subject.totalQuestions, 0);
        
        if (totalSessions === 0) return 0;
        
        return Math.round(this.userProgress.overall.totalTimeSpent / totalSessions);
    }
    
    getMostActiveSubject() {
        let mostActive = '';
        let maxQuestions = 0;
        
        Object.entries(this.userProgress.subjects).forEach(([subject, data]) => {
            if (data.totalQuestions > maxQuestions) {
                maxQuestions = data.totalQuestions;
                mostActive = subject;
            }
        });
        
        return CONFIG.SUBJECTS[mostActive]?.name || mostActive;
    }
    
    getWeakestSubject() {
        let weakest = '';
        let minScore = 100;
        
        Object.entries(this.userProgress.subjects).forEach(([subject, data]) => {
            if (data.averageScore < minScore) {
                minScore = data.averageScore;
                weakest = subject;
            }
        });
        
        return CONFIG.SUBJECTS[weakest]?.name || weakest;
    }
    
    getStrongestSubject() {
        let strongest = '';
        let maxScore = 0;
        
        Object.entries(this.userProgress.subjects).forEach(([subject, data]) => {
            if (data.averageScore > maxScore) {
                maxScore = data.averageScore;
                strongest = subject;
            }
        });
        
        return CONFIG.SUBJECTS[strongest]?.name || strongest;
    }
    
    getImprovementTrend() {
        // Calculate improvement trend based on recent test scores
        const recentTests = this.getRecentTestScores(10);
        
        if (recentTests.length < 3) return 'stable';
        
        const firstHalf = recentTests.slice(0, Math.floor(recentTests.length / 2));
        const secondHalf = recentTests.slice(Math.floor(recentTests.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
        
        const improvement = secondAvg - firstAvg;
        
        if (improvement > 5) return 'improving';
        if (improvement < -5) return 'declining';
        return 'stable';
    }
    
    getRecentTestScores(count) {
        const testHistory = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.TEST_HISTORY) || '[]');
        return testHistory
            .sort((a, b) => b.completedAt - a.completedAt)
            .slice(0, count)
            .map(test => test.score);
    }
    
    getWeeklyProgress() {
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const testHistory = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.TEST_HISTORY) || '[]');
        
        const weeklyTests = testHistory.filter(test => test.completedAt >= weekAgo);
        
        return {
            testsCompleted: weeklyTests.length,
            averageScore: weeklyTests.length > 0 ? 
                Math.round(weeklyTests.reduce((sum, test) => sum + test.score, 0) / weeklyTests.length) : 0,
            totalQuestions: weeklyTests.reduce((sum, test) => sum + test.totalQuestions, 0),
            timeSpent: weeklyTests.reduce((sum, test) => sum + test.timeSpent, 0)
        };
    }
    
    // Helper methods for achievements
    getHighScoreTestCount() {
        const testHistory = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.TEST_HISTORY) || '[]');
        return testHistory.filter(test => test.score >= 90).length;
    }
    
    getMathHighScoreCount() {
        const testHistory = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.TEST_HISTORY) || '[]');
        return testHistory.filter(test => test.subject === 'mathematics' && test.score >= 95).length;
    }
    
    // Data persistence
    saveProgress() {
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROGRESS, JSON.stringify(this.userProgress));
    }
    
    saveAchievements() {
        localStorage.setItem(CONFIG.STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(this.achievements));
    }
    
    // Export progress data
    exportProgress() {
        const exportData = {
            progress: this.userProgress,
            achievements: this.achievements,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `cbse-ai-progress-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        if (window.NotificationManager) {
            window.NotificationManager.show('Progress data exported successfully!', 'success');
        }
    }
    
    // Reset progress (for testing or new academic year)
    resetProgress() {
        if (confirm('Are you sure you want to reset all progress? This action cannot be undone.')) {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_PROGRESS);
            localStorage.removeItem(CONFIG.STORAGE_KEYS.ACHIEVEMENTS);
            localStorage.removeItem(CONFIG.STORAGE_KEYS.TEST_HISTORY);
            
            this.userProgress = this.getDefaultProgress();
            this.achievements = [];
            this.totalPoints = 0;
            this.currentStreak = 0;
            
            this.updateProgressDisplay();
            
            if (window.NotificationManager) {
                window.NotificationManager.show('Progress reset successfully!', 'success');
            }
        }
    }
    
    // Public API methods
    getCurrentLevel() {
        return this.userProgress.overall?.level || 1;
    }
    
    getTotalPoints() {
        return this.totalPoints;
    }
    
    getCurrentStreak() {
        return this.currentStreak;
    }
    
    getSubjectProgress(subject) {
        return this.userProgress.subjects[subject] || null;
    }
    
    getOverallProgress() {
        return this.userProgress.overall || {};
    }
    
    getAchievements() {
        return this.achievements;
    }
}

// Achievement Manager (separate class for better organization)
class AchievementManager {
    constructor() {
        this.progressManager = null;
    }
    
    setProgressManager(progressManager) {
        this.progressManager = progressManager;
    }
    
    checkQuestionAchievements(stats) {
        // First question achievement
        if (stats.total === 1) {
            this.progressManager?.unlockAchievement('FIRST_QUESTION');
        }
        
        // Quick learner achievement (10 questions in a day)
        const today = new Date().toDateString();
        const dailyStats = this.progressManager?.userProgress.daily;
        
        if (dailyStats?.date === today && dailyStats.questionsToday >= 10) {
            this.progressManager?.unlockAchievement('QUICK_LEARNER');
        }
        
        // Speed solver achievement (50 questions in an hour)
        this.checkSpeedSolverAchievement();
    }
    
    checkTestAchievements(testResults) {
        // Top performer achievement (90%+ in 5 tests)
        if (testResults.score >= 90) {
            const highScoreCount = this.progressManager?.getHighScoreTestCount() || 0;
            if (highScoreCount >= 5) {
                this.progressManager?.unlockAchievement('TOP_PERFORMER');
            }
        }
        
        // Math master achievement (95%+ in 3 math tests)
        if (testResults.subject === 'mathematics' && testResults.score >= 95) {
            const mathHighScores = this.progressManager?.getMathHighScoreCount() || 0;
            if (mathHighScores >= 3) {
                this.progressManager?.unlockAchievement('MATH_MASTER');
            }
        }
        
        // Knowledge king achievement (master all subjects)
        this.checkKnowledgeKingAchievement();
    }
    
    checkSpeedSolverAchievement() {
        // Check if user solved 50 questions in the last hour
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const questionStats = JSON.parse(localStorage.getItem('question_stats') || '{}');
        
        // This would need more detailed tracking to implement properly
        // For now, we'll use a simplified check
        const dailyStats = this.progressManager?.userProgress.daily;
        if (dailyStats && dailyStats.questionsToday >= 50) {
            this.progressManager?.unlockAchievement('SPEED_SOLVER');
        }
    }
    
    checkKnowledgeKingAchievement() {
        const subjects = Object.keys(CONFIG.SUBJECTS);
        const userSubjects = Object.keys(this.progressManager?.userProgress.subjects || {});
        
        const masteredSubjects = userSubjects.filter(subject => {
            const subjectData = this.progressManager?.userProgress.subjects[subject];
            return subjectData && subjectData.averageScore >= 85 && subjectData.testsCompleted >= 3;
        });
        
        if (masteredSubjects.length >= subjects.length) {
            this.progressManager?.unlockAchievement('KNOWLEDGE_KING');
        }
    }
}

// Initialize Progress Manager
window.ProgressManager = new ProgressManager();
window.AchievementManager = new AchievementManager();
window.AchievementManager.setProgressManager(window.ProgressManager);