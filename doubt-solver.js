// Doubt Solver Module
class DoubtSolver {
    constructor() {
        this.currentMethod = 'text';
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setupVoiceRecognition();
        this.setupFileUpload();
    }
    
    bindEvents() {
        // Method tab switching
        const methodTabs = document.querySelectorAll('.tab-btn');
        methodTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchMethod(e.target.dataset.method));
        });
        
        // Text input events
        const solveBtn = document.getElementById('solve-question');
        const clearBtn = document.getElementById('clear-question');
        
        if (solveBtn) {
            solveBtn.addEventListener('click', () => this.solveTextQuestion());
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearQuestion());
        }
        
        // Voice recording events
        const voiceBtn = document.getElementById('voice-record');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleVoiceRecording());
        }
        
        // Photo upload events
        const photoFile = document.getElementById('photo-file');
        const uploadBtn = document.querySelector('.upload-btn');
        const removePhotoBtn = document.getElementById('remove-photo');
        const analyzePhotoBtn = document.getElementById('analyze-photo');
        
        if (photoFile) {
            photoFile.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => photoFile?.click());
        }
        
        if (removePhotoBtn) {
            removePhotoBtn.addEventListener('click', () => this.removePhoto());
        }
        
        if (analyzePhotoBtn) {
            analyzePhotoBtn.addEventListener('click', () => this.analyzePhoto());
        }
        
        // Solution actions
        const explainSimpleBtn = document.getElementById('explain-simple');
        const showStepsBtn = document.getElementById('show-steps');
        const saveSolutionBtn = document.getElementById('save-solution');
        
        if (explainSimpleBtn) {
            explainSimpleBtn.addEventListener('click', () => this.explainSimple());
        }
        
        if (showStepsBtn) {
            showStepsBtn.addEventListener('click', () => this.showDetailedSteps());
        }
        
        if (saveSolutionBtn) {
            saveSolutionBtn.addEventListener('click', () => this.saveSolution());
        }
        
        // Feedback buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('feedback-btn')) {
                this.handleFeedback(e.target.classList.contains('positive'));
            }
        });
        
        // Drag and drop for photo upload
        this.setupDragAndDrop();
    }
    
    switchMethod(method) {
        this.currentMethod = method;
        
        // Update tab appearance
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.method === method);
        });
        
        // Show/hide input panels
        document.querySelectorAll('.input-panel').forEach(panel => {
            panel.style.display = 'none';
        });
        
        const activePanel = document.getElementById(`${method}-input`);
        if (activePanel) {
            activePanel.style.display = 'block';
        }
        
        // Initialize method-specific features
        if (method === 'voice') {
            this.initializeVoiceInput();
        } else if (method === 'photo') {
            this.initializePhotoInput();
        }
    }
    
    async solveTextQuestion() {
        const questionText = document.getElementById('question-text').value.trim();
        const subject = document.getElementById('subject-select').value;
        
        if (!questionText) {
            this.showError('Please enter a question');
            return;
        }
        
        if (!subject) {
            this.showError('Please select a subject');
            return;
        }
        
        try {
            this.showLoading('Solving your question...');
            
            const result = await window.AIIntegration.askQuestion(questionText, subject);
            
            if (result.success) {
                this.displaySolution(result.solution, result.confidence);
                this.trackQuestionSolved(subject, 'text');
            } else {
                this.showError(result.error || 'Failed to solve question');
            }
            
        } catch (error) {
            console.error('Error solving question:', error);
            this.showError('Failed to solve question. Please try again.');
        } finally {
            this.hideLoading();
        }
    }
    
    clearQuestion() {
        const questionText = document.getElementById('question-text');
        const subjectSelect = document.getElementById('subject-select');
        
        if (questionText) questionText.value = '';
        if (subjectSelect) subjectSelect.value = '';
        
        this.hideSolution();
    }
    
    // Voice Recognition Setup
    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.speechRecognition = new SpeechRecognition();
            
            this.speechRecognition.continuous = false;
            this.speechRecognition.interimResults = false;
            this.speechRecognition.lang = 'en-US';
            
            this.speechRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.handleVoiceResult(transcript);
            };
            
            this.speechRecognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.handleVoiceError(event.error);
            };
            
            this.speechRecognition.onend = () => {
                this.stopVoiceRecording();
            };
        }
    }
    
    initializeVoiceInput() {
        const voiceStatus = document.querySelector('.voice-status');
        if (voiceStatus) {
            voiceStatus.textContent = 'Click to start recording';
        }
        
        this.resetVoiceUI();
    }
    
    async toggleVoiceRecording() {
        if (this.isRecording) {
            this.stopVoiceRecording();
        } else {
            await this.startVoiceRecording();
        }
    }
    
    async startVoiceRecording() {
        try {
            // Check microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.isRecording = true;
            this.updateVoiceUI(true);
            
            // Start speech recognition
            if (this.speechRecognition) {
                this.speechRecognition.start();
            }
            
            // Setup media recorder for backup
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.start();
            
            // Auto-stop after max duration
            setTimeout(() => {
                if (this.isRecording) {
                    this.stopVoiceRecording();
                }
            }, CONFIG.AUDIO_LIMITS.MAX_DURATION * 1000);
            
        } catch (error) {
            console.error('Voice recording error:', error);
            this.showError(CONFIG.ERRORS.MICROPHONE_ERROR);
            this.resetVoiceUI();
        }
    }
    
    stopVoiceRecording() {
        this.isRecording = false;
        this.updateVoiceUI(false);
        
        if (this.speechRecognition) {
            this.speechRecognition.stop();
        }
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        // Stop all audio tracks
        if (this.mediaRecorder && this.mediaRecorder.stream) {
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }
    
    updateVoiceUI(recording) {
        const voiceBtn = document.getElementById('voice-record');
        const voiceStatus = document.querySelector('.voice-status');
        const voiceCircle = document.querySelector('.voice-circle');
        const voiceWaves = document.querySelector('.voice-waves');
        const btnIcon = voiceBtn?.querySelector('i');
        
        if (recording) {
            voiceBtn.textContent = 'Stop Recording';
            if (btnIcon) btnIcon.className = 'fas fa-stop';
            voiceBtn.classList.add('recording');
            voiceStatus.textContent = 'Listening... Speak your question';
            voiceCircle.classList.add('recording');
            voiceWaves.classList.add('active');
        } else {
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Recording';
            voiceBtn.classList.remove('recording');
            voiceStatus.textContent = 'Click to start recording';
            voiceCircle.classList.remove('recording');
            voiceWaves.classList.remove('active');
        }
    }
    
    resetVoiceUI() {
        this.updateVoiceUI(false);
    }
    
    handleVoiceResult(transcript) {
        console.log('Voice transcript:', transcript);
        
        const voiceStatus = document.querySelector('.voice-status');
        voiceStatus.textContent = `Recognized: "${transcript}"`;
        
        // Process the voice input
        this.processVoiceQuestion(transcript);
    }
    
    handleVoiceError(error) {
        console.error('Voice recognition error:', error);
        
        let errorMessage = 'Voice recognition failed';
        
        switch (error) {
            case 'no-speech':
                errorMessage = 'No speech detected. Please try again.';
                break;
            case 'audio-capture':
                errorMessage = 'Microphone not accessible.';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone permission denied.';
                break;
            default:
                errorMessage = 'Voice recognition error. Please try again.';
        }
        
        this.showError(errorMessage);
        this.resetVoiceUI();
    }
    
    async processVoiceQuestion(transcript) {
        try {
            this.showLoading('Processing voice question...');
            
            // Auto-detect subject from transcript
            const subject = this.detectSubject(transcript);
            
            const result = await window.AIIntegration.askQuestion(transcript, subject);
            
            if (result.success) {
                this.displaySolution(result.solution, result.confidence);
                this.trackQuestionSolved(subject, 'voice');
            } else {
                this.showError(result.error || 'Failed to solve question');
            }
            
        } catch (error) {
            console.error('Error processing voice question:', error);
            this.showError('Failed to process voice question');
        } finally {
            this.hideLoading();
        }
    }
    
    detectSubject(text) {
        const keywords = {
            mathematics: ['math', 'equation', 'solve', 'calculate', 'algebra', 'geometry', 'number', 'formula'],
            science: ['science', 'physics', 'chemistry', 'biology', 'experiment', 'reaction', 'force', 'energy'],
            'social-studies': ['history', 'geography', 'civics', 'democracy', 'revolution', 'constitution'],
            english: ['english', 'grammar', 'essay', 'literature', 'poem', 'story'],
            hindi: ['hindi', 'व्याकरण', 'कविता', 'गद्य', 'निबंध']
        };
        
        const lowerText = text.toLowerCase();
        
        for (const [subject, words] of Object.entries(keywords)) {
            if (words.some(word => lowerText.includes(word))) {
                return subject;
            }
        }
        
        return 'mathematics'; // Default subject
    }
    
    // File Upload Setup
    setupFileUpload() {
        this.setupDragAndDrop();
    }
    
    setupDragAndDrop() {
        const dropZone = document.getElementById('photo-drop-zone');
        
        if (!dropZone) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });
        
        dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleDrop(e) {
        const files = e.dataTransfer.files;
        this.handleFiles(files);
    }
    
    handleFileSelect(e) {
        const files = e.target.files;
        this.handleFiles(files);
    }
    
    handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        
        // Validate file
        if (!this.validateFile(file)) {
            return;
        }
        
        this.previewFile(file);
    }
    
    validateFile(file) {
        // Check file type
        if (!CONFIG.FILE_LIMITS.ALLOWED_TYPES.includes(file.type)) {
            this.showError(CONFIG.ERRORS.INVALID_FILE_TYPE);
            return false;
        }
        
        // Check file size
        if (file.size > CONFIG.FILE_LIMITS.MAX_SIZE) {
            this.showError(CONFIG.ERRORS.FILE_TOO_LARGE);
            return false;
        }
        
        return true;
    }
    
    previewFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const previewImage = document.getElementById('preview-image');
            const uploadArea = document.querySelector('.upload-area');
            const previewArea = document.getElementById('photo-preview');
            
            if (previewImage && uploadArea && previewArea) {
                previewImage.src = e.target.result;
                uploadArea.style.display = 'none';
                previewArea.style.display = 'block';
                
                // Store file data for analysis
                this.currentImageData = e.target.result;
            }
        };
        
        reader.readAsDataURL(file);
    }
    
    removePhoto() {
        const uploadArea = document.querySelector('.upload-area');
        const previewArea = document.getElementById('photo-preview');
        const photoFile = document.getElementById('photo-file');
        
        if (uploadArea && previewArea) {
            uploadArea.style.display = 'block';
            previewArea.style.display = 'none';
        }
        
        if (photoFile) {
            photoFile.value = '';
        }
        
        this.currentImageData = null;
    }
    
    async analyzePhoto() {
        if (!this.currentImageData) {
            this.showError('No image to analyze');
            return;
        }
        
        try {
            this.showLoading('Analyzing image...');
            
            const result = await window.AIIntegration.processImageQuestion(
                this.currentImageData,
                'mathematics' // Default subject for now
            );
            
            if (result.success) {
                this.displaySolution(result.solution, result.confidence);
                this.trackQuestionSolved('mathematics', 'photo');
            } else {
                this.showError(result.error || 'Failed to analyze image');
            }
            
        } catch (error) {
            console.error('Error analyzing photo:', error);
            this.showError('Failed to analyze image');
        } finally {
            this.hideLoading();
        }
    }
    
    initializePhotoInput() {
        this.removePhoto(); // Reset photo input
    }
    
    displaySolution(solution, confidence) {
        const solutionPanel = document.getElementById('solution-display');
        const solutionContent = document.getElementById('solution-text');
        
        if (!solutionPanel || !solutionContent) return;
        
        // Store current solution for actions
        this.currentSolution = solution;
        
        // Format solution HTML
        let html = '';
        
        if (solution.understanding) {
            html += `<div class="solution-section">
                <h4>Problem Understanding</h4>
                <p>${solution.understanding}</p>
            </div>`;
        }
        
        if (solution.steps && solution.steps.length > 0) {
            html += `<div class="solution-section">
                <h4>Step-by-Step Solution</h4>`;
            
            solution.steps.forEach(step => {
                html += `<div class="step">
                    <span class="step-number">${step.number}</span>
                    ${step.description}
                </div>`;
            });
            
            html += `</div>`;
        }
        
        if (solution.answer) {
            html += `<div class="solution-section">
                <h4>Final Answer</h4>
                <div class="final-answer">${solution.answer}</div>
            </div>`;
        }
        
        if (solution.concepts && solution.concepts.length > 0) {
            html += `<div class="solution-section">
                <h4>Key Concepts</h4>
                <ul>`;
            
            solution.concepts.forEach(concept => {
                html += `<li>${concept}</li>`;
            });
            
            html += `</ul></div>`;
        }
        
        if (solution.tips && solution.tips.length > 0) {
            html += `<div class="solution-section">
                <h4>Tips to Remember</h4>
                <ul>`;
            
            solution.tips.forEach(tip => {
                html += `<li>${tip}</li>`;
            });
            
            html += `</ul></div>`;
        }
        
        solutionContent.innerHTML = html;
        solutionPanel.style.display = 'block';
        
        // Scroll to solution
        solutionPanel.scrollIntoView({ behavior: 'smooth' });
        
        // Add confidence indicator
        this.showConfidence(confidence);
    }
    
    showConfidence(confidence) {
        const confidencePercent = Math.round(confidence * 100);
        let confidenceClass = 'low';
        
        if (confidencePercent >= 80) {
            confidenceClass = 'high';
        } else if (confidencePercent >= 60) {
            confidenceClass = 'medium';
        }
        
        const confidenceHTML = `
            <div class="confidence-indicator ${confidenceClass}">
                <i class="fas fa-brain"></i>
                <span>AI Confidence: ${confidencePercent}%</span>
            </div>
        `;
        
        const solutionHeader = document.querySelector('.solution-header');
        if (solutionHeader) {
            // Remove existing confidence indicator
            const existing = solutionHeader.querySelector('.confidence-indicator');
            if (existing) existing.remove();
            
            solutionHeader.insertAdjacentHTML('beforeend', confidenceHTML);
        }
    }
    
    hideSolution() {
        const solutionPanel = document.getElementById('solution-display');
        if (solutionPanel) {
            solutionPanel.style.display = 'none';
        }
    }
    
    async explainSimple() {
        if (!this.currentSolution) return;
        
        try {
            this.showLoading('Generating simple explanation...');
            
            const content = this.solutionToText(this.currentSolution);
            const result = await window.AIIntegration.explainSimple(content);
            
            if (result.success) {
                this.showSimpleExplanation(result.content);
            } else {
                this.showError('Failed to generate simple explanation');
            }
            
        } catch (error) {
            console.error('Error generating simple explanation:', error);
            this.showError('Failed to generate simple explanation');
        } finally {
            this.hideLoading();
        }
    }
    
    async showDetailedSteps() {
        if (!this.currentSolution) return;
        
        try {
            this.showLoading('Generating detailed steps...');
            
            const content = this.solutionToText(this.currentSolution);
            const result = await window.AIIntegration.generateStepByStep(content);
            
            if (result.success) {
                this.showDetailedStepsModal(result.content);
            } else {
                this.showError('Failed to generate detailed steps');
            }
            
        } catch (error) {
            console.error('Error generating detailed steps:', error);
            this.showError('Failed to generate detailed steps');
        } finally {
            this.hideLoading();
        }
    }
    
    solutionToText(solution) {
        let text = '';
        
        if (solution.understanding) text += solution.understanding + '\n\n';
        if (solution.steps) {
            solution.steps.forEach(step => {
                text += `Step ${step.number}: ${step.description}\n`;
            });
            text += '\n';
        }
        if (solution.answer) text += `Answer: ${solution.answer}\n\n`;
        
        return text;
    }
    
    showSimpleExplanation(content) {
        // Create modal or update solution panel with simple explanation
        const modal = this.createModal('Simple Explanation', content);
        document.body.appendChild(modal);
    }
    
    showDetailedStepsModal(content) {
        const modal = this.createModal('Detailed Steps', content);
        document.body.appendChild(modal);
    }
    
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="explanation-content">${content}</div>
                </div>
            </div>
        `;
        
        // Add close functionality
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        return modal;
    }
    
    saveSolution() {
        if (!this.currentSolution) return;
        
        const savedSolutions = JSON.parse(localStorage.getItem('saved_solutions') || '[]');
        
        const solutionData = {
            id: Date.now(),
            solution: this.currentSolution,
            timestamp: new Date().toISOString(),
            subject: document.getElementById('subject-select')?.value || 'unknown'
        };
        
        savedSolutions.push(solutionData);
        localStorage.setItem('saved_solutions', JSON.stringify(savedSolutions));
        
        this.showSuccess('Solution saved successfully!');
    }
    
    handleFeedback(isPositive) {
        const feedback = {
            timestamp: Date.now(),
            positive: isPositive,
            solutionId: this.currentSolution ? Date.now() : null
        };
        
        // Store feedback
        const feedbackData = JSON.parse(localStorage.getItem('solution_feedback') || '[]');
        feedbackData.push(feedback);
        localStorage.setItem('solution_feedback', JSON.stringify(feedbackData));
        
        // Show thank you message
        const message = isPositive ? 
            'Thank you for your positive feedback!' : 
            'Thank you for your feedback. We\'ll work to improve!';
        
        this.showSuccess(message);
        
        // Hide feedback buttons
        const feedbackButtons = document.querySelector('.feedback-buttons');
        if (feedbackButtons) {
            feedbackButtons.style.display = 'none';
        }
    }
    
    trackQuestionSolved(subject, method) {
        // Track for analytics and gamification
        const stats = JSON.parse(localStorage.getItem('question_stats') || '{}');
        
        if (!stats[subject]) stats[subject] = {};
        if (!stats[subject][method]) stats[subject][method] = 0;
        
        stats[subject][method]++;
        stats.total = (stats.total || 0) + 1;
        stats.lastSolved = Date.now();
        
        localStorage.setItem('question_stats', JSON.stringify(stats));
        
        // Award points
        if (window.ProgressManager) {
            window.ProgressManager.awardPoints(CONFIG.POINTS.QUESTION_SOLVED, 'Question Solved');
        }
        
        // Check achievements
        if (window.AchievementManager) {
            window.AchievementManager.checkQuestionAchievements(stats);
        }
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

// Initialize Doubt Solver
window.DoubtSolver = new DoubtSolver();