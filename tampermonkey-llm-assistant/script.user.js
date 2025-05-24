// ==UserScript==
// @name         LLM Text Assistant
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Enhance browsing and writing with automatic text rewriting using LLMs via Ollama
// @author       You
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Configuration and State Management
    class LLMAssistant {
        constructor() {
            this.isOpen = false;
            this.settings = this.loadSettings();
            this.activeElement = null;
            this.isProcessing = false;
            
            // Initialize the assistant
            this.init();
        }

        // Default settings
        getDefaultSettings() {
            return {
                ollama_model: "llama2",
                rewrite_mode: "grammar",
                persona_name: "Donald Trump",
                bionic_mode: false,
                dark_mode: false,
                auto_rewrite: false,
                ollama_url: "http://localhost:11434"
            };
        }

        // Load settings from localStorage
        loadSettings() {
            try {
                const saved = localStorage.getItem('llm_assistant_settings');
                return saved ? { ...this.getDefaultSettings(), ...JSON.parse(saved) } : this.getDefaultSettings();
            } catch (e) {
                console.error('Failed to load settings:', e);
                return this.getDefaultSettings();
            }
        }

        // Save settings to localStorage
        saveSettings() {
            try {
                localStorage.setItem('llm_assistant_settings', JSON.stringify(this.settings));
            } catch (e) {
                console.error('Failed to save settings:', e);
            }
        }        // Initialize the assistant
        async init() {
            this.injectStyles();
            this.createUI();
            this.attachEventListeners();
            this.applyTheme();
            this.applyBionicReading();
            await this.loadAvailableModels();
        }

        // Inject CSS styles
        injectStyles() {
            const styles = `
                .llm-assistant-toggle {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    z-index: 10000;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 24px;
                }

                .llm-assistant-toggle:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 25px rgba(0,0,0,0.4);
                }

                .llm-assistant-panel {
                    position: fixed;
                    bottom: 90px;
                    right: 20px;
                    width: 350px;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    z-index: 10001;
                    transform: translateY(20px);
                    opacity: 0;
                    transition: all 0.3s ease;
                    pointer-events: none;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .llm-assistant-panel.open {
                    transform: translateY(0);
                    opacity: 1;
                    pointer-events: all;
                }

                .llm-assistant-header {
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .llm-assistant-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #333;
                    margin: 0;
                }

                .llm-assistant-close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #666;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .llm-assistant-content {
                    padding: 20px;
                    max-height: 400px;
                    overflow-y: auto;
                }

                .llm-setting-group {
                    margin-bottom: 20px;
                }

                .llm-setting-label {
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: #333;
                    margin-bottom: 8px;
                }

                .llm-select {
                    width: 100%;
                    padding: 10px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: border-color 0.2s;
                }

                .llm-select:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .llm-toggle {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid #f0f0f0;
                }

                .llm-toggle:last-child {
                    border-bottom: none;
                }

                .llm-toggle-label {
                    font-size: 14px;
                    color: #333;
                    font-weight: 500;
                }

                .llm-switch {
                    position: relative;
                    width: 50px;
                    height: 24px;
                }

                .llm-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .llm-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: 0.4s;
                    border-radius: 34px;
                }

                .llm-slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: 0.4s;
                    border-radius: 50%;
                }

                input:checked + .llm-slider {
                    background-color: #667eea;
                }

                input:checked + .llm-slider:before {
                    transform: translateX(26px);
                }

                .llm-rewrite-btn {
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity 0.2s;
                    margin-top: 10px;
                }

                .llm-rewrite-btn:hover {
                    opacity: 0.9;
                }                .llm-rewrite-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .llm-refresh-models {
                    transition: background-color 0.2s;
                }

                .llm-refresh-models:hover {
                    background-color: #e9ecef !important;
                }

                .llm-models-error {
                    color: #e74c3c;
                    font-size: 12px;
                    margin-top: 5px;
                }

                .llm-models-success {
                    color: #27ae60;
                    font-size: 12px;
                    margin-top: 5px;
                }

                .llm-status {
                    font-size: 12px;
                    color: #666;
                    margin-top: 10px;
                    text-align: center;
                }

                .llm-processing {
                    color: #667eea;
                }

                .llm-error {
                    color: #e74c3c;
                }

                .llm-success {
                    color: #27ae60;
                }

                /* Dark Mode Styles */
                .llm-dark .llm-assistant-panel {
                    background: #2c3e50;
                    color: white;
                }

                .llm-dark .llm-assistant-header {
                    border-bottom-color: #34495e;
                }

                .llm-dark .llm-assistant-title,
                .llm-dark .llm-setting-label,
                .llm-dark .llm-toggle-label {
                    color: white;
                }

                .llm-dark .llm-select {
                    background: #34495e;
                    border-color: #4a5f7a;
                    color: white;
                }

                .llm-dark .llm-toggle {
                    border-bottom-color: #34495e;
                }

                /* Bionic Reading Styles */
                .bionic-reading {
                    font-family: inherit !important;
                }

                .bionic-reading b {
                    font-weight: bold !important;
                }

                /* Processing indicator */
                .llm-processing-indicator {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #667eea;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 25px;
                    font-size: 14px;
                    z-index: 10002;
                    animation: pulse 1.5s ease-in-out infinite alternate;
                }

                @keyframes pulse {
                    from { opacity: 0.7; }
                    to { opacity: 1; }
                }
            `;

            const styleElement = document.createElement('style');
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);
        }

        // Create the UI elements
        createUI() {
            // Toggle button
            this.toggleButton = document.createElement('button');
            this.toggleButton.className = 'llm-assistant-toggle';
            this.toggleButton.innerHTML = '🧠';
            this.toggleButton.title = 'LLM Assistant';

            // Settings panel
            this.panel = document.createElement('div');
            this.panel.className = 'llm-assistant-panel';
            this.panel.innerHTML = `
                <div class="llm-assistant-header">
                    <h3 class="llm-assistant-title">🧠 LLM Assistant</h3>
                    <button class="llm-assistant-close">×</button>
                </div>
                <div class="llm-assistant-content">                    <div class="llm-setting-group">
                        <label class="llm-setting-label">Ollama Model</label>
                        <select class="llm-select" id="llm-model">
                            <option value="">Loading models...</option>
                        </select>
                        <button class="llm-refresh-models" id="refresh-models" style="margin-top: 5px; padding: 5px 10px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            🔄 Refresh Models
                        </button>
                    </div>

                    <div class="llm-setting-group">
                        <label class="llm-setting-label">Rewrite Mode</label>
                        <select class="llm-select" id="llm-rewrite-mode">
                            <option value="grammar">Grammar & Spelling</option>
                            <option value="dont_lie">Don't Lie Mode</option>
                            <option value="facts_only">Facts Only</option>
                            <option value="persona">Persona Imitation</option>
                        </select>
                    </div>

                    <div class="llm-setting-group" id="persona-group" style="display: none;">
                        <label class="llm-setting-label">Persona</label>
                        <select class="llm-select" id="llm-persona">
                            <option value="Donald Trump">Donald Trump</option>
                            <option value="Elon Musk">Elon Musk</option>
                            <option value="Barack Obama">Barack Obama</option>
                            <option value="Shakespeare">Shakespeare</option>
                            <option value="Yoda">Yoda</option>
                        </select>
                    </div>

                    <div class="llm-setting-group">
                        <div class="llm-toggle">
                            <span class="llm-toggle-label">Auto Rewrite</span>
                            <label class="llm-switch">
                                <input type="checkbox" id="auto-rewrite">
                                <span class="llm-slider"></span>
                            </label>
                        </div>
                        <div class="llm-toggle">
                            <span class="llm-toggle-label">Bionic Reading</span>
                            <label class="llm-switch">
                                <input type="checkbox" id="bionic-mode">
                                <span class="llm-slider"></span>
                            </label>
                        </div>
                        <div class="llm-toggle">
                            <span class="llm-toggle-label">Dark Mode</span>
                            <label class="llm-switch">
                                <input type="checkbox" id="dark-mode">
                                <span class="llm-slider"></span>
                            </label>
                        </div>
                    </div>

                    <button class="llm-rewrite-btn" id="manual-rewrite">
                        Rewrite Selected Text
                    </button>

                    <div class="llm-status" id="llm-status"></div>
                </div>
            `;

            document.body.appendChild(this.toggleButton);
            document.body.appendChild(this.panel);

            this.loadUISettings();
        }        // Load settings into UI
        loadUISettings() {
            // Model will be set after loading available models
            document.getElementById('llm-rewrite-mode').value = this.settings.rewrite_mode;
            document.getElementById('llm-persona').value = this.settings.persona_name;
            document.getElementById('auto-rewrite').checked = this.settings.auto_rewrite;
            document.getElementById('bionic-mode').checked = this.settings.bionic_mode;
            document.getElementById('dark-mode').checked = this.settings.dark_mode;

            this.togglePersonaGroup();
        }

        // Show/hide persona selection based on rewrite mode
        togglePersonaGroup() {
            const personaGroup = document.getElementById('persona-group');
            const rewriteMode = document.getElementById('llm-rewrite-mode').value;
            personaGroup.style.display = rewriteMode === 'persona' ? 'block' : 'none';
        }

        // Attach event listeners
        attachEventListeners() {
            // Toggle button
            this.toggleButton.addEventListener('click', () => this.togglePanel());

            // Close button
            this.panel.querySelector('.llm-assistant-close').addEventListener('click', () => this.closePanel());

            // Settings changes
            document.getElementById('llm-model').addEventListener('change', (e) => {
                this.settings.ollama_model = e.target.value;
                this.saveSettings();
            });

            document.getElementById('llm-rewrite-mode').addEventListener('change', (e) => {
                this.settings.rewrite_mode = e.target.value;
                this.togglePersonaGroup();
                this.saveSettings();
            });

            document.getElementById('llm-persona').addEventListener('change', (e) => {
                this.settings.persona_name = e.target.value;
                this.saveSettings();
            });

            document.getElementById('auto-rewrite').addEventListener('change', (e) => {
                this.settings.auto_rewrite = e.target.checked;
                this.saveSettings();
            });

            document.getElementById('bionic-mode').addEventListener('change', (e) => {
                this.settings.bionic_mode = e.target.checked;
                this.applyBionicReading();
                this.saveSettings();
            });

            document.getElementById('dark-mode').addEventListener('change', (e) => {
                this.settings.dark_mode = e.target.checked;
                this.applyTheme();
                this.saveSettings();
            });            // Manual rewrite button
            document.getElementById('manual-rewrite').addEventListener('click', () => this.manualRewrite());

            // Refresh models button
            document.getElementById('refresh-models').addEventListener('click', () => this.loadAvailableModels());

            // Text area monitoring
            this.attachTextAreaListeners();

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                    e.preventDefault();
                    this.manualRewrite();
                }
            });

            // Click outside to close
            document.addEventListener('click', (e) => {
                if (!this.panel.contains(e.target) && !this.toggleButton.contains(e.target)) {
                    this.closePanel();
                }
            });
        }

        // Attach listeners to text areas and inputs
        attachTextAreaListeners() {
            document.addEventListener('focusin', (e) => {
                if (e.target.matches('textarea, input[type="text"], [contenteditable="true"]')) {
                    this.activeElement = e.target;
                }
            });

            document.addEventListener('keydown', (e) => {
                if (this.settings.auto_rewrite && this.activeElement && 
                    (e.key === 'Enter' || e.key === 'Tab')) {
                    this.debounce(() => this.autoRewrite(), 300);
                }
            });
        }

        // Toggle panel visibility
        togglePanel() {
            this.isOpen = !this.isOpen;
            this.panel.classList.toggle('open', this.isOpen);
        }

        // Close panel
        closePanel() {
            this.isOpen = false;
            this.panel.classList.remove('open');
        }

        // Apply theme
        applyTheme() {
            document.body.classList.toggle('llm-dark', this.settings.dark_mode);
        }

        // Apply bionic reading
        applyBionicReading() {
            if (this.settings.bionic_mode) {
                this.makeBionicReading();
            } else {
                this.removeBionicReading();
            }
        }

        // Make text bionic readable
        makeBionicReading() {
            const textNodes = this.getTextNodes(document.body);
            textNodes.forEach(node => {
                if (!node.parentElement.closest('.llm-assistant-panel')) {
                    const bionicText = this.convertToBionic(node.textContent);
                    if (bionicText !== node.textContent) {
                        const span = document.createElement('span');
                        span.innerHTML = bionicText;
                        span.className = 'bionic-reading';
                        node.parentElement.replaceChild(span, node);
                    }
                }
            });
        }

        // Remove bionic reading
        removeBionicReading() {
            const bionicElements = document.querySelectorAll('.bionic-reading');
            bionicElements.forEach(element => {
                const textNode = document.createTextNode(element.textContent);
                element.parentElement.replaceChild(textNode, element);
            });
        }

        // Convert text to bionic format
        convertToBionic(text) {
            return text.replace(/\b(\w+)\b/g, (word) => {
                if (word.length <= 2) return word;
                const splitPoint = Math.ceil(word.length / 2);
                return `<b>${word.substring(0, splitPoint)}</b>${word.substring(splitPoint)}`;
            });
        }

        // Get all text nodes
        getTextNodes(element) {
            const textNodes = [];
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                node => node.textContent.trim() !== '' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
            );

            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }
            return textNodes;
        }

        // Manual rewrite
        async manualRewrite() {
            if (!this.activeElement) {
                this.showStatus('No text field selected', 'error');
                return;
            }

            const text = this.getElementText(this.activeElement);
            if (!text.trim()) {
                this.showStatus('No text to rewrite', 'error');
                return;
            }

            await this.rewriteText(text, this.activeElement);
        }

        // Auto rewrite (triggered by events)
        async autoRewrite() {
            if (!this.activeElement || this.isProcessing) return;

            const text = this.getElementText(this.activeElement);
            if (text.trim().length < 10) return; // Skip very short text

            await this.rewriteText(text, this.activeElement);
        }

        // Main rewrite function
        async rewriteText(text, element) {
            if (this.isProcessing) return;

            this.isProcessing = true;
            this.showProcessingIndicator();
            this.showStatus('Processing...', 'processing');

            try {
                const prompt = this.buildPrompt(text);
                const rewrittenText = await this.callOllama(prompt);
                
                if (rewrittenText && rewrittenText !== text) {
                    this.setElementText(element, rewrittenText);
                    this.showStatus('Text rewritten successfully!', 'success');
                } else {
                    this.showStatus('No changes needed', 'success');
                }
            } catch (error) {
                console.error('Rewrite error:', error);
                this.showStatus('Error: ' + error.message, 'error');
            } finally {
                this.isProcessing = false;
                this.hideProcessingIndicator();
            }
        }

        // Build prompt based on rewrite mode
        buildPrompt(text) {
            const mode = this.settings.rewrite_mode;
            const persona = this.settings.persona_name;

            const prompts = {
                grammar: `Fix grammar, spelling, and punctuation in the following text. Retain the original meaning and voice. Only return the corrected text:\n\n${text}`,
                dont_lie: `Remove exaggerations, hyperbole, and speculation from the following statement. Make it more factual and accurate. Only return the revised text:\n\n${text}`,
                facts_only: `Convert the following statement into an objective, factual tone. Remove opinions and emotional language. Only return the factual version:\n\n${text}`,
                persona: `Rewrite the following text in the voice and style of ${persona}. Match their tone and speaking patterns while keeping the same meaning and approximate length. Only return the rewritten text:\n\n${text}`
            };

            return prompts[mode] || prompts.grammar;
        }

        // Call Ollama API
        async callOllama(prompt) {
            const response = await fetch(`${this.settings.ollama_url}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.settings.ollama_model,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        max_tokens: 1000
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }

            const data = await response.json();
            return data.response?.trim() || '';
        }

        // Get text from element
        getElementText(element) {
            if (element.contentEditable === 'true') {
                return element.innerText || element.textContent;
            }
            return element.value || '';
        }

        // Set text in element
        setElementText(element, text) {
            if (element.contentEditable === 'true') {
                element.innerText = text;
            } else {
                element.value = text;
            }
            
            // Trigger input event
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Show status message
        showStatus(message, type = '') {
            const statusElement = document.getElementById('llm-status');
            statusElement.textContent = message;
            statusElement.className = `llm-status ${type ? 'llm-' + type : ''}`;
            
            if (type === 'success' || type === 'error') {
                setTimeout(() => {
                    statusElement.textContent = '';
                    statusElement.className = 'llm-status';
                }, 3000);
            }
        }

        // Show processing indicator
        showProcessingIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'llm-processing-indicator';
            indicator.textContent = '🧠 Processing...';
            indicator.id = 'llm-processing';
            document.body.appendChild(indicator);
        }

        // Hide processing indicator
        hideProcessingIndicator() {
            const indicator = document.getElementById('llm-processing');
            if (indicator) {
                indicator.remove();
            }
        }        // Debounce function
        debounce(func, wait) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(func, wait);
        }

        // Load available models from Ollama
        async loadAvailableModels() {
            const modelSelect = document.getElementById('llm-model');
            const refreshButton = document.getElementById('refresh-models');
            
            // Show loading state
            modelSelect.innerHTML = '<option value="">Loading models...</option>';
            refreshButton.disabled = true;
            refreshButton.textContent = '🔄 Loading...';

            // Remove any existing status messages
            const existingStatus = document.querySelector('.llm-models-error, .llm-models-success');
            if (existingStatus) {
                existingStatus.remove();
            }

            try {
                const response = await fetch(`${this.settings.ollama_url}/api/tags`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error(`Ollama API error: ${response.status}`);
                }

                const data = await response.json();
                const models = data.models || [];

                // Clear and populate model dropdown
                modelSelect.innerHTML = '';

                if (models.length === 0) {
                    modelSelect.innerHTML = '<option value="">No models found</option>';
                    this.showModelStatus('No models found. Please install models using "ollama pull <model-name>"', 'error');
                } else {
                    models.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model.name;
                        option.textContent = `${model.name} (${this.formatSize(model.size)})`;
                        modelSelect.appendChild(option);
                    });

                    // Set the saved model if it exists in the list
                    const savedModel = this.settings.ollama_model;
                    const modelExists = models.some(model => model.name === savedModel);
                    
                    if (modelExists) {
                        modelSelect.value = savedModel;
                    } else if (models.length > 0) {
                        // Select first model if saved model doesn't exist
                        modelSelect.value = models[0].name;
                        this.settings.ollama_model = models[0].name;
                        this.saveSettings();
                    }

                    this.showModelStatus(`Found ${models.length} model(s)`, 'success');
                }

            } catch (error) {
                console.error('Failed to load models:', error);
                modelSelect.innerHTML = '<option value="">Failed to load models</option>';
                this.showModelStatus(`Error: ${error.message}. Make sure Ollama is running.`, 'error');
            } finally {
                refreshButton.disabled = false;
                refreshButton.textContent = '🔄 Refresh Models';
            }
        }

        // Show model loading status
        showModelStatus(message, type) {
            const refreshButton = document.getElementById('refresh-models');
            const existingStatus = document.querySelector('.llm-models-error, .llm-models-success');
            
            if (existingStatus) {
                existingStatus.remove();
            }

            const statusDiv = document.createElement('div');
            statusDiv.className = `llm-models-${type}`;
            statusDiv.textContent = message;
            
            refreshButton.parentNode.appendChild(statusDiv);

            // Auto-remove success messages
            if (type === 'success') {
                setTimeout(() => {
                    if (statusDiv.parentNode) {
                        statusDiv.remove();
                    }
                }, 3000);
            }
        }

        // Format file size for display
        formatSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }
    }

    // Initialize the LLM Assistant
    const assistant = new LLMAssistant();

    // Export for debugging
    window.LLMAssistant = assistant;

})();
