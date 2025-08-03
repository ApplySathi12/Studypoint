// Smart Notes Module
class SmartNotes {
    constructor() {
        this.currentNoteType = 'summary';
        this.selectedSubjects = ['mathematics', 'science', 'social-studies', 'english', 'hindi'];
        this.notes = [];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadNotes();
        this.setupFilters();
    }
    
    bindEvents() {
        // Subject filters
        const filterItems = document.querySelectorAll('.filter-item input');
        filterItems.forEach(filter => {
            filter.addEventListener('change', (e) => this.handleSubjectFilter(e));
        });
        
        // Note type buttons
        const typeButtons = document.querySelectorAll('.type-btn');
        typeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchNoteType(e.target.dataset.type));
        });
        
        // Search functionality
        const searchInput = document.getElementById('notes-search');
        if (searchInput) {
            searchInput.addEventListener('input', ConfigUtils.debounce((e) => {
                this.searchNotes(e.target.value);
            }, 300));
        }
        
        // Toolbar actions
        const generateBtn = document.getElementById('generate-notes');
        const mindmapBtn = document.getElementById('create-mindmap');
        
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.showGenerateNotesDialog());
        }
        
        if (mindmapBtn) {
            mindmapBtn.addEventListener('click', () => this.showCreateMindmapDialog());
        }
    }
    
    setupFilters() {
        // Initialize filter states
        this.selectedSubjects = ['mathematics', 'science', 'social-studies', 'english', 'hindi'];
        this.updateNotesDisplay();
    }
    
    handleSubjectFilter(event) {
        const subject = event.target.value;
        const isChecked = event.target.checked;
        
        if (isChecked) {
            if (!this.selectedSubjects.includes(subject)) {
                this.selectedSubjects.push(subject);
            }
        } else {
            this.selectedSubjects = this.selectedSubjects.filter(s => s !== subject);
        }
        
        this.updateNotesDisplay();
    }
    
    switchNoteType(type) {
        this.currentNoteType = type;
        
        // Update button appearance
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        
        this.updateNotesDisplay();
    }
    
    searchNotes(query) {
        this.searchQuery = query.toLowerCase();
        this.updateNotesDisplay();
    }
    
    loadNotes() {
        // Load notes from localStorage
        const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.NOTES);
        this.notes = stored ? JSON.parse(stored) : this.getDefaultNotes();
        
        this.updateNotesDisplay();
    }
    
    getDefaultNotes() {
        // Default sample notes
        return [
            {
                id: 'note_1',
                title: 'Quadratic Equations',
                subject: 'mathematics',
                type: 'summary',
                content: 'A quadratic equation is a polynomial equation of degree 2...',
                tags: ['algebra', 'equations', 'polynomials'],
                createdAt: Date.now() - 86400000,
                updatedAt: Date.now() - 86400000
            },
            {
                id: 'note_2',
                title: 'Light and Reflection',
                subject: 'science',
                type: 'summary',
                content: 'Light is a form of energy that enables us to see...',
                tags: ['physics', 'optics', 'reflection'],
                createdAt: Date.now() - 172800000,
                updatedAt: Date.now() - 172800000
            },
            {
                id: 'note_3',
                title: 'Democracy Concepts',
                subject: 'social-studies',
                type: 'mindmap',
                content: 'Democracy is a form of government...',
                tags: ['civics', 'government', 'politics'],
                createdAt: Date.now() - 259200000,
                updatedAt: Date.now() - 259200000
            }
        ];
    }
    
    updateNotesDisplay() {
        const notesGrid = document.getElementById('notes-grid');
        if (!notesGrid) return;
        
        // Filter notes
        let filteredNotes = this.notes.filter(note => {
            // Subject filter
            if (!this.selectedSubjects.includes(note.subject)) return false;
            
            // Type filter
            if (note.type !== this.currentNoteType) return false;
            
            // Search filter
            if (this.searchQuery) {
                const searchText = `${note.title} ${note.content} ${note.tags.join(' ')}`.toLowerCase();
                if (!searchText.includes(this.searchQuery)) return false;
            }
            
            return true;
        });
        
        // Sort by updated date
        filteredNotes.sort((a, b) => b.updatedAt - a.updatedAt);
        
        // Render notes
        if (filteredNotes.length === 0) {
            notesGrid.innerHTML = this.getEmptyStateHTML();
        } else {
            notesGrid.innerHTML = filteredNotes.map(note => this.createNoteCardHTML(note)).join('');
        }
        
        // Bind note card events
        this.bindNoteCardEvents();
    }
    
    createNoteCardHTML(note) {
        const subject = CONFIG.SUBJECTS[note.subject];
        const subjectName = subject ? subject.name : note.subject;
        const subjectIcon = subject ? subject.icon : 'fas fa-book';
        const subjectColor = subject ? subject.color : '#6b7280';
        
        const timeAgo = this.getTimeAgo(note.updatedAt);
        
        return `
            <div class="note-card" data-note-id="${note.id}">
                <div class="note-header">
                    <div class="note-subject">
                        <i class="${subjectIcon}" style="color: ${subjectColor}"></i>
                        <span>${subjectName}</span>
                    </div>
                    <div class="note-type">
                        <i class="${this.getNoteTypeIcon(note.type)}"></i>
                    </div>
                </div>
                
                <h4>${note.title}</h4>
                <p>${this.truncateContent(note.content, 100)}</p>
                
                <div class="note-tags">
                    ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                
                <div class="note-meta">
                    <span class="note-date">${timeAgo}</span>
                    <div class="note-actions">
                        <button class="note-action-btn" data-action="view" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="note-action-btn" data-action="edit" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="note-action-btn" data-action="share" title="Share">
                            <i class="fas fa-share"></i>
                        </button>
                        <button class="note-action-btn" data-action="delete" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    getNoteTypeIcon(type) {
        const icons = {
            summary: 'fas fa-file-alt',
            mindmap: 'fas fa-project-diagram',
            flashcards: 'fas fa-clone',
            formulas: 'fas fa-calculator'
        };
        
        return icons[type] || 'fas fa-file-alt';
    }
    
    truncateContent(content, maxLength) {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    }
    
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }
    
    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-sticky-note"></i>
                <h3>No notes found</h3>
                <p>Generate your first AI-powered notes to get started!</p>
                <button class="action-btn primary" onclick="smartNotes.showGenerateNotesDialog()">
                    <i class="fas fa-magic"></i>
                    Generate Notes
                </button>
            </div>
        `;
    }
    
    bindNoteCardEvents() {
        const noteCards = document.querySelectorAll('.note-card');
        
        noteCards.forEach(card => {
            // Card click to view
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.note-action-btn')) {
                    this.viewNote(card.dataset.noteId);
                }
            });
            
            // Action buttons
            const actionBtns = card.querySelectorAll('.note-action-btn');
            actionBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    const noteId = card.dataset.noteId;
                    this.handleNoteAction(action, noteId);
                });
            });
        });
    }
    
    handleNoteAction(action, noteId) {
        switch (action) {
            case 'view':
                this.viewNote(noteId);
                break;
            case 'edit':
                this.editNote(noteId);
                break;
            case 'share':
                this.shareNote(noteId);
                break;
            case 'delete':
                this.deleteNote(noteId);
                break;
        }
    }
    
    viewNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;
        
        const modal = this.createNoteViewModal(note);
        document.body.appendChild(modal);
    }
    
    createNoteViewModal(note) {
        const subject = CONFIG.SUBJECTS[note.subject];
        const subjectName = subject ? subject.name : note.subject;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay note-modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <div class="note-modal-title">
                        <h3>${note.title}</h3>
                        <div class="note-modal-meta">
                            <span class="subject-badge">${subjectName}</span>
                            <span class="type-badge">${note.type}</span>
                        </div>
                    </div>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="note-content">
                        ${this.formatNoteContent(note)}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="action-btn secondary" onclick="smartNotes.editNote('${note.id}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="action-btn secondary" onclick="smartNotes.shareNote('${note.id}')">
                        <i class="fas fa-share"></i>
                        Share
                    </button>
                    <button class="action-btn primary modal-close-btn">
                        <i class="fas fa-times"></i>
                        Close
                    </button>
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
    
    formatNoteContent(note) {
        if (note.type === 'mindmap') {
            return this.renderMindMap(note.content);
        } else if (note.type === 'flashcards') {
            return this.renderFlashcards(note.content);
        } else if (note.type === 'formulas') {
            return this.renderFormulas(note.content);
        } else {
            return this.renderSummaryNotes(note.content);
        }
    }
    
    renderSummaryNotes(content) {
        // Convert markdown-like content to HTML
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }
    
    renderMindMap(content) {
        // Simple mind map visualization
        try {
            const mindMapData = typeof content === 'string' ? JSON.parse(content) : content;
            
            let html = `<div class="mindmap-container">
                <div class="mindmap-central">${mindMapData.central || 'Topic'}</div>
                <div class="mindmap-branches">`;
            
            if (mindMapData.branches) {
                mindMapData.branches.forEach(branch => {
                    html += `
                        <div class="mindmap-branch">
                            <h4>${branch.title}</h4>
                            <ul>
                                ${branch.items.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                });
            }
            
            html += `</div></div>`;
            return html;
            
        } catch (error) {
            return this.renderSummaryNotes(content);
        }
    }
    
    renderFlashcards(content) {
        // Render flashcards interface
        try {
            const flashcards = typeof content === 'string' ? JSON.parse(content) : content;
            
            let html = `<div class="flashcards-container">`;
            
            if (Array.isArray(flashcards)) {
                flashcards.forEach((card, index) => {
                    html += `
                        <div class="flashcard" data-index="${index}">
                            <div class="flashcard-front">
                                <h4>Question</h4>
                                <p>${card.question}</p>
                            </div>
                            <div class="flashcard-back">
                                <h4>Answer</h4>
                                <p>${card.answer}</p>
                            </div>
                        </div>
                    `;
                });
            }
            
            html += `</div>`;
            return html;
            
        } catch (error) {
            return this.renderSummaryNotes(content);
        }
    }
    
    renderFormulas(content) {
        // Render formula sheets
        return `
            <div class="formulas-container">
                <div class="formulas-content">
                    ${this.renderSummaryNotes(content)}
                </div>
            </div>
        `;
    }
    
    showGenerateNotesDialog() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Generate Smart Notes</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="generate-notes-form">
                        <div class="form-group">
                            <label for="note-subject">Subject</label>
                            <select id="note-subject" required>
                                <option value="">Select Subject</option>
                                ${Object.entries(CONFIG.SUBJECTS).map(([id, subject]) => 
                                    `<option value="${id}">${subject.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="note-topic">Topic</label>
                            <input type="text" id="note-topic" placeholder="Enter topic name" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="note-type-select">Note Type</label>
                            <select id="note-type-select" required>
                                <option value="summary">Summary Notes</option>
                                <option value="mindmap">Mind Map</option>
                                <option value="flashcards">Flashcards</option>
                                <option value="formulas">Formula Sheet</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="note-difficulty">Difficulty Level</label>
                            <select id="note-difficulty">
                                <option value="easy">Easy</option>
                                <option value="medium" selected>Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="note-language">Language</label>
                            <select id="note-language">
                                <option value="EN">English</option>
                                <option value="HI">Hindi + English</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="action-btn secondary modal-close-btn">Cancel</button>
                    <button class="action-btn primary" onclick="smartNotes.generateNotes()">
                        <i class="fas fa-magic"></i>
                        Generate Notes
                    </button>
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
        
        document.body.appendChild(modal);
    }
    
    async generateNotes() {
        const form = document.getElementById('generate-notes-form');
        const formData = new FormData(form);
        
        const subject = document.getElementById('note-subject').value;
        const topic = document.getElementById('note-topic').value;
        const type = document.getElementById('note-type-select').value;
        const difficulty = document.getElementById('note-difficulty').value;
        const language = document.getElementById('note-language').value;
        
        if (!subject || !topic) {
            this.showError('Please fill in all required fields');
            return;
        }
        
        try {
            this.showLoading('Generating smart notes...');
            
            const result = await window.AIIntegration.createNotes(topic, subject, {
                type,
                difficulty,
                language,
                class: '9th/10th'
            });
            
            if (result.success) {
                const note = {
                    id: `note_${Date.now()}`,
                    title: topic,
                    subject,
                    type,
                    content: result.notes.sections ? this.formatNoteSections(result.notes.sections) : result.notes,
                    tags: this.extractTags(topic, subject),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    difficulty,
                    language
                };
                
                this.notes.unshift(note);
                this.saveNotes();
                this.updateNotesDisplay();
                
                // Close modal
                document.querySelector('.modal-overlay').remove();
                
                this.showSuccess(CONFIG.SUCCESS.NOTE_GENERATED);
                
                // Award points
                if (window.ProgressManager) {
                    window.ProgressManager.awardPoints(CONFIG.POINTS.QUESTION_SOLVED, 'Notes Generated');
                }
                
            } else {
                this.showError(result.error || 'Failed to generate notes');
            }
            
        } catch (error) {
            console.error('Error generating notes:', error);
            this.showError('Failed to generate notes');
        } finally {
            this.hideLoading();
        }
    }
    
    formatNoteSections(sections) {
        return sections.map(section => {
            let content = `## ${section.title}\n\n${section.content}\n\n`;
            return content;
        }).join('');
    }
    
    extractTags(topic, subject) {
        const topicWords = topic.toLowerCase().split(' ');
        const subjectConfig = CONFIG.SUBJECTS[subject];
        const subjectTopics = subjectConfig ? subjectConfig.topics : [];
        
        const tags = [...topicWords];
        
        // Add related subject topics
        subjectTopics.forEach(subjectTopic => {
            if (subjectTopic.toLowerCase().includes(topic.toLowerCase()) || 
                topic.toLowerCase().includes(subjectTopic.toLowerCase())) {
                tags.push(subjectTopic.toLowerCase().replace(/\s+/g, '-'));
            }
        });
        
        return [...new Set(tags)].slice(0, 5); // Limit to 5 unique tags
    }
    
    showCreateMindmapDialog() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Create Mind Map</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="create-mindmap-form">
                        <div class="form-group">
                            <label for="mindmap-subject">Subject</label>
                            <select id="mindmap-subject" required>
                                <option value="">Select Subject</option>
                                ${Object.entries(CONFIG.SUBJECTS).map(([id, subject]) => 
                                    `<option value="${id}">${subject.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="mindmap-topic">Central Topic</label>
                            <input type="text" id="mindmap-topic" placeholder="Enter main topic" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="mindmap-subtopics">Subtopics (optional)</label>
                            <textarea id="mindmap-subtopics" placeholder="Enter subtopics, one per line" rows="4"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="action-btn secondary modal-close-btn">Cancel</button>
                    <button class="action-btn primary" onclick="smartNotes.createMindMap()">
                        <i class="fas fa-project-diagram"></i>
                        Create Mind Map
                    </button>
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
    
    async createMindMap() {
        const subject = document.getElementById('mindmap-subject').value;
        const topic = document.getElementById('mindmap-topic').value;
        const subtopics = document.getElementById('mindmap-subtopics').value;
        
        if (!subject || !topic) {
            this.showError('Please fill in required fields');
            return;
        }
        
        try {
            this.showLoading('Creating mind map...');
            
            let prompt = `Create a comprehensive mind map for the topic: ${topic}`;
            if (subtopics) {
                prompt += `\n\nInclude these subtopics: ${subtopics}`;
            }
            
            const result = await window.AIIntegration.createNotes(prompt, subject, {
                type: 'mindmap',
                class: '9th/10th'
            });
            
            if (result.success) {
                const mindMapNote = {
                    id: `mindmap_${Date.now()}`,
                    title: `${topic} - Mind Map`,
                    subject,
                    type: 'mindmap',
                    content: result.mindMap || result.notes,
                    tags: this.extractTags(topic, subject),
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                
                this.notes.unshift(mindMapNote);
                this.saveNotes();
                this.updateNotesDisplay();
                
                // Close modal
                document.querySelector('.modal-overlay').remove();
                
                this.showSuccess('Mind map created successfully!');
                
            } else {
                this.showError(result.error || 'Failed to create mind map');
            }
            
        } catch (error) {
            console.error('Error creating mind map:', error);
            this.showError('Failed to create mind map');
        } finally {
            this.hideLoading();
        }
    }
    
    editNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;
        
        // Create edit modal
        const modal = this.createEditNoteModal(note);
        document.body.appendChild(modal);
    }
    
    createEditNoteModal(note) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>Edit Note</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="edit-note-form">
                        <div class="form-group">
                            <label for="edit-note-title">Title</label>
                            <input type="text" id="edit-note-title" value="${note.title}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-note-content">Content</label>
                            <textarea id="edit-note-content" rows="10" required>${note.content}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-note-tags">Tags (comma-separated)</label>
                            <input type="text" id="edit-note-tags" value="${note.tags.join(', ')}">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="action-btn secondary modal-close-btn">Cancel</button>
                    <button class="action-btn primary" onclick="smartNotes.saveEditedNote('${note.id}')">
                        <i class="fas fa-save"></i>
                        Save Changes
                    </button>
                </div>
            </div>
        `;
        
        // Add close functionality
        const closeButtons = modal.querySelectorAll('.modal-close, .modal-close-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        return modal;
    }
    
    saveEditedNote(noteId) {
        const title = document.getElementById('edit-note-title').value;
        const content = document.getElementById('edit-note-content').value;
        const tags = document.getElementById('edit-note-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        
        if (!title || !content) {
            this.showError('Please fill in all required fields');
            return;
        }
        
        const noteIndex = this.notes.findIndex(n => n.id === noteId);
        if (noteIndex === -1) return;
        
        this.notes[noteIndex] = {
            ...this.notes[noteIndex],
            title,
            content,
            tags,
            updatedAt: Date.now()
        };
        
        this.saveNotes();
        this.updateNotesDisplay();
        
        // Close modal
        document.querySelector('.modal-overlay').remove();
        
        this.showSuccess('Note updated successfully!');
    }
    
    shareNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;
        
        const shareContent = `${note.title}\n\n${note.content}`;
        
        if (navigator.share) {
            navigator.share({
                title: note.title,
                text: shareContent,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareContent).then(() => {
                this.showSuccess('Note copied to clipboard!');
            }).catch(() => {
                this.showError('Failed to copy note');
            });
        }
    }
    
    deleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this note?')) {
            return;
        }
        
        this.notes = this.notes.filter(n => n.id !== noteId);
        this.saveNotes();
        this.updateNotesDisplay();
        
        this.showSuccess('Note deleted successfully!');
    }
    
    saveNotes() {
        localStorage.setItem(CONFIG.STORAGE_KEYS.NOTES, JSON.stringify(this.notes));
    }
    
    // Export/Import functionality
    exportNotes() {
        const dataStr = JSON.stringify(this.notes, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `cbse-ai-notes-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showSuccess('Notes exported successfully!');
    }
    
    importNotes(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importedNotes = JSON.parse(e.target.result);
                
                if (Array.isArray(importedNotes)) {
                    // Merge with existing notes
                    this.notes = [...this.notes, ...importedNotes];
                    this.saveNotes();
                    this.updateNotesDisplay();
                    
                    this.showSuccess(`Imported ${importedNotes.length} notes successfully!`);
                } else {
                    this.showError('Invalid notes file format');
                }
                
            } catch (error) {
                console.error('Error importing notes:', error);
                this.showError('Failed to import notes');
            }
        };
        
        reader.readAsText(file);
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

// Initialize Smart Notes
window.SmartNotes = new SmartNotes();

// Make it globally accessible
window.smartNotes = window.SmartNotes;