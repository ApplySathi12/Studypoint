// AI Integration Module
class AIIntegration {
    constructor() {
        this.apiKey = CONFIG.API.GEMINI_KEY;
        this.endpoint = CONFIG.API.GEMINI_ENDPOINT;
        this.requestQueue = [];
        this.isProcessing = false;
        
        this.init();
    }
    
    init() {
        this.setupErrorHandling();
    }
    
    setupErrorHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.message && event.reason.message.includes('AI')) {
                console.error('AI Integration Error:', event.reason);
                this.handleAIError(event.reason);
                event.preventDefault();
            }
        });
    }
    
    async generateContent(prompt, options = {}) {
        try {
            // Check rate limits
            if (!ConfigUtils.checkRateLimit('questions_hour')) {
                throw new Error(CONFIG.ERRORS.RATE_LIMIT_EXCEEDED);
            }
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: this.enhancePrompt(prompt, options)
                    }]
                }],
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    topK: options.topK || 40,
                    topP: options.topP || 0.95,
                    maxOutputTokens: options.maxTokens || 2048,
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            };
            
            const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`AI API Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return {
                    success: true,
                    content: data.candidates[0].content.parts[0].text,
                    usage: data.usageMetadata
                };
            } else {
                throw new Error('Invalid response from AI service');
            }
            
        } catch (error) {
            console.error('AI Generation Error:', error);
            throw error;
        }
    }
    
    enhancePrompt(prompt, options = {}) {
        const { subject, difficulty, language, type } = options;
        
        let enhancedPrompt = '';
        
        // Add context based on type
        switch (type) {
            case 'doubt-solver':
                enhancedPrompt = `You are an expert CBSE tutor helping a Class ${options.class || '9th/10th'} student. `;
                break;
            case 'homework':
                enhancedPrompt = `You are helping a CBSE student solve their homework problem. `;
                break;
            case 'notes':
                enhancedPrompt = `Generate comprehensive study notes for CBSE Class ${options.class || '9th/10th'}. `;
                break;
            case 'test':
                enhancedPrompt = `Create a practice test question for CBSE Class ${options.class || '9th/10th'}. `;
                break;
            default:
                enhancedPrompt = `You are an AI tutor for CBSE students. `;
        }
        
        // Add subject context
        if (subject) {
            const subjectConfig = CONFIG.SUBJECTS[subject];
            if (subjectConfig) {
                enhancedPrompt += `Subject: ${subjectConfig.name}. `;
            }
        }
        
        // Add difficulty context
        if (difficulty) {
            enhancedPrompt += `Difficulty level: ${difficulty}. `;
        }
        
        // Add language preference
        if (language === 'HI') {
            enhancedPrompt += `Provide explanations in both Hindi and English where helpful. `;
        }
        
        // Add specific instructions based on type
        if (type === 'doubt-solver') {
            enhancedPrompt += `Provide a step-by-step solution with clear explanations. Include:
1. Problem understanding
2. Step-by-step solution
3. Final answer
4. Key concepts used
5. Tips to remember

`;
        } else if (type === 'homework') {
            enhancedPrompt += `Provide detailed homework help including:
1. Problem analysis
2. Solution approach
3. Step-by-step working
4. Final answer
5. Similar practice problems

`;
        } else if (type === 'notes') {
            enhancedPrompt += `Create comprehensive notes including:
1. Key concepts
2. Important formulas/facts
3. Examples
4. Practice questions
5. Memory tips

