// Tests Module
class TestManager {
    constructor() {
        this.currentTest = null;
        this.testHistory = [];
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.startTime = null;
        this.timerInterval = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadTestHistory();
    }
    
    bindEvents() {
        // Test category cards
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            const startBtn = card.querySelector('.start-test-btn');
            if (startBtn) {
                startBtn.addEventListener('click', () => {
                    const category = card.dataset.category;
                    this.startTest(category);
                });
            }
        });
        
        // Review buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('review-btn')) {
                const historyItem = e.target.closest('.history-item');
                if (historyItem) {
                    this.reviewTest(historyItem.dataset.testId);
                }
            }
        });
    }
    
    loadTestHistory() {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.TEST_HISTORY);
        this.testHistory = stored ? JSON.parse(stored) : this.getDefaultHistory();
        this.updateHistoryDisplay();
    }
    
    getDefaultHistory() {
        return [
            {
                id: 'test_1',
                title: 'Mathematics - Algebra',
                type: 'quick',
                subject: 'mathematics',
                totalQuestions: 15,
                correctAnswers: 13,
                score: 85,
                timeSpent: 900, // seconds
                completedAt: Date.now() - 86400000,
                difficulty: 'medium'
            },
            {
                id: 'test_2',
                title: 'Science - Light & Reflection',
                type: 'chapter',
                subject: 'science',
                totalQuestions: 25,
                correctAnswers: 23,
                score: 92,
                timeSpent: 1800,
                completedAt: Date.now() - 172800000,
                difficulty: 'medium'
            }
        ];
    }
    
    updateHistoryDisplay() {
        const historyList = document.querySelector('.history-list');
        if (!historyList) return;
        
        if (this.testHistory.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-check"></i>
                    <p>No test history yet. Take your first test!</p>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = this.testHistory
            .sort((a, b) => b.completedAt - a.completedAt)
            .slice(0, 5) // Show only recent 5 tests
            .map(test => this.createHistoryItemHTML(test))
            .join('');
    }
    
    createHistoryItemHTML(test) {
        const timeAgo = this.getTimeAgo(test.completedAt);
        const duration = this.formatDuration(test.timeSpent);
        
        return `
            <div class="history-item" data-test-id="${test.id}">
                <div class="test-info">
                    <h4>${test.title}</h4>
                    <p>${this.getTestTypeLabel(test.type)} • ${test.totalQuestions} questions • ${duration}</p>
                    <span class="test-date">${timeAgo}</span>
                </div>
                <div class="test-score">
                    <span class="score">${test.score}%</span>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${test.score}%;"></div>
                    </div>
                </div>
                <button class="review-btn">
                    <i class="fas fa-eye"></i>
                    Review
                </button>
            </div>
        `;
    }
    
    getTestTypeLabel(type) {
        const labels = {
            quick: 'Quick Quiz',
            chapter: 'Chapter Test',
            mock: 'Mock Exam',
            adaptive: 'Adaptive Test'
        };
        
        return labels[type] || type;
    }
    
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor(diff / 3600000);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return 'Today';
    }
    
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
    }
    
    async startTest(category) {
        // Check rate limits
        if (!ConfigUtils.checkRateLimit('tests_day')) {
            this.showError(CONFIG.ERRORS.RATE_LIMIT_EXCEEDED);
            return;
        }
        
        try {
            this.showLoading('Preparing your test...');
            
            const testConfig = this.getTestConfig(category);
            const questions = await this.generateTestQuestions(testConfig);
            
            if (questions && questions.length > 0) {
                this.currentTest = {
                    id: `test_${Date.now()}`,
                    category,
                    config: testConfig,
                    questions,
                    startTime: Date.now()
                };
                
                this.showTestInterface();
            } else {
                this.showError('Failed to generate test questions');
            }
            
        } catch (error) {
            console.error('Error starting test:', error);
            this.showError('Failed to start test');
        } finally {
            this.hideLoading();
        }
    }
    
    getTestConfig(category) {
        const configs = {
            quick: {
                questionCount: 10,
                timeLimit: 600, // 10 minutes
                subjects: ['mathematics'],
                difficulty: 'medium',
                types: ['mcq', 'short']
            },
            chapter: {
                questionCount: 25,
                timeLimit: 2700, // 45 minutes
                subjects: ['mathematics', 'science'],
                difficulty: 'medium',
                types: ['mcq', 'short', 'numerical']
            },
            mock: {
                questionCount: 80,
                timeLimit: 10800, // 3 hours
                subjects: ['mathematics', 'science', 'social-studies', 'english', 'hindi'],
                difficulty: 'mixed',
                types: ['mcq', 'short', 'long', 'numerical']
            },
            adaptive: {
                questionCount: 15,
                timeLimit: 900, // 15 minutes
                subjects: ['mathematics'],
                difficulty: 'adaptive',
                types: ['mcq', 'numerical']
            }
        };
        
        return configs[category] || configs.quick;
    }
    
    async generateTestQuestions(config) {
        try {
            const questions = [];
            
            for (const subject of config.subjects) {
                const subjectConfig = CONFIG.SUBJECTS[subject];
                if (!subjectConfig) continue;
                
                // Select random topics
                const topics = subjectConfig.topics.slice(0, 3);
                
                for (const topic of topics) {
                    const questionsPerTopic = Math.ceil(config.questionCount / (config.subjects.length * topics.length));
                    
                    const result = await window.AIIntegration.createQuiz(
                        subject,
                        topic,
                        { questionCount: questionsPerTopic }
                    );
                    
                    if (result.success && result.quiz.questions) {
                        questions.push(...result.quiz.questions.map(q => ({
                            ...q,
                            subject,
                            topic,
                            difficulty: config.difficulty === 'mixed' ? 
                                ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] : 
                                config.difficulty
                        })));
                    }
                }
            }
            
            // Shuffle questions
            return this.shuffleArray(questions).slice(0, config.questionCount);
            
        } catch (error) {
            console.error('Error generating test questions:', error);
            throw error;
        }
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    showTestInterface() {
        // Create test interface modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay test-modal';
        modal.innerHTML = this.createTestInterfaceHTML();
        
        document.body.appendChild(modal);
        
        // Initialize test
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.startTime = Date.now();
        
        this.displayQuestion();
        this.startTimer();
        this.bindTestEvents();
    }
    
    createTestInterfaceHTML() {
        const test = this.currentTest;
        
        return `
            <div class="modal-content test-interface">
                <div class="test-header">
                    <div class="test-info">
                        <h3>${this.getTestTypeLabel(test.category)}</h3>
                        <p>${test.questions.length} Questions</p>
                    </div>
                    <div class="test-timer">
                        <i class="fas fa-clock"></i>
                        <span id="timer-display">--:--</span>
                    </div>
                    <button class="test-close" onclick="testManager.confirmExitTest()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="test-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="test-progress-fill"></div>
                    </div>
                    <span class="progress-text">
                        Question <span id="current-question">1</span> of ${test.questions.length}
                    </span>
                </div>
                
                <div class="test-content">
                    <div class="question-container" id="question-container">
                        <!-- Question content will be inserted here -->
                    </div>
                </div>
                
                <div class="test-navigation">
                    <button class="nav-btn secondary" id="prev-question" disabled>
                        <i class="fas fa-chevron-left"></i>
                        Previous
                    </button>
                    
                    <div class="question-palette">
                        ${test.questions.map((_, index) => 
                            `<button class="palette-btn" data-question="${index}">${index + 1}</button>`
                        ).join('')}
                    </div>
                    
                    <button class="nav-btn primary" id="next-question">
                        Next
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                
                <div class="test-actions">
                    <button class="action-btn secondary" onclick="testManager.reviewAnswers()">
                        <i class="fas fa-list"></i>
                        Review Answers
                    </button>
                    <button class="action-btn primary" onclick="testManager.submitTest()">
                        <i class="fas fa-check"></i>
                        Submit Test
                    </button>
                </div>
            </div>
        `;
    }
    
    bindTestEvents() {
        // Navigation buttons
        const prevBtn = document.getElementById('prev-question');
        const nextBtn = document.getElementById('next-question');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousQuestion());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextQuestion());
        }
        
        // Question palette
        const paletteButtons = document.querySelectorAll('.palette-btn');
        paletteButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const questionIndex = parseInt(btn.dataset.question);
                this.goToQuestion(questionIndex);
            });
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
    }
    
    displayQuestion() {
        const question = this.currentTest.questions[this.currentQuestionIndex];
        const container = document.getElementById('question-container');
        
        if (!question || !container) return;
        
        container.innerHTML = this.createQuestionHTML(question);
        
        // Update progress
        this.updateTestProgress();
        
        // Bind answer events
        this.bindAnswerEvents();
        
        // Load saved answer if exists
        this.loadSavedAnswer();
    }
    
    createQuestionHTML(question) {
        let html = `
            <div class="question-header">
                <div class="question-subject">
                    <i class="${CONFIG.SUBJECTS[question.subject]?.icon || 'fas fa-book'}"></i>
                    <span>${CONFIG.SUBJECTS[question.subject]?.name || question.subject}</span>
                </div>
                <div class="question-difficulty ${question.difficulty}">
                    ${question.difficulty}
                </div>
            </div>
            
            <div class="question-text">
                <h4>Question ${this.currentQuestionIndex + 1}</h4>
                <p>${question.question}</p>
            </div>
            
            <div class="answer-section">
        `;
        
        if (question.type === 'mcq' || question.type === 'multiple-choice') {
            html += this.createMCQOptions(question);
        } else if (question.type === 'numerical') {
            html += this.createNumericalInput(question);
        } else if (question.type === 'short-answer' || question.type === 'short') {
            html += this.createShortAnswerInput(question);
        } else if (question.type === 'true-false') {
            html += this.createTrueFalseOptions(question);
        } else {
            html += this.createLongAnswerInput(question);
        }
        
        html += `</div>`;
        
        return html;
    }
    
    createMCQOptions(question) {
        if (!question.options || question.options.length === 0) {
            return '<p>No options available</p>';
        }
        
        let html = '<div class="mcq-options">';
        
        question.options.forEach((option, index) => {
            const optionId = `option_${index}`;
            html += `
                <label class="mcq-option">
                    <input type="radio" name="answer" value="${option}" id="${optionId}">
                    <span class="option-text">${option}</span>
                </label>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    createNumericalInput(question) {
        return `
            <div class="numerical-input">
                <label for="numerical-answer">Enter your answer:</label>
                <input type="number" id="numerical-answer" name="answer" 
                       placeholder="Enter numerical value" step="any">
                <div class="input-hint">
                    <i class="fas fa-info-circle"></i>
                    Enter only the numerical value
                </div>
            </div>
        `;
    }
    
    createShortAnswerInput(question) {
        return `
            <div class="short-answer-input">
                <label for="short-answer">Your answer:</label>
                <textarea id="short-answer" name="answer" rows="3" 
                          placeholder="Enter your answer (2-3 sentences)"></textarea>
                <div class="character-count">
                    <span id="char-count">0</span>/200 characters
                </div>
            </div>
        `;
    }
    
    createTrueFalseOptions(question) {
        return `
            <div class="true-false-options">
                <label class="tf-option">
                    <input type="radio" name="answer" value="true">
                    <span class="option-text">True</span>
                </label>
                <label class="tf-option">
                    <input type="radio" name="answer" value="false">
                    <span class="option-text">False</span>
                </label>
            </div>
        `;
    }
    
    createLongAnswerInput(question) {
        return `
            <div class="long-answer-input">
                <label for="long-answer">Your answer:</label>
                <textarea id="long-answer" name="answer" rows="6" 
                          placeholder="Write your detailed answer here..."></textarea>
                <div class="character-count">
                    <span id="char-count">0</span>/1000 characters
                </div>
            </div>
        `;
    }
    
    bindAnswerEvents() {
        // Radio buttons and checkboxes
        const answerInputs = document.querySelectorAll('input[name="answer"]');
        answerInputs.forEach(input => {
            input.addEventListener('change', () => this.saveCurrentAnswer());
        });
        
        // Text areas and text inputs
        const textInputs = document.querySelectorAll('textarea[name="answer"], input[type="number"][name="answer"]');
        textInputs.forEach(input => {
            input.addEventListener('input', ConfigUtils.debounce(() => {
                this.saveCurrentAnswer();
                this.updateCharacterCount(input);
            }, 500));
        });
    }
    
    updateCharacterCount(input) {
        const charCountSpan = document.getElementById('char-count');
        if (charCountSpan) {
            charCountSpan.textContent = input.value.length;
        }
    }
    
    saveCurrentAnswer() {
        const questionId = this.currentTest.questions[this.currentQuestionIndex].id;
        
        // Get answer based on input type
        const radioInput = document.querySelector('input[name="answer"]:checked');
        const textInput = document.querySelector('textarea[name="answer"], input[type="number"][name="answer"]');
        
        let answer = '';
        
        if (radioInput) {
            answer = radioInput.value;
        } else if (textInput) {
            answer = textInput.value.trim();
        }
        
        this.answers[questionId] = {
            answer,
            timestamp: Date.now(),
            questionIndex: this.currentQuestionIndex
        };
        
        // Update question palette
        this.updateQuestionPalette();
    }
    
    loadSavedAnswer() {
        const questionId = this.currentTest.questions[this.currentQuestionIndex].id;
        const savedAnswer = this.answers[questionId];
        
        if (!savedAnswer) return;
        
        // Load answer based on input type
        const radioInput = document.querySelector(`input[name="answer"][value="${savedAnswer.answer}"]`);
        const textInput = document.querySelector('textarea[name="answer"], input[type="number"][name="answer"]');
        
        if (radioInput) {
            radioInput.checked = true;
        } else if (textInput) {
            textInput.value = savedAnswer.answer;
            this.updateCharacterCount(textInput);
        }
    }
    
    updateTestProgress() {
        const progressFill = document.getElementById('test-progress-fill');
        const currentQuestionSpan = document.getElementById('current-question');
        
        if (progressFill) {
            const progress = ((this.currentQuestionIndex + 1) / this.currentTest.questions.length) * 100;
            progressFill.style.width = `${progress}%`;
        }
        
        if (currentQuestionSpan) {
            currentQuestionSpan.textContent = this.currentQuestionIndex + 1;
        }
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prev-question');
        const nextBtn = document.getElementById('next-question');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentQuestionIndex === 0;
        }
        
        if (nextBtn) {
            const isLastQuestion = this.currentQuestionIndex === this.currentTest.questions.length - 1;
            nextBtn.innerHTML = isLastQuestion ? 
                'Finish <i class="fas fa-check"></i>' : 
                'Next <i class="fas fa-chevron-right"></i>';
        }
    }
    
    updateQuestionPalette() {
        const paletteButtons = document.querySelectorAll('.palette-btn');
        
        paletteButtons.forEach((btn, index) => {
            const questionId = this.currentTest.questions[index].id;
            const hasAnswer = this.answers[questionId] && this.answers[questionId].answer;
            
            btn.classList.toggle('answered', hasAnswer);
            btn.classList.toggle('current', index === this.currentQuestionIndex);
        });
    }
    
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
        }
    }
    
    nextQuestion() {
        if (this.currentQuestionIndex < this.currentTest.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
        } else {
            // Last question - show submit confirmation
            this.confirmSubmitTest();
        }
    }
    
    goToQuestion(index) {
        if (index >= 0 && index < this.currentTest.questions.length) {
            this.currentQuestionIndex = index;
            this.displayQuestion();
        }
    }
    
    handleKeyboardNavigation(e) {
        if (!this.currentTest) return;
        
        switch (e.key) {
            case 'ArrowLeft':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.previousQuestion();
                }
                break;
            case 'ArrowRight':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.nextQuestion();
                }
                break;
            case 'Enter':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.nextQuestion();
                }
                break;
        }
    }
    
    startTimer() {
        const timeLimit = this.currentTest.config.timeLimit;
        let remainingTime = timeLimit;
        
        this.timerInterval = setInterval(() => {
            remainingTime--;
            
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            
            const timerDisplay = document.getElementById('timer-display');
            if (timerDisplay) {
                timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                // Warning colors
                if (remainingTime <= 300) { // 5 minutes
                    timerDisplay.style.color = '#ef4444';
                } else if (remainingTime <= 600) { // 10 minutes
                    timerDisplay.style.color = '#f59e0b';
                }
            }
            
            if (remainingTime <= 0) {
                this.timeUp();
            }
        }, 1000);
    }
    
    timeUp() {
        clearInterval(this.timerInterval);
        this.showError('Time\'s up! Submitting your test...');
        setTimeout(() => this.submitTest(), 2000);
    }
    
    confirmExitTest() {
        if (confirm('Are you sure you want to exit the test? Your progress will be lost.')) {
            this.exitTest();
        }
    }
    
    exitTest() {
        clearInterval(this.timerInterval);
        this.currentTest = null;
        this.answers = {};
        
        const modal = document.querySelector('.test-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    reviewAnswers() {
        // Show review modal with all questions and answers
        const modal = this.createReviewModal();
        document.body.appendChild(modal);
    }
    
    createReviewModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay review-modal';
        
        let html = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>Review Your Answers</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="review-summary">
                        <div class="summary-stats">
                            <div class="stat">
                                <span class="stat-label">Answered</span>
                                <span class="stat-value">${Object.keys(this.answers).length}/${this.currentTest.questions.length}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Remaining</span>
                                <span class="stat-value">${this.currentTest.questions.length - Object.keys(this.answers).length}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="review-questions">
        `;
        
        this.currentTest.questions.forEach((question, index) => {
            const answer = this.answers[question.id];
            const hasAnswer = answer && answer.answer;
            
            html += `
                <div class="review-question ${hasAnswer ? 'answered' : 'unanswered'}">
                    <div class="review-question-header">
                        <span class="question-number">Q${index + 1}</span>
                        <span class="question-status">
                            ${hasAnswer ? '<i class="fas fa-check"></i> Answered' : '<i class="fas fa-exclamation"></i> Not Answered'}
                        </span>
                    </div>
                    <div class="review-question-text">${question.question}</div>
                    ${hasAnswer ? `<div class="review-answer">Your answer: ${answer.answer}</div>` : ''}
                    <button class="goto-question-btn" onclick="testManager.goToQuestionFromReview(${index})">
                        Go to Question
                    </button>
                </div>
            `;
        });
        
        html += `
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="action-btn secondary modal-close-btn">Continue Test</button>
                    <button class="action-btn primary" onclick="testManager.submitTest()">
                        <i class="fas fa-check"></i>
                        Submit Test
                    </button>
                </div>
            </div>
        `;
        
        modal.innerHTML = html;
        
        // Add close functionality
        const closeButtons = modal.querySelectorAll('.modal-close, .modal-close-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        return modal;
    }
    
    goToQuestionFromReview(index) {
        // Close review modal
        const reviewModal = document.querySelector('.review-modal');
        if (reviewModal) {
            reviewModal.remove();
        }
        
        // Go to question
        this.goToQuestion(index);
    }
    
    confirmSubmitTest() {
        const unanswered = this.currentTest.questions.length - Object.keys(this.answers).length;
        
        let message = 'Are you sure you want to submit your test?';
        if (unanswered > 0) {
            message += `\n\nYou have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}.`;
        }
        
        if (confirm(message)) {
            this.submitTest();
        }
    }
    
    async submitTest() {
        try {
            this.showLoading('Evaluating your test...');
            
            clearInterval(this.timerInterval);
            
            const results = await this.evaluateTest();
            this.saveTestResults(results);
            this.showTestResults(results);
            
            // Award points
            if (window.ProgressManager) {
                window.ProgressManager.awardPoints(CONFIG.POINTS.TEST_COMPLETED, 'Test Completed');
            }
            
            // Check achievements
            if (window.AchievementManager) {
                window.AchievementManager.checkTestAchievements(results);
            }
            
        } catch (error) {
            console.error('Error submitting test:', error);
            this.showError('Failed to submit test');
        } finally {
            this.hideLoading();
        }
    }
    
    async evaluateTest() {
        const results = {
            testId: this.currentTest.id,
            category: this.currentTest.category,
            totalQuestions: this.currentTest.questions.length,
            answeredQuestions: Object.keys(this.answers).length,
            correctAnswers: 0,
            score: 0,
            timeSpent: Math.floor((Date.now() - this.startTime) / 1000),
            completedAt: Date.now(),
            questionResults: []
        };
        
        // Evaluate each question
        for (let i = 0; i < this.currentTest.questions.length; i++) {
            const question = this.currentTest.questions[i];
            const userAnswer = this.answers[question.id];
            
            const questionResult = {
                questionId: question.id,
                question: question.question,
                userAnswer: userAnswer ? userAnswer.answer : '',
                correctAnswer: question.correctAnswer,
                isCorrect: false,
                explanation: question.explanation || '',
                subject: question.subject,
                topic: question.topic
            };
            
            // Check if answer is correct
            if (userAnswer && userAnswer.answer) {
                questionResult.isCorrect = this.checkAnswer(
                    userAnswer.answer,
                    question.correctAnswer,
                    question.type
                );
                
                if (questionResult.isCorrect) {
                    results.correctAnswers++;
                }
            }
            
            results.questionResults.push(questionResult);
        }
        
        // Calculate score
        results.score = Math.round((results.correctAnswers / results.totalQuestions) * 100);
        
        return results;
    }
    
    checkAnswer(userAnswer, correctAnswer, questionType) {
        if (!userAnswer || !correctAnswer) return false;
        
        const userAnswerNormalized = userAnswer.toString().toLowerCase().trim();
        const correctAnswerNormalized = correctAnswer.toString().toLowerCase().trim();
        
        if (questionType === 'numerical') {
            const userNum = parseFloat(userAnswerNormalized);
            const correctNum = parseFloat(correctAnswerNormalized);
            
            if (isNaN(userNum) || isNaN(correctNum)) return false;
            
            // Allow small tolerance for numerical answers
            const tolerance = Math.abs(correctNum) * 0.01; // 1% tolerance
            return Math.abs(userNum - correctNum) <= tolerance;
        }
        
        // For other types, check exact match or partial match
        return userAnswerNormalized === correctAnswerNormalized ||
               userAnswerNormalized.includes(correctAnswerNormalized) ||
               correctAnswerNormalized.includes(userAnswerNormalized);
    }
    
    saveTestResults(results) {
        // Add to test history
        this.testHistory.unshift({
            id: results.testId,
            title: `${CONFIG.SUBJECTS[results.questionResults[0]?.subject]?.name || 'Mixed'} - ${this.getTestTypeLabel(results.category)}`,
            type: results.category,
            subject: results.questionResults[0]?.subject || 'mixed',
            totalQuestions: results.totalQuestions,
            correctAnswers: results.correctAnswers,
            score: results.score,
            timeSpent: results.timeSpent,
            completedAt: results.completedAt,
            difficulty: this.currentTest.config.difficulty,
            results: results.questionResults
        });
        
        // Keep only last 50 tests
        this.testHistory = this.testHistory.slice(0, 50);
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.TEST_HISTORY, JSON.stringify(this.testHistory));
        
        // Update display
        this.updateHistoryDisplay();
    }
    
    showTestResults(results) {
        // Close test interface
        const testModal = document.querySelector('.test-modal');
        if (testModal) {
            testModal.remove();
        }
        
        // Create results modal
        const modal = this.createResultsModal(results);
        document.body.appendChild(modal);
    }
    
    createResultsModal(results) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay results-modal';
        
        const scoreClass = results.score >= 80 ? 'excellent' : results.score >= 60 ? 'good' : 'needs-improvement';
        const duration = this.formatDuration(results.timeSpent);
        
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>Test Results</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="results-summary ${scoreClass}">
                        <div class="score-display">
                            <div class="score-circle">
                                <svg viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="8"/>
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="8" 
                                            stroke-dasharray="283" stroke-dashoffset="${283 - (283 * results.score / 100)}" 
                                            transform="rotate(-90 50 50)"/>
                                </svg>
                                <div class="score-text">
                                    <span class="score-value">${results.score}%</span>
                                    <span class="score-label">Score</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="results-stats">
                            <div class="stat">
                                <i class="fas fa-check-circle"></i>
                                <div>
                                    <span class="stat-value">${results.correctAnswers}</span>
                                    <span class="stat-label">Correct</span>
                                </div>
                            </div>
                            <div class="stat">
                                <i class="fas fa-times-circle"></i>
                                <div>
                                    <span class="stat-value">${results.totalQuestions - results.correctAnswers}</span>
                                    <span class="stat-label">Incorrect</span>
                                </div>
                            </div>
                            <div class="stat">
                                <i class="fas fa-clock"></i>
                                <div>
                                    <span class="stat-value">${duration}</span>
                                    <span class="stat-label">Time</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="results-analysis">
                        <h4>Performance Analysis</h4>
                        ${this.generatePerformanceAnalysis(results)}
                    </div>
                    
                    <div class="results-recommendations">
                        <h4>Recommendations</h4>
                        ${this.generateRecommendations(results)}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="action-btn secondary" onclick="testManager.reviewDetailedResults('${results.testId}')">
                        <i class="fas fa-list"></i>
                        Detailed Review
                    </button>
                    <button class="action-btn secondary" onclick="testManager.retakeTest()">
                        <i class="fas fa-redo"></i>
                        Retake Test
                    </button>
                    <button class="action-btn primary modal-close-btn">
                        <i class="fas fa-home"></i>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        `;
        
        // Add close functionality
        const closeButtons = modal.querySelectorAll('.modal-close, .modal-close-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
                this.currentTest = null;
            });
        });
        
        return modal;
    }
    
    generatePerformanceAnalysis(results) {
        const subjectPerformance = {};
        
        results.questionResults.forEach(result => {
            if (!subjectPerformance[result.subject]) {
                subjectPerformance[result.subject] = { correct: 0, total: 0 };
            }
            
            subjectPerformance[result.subject].total++;
            if (result.isCorrect) {
                subjectPerformance[result.subject].correct++;
            }
        });
        
        let html = '<div class="subject-performance">';
        
        Object.entries(subjectPerformance).forEach(([subject, perf]) => {
            const percentage = Math.round((perf.correct / perf.total) * 100);
            const subjectConfig = CONFIG.SUBJECTS[subject];
            
            html += `
                <div class="subject-perf-item">
                    <div class="subject-info">
                        <i class="${subjectConfig?.icon || 'fas fa-book'}"></i>
                        <span>${subjectConfig?.name || subject}</span>
                    </div>
                    <div class="perf-bar">
                        <div class="perf-fill" style="width: ${percentage}%;"></div>
                    </div>
                    <span class="perf-text">${percentage}%</span>
                </div>
            `;
        });
        
        html += '</div>';
        
        return html;
    }
    
    generateRecommendations(results) {
        const recommendations = [];
        
        if (results.score >= 90) {
            recommendations.push('🎉 Excellent performance! You\'re ready for more challenging topics.');
        } else if (results.score >= 70) {
            recommendations.push('👍 Good job! Review the incorrect answers to improve further.');
        } else {
            recommendations.push('📚 Focus on understanding the concepts better. Practice more questions.');
        }
        
        // Subject-specific recommendations
        const weakSubjects = this.getWeakSubjects(results);
        if (weakSubjects.length > 0) {
            recommendations.push(`🎯 Focus more on: ${weakSubjects.join(', ')}`);
        }
        
        // Time management
        const avgTimePerQuestion = results.timeSpent / results.totalQuestions;
        if (avgTimePerQuestion > 120) { // More than 2 minutes per question
            recommendations.push('⏰ Work on time management. Try to solve questions faster.');
        }
        
        let html = '<ul class="recommendations-list">';
        recommendations.forEach(rec => {
            html += `<li>${rec}</li>`;
        });
        html += '</ul>';
        
        return html;
    }
    
    getWeakSubjects(results) {
        const subjectPerformance = {};
        
        results.questionResults.forEach(result => {
            if (!subjectPerformance[result.subject]) {
                subjectPerformance[result.subject] = { correct: 0, total: 0 };
            }
            
            subjectPerformance[result.subject].total++;
            if (result.isCorrect) {
                subjectPerformance[result.subject].correct++;
            }
        });
        
        return Object.entries(subjectPerformance)
            .filter(([subject, perf]) => (perf.correct / perf.total) < 0.7)
            .map(([subject]) => CONFIG.SUBJECTS[subject]?.name || subject);
    }
    
    reviewDetailedResults(testId) {
        const test = this.testHistory.find(t => t.id === testId);
        if (!test) return;
        
        // Close current modal
        document.querySelector('.results-modal').remove();
        
        // Show detailed review
        const modal = this.createDetailedReviewModal(test);
        document.body.appendChild(modal);
    }
    
    createDetailedReviewModal(test) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay detailed-review-modal';
        
        let html = `
            <div class="modal-content extra-large">
                <div class="modal-header">
                    <h3>Detailed Test Review - ${test.title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="detailed-questions">
        `;
        
        if (test.results) {
            test.results.forEach((result, index) => {
                const statusClass = result.isCorrect ? 'correct' : 'incorrect';
                const statusIcon = result.isCorrect ? 'fas fa-check' : 'fas fa-times';
                
                html += `
                    <div class="detailed-question ${statusClass}">
                        <div class="question-header">
                            <div class="question-number">
                                <i class="${statusIcon}"></i>
                                Question ${index + 1}
                            </div>
                            <div class="question-subject">${CONFIG.SUBJECTS[result.subject]?.name || result.subject}</div>
                        </div>
                        
                        <div class="question-content">
                            <div class="question-text">${result.question}</div>
                            
                            <div class="answer-comparison">
                                <div class="user-answer">
                                    <strong>Your Answer:</strong>
                                    <span class="${statusClass}">${result.userAnswer || 'Not answered'}</span>
                                </div>
                                <div class="correct-answer">
                                    <strong>Correct Answer:</strong>
                                    <span class="correct">${result.correctAnswer}</span>
                                </div>
                            </div>
                            
                            ${result.explanation ? `
                                <div class="explanation">
                                    <strong>Explanation:</strong>
                                    <p>${result.explanation}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });
        }
        
        html += `
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="action-btn secondary modal-close-btn">Close</button>
                    <button class="action-btn primary" onclick="testManager.generatePracticeTest('${test.subject}')">
                        <i class="fas fa-plus"></i>
                        Practice Similar Questions
                    </button>
                </div>
            </div>
        `;
        
        modal.innerHTML = html;
        
        // Add close functionality
        const closeButtons = modal.querySelectorAll('.modal-close, .modal-close-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        return modal;
    }
    
    retakeTest() {
        if (confirm('Are you sure you want to retake this test?')) {
            // Close results modal
            document.querySelector('.results-modal').remove();
            
            // Start the same test again
            this.startTest(this.currentTest.category);
        }
    }
    
    async generatePracticeTest(subject) {
        try {
            this.showLoading('Generating practice test...');
            
            // Generate a practice test based on weak areas
            const practiceConfig = {
                questionCount: 10,
                timeLimit: 600,
                subjects: [subject],
                difficulty: 'medium',
                types: ['mcq', 'short']
            };
            
            const questions = await this.generateTestQuestions(practiceConfig);
            
            if (questions && questions.length > 0) {
                this.currentTest = {
                    id: `practice_${Date.now()}`,
                    category: 'practice',
                    config: practiceConfig,
                    questions,
                    startTime: Date.now()
                };
                
                // Close current modal
                document.querySelector('.detailed-review-modal').remove();
                
                this.showTestInterface();
            } else {
                this.showError('Failed to generate practice test');
            }
            
        } catch (error) {
            console.error('Error generating practice test:', error);
            this.showError('Failed to generate practice test');
        } finally {
            this.hideLoading();
        }
    }
    
    reviewTest(testId) {
        const test = this.testHistory.find(t => t.id === testId);
        if (!test) return;
        
        const modal = this.createDetailedReviewModal(test);
        document.body.appendChild(modal);
    }
    
    // Utility methods
    showLoading(message) {
        if (window.AuthManager) {
            window.AuthManager.showLoading(message);
        }
    }
    
    hideLoading() {
        if (window.AuthManager) {
            window.AuthManager.hideLoading();
        }
    }
    
    showError(message) {
        if (window.NotificationManager) {
            window.NotificationManager.show(message, 'error');
        }
    }
    
    showSuccess(message) {
        if (window.NotificationManager) {
            window.NotificationManager.show(message, 'success');
        }
    }
}

// Initialize Test Manager
window.TestManager = new TestManager();

// Make it globally accessible
window.testManager = window.TestManager;