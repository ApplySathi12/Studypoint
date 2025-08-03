// Homework Assistant Module
class HomeworkAssistant {
    constructor() {
        this.currentMethod = 'camera';
        this.cameraStream = null;
        this.capturedImages = [];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setupCamera();
        this.setupFileUpload();
    }
    
    bindEvents() {
        // Method switching
        const methodCards = document.querySelectorAll('.method-card');
        methodCards.forEach(card => {
            card.addEventListener('click', () => {
                const method = card.dataset.method;
                this.switchMethod(method);
            });
        });
        
        // Camera controls
        const startCameraBtn = document.getElementById('start-camera');
        const captureBtn = document.getElementById('capture-photo');
        
        if (startCameraBtn) {
            startCameraBtn.addEventListener('click', () => this.startCamera());
        }
        
        if (captureBtn) {
            captureBtn.addEventListener('click', () => this.capturePhoto());
        }
        
        // File upload
        const homeworkFile = document.getElementById('homework-file');
        const uploadBtn = document.querySelector('.upload-btn');
        
        if (homeworkFile) {
            homeworkFile.addEventListener('change', (e) => this.handleFileUpload(e));
        }
        
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => homeworkFile?.click());
        }
        
        // Text input
        const textInput = document.querySelector('#homework-text-input textarea');
        const solveBtn = document.querySelector('#homework-text-input .action-btn');
        
        if (solveBtn) {
            solveBtn.addEventListener('click', () => this.solveTextProblem());
        }
        
        // Setup drag and drop
        this.setupDragAndDrop();
    }
    
    switchMethod(method) {
        this.currentMethod = method;
        
        // Update method card appearance
        document.querySelectorAll('.method-card').forEach(card => {
            card.classList.toggle('active', card.dataset.method === method);
        });
        
        // Show/hide interfaces
        document.querySelectorAll('.camera-interface, .file-upload, .text-input').forEach(interface => {
            interface.style.display = 'none';
        });
        
        const activeInterface = document.getElementById(`${method}-interface`) || 
                               document.querySelector(`.${method}-interface`) ||
                               document.getElementById(`homework-${method}-input`);
        
        if (activeInterface) {
            activeInterface.style.display = 'block';
        }
        
        // Initialize method-specific features
        if (method === 'camera') {
            this.initializeCameraInterface();
        } else if (method === 'gallery') {
            this.initializeFileUpload();
        } else if (method === 'text') {
            this.initializeTextInput();
        }
    }
    
    // Camera functionality
    async setupCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('Camera not supported');
            return;
        }
    }
    
    initializeCameraInterface() {
        const video = document.getElementById('camera-video');
        const startBtn = document.getElementById('start-camera');
        const captureBtn = document.getElementById('capture-photo');
        
        if (video && this.cameraStream) {
            video.srcObject = this.cameraStream;
            startBtn.style.display = 'none';
            captureBtn.style.display = 'block';
        } else {
            if (startBtn) startBtn.style.display = 'block';
            if (captureBtn) captureBtn.style.display = 'none';
        }
    }
    
    async startCamera() {
        try {
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment' // Use back camera on mobile
                }
            };
            
            this.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            const video = document.getElementById('camera-video');
            const startBtn = document.getElementById('start-camera');
            const captureBtn = document.getElementById('capture-photo');
            
            if (video) {
                video.srcObject = this.cameraStream;
                video.play();
            }
            
            if (startBtn) startBtn.style.display = 'none';
            if (captureBtn) captureBtn.style.display = 'block';
            
        } catch (error) {
            console.error('Camera error:', error);
            this.showError(CONFIG.ERRORS.CAMERA_ERROR);
        }
    }
    
    capturePhoto() {
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        
        if (!video || !canvas) return;
        
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0);
        
        // Convert to blob
        canvas.toBlob((blob) => {
            this.processCapturedImage(blob);
        }, 'image/jpeg', 0.8);
    }
    
    async processCapturedImage(blob) {
        try {
            this.showLoading('Processing captured image...');
            
            const imageData = await this.blobToDataURL(blob);
            const result = await window.AIIntegration.processImageQuestion(imageData, 'mathematics');
            
            if (result.success) {
                this.displayHomeworkSolution(result.solution, result.confidence, 'camera');
                this.trackHomeworkSolved('camera');
            } else {
                this.showError(result.error || 'Failed to process image');
            }
            
        } catch (error) {
            console.error('Error processing captured image:', error);
            this.showError('Failed to process captured image');
        } finally {
            this.hideLoading();
        }
    }
    
    blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    // File upload functionality
    setupFileUpload() {
        this.setupDragAndDrop();
    }
    
    initializeFileUpload() {
        // Reset file input
        const fileInput = document.getElementById('homework-file');
        if (fileInput) {
            fileInput.value = '';
        }
    }
    
    setupDragAndDrop() {
        const dropZone = document.querySelector('.drop-zone');
        
        if (!dropZone) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('dragover');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
            }, false);
        });
        
        dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleDrop(e) {
        const files = e.dataTransfer.files;
        this.processFiles(files);
    }
    
    handleFileUpload(e) {
        const files = e.target.files;
        this.processFiles(files);
    }
    
    async processFiles(files) {
        if (files.length === 0) return;
        
        // Limit number of files
        const filesToProcess = Array.from(files).slice(0, CONFIG.FILE_LIMITS.MAX_FILES);
        
        try {
            this.showLoading(`Processing ${filesToProcess.length} image(s)...`);
            
            const results = [];
            
            for (const file of filesToProcess) {
                if (!this.validateFile(file)) continue;
                
                const imageData = await this.fileToDataURL(file);
                const result = await window.AIIntegration.processImageQuestion(imageData, 'mathematics');
                
                if (result.success) {
                    results.push({
                        filename: file.name,
                        solution: result.solution,
                        confidence: result.confidence
                    });
                }
            }
            
            if (results.length > 0) {
                this.displayMultipleHomeworkSolutions(results);
                this.trackHomeworkSolved('upload');
            } else {
                this.showError('No valid solutions found');
            }
            
        } catch (error) {
            console.error('Error processing files:', error);
            this.showError('Failed to process uploaded files');
        } finally {
            this.hideLoading();
        }
    }
    
    validateFile(file) {
        // Check file type
        if (!CONFIG.FILE_LIMITS.ALLOWED_TYPES.includes(file.type)) {
            this.showError(`Invalid file type: ${file.name}`);
            return false;
        }
        
        // Check file size
        if (file.size > CONFIG.FILE_LIMITS.MAX_SIZE) {
            this.showError(`File too large: ${file.name}`);
            return false;
        }
        
        return true;
    }
    
    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // Text input functionality
    initializeTextInput() {
        const textarea = document.querySelector('#homework-text-input textarea');
        if (textarea) {
            textarea.value = '';
            textarea.focus();
        }
    }
    
    async solveTextProblem() {
        const textarea = document.querySelector('#homework-text-input textarea');
        const problem = textarea?.value.trim();
        
        if (!problem) {
            this.showError('Please enter a homework problem');
            return;
        }
        
        try {
            this.showLoading('Solving homework problem...');
            
            const result = await window.AIIntegration.solveHomework(problem, 'mathematics');
            
            if (result.success) {
                this.displayHomeworkSolution(result.solution, result.confidence, 'text');
                this.trackHomeworkSolved('text');
            } else {
                this.showError(result.error || 'Failed to solve problem');
            }
            
        } catch (error) {
            console.error('Error solving text problem:', error);
            this.showError('Failed to solve problem');
        } finally {
            this.hideLoading();
        }
    }
    
    // Solution display
    displayHomeworkSolution(solution, confidence, method) {
        const solutionsContainer = document.getElementById('homework-solutions');
        
        if (!solutionsContainer) return;
        
        const solutionHTML = this.createSolutionHTML(solution, confidence, method);
        
        // Add to solutions container
        solutionsContainer.innerHTML = solutionHTML;
        solutionsContainer.style.display = 'block';
        
        // Scroll to solutions
        solutionsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    displayMultipleHomeworkSolutions(results) {
        const solutionsContainer = document.getElementById('homework-solutions');
        
        if (!solutionsContainer) return;
        
        let html = '<h3>Homework Solutions</h3>';
        
        results.forEach((result, index) => {
            html += this.createSolutionHTML(result.solution, result.confidence, 'upload', result.filename, index);
        });
        
        solutionsContainer.innerHTML = html;
        solutionsContainer.style.display = 'block';
        
        // Scroll to solutions
        solutionsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    createSolutionHTML(solution, confidence, method, filename = null, index = 0) {
        const confidencePercent = Math.round(confidence * 100);
        const confidenceClass = confidencePercent >= 80 ? 'high' : confidencePercent >= 60 ? 'medium' : 'low';
        
        let html = `
            <div class="solution-item" data-index="${index}">
                <div class="solution-header-hw">
                    <div class="solution-title">
                        ${filename ? `Solution for ${filename}` : `Homework Solution`}
                        <span class="solution-method">(${method})</span>
                    </div>
                    <div class="solution-confidence ${confidenceClass}">
                        ${confidencePercent}% Confidence
                    </div>
                </div>
        `;
        
        if (solution.understanding) {
            html += `
                <div class="solution-understanding">
                    <h4>Problem Analysis</h4>
                    <p>${solution.understanding}</p>
                </div>
            `;
        }
        
        if (solution.steps && solution.steps.length > 0) {
            html += `
                <div class="solution-steps">
                    <h4>Step-by-Step Solution</h4>
            `;
            
            solution.steps.forEach(step => {
                html += `
                    <div class="solution-step">
                        <strong>Step ${step.number}:</strong> ${step.description}
                    </div>
                `;
            });
            
            html += `</div>`;
        }
        
        if (solution.answer) {
            html += `
                <div class="solution-answer">
                    <h4>Final Answer</h4>
                    <div class="answer-box">${solution.answer}</div>
                </div>
            `;
        }
        
        if (solution.concepts && solution.concepts.length > 0) {
            html += `
                <div class="solution-concepts">
                    <h4>Key Concepts Used</h4>
                    <ul>
            `;
            
            solution.concepts.forEach(concept => {
                html += `<li>${concept}</li>`;
            });
            
            html += `</ul></div>`;
        }
        
        // Add practice problems
        html += this.generatePracticeProblems(solution);
        
        // Add action buttons
        html += `
            <div class="solution-actions-hw">
                <button class="action-btn secondary" onclick="homeworkAssistant.explainSolution(${index})">
                    <i class="fas fa-child"></i>
                    Explain Simply
                </button>
                <button class="action-btn secondary" onclick="homeworkAssistant.generateSimilar(${index})">
                    <i class="fas fa-clone"></i>
                    Similar Problems
                </button>
                <button class="action-btn secondary" onclick="homeworkAssistant.saveSolution(${index})">
                    <i class="fas fa-bookmark"></i>
                    Save Solution
                </button>
                <button class="action-btn primary" onclick="homeworkAssistant.shareWithTeacher(${index})">
                    <i class="fas fa-share"></i>
                    Share with Teacher
                </button>
            </div>
        `;
        
        html += `</div>`;
        
        return html;
    }
    
    generatePracticeProblems(solution) {
        // Generate similar practice problems based on the solution
        const practiceProblems = [
            "Try solving a similar problem with different numbers",
            "Practice the same concept with a word problem",
            "Apply this method to a more complex scenario"
        ];
        
        let html = `
            <div class="practice-problems">
                <h4>Practice More</h4>
                <ul>
        `;
        
        practiceProblems.forEach(problem => {
            html += `<li>${problem}</li>`;
        });
        
        html += `</ul></div>`;
        
        return html;
    }
    
    async startCamera() {
        try {
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment'
                }
            };
            
            this.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            const video = document.getElementById('camera-video');
            const startBtn = document.getElementById('start-camera');
            const captureBtn = document.getElementById('capture-photo');
            
            if (video) {
                video.srcObject = this.cameraStream;
                await video.play();
            }
            
            if (startBtn) startBtn.style.display = 'none';
            if (captureBtn) captureBtn.style.display = 'inline-flex';
            
        } catch (error) {
            console.error('Camera error:', error);
            this.showError(CONFIG.ERRORS.CAMERA_ERROR);
        }
    }
    
    capturePhoto() {
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        
        if (!video || !canvas) return;
        
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0);
        
        // Convert to blob and process
        canvas.toBlob(async (blob) => {
            try {
                this.showLoading('Analyzing homework...');
                
                const imageData = await this.blobToDataURL(blob);
                const result = await window.AIIntegration.processImageQuestion(imageData, 'mathematics');
                
                if (result.success) {
                    this.displayHomeworkSolution(result.solution, result.confidence, 'camera');
                    this.trackHomeworkSolved('camera');
                    
                    // Store captured image
                    this.capturedImages.push({
                        data: imageData,
                        timestamp: Date.now(),
                        solution: result.solution
                    });
                } else {
                    this.showError(result.error || 'Failed to analyze homework');
                }
                
            } catch (error) {
                console.error('Error processing captured photo:', error);
                this.showError('Failed to process photo');
            } finally {
                this.hideLoading();
            }
        }, 'image/jpeg', 0.8);
    }
    
    blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    // File upload functionality
    setupDragAndDrop() {
        const dropZone = document.querySelector('.drop-zone');
        
        if (!dropZone) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('dragover');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
            }, false);
        });
        
        dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleDrop(e) {
        const files = e.dataTransfer.files;
        this.processFiles(files);
    }
    
    async processFiles(files) {
        if (files.length === 0) return;
        
        const validFiles = Array.from(files).filter(file => this.validateFile(file));
        
        if (validFiles.length === 0) {
            this.showError('No valid image files found');
            return;
        }
        
        try {
            this.showLoading(`Processing ${validFiles.length} homework image(s)...`);
            
            const results = [];
            
            for (const file of validFiles) {
                const imageData = await this.fileToDataURL(file);
                const result = await window.AIIntegration.processImageQuestion(imageData, 'mathematics');
                
                if (result.success) {
                    results.push({
                        filename: file.name,
                        solution: result.solution,
                        confidence: result.confidence
                    });
                }
                
                // Add delay between requests
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            if (results.length > 0) {
                this.displayMultipleHomeworkSolutions(results);
                this.trackHomeworkSolved('upload');
            } else {
                this.showError('Failed to process any images');
            }
            
        } catch (error) {
            console.error('Error processing files:', error);
            this.showError('Failed to process homework images');
        } finally {
            this.hideLoading();
        }
    }
    
    validateFile(file) {
        if (!CONFIG.FILE_LIMITS.ALLOWED_TYPES.includes(file.type)) {
            this.showError(`Invalid file type: ${file.name}`);
            return false;
        }
        
        if (file.size > CONFIG.FILE_LIMITS.MAX_SIZE) {
            this.showError(`File too large: ${file.name}`);
            return false;
        }
        
        return true;
    }
    
    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // Text input functionality
    initializeTextInput() {
        const textarea = document.querySelector('#homework-text-input textarea');
        if (textarea) {
            textarea.value = '';
            textarea.focus();
        }
    }
    
    // Solution actions
    async explainSolution(index) {
        const solutionItem = document.querySelector(`[data-index="${index}"]`);
        if (!solutionItem) return;
        
        try {
            this.showLoading('Generating simple explanation...');
            
            // Get solution content
            const solutionContent = this.extractSolutionContent(solutionItem);
            const result = await window.AIIntegration.explainSimple(solutionContent);
            
            if (result.success) {
                this.showExplanationModal(result.content);
            } else {
                this.showError('Failed to generate explanation');
            }
            
        } catch (error) {
            console.error('Error generating explanation:', error);
            this.showError('Failed to generate explanation');
        } finally {
            this.hideLoading();
        }
    }
    
    async generateSimilar(index) {
        try {
            this.showLoading('Generating similar problems...');
            
            // Generate similar problems using AI
            const prompt = "Generate 3 similar practice problems with solutions";
            const result = await window.AIIntegration.generateContent(prompt, {
                type: 'homework',
                temperature: 0.8
            });
            
            if (result.success) {
                this.showSimilarProblemsModal(result.content);
            } else {
                this.showError('Failed to generate similar problems');
            }
            
        } catch (error) {
            console.error('Error generating similar problems:', error);
            this.showError('Failed to generate similar problems');
        } finally {
            this.hideLoading();
        }
    }
    
    saveSolution(index) {
        const solutionItem = document.querySelector(`[data-index="${index}"]`);
        if (!solutionItem) return;
        
        const solutionData = {
            id: Date.now(),
            content: this.extractSolutionContent(solutionItem),
            timestamp: new Date().toISOString(),
            type: 'homework',
            method: this.currentMethod
        };
        
        const savedSolutions = JSON.parse(localStorage.getItem('saved_homework') || '[]');
        savedSolutions.push(solutionData);
        localStorage.setItem('saved_homework', JSON.stringify(savedSolutions));
        
        this.showSuccess('Homework solution saved!');
    }
    
    shareWithTeacher(index) {
        const solutionItem = document.querySelector(`[data-index="${index}"]`);
        if (!solutionItem) return;
        
        const solutionContent = this.extractSolutionContent(solutionItem);
        
        // Create shareable content
        const shareData = {
            title: 'CBSE AI SmartPath - Homework Solution',
            text: solutionContent,
            url: window.location.href
        };
        
        if (navigator.share) {
            navigator.share(shareData).catch(console.error);
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(solutionContent).then(() => {
                this.showSuccess('Solution copied to clipboard!');
            }).catch(() => {
                this.showError('Failed to copy solution');
            });
        }
    }
    
    extractSolutionContent(solutionElement) {
        // Extract text content from solution element
        const title = solutionElement.querySelector('.solution-title')?.textContent || '';
        const understanding = solutionElement.querySelector('.solution-understanding p')?.textContent || '';
        const steps = Array.from(solutionElement.querySelectorAll('.solution-step')).map(step => step.textContent);
        const answer = solutionElement.querySelector('.answer-box')?.textContent || '';
        
        let content = `${title}\n\n`;
        if (understanding) content += `Problem Analysis:\n${understanding}\n\n`;
        if (steps.length > 0) {
            content += `Solution Steps:\n${steps.join('\n')}\n\n`;
        }
        if (answer) content += `Answer: ${answer}`;
        
        return content;
    }
    
    showExplanationModal(content) {
        const modal = this.createModal('Simple Explanation', content);
        document.body.appendChild(modal);
    }
    
    showSimilarProblemsModal(content) {
        const modal = this.createModal('Similar Practice Problems', content);
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
                    <div class="modal-text">${content}</div>
                </div>
                <div class="modal-footer">
                    <button class="action-btn secondary modal-close-btn">Close</button>
                </div>
            </div>
        `;
        
        // Add close functionality
        const closeButtons = modal.querySelectorAll('.modal-close, .modal-close-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        return modal;
    }
    
    trackHomeworkSolved(method) {
        // Track homework completion for analytics
        const stats = JSON.parse(localStorage.getItem('homework_stats') || '{}');
        
        if (!stats[method]) stats[method] = 0;
        stats[method]++;
        stats.total = (stats.total || 0) + 1;
        stats.lastCompleted = Date.now();
        
        localStorage.setItem('homework_stats', JSON.stringify(stats));
        
        // Award points
        if (window.ProgressManager) {
            window.ProgressManager.awardPoints(CONFIG.POINTS.QUESTION_SOLVED * 2, 'Homework Completed');
        }
    }
    
    // Cleanup
    cleanup() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
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

// Initialize Homework Assistant
window.HomeworkAssistant = new HomeworkAssistant();

// Make it globally accessible for onclick handlers
window.homeworkAssistant = window.HomeworkAssistant;