`;
        }
        
        // Add the actual prompt
        enhancedPrompt += `\n\nStudent's question/request: ${prompt}`;
        
        return enhancedPrompt;
    }
    
    async solveDoubt(question, options = {}) {
        try {
            const result = await this.generateContent(question, {
                ...options,
                type: 'doubt-solver'
            });
            
            if (result.success) {
                return {
                    success: true,
                    solution: this.formatSolution(result.content),
                    confidence: this.calculateConfidence(result.content)
                };
            }
            
            throw new Error('Failed to generate solution');
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async analyzeHomework(problem, options = {}) {
        try {
            const result = await this.generateContent(problem, {
                ...options,
                type: 'homework'
            });
            
            if (result.success) {
                return {
                    success: true,
                    solution: this.formatHomeworkSolution(result.content),
                    confidence: this.calculateConfidence(result.content)
                };
            }
            
            throw new Error('Failed to analyze homework');
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async generateNotes(topic, options = {}) {
        try {
            const prompt = `Generate comprehensive study notes for the topic: ${topic}`;
            
            const result = await this.generateContent(prompt, {
                ...options,
                type: 'notes'
            });
            
            if (result.success) {
                return {
                    success: true,
                    notes: this.formatNotes(result.content),
                    mindMap: this.generateMindMapData(result.content)
                };
            }
            
            throw new Error('Failed to generate notes');
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async generateQuiz(subject, topic, options = {}) {
        try {
            const prompt = `Generate a ${options.questionCount || 10} question quiz on ${topic} for ${subject}. 
            Include multiple choice, short answer, and numerical questions as appropriate.
            Provide correct answers and explanations.`;
            
            const result = await this.generateContent(prompt, {
                ...options,
                type: 'test'
            });
            
            if (result.success) {
                return {
                    success: true,
                    quiz: this.parseQuizContent(result.content)
                };
            }
            
            throw new Error('Failed to generate quiz');
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async processImage(imageData, options = {}) {
        try {
            // For image processing, we would typically use Google Vision API
            // or similar OCR service, then pass the extracted text to Gemini
            
            const extractedText = await this.extractTextFromImage(imageData);
            
            if (extractedText) {
                return await this.solveDoubt(extractedText, options);
            }
            
            throw new Error('Could not extract text from image');
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async extractTextFromImage(imageData) {
        // Placeholder for OCR functionality
        // In a real implementation, this would use Google Vision API or similar
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve("Sample extracted text from image");
            }, 1000);
        });
    }
    
    formatSolution(content) {
        // Parse and format the AI response into structured solution
        const lines = content.split('\n').filter(line => line.trim());
        const solution = {
            understanding: '',
            steps: [],
            answer: '',
            concepts: [],
            tips: []
        };
        
        let currentSection = 'understanding';
        let stepCounter = 0;
        
        lines.forEach(line => {
            const trimmed = line.trim();
            
            if (trimmed.toLowerCase().includes('step') || /^\d+\./.test(trimmed)) {
                currentSection = 'steps';
                stepCounter++;
                solution.steps.push({
                    number: stepCounter,
                    description: trimmed.replace(/^\d+\.\s*/, '').replace(/^step\s*\d*:?\s*/i, '')
                });
            } else if (trimmed.toLowerCase().includes('answer') || trimmed.toLowerCase().includes('final')) {
                currentSection = 'answer';
                solution.answer = trimmed.replace(/^(answer|final answer):?\s*/i, '');
            } else if (trimmed.toLowerCase().includes('concept') || trimmed.toLowerCase().includes('key')) {
                currentSection = 'concepts';
                solution.concepts.push(trimmed.replace(/^(concept|key concepts?):?\s*/i, ''));
            } else if (trimmed.toLowerCase().includes('tip') || trimmed.toLowerCase().includes('remember')) {
                currentSection = 'tips';
                solution.tips.push(trimmed.replace(/^(tip|remember):?\s*/i, ''));
            } else if (currentSection === 'understanding' && !solution.understanding) {
                solution.understanding = trimmed;
            }
        });
        
        return solution;
    }
    
    formatHomeworkSolution(content) {
        // Similar to formatSolution but optimized for homework
        return this.formatSolution(content);
    }
    
    formatNotes(content) {
        // Parse notes content into structured format
        const sections = content.split('\n\n').filter(section => section.trim());
        
        return {
            title: sections[0] || 'Study Notes',
            sections: sections.slice(1).map((section, index) => ({
                id: `section_${index}`,
                title: this.extractSectionTitle(section),
                content: section,
                type: this.determineSectionType(section)
            }))
        };
    }
    
    extractSectionTitle(section) {
        const lines = section.split('\n');
        const firstLine = lines[0].trim();
        
        // Look for title patterns
        if (firstLine.includes(':') || firstLine.length < 50) {
            return firstLine.replace(/[:#]/g, '').trim();
        }
        
        return `Section ${Math.floor(Math.random() * 100)}`;
    }
    
    determineSectionType(section) {
        const content = section.toLowerCase();
        
        if (content.includes('formula') || content.includes('equation')) {
            return 'formula';
        } else if (content.includes('example') || content.includes('problem')) {
            return 'example';
        } else if (content.includes('definition') || content.includes('concept')) {
            return 'concept';
        } else {
            return 'general';
        }
    }
    
    generateMindMapData(content) {
        // Generate mind map structure from content
        const lines = content.split('\n').filter(line => line.trim());
        const mindMap = {
            central: 'Topic',
            branches: []
        };
        
        let currentBranch = null;
        
        lines.forEach(line => {
            const trimmed = line.trim();
            
            if (trimmed.includes(':') || /^\d+\./.test(trimmed)) {
                currentBranch = {
                    title: trimmed.replace(/[:\d\.]/g, '').trim(),
                    items: []
                };
                mindMap.branches.push(currentBranch);
            } else if (currentBranch && trimmed.startsWith('-')) {
                currentBranch.items.push(trimmed.replace(/^-\s*/, ''));
            }
        });
        
        return mindMap;
    }
    
    parseQuizContent(content) {
        // Parse quiz content into structured questions
        const questions = [];
        const sections = content.split(/Question\s*\d+/i).filter(section => section.trim());
        
        sections.forEach((section, index) => {
            if (index === 0) return; // Skip intro text
            
            const lines = section.split('\n').filter(line => line.trim());
            const question = {
                id: `q_${index}`,
                question: '',
                type: 'mcq',
                options: [],
                correctAnswer: '',
                explanation: ''
            };
            
            let currentSection = 'question';
            
            lines.forEach(line => {
                const trimmed = line.trim();
                
                if (trimmed.match(/^[a-d]\)/i)) {
                    currentSection = 'options';
                    question.options.push(trimmed.substring(2).trim());
                } else if (trimmed.toLowerCase().includes('answer')) {
                    currentSection = 'answer';
                    question.correctAnswer = trimmed.replace(/^answer:?\s*/i, '');
                } else if (trimmed.toLowerCase().includes('explanation')) {
                    currentSection = 'explanation';
                    question.explanation = trimmed.replace(/^explanation:?\s*/i, '');
                } else if (currentSection === 'question') {
                    question.question += (question.question ? ' ' : '') + trimmed;
                } else if (currentSection === 'explanation') {
                    question.explanation += ' ' + trimmed;
                }
            });
            
            if (question.question) {
                questions.push(question);
            }
        });
        
        return {
            questions,
            totalQuestions: questions.length,
            timeLimit: questions.length * 2 // 2 minutes per question
        };
    }
    
    calculateConfidence(content) {
        // Calculate confidence score based on content quality
        let score = 0.5; // Base score
        
        // Check for structured content
        if (content.includes('Step') || content.includes('step')) score += 0.1;
        if (content.includes('Answer') || content.includes('answer')) score += 0.1;
        if (content.includes('Formula') || content.includes('formula')) score += 0.1;
        if (content.includes('Example') || content.includes('example')) score += 0.1;
        
        // Check content length (longer usually means more detailed)
        if (content.length > 500) score += 0.1;
        if (content.length > 1000) score += 0.1;
        
        // Check for mathematical expressions
        if (content.match(/[=+\-*/()]/)) score += 0.05;
        
        // Check for proper formatting
        if (content.includes('\n')) score += 0.05;
        
        return Math.min(score, 0.95); // Cap at 95%
    }
    
    async explainSimple(content, options = {}) {
        try {
            const prompt = `Explain this in very simple terms that a 12-year-old can understand. Use analogies and simple examples:

${content}

Make it fun and easy to understand while keeping it accurate.`;
            
            const result = await this.generateContent(prompt, {
                ...options,
                temperature: 0.8
            });
            
            return result;
            
        } catch (error) {
            throw new Error('Failed to generate simple explanation');
        }
    }
    
    async generateStepByStep(content, options = {}) {
        try {
            const prompt = `Break down this solution into clear, numbered steps:

${content}

Each step should be:
1. Clear and specific
2. Easy to follow
3. Include the reasoning
4. Show calculations if applicable`;
            
            const result = await this.generateContent(prompt, {
                ...options,
                temperature: 0.6
            });
            
            return result;
            
        } catch (error) {
            throw new Error('Failed to generate step-by-step explanation');
        }
    }
    
    async translateContent(content, targetLanguage = 'HI') {
        try {
            const languageName = targetLanguage === 'HI' ? 'Hindi' : 'English';
            const prompt = `Translate this educational content to ${languageName} while maintaining technical accuracy:

${content}

Keep mathematical expressions and formulas in their original form.`;
            
            const result = await this.generateContent(prompt, {
                temperature: 0.3
            });
            
            return result;
            
        } catch (error) {
            throw new Error('Failed to translate content');
        }
    }
    
    handleAIError(error) {
        console.error('AI Error:', error);
        
        let userMessage = CONFIG.ERRORS.AI_ERROR;
        
        if (error.message.includes('rate limit') || error.message.includes('quota')) {
            userMessage = CONFIG.ERRORS.RATE_LIMIT_EXCEEDED;
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            userMessage = CONFIG.ERRORS.NETWORK_ERROR;
        }
        
        if (window.NotificationManager) {
            window.NotificationManager.show(userMessage, 'error');
        }
    }
    
    // Queue management for handling multiple requests
    async addToQueue(request) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ request, resolve, reject });
            this.processQueue();
        });
    }
    
    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }
        
        this.isProcessing = true;
        
        while (this.requestQueue.length > 0) {
            const { request, resolve, reject } = this.requestQueue.shift();
            
            try {
                const result = await request();
                resolve(result);
            } catch (error) {
                reject(error);
            }
            
            // Add delay between requests to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        this.isProcessing = false;
    }
    
    // Public methods for different AI features
    async askQuestion(question, subject, difficulty = 'medium') {
        return this.addToQueue(() => 
            this.solveDoubt(question, { subject, difficulty, type: 'doubt-solver' })
        );
    }
    
    async solveHomework(problem, subject) {
        return this.addToQueue(() => 
            this.analyzeHomework(problem, { subject, type: 'homework' })
        );
    }
    
    async createNotes(topic, subject) {
        return this.addToQueue(() => 
            this.generateNotes(topic, { subject, type: 'notes' })
        );
    }
    
    async createQuiz(subject, topic, questionCount = 10) {
        return this.addToQueue(() => 
            this.generateQuiz(subject, topic, { questionCount, type: 'test' })
        );
    }
    
    async processImageQuestion(imageData, subject) {
        return this.addToQueue(() => 
            this.processImage(imageData, { subject, type: 'doubt-solver' })
        );
    }
}

// Initialize AI Integration
window.AIIntegration = new AIIntegration();