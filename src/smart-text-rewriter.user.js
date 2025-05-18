// ==UserScript==
// @name         Smart Text Rewriter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Rewrite text in various styles using LLMs
// @author       You
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {    'use strict';    // Constants and configuration
    const CONFIG = {
        ollamaEndpoint: 'http://localhost:11434/api/generate',
        ollamaModel: 'llama3', // Default Ollama model (will be updated with what's available)
        availableOllamaModels: [], // Will be populated from actual Ollama server
        debugMode: true, // Set debug mode to true by default to help troubleshoot
        showRewriteButton: true,
        lastUsedModes: {}, // Store last used mode per element
        defaultMode: 'casual' // Default rewrite mode
    };

    // Define rewrite modes
    const REWRITE_MODES = {
        trump: {
            name: '🧑‍💼 Donald Trump',
            description: 'Bold, self-assured, uses superlatives, simple language, often repeats phrases for emphasis, adds humor with exaggeration',
            prompt: 'Rewrite the following text as if Donald Trump was saying it. Be bold, self-assured, use superlatives, simple language, often repeat phrases for emphasis, and add humor with exaggeration:'
        },
        theoVon: {
            name: '🎤 Theo Von',
            description: 'Southern charm, quirky analogies, offbeat humor, conversational, uses unexpected metaphors',
            prompt: 'Rewrite the following text with Theo Von\'s style. Use Southern charm, quirky analogies, offbeat humor, conversational tone, and unexpected metaphors:'
        },
        joeyDiaz: {
            name: '🔥 Joey Diaz',
            description: 'Raw, energetic, uses strong language, streetwise humor, direct and unfiltered, often includes personal anecdotes',
            prompt: 'Rewrite the following text in Joey Diaz\'s style. Be raw, energetic, use strong language, streetwise humor, direct and unfiltered, and include personal anecdotes where appropriate:'
        },
        academic: {
            name: '📚 Academic',
            description: 'Clean, professional, formal tone, precise vocabulary, well-structured sentences',
            prompt: 'Rewrite the following text in an academic style. Use clean, professional, formal tone, precise vocabulary, and well-structured sentences:'
        },
        casual: {
            name: '😎 Casual Millennial',
            description: 'Relaxed, uses slang and emojis, conversational, friendly, pop culture references',
            prompt: 'Rewrite the following text in a casual millennial style. Be relaxed, use slang and emojis, conversational, friendly, and include pop culture references:'
        },
        flirty: {
            name: '❤️ Guy looking for a girlfriend',
            description: 'Flirty, lighthearted, sincere, a bit self-deprecating, playful compliments',
            prompt: 'Rewrite the following text as if it\'s written by someone looking for a girlfriend. Make it flirty, lighthearted, sincere, a bit self-deprecating, with playful compliments:'
        },
        explicit: {
            name: '🌶️ Adult / Explicit',
            description: 'Mature themes, direct, uses explicit language, not suitable for all audiences',
            prompt: 'Rewrite the following text in an explicit, adult style. Include mature themes, be direct, use explicit language (note: not suitable for all audiences):'
        },
        factCheck: {
            name: '🕵️ Fact Check',
            description: 'Objective, cites sources, corrects errors, neutral and informative',
            prompt: 'Fact check the following text. Be objective, cite sources where possible, correct errors, and maintain a neutral and informative tone:'
        },
        mockOpponent: {
            name: '🤡 Make Opponent\'s Point Look Silly',
            description: 'Sarcastic, uses irony, highlights flaws humorously, playful ridicule',
            prompt: 'Rewrite the following text to make the opponent\'s point look silly. Be sarcastic, use irony, highlight flaws humorously, and include playful ridicule:'
        },
        strongerArgument: {
            name: '🌟 Overshadow with a Stronger Argument',
            description: 'Confident, assertive, presents superior logic, persuasive tone',
            prompt: 'Rewrite the following text to overshadow with a stronger argument. Be confident, assertive, present superior logic, and use a persuasive tone:'
        },
        diplomatic: {
            name: '🤝 Diplomatic / Neutral Tone',
            description: 'Balanced, non-confrontational, seeks common ground, respectful',
            prompt: 'Rewrite the following text in a diplomatic, neutral tone. Be balanced, non-confrontational, seek common ground, and maintain a respectful tone:'
        },
        creative: {
            name: '🧑‍🎨 Creative / Playful Rewrite',
            description: 'Imaginative, uses wordplay, whimsical, fun and engaging',
            prompt: 'Rewrite the following text in a creative, playful way. Be imaginative, use wordplay, be whimsical, and make it fun and engaging:'
        },
        kids: {
            name: '🧑‍🏫 Simplify for Kids',
            description: 'Simple words, short sentences, clear explanations, friendly tone',
            prompt: 'Rewrite the following text for children. Use simple words, short sentences, clear explanations, and a friendly tone:'
        },
        technical: {
            name: '🧑‍🔬 Technical / Jargon-heavy',
            description: 'Uses domain-specific terminology, detailed, assumes expert audience',
            prompt: 'Rewrite the following text in a technical, jargon-heavy style. Use domain-specific terminology, be detailed, and assume an expert audience:'
        },
        sarcastic: {
            name: '🧑‍🎤 Sarcastic / Satirical',
            description: 'Mocking, uses irony and exaggeration, witty, exposes absurdities',
            prompt: 'Rewrite the following text in a sarcastic, satirical style. Be mocking, use irony and exaggeration, be witty, and expose absurdities:'
        },
        // Custom mode will be added dynamically
    };    // Load saved configuration
    function loadConfig() {
        try {
            const savedConfig = GM_getValue('smartRewriterConfig');
            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                
                // Only load the endpoint, model, debug mode, button visibility and default mode
                // We'll fetch available models from the server
                if (parsedConfig.ollamaEndpoint) CONFIG.ollamaEndpoint = parsedConfig.ollamaEndpoint;
                if (parsedConfig.ollamaModel) CONFIG.ollamaModel = parsedConfig.ollamaModel; 
                if (parsedConfig.debugMode !== undefined) CONFIG.debugMode = parsedConfig.debugMode;
                if (parsedConfig.showRewriteButton !== undefined) CONFIG.showRewriteButton = parsedConfig.showRewriteButton;
                if (parsedConfig.defaultMode) CONFIG.defaultMode = parsedConfig.defaultMode;
            }
            
            const savedModes = GM_getValue('smartRewriterLastModes');
            if (savedModes) {
                CONFIG.lastUsedModes = JSON.parse(savedModes);
            }
            
            // Load custom modes
            const customModes = GM_getValue('smartRewriterCustomModes');
            if (customModes) {
                Object.assign(REWRITE_MODES, JSON.parse(customModes));
            }
            
            updateDebug('Configuration loaded from storage');
        } catch (error) {
            console.error('Error loading Smart Text Rewriter config:', error);
            updateDebug('Error loading configuration: ' + error.message, true);
        }
    }

    // Save configuration
    function saveConfig() {
        try {
            GM_setValue('smartRewriterConfig', JSON.stringify({
                ollamaEndpoint: CONFIG.ollamaEndpoint,
                ollamaModel: CONFIG.ollamaModel,
                availableOllamaModels: CONFIG.availableOllamaModels,
                debugMode: CONFIG.debugMode,
                showRewriteButton: CONFIG.showRewriteButton,
                defaultMode: CONFIG.defaultMode
            }));
            
            GM_setValue('smartRewriterLastModes', JSON.stringify(CONFIG.lastUsedModes));
        } catch (error) {
            console.error('Error saving Smart Text Rewriter config:', error);
        }
    }

    // Save custom modes
    function saveCustomModes() {
        try {
            const customModes = {};
            Object.keys(REWRITE_MODES).forEach(key => {
                if (REWRITE_MODES[key].isCustom) {
                    customModes[key] = REWRITE_MODES[key];
                }
            });
            
            GM_setValue('smartRewriterCustomModes', JSON.stringify(customModes));
        } catch (error) {
            console.error('Error saving Smart Text Rewriter custom modes:', error);
        }
    }

    // Add styles for the UI
    function addStyles() {
        GM_addStyle(`
            .smart-rewriter-btn {
                position: absolute;
                background: linear-gradient(135deg, #6e8efb, #a777e3);
                color: white;
                border: none;
                border-radius: 4px;
                padding: 2px 8px;
                font-size: 12px;
                cursor: pointer;
                z-index: 9999;
                opacity: 0.8;
                transition: opacity 0.2s;
            }
            
            .smart-rewriter-btn:hover {
                opacity: 1;
            }
            
            .smart-rewriter-settings {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                padding: 20px;
                z-index: 10000;
                min-width: 400px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .smart-rewriter-settings h2 {
                margin-top: 0;
                color: #333;
                font-size: 20px;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
            }
            
            .smart-rewriter-settings label {
                display: block;
                margin: 12px 0 4px;
                font-weight: bold;
                color: #444;
            }
            
            .smart-rewriter-settings input[type="text"],
            .smart-rewriter-settings textarea,
            .smart-rewriter-settings select {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
            }
            
            .smart-rewriter-settings button {
                background: linear-gradient(135deg, #6e8efb, #a777e3);
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
                margin-top: 16px;
                cursor: pointer;
                font-weight: bold;
            }
            
            .smart-rewriter-mode-select {
                position: absolute;
                background: white;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 10000;
                max-height: 300px;
                overflow-y: auto;
                width: 250px;
            }
            
            .smart-rewriter-mode-option {
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
            }
            
            .smart-rewriter-mode-option:hover {
                background: #f5f5f5;
            }
            
            .smart-rewriter-status {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                padding: 10px 15px;
                z-index: 10000;
                font-size: 14px;
                display: flex;
                align-items: center;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .smart-rewriter-status.visible {
                opacity: 1;
            }
            
            .smart-rewriter-status-indicator {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                margin-right: 8px;
            }
            
            .smart-rewriter-status-indicator.connected {
                background: #4caf50;
            }
            
            .smart-rewriter-status-indicator.error {
                background: #f44336;
            }
            
            .smart-rewriter-status-indicator.processing {
                background: #2196f3;
                animation: pulse 1.5s infinite;
            }
            
            .smart-rewriter-debug {
                position: fixed;
                bottom: 0;
                right: 0;
                width: 400px;
                height: 300px;
                background: rgba(0,0,0,0.8);
                color: #4caf50;
                font-family: monospace;
                padding: 10px;
                box-sizing: border-box;
                overflow: auto;
                z-index: 10001;
                font-size: 12px;
                border-top-left-radius: 8px;
                display: none;
            }
            
            .smart-rewriter-debug.visible {
                display: block;
            }
            
            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }
        `);
    }    // Create UI elements
    function createUI() {
        // Create status indicator
        const statusEl = document.createElement('div');
        statusEl.className = 'smart-rewriter-status';
        statusEl.innerHTML = `
            <div class="smart-rewriter-status-indicator"></div>
            <div class="smart-rewriter-status-text">Smart Text Rewriter</div>
        `;
        document.body.appendChild(statusEl);
        
        // Create debug panel
        const debugEl = document.createElement('div');
        debugEl.className = 'smart-rewriter-debug';
        document.body.appendChild(debugEl);
        
        // Show status initially
        updateStatus('connected');
        setTimeout(() => {
            statusEl.classList.remove('visible');
        }, 3000);
        
        // If debug mode is enabled, show debug panel
        if (CONFIG.debugMode) {
            debugEl.classList.add('visible');
        }
        
        // Create settings panel (initially hidden)
        const settingsEl = document.createElement('div');
        settingsEl.className = 'smart-rewriter-settings';
        settingsEl.style.display = 'none';
        settingsEl.innerHTML = `
            <h2>Smart Text Rewriter Settings</h2>
            
            <h3>Ollama Settings</h3>
            <label for="smart-rewriter-ollama-endpoint">Ollama Endpoint URL:</label>
            <input type="text" id="smart-rewriter-ollama-endpoint" placeholder="Ollama API endpoint URL" value="${CONFIG.ollamaEndpoint}">
            
            <label for="smart-rewriter-ollama-model">Ollama Model:</label>
            <select id="smart-rewriter-ollama-model">
                ${CONFIG.availableOllamaModels.map(model => 
                    `<option value="${model}" ${CONFIG.ollamaModel === model ? 'selected' : ''}>${model}</option>`
                ).join('')}
            </select>
            
            <button id="smart-rewriter-refresh-models" style="margin-top:8px;">Refresh Available Models</button>
            
            <label for="smart-rewriter-default-mode">Default Rewrite Mode:</label>
            <select id="smart-rewriter-default-mode">
                ${Object.keys(REWRITE_MODES).map(mode => 
                    `<option value="${mode}" ${CONFIG.defaultMode === mode ? 'selected' : ''}>${REWRITE_MODES[mode].name}</option>`
                ).join('')}
            </select>
            
            <label>
                <input type="checkbox" id="smart-rewriter-show-btn" ${CONFIG.showRewriteButton ? 'checked' : ''}>
                Show rewrite button next to text fields
            </label>
            
            <label>
                <input type="checkbox" id="smart-rewriter-debug-mode" ${CONFIG.debugMode ? 'checked' : ''}>
                Enable debug mode
            </label>
            
            <h3>Custom Rewrite Mode</h3>
            <label for="smart-rewriter-custom-name">Name:</label>
            <input type="text" id="smart-rewriter-custom-name" placeholder="Custom mode name">
            
            <label for="smart-rewriter-custom-description">Description:</label>
            <input type="text" id="smart-rewriter-custom-description" placeholder="Brief description of this style">
            
            <label for="smart-rewriter-custom-prompt">Prompt:</label>
            <textarea id="smart-rewriter-custom-prompt" placeholder="Rewrite the following text in this style:"></textarea>
            
            <button id="smart-rewriter-add-custom">Add Custom Mode</button>
            
            <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                <button id="smart-rewriter-save">Save Settings</button>
                <button id="smart-rewriter-close">Close</button>
            </div>
        `;
        document.body.appendChild(settingsEl);
        
        // Add event listener for refresh models button
        document.getElementById('smart-rewriter-refresh-models').addEventListener('click', function() {
            fetchOllamaModels();
        });
        
        // Add event listeners for settings
        document.getElementById('smart-rewriter-save').addEventListener('click', function() {
            CONFIG.ollamaEndpoint = document.getElementById('smart-rewriter-ollama-endpoint').value;
            CONFIG.ollamaModel = document.getElementById('smart-rewriter-ollama-model').value;
            CONFIG.defaultMode = document.getElementById('smart-rewriter-default-mode').value;
            CONFIG.showRewriteButton = document.getElementById('smart-rewriter-show-btn').checked;
            CONFIG.debugMode = document.getElementById('smart-rewriter-debug-mode').checked;
            
            saveConfig();
            settingsEl.style.display = 'none';
            
            // Update debug panel visibility
            if (CONFIG.debugMode) {
                debugEl.classList.add('visible');
            } else {
                debugEl.classList.remove('visible');
            }
            
            // Update button visibility
            updateButtonVisibility();
            
            // Show success status
            updateStatus('connected', 'Settings saved!');
        });
        
        document.getElementById('smart-rewriter-close').addEventListener('click', function() {
            settingsEl.style.display = 'none';
        });
        
        document.getElementById('smart-rewriter-add-custom').addEventListener('click', function() {
            const name = document.getElementById('smart-rewriter-custom-name').value.trim();
            const description = document.getElementById('smart-rewriter-custom-description').value.trim();
            const prompt = document.getElementById('smart-rewriter-custom-prompt').value.trim();
            
            if (!name || !prompt) {
                updateStatus('error', 'Name and prompt are required');
                return;
            }
            
            // Generate a unique key for the custom mode
            const key = 'custom_' + Date.now();
            
            // Add the custom mode
            REWRITE_MODES[key] = {
                name: name,
                description: description,
                prompt: prompt,
                isCustom: true
            };
            
            // Update the dropdown
            const select = document.getElementById('smart-rewriter-default-mode');
            const option = document.createElement('option');
            option.value = key;
            option.textContent = name;
            select.appendChild(option);
            
            // Clear the inputs
            document.getElementById('smart-rewriter-custom-name').value = '';
            document.getElementById('smart-rewriter-custom-description').value = '';
            document.getElementById('smart-rewriter-custom-prompt').value = '';
            
            // Save the custom modes
            saveCustomModes();
            
            updateStatus('connected', 'Custom mode added!');
        });
        
        // Register menu command
        GM_registerMenuCommand('Smart Text Rewriter Settings', function() {
            settingsEl.style.display = 'block';
        });
    }

    // Update status indicator
    function updateStatus(status, message) {
        const statusEl = document.querySelector('.smart-rewriter-status');
        const indicatorEl = document.querySelector('.smart-rewriter-status-indicator');
        const textEl = document.querySelector('.smart-rewriter-status-text');
        
        indicatorEl.classList.remove('connected', 'error', 'processing');
        indicatorEl.classList.add(status);
        
        textEl.textContent = message || 'Smart Text Rewriter';
        
        statusEl.classList.add('visible');
        
        // Hide after a few seconds
        setTimeout(() => {
            statusEl.classList.remove('visible');
        }, 3000);
    }

    // Update debug panel
    function updateDebug(message, isError = false) {
        if (!CONFIG.debugMode) return;
        
        const debugEl = document.querySelector('.smart-rewriter-debug');
        
        const timestamp = new Date().toLocaleTimeString();
        const msgEl = document.createElement('div');
        msgEl.innerHTML = `[${timestamp}] ${isError ? '<span style="color: #f44336">ERROR:</span> ' : ''}${message}`;
        
        debugEl.appendChild(msgEl);
        debugEl.scrollTop = debugEl.scrollHeight;
        
        // Limit debug entries
        while (debugEl.childElementCount > 100) {
            debugEl.removeChild(debugEl.firstChild);
        }
    }

    // Update button visibility based on settings
    function updateButtonVisibility() {
        const buttons = document.querySelectorAll('.smart-rewriter-btn');
        buttons.forEach(btn => {
            btn.style.display = CONFIG.showRewriteButton ? 'block' : 'none';
        });
    }

    // Get last used mode for an element
    function getLastUsedMode(element) {
        const elementId = element.id || `el_${Math.random().toString(36).substr(2, 9)}`;
        if (!element.id) {
            element.id = elementId;
        }
        
        return CONFIG.lastUsedModes[elementId] || CONFIG.defaultMode;
    }

    // Save last used mode for an element
    function saveLastUsedMode(element, mode) {
        const elementId = element.id || `el_${Math.random().toString(36).substr(2, 9)}`;
        if (!element.id) {
            element.id = elementId;
        }
        
        CONFIG.lastUsedModes[elementId] = mode;
        saveConfig();
    }

    // Create rewrite button for an element
    function createRewriteButton(element) {
        // Check if the element already has a rewrite button
        if (element.getAttribute('data-smart-rewriter')) {
            return;
        }
        
        // Mark the element as having a rewrite button
        element.setAttribute('data-smart-rewriter', 'true');
        
        // Create the button
        const button = document.createElement('button');
        button.className = 'smart-rewriter-btn';
        button.textContent = '✍';
        button.title = 'Rewrite Text';
        button.style.display = CONFIG.showRewriteButton ? 'block' : 'none';
        
        // Position the button
        const elementRect = element.getBoundingClientRect();
        button.style.top = `${window.scrollY + elementRect.top}px`;
        button.style.left = `${window.scrollX + elementRect.right + 5}px`;
        
        // Add event listener
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            showModeSelect(element, button);
        });
        
        // Add the button to the document
        document.body.appendChild(button);
        
        // Update button position when window is resized
        window.addEventListener('resize', function() {
            const updatedRect = element.getBoundingClientRect();
            button.style.top = `${window.scrollY + updatedRect.top}px`;
            button.style.left = `${window.scrollX + updatedRect.right + 5}px`;
        });
        
        // Update button position when document is scrolled
        document.addEventListener('scroll', function() {
            const updatedRect = element.getBoundingClientRect();
            button.style.top = `${window.scrollY + updatedRect.top}px`;
            button.style.left = `${window.scrollX + updatedRect.right + 5}px`;
        });
        
        return button;
    }

    // Show the mode selection dropdown
    function showModeSelect(element, button) {
        // Remove any existing mode select
        const existingSelect = document.querySelector('.smart-rewriter-mode-select');
        if (existingSelect) {
            existingSelect.remove();
        }
        
        // Create the mode select container
        const modeSelect = document.createElement('div');
        modeSelect.className = 'smart-rewriter-mode-select';
        
        // Position the mode select
        const buttonRect = button.getBoundingClientRect();
        modeSelect.style.top = `${window.scrollY + buttonRect.bottom + 5}px`;
        modeSelect.style.left = `${window.scrollX + buttonRect.left}px`;
        
        // Add mode options
        for (const mode in REWRITE_MODES) {
            const option = document.createElement('div');
            option.className = 'smart-rewriter-mode-option';
            option.innerHTML = `
                <div>${REWRITE_MODES[mode].name}</div>
                <div style="font-size: 11px; color: #666;">${REWRITE_MODES[mode].description}</div>
            `;
            
            option.addEventListener('click', function() {
                rewriteText(element, mode);
                modeSelect.remove();
            });
            
            modeSelect.appendChild(option);
        }
        
        // Add the mode select to the document
        document.body.appendChild(modeSelect);
        
        // Close the mode select when clicking outside
        document.addEventListener('click', function closeSelect(e) {
            if (!modeSelect.contains(e.target) && e.target !== button) {
                modeSelect.remove();
                document.removeEventListener('click', closeSelect);
            }
        });
    }    // Rewrite text with the selected mode
    function rewriteText(element, mode) {
        // Get the text content
        let text = '';
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            text = element.value;
        } else if (element.isContentEditable) {
            text = element.innerHTML;
        }
        
        if (!text.trim()) {
            updateStatus('error', 'No text to rewrite');
            return;
        }
        
        // Check if we have any models available
        if (CONFIG.availableOllamaModels.length === 0) {
            updateStatus('error', 'No Ollama models available');
            updateDebug('Cannot rewrite text: No models available', true);
            showOllamaInstallInstructions();
            return;
        }
        
        // Ensure selected model is available
        if (!CONFIG.availableOllamaModels.includes(CONFIG.ollamaModel)) {
            // Try to select another model
            if (CONFIG.availableOllamaModels.length > 0) {
                CONFIG.ollamaModel = CONFIG.availableOllamaModels[0];
                updateDebug(`Selected model not available. Switching to: ${CONFIG.ollamaModel}`);
                saveConfig();
            } else {
                updateStatus('error', 'Selected model not available');
                updateDebug('Cannot rewrite text: Selected model not available', true);
                return;
            }
        }
        
        // Save the last used mode
        saveLastUsedMode(element, mode);
        
        // Show processing status
        updateStatus('processing', 'Rewriting text...');
        
        // Get the prompt for the selected mode
        const promptText = REWRITE_MODES[mode].prompt;
        
        // Debug
        updateDebug(`Rewriting using mode: ${REWRITE_MODES[mode].name}`);
        updateDebug(`Using model: ${CONFIG.ollamaModel}`);
        updateDebug(`Original text: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
        
        // Call the API
        callLLMAPI(promptText, text)
            .then(rewrittenText => {
                // Update the text
                if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
                    element.value = rewrittenText;
                    // Trigger input event for frameworks that rely on it
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                } else if (element.isContentEditable) {
                    element.innerHTML = rewrittenText;
                    // Trigger input event for frameworks that rely on it
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                }
                
                // Show success status
                updateStatus('connected', 'Text rewritten!');
                
                // Debug
                updateDebug(`Rewritten text: ${rewrittenText.substring(0, 100)}${rewrittenText.length > 100 ? '...' : ''}`);
            })
            .catch(error => {
                updateStatus('error', 'Failed to rewrite text');
                updateDebug(`API error: ${error.message}`, true);
            });
    }// Call the LLM API
    function callLLMAPI(prompt, text) {
        return new Promise((resolve, reject) => {
            if (!CONFIG.ollamaEndpoint) {
                updateStatus('error', 'Ollama endpoint not set. Open settings and configure it.');
                reject(new Error('Ollama endpoint not set'));
                return;
            }
            
            updateDebug(`Calling Ollama API using model: ${CONFIG.ollamaModel}...`);
            updateStatus('processing', 'Connecting to Ollama...');
            
            // Prepare the system message and user prompt
            const systemMessage = 'You are a helpful writing assistant that rewrites text in specific styles.';
            const fullPrompt = `${systemMessage}\n\n${prompt}\n\n${text}`;
            
            // Log the full prompt in debug mode
            updateDebug(`Sending prompt to Ollama: ${fullPrompt.substring(0, 100)}...`);
            
            // Prepare the request data for Ollama
            const data = {
                model: CONFIG.ollamaModel,
                prompt: fullPrompt,
                stream: false,
                options: {
                    temperature: 0.7
                }
            };
            
            // Set up a timeout to detect if Ollama isn't running
            const connectionTimeoutId = setTimeout(() => {
                updateStatus('error', 'Connection to Ollama timed out. Is Ollama running?');
                updateDebug('Initial connection timeout - Ollama might not be running', true);
                reject(new Error('Connection to Ollama timed out. Make sure Ollama is running on your computer.'));
            }, 5000); // 5 second initial connection timeout
            
            // Make the API request to the correct endpoint
            const apiUrl = CONFIG.ollamaEndpoint;
            updateDebug(`Sending request to Ollama API: ${apiUrl}`);
            
            GM_xmlhttpRequest({
                method: 'POST',
                url: apiUrl,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(data),
                timeout: 60000, // 60 second timeout for the full request
                onload: function(response) {
                    clearTimeout(connectionTimeoutId); // Clear the initial connection timeout
                    
                    try {
                        updateDebug(`Received response from Ollama: Status ${response.status}, Length: ${response.responseText.length} bytes`);
                        
                        if (response.status >= 200 && response.status < 300) {
                            const responseData = JSON.parse(response.responseText);
                            
                            // Debug the actual response structure
                            updateDebug(`Response structure: ${JSON.stringify(Object.keys(responseData))}`);
                            
                            // Handle Ollama response format - Ollama uses 'response' property for its response
                            if (responseData.response) {
                                updateDebug(`Received successful Ollama response (${response.responseText.length} bytes)`);
                                resolve(responseData.response);
                            } else if (responseData.message) {
                                // Some Ollama versions might use 'message' instead
                                updateDebug(`Received successful Ollama response with message property`);
                                resolve(responseData.message);
                            } else if (responseData.content) {
                                // Some API formats use 'content'
                                updateDebug(`Received successful Ollama response with content property`);
                                resolve(responseData.content);
                            } else {
                                // Last resort - if we get a valid response but can't find the expected property,
                                // just return the whole object as a string
                                updateDebug(`No standard response property found. Using full response.`, true);
                                resolve(JSON.stringify(responseData));
                            }
                        } else {
                            let errorMessage = 'Ollama API call failed';
                            try {
                                const responseData = JSON.parse(response.responseText);
                                errorMessage = responseData.error || errorMessage;
                                updateStatus('error', `Ollama error: ${errorMessage}`);
                                updateDebug(`Ollama error response: ${response.responseText}`, true);
                            } catch (e) {
                                // If we can't parse the error, use the default message
                                updateStatus('error', 'Failed to connect to Ollama server');
                                updateDebug(`Unparseable error response: ${response.responseText}`, true);
                            }
                            reject(new Error(errorMessage));
                        }
                    } catch (error) {
                        updateStatus('error', 'Failed to parse Ollama response');
                        updateDebug(`Parse error: ${error.message} in response: ${response.responseText.substring(0, 150)}...`, true);
                        reject(new Error(`Failed to parse Ollama API response: ${error.message}`));
                    }
                },
                onerror: function(error) {
                    clearTimeout(connectionTimeoutId); // Clear the initial connection timeout
                    updateStatus('error', 'Cannot connect to Ollama server. Is it running?');
                    updateDebug(`Network error details: ${error ? JSON.stringify(error) : 'No details'}`, true);
                    reject(new Error('Network error connecting to Ollama. Make sure Ollama is running on your computer.'));
                },
                ontimeout: function() {
                    clearTimeout(connectionTimeoutId); // Clear the initial connection timeout
                    updateStatus('error', 'Request to Ollama timed out. Is it running?');
                    updateDebug('Request timed out after 60 seconds', true);
                    reject(new Error('Request to Ollama timed out. Make sure Ollama is running and accessible.'));
                }
            });
        });
    }    // Fetch available Ollama models
    function fetchOllamaModels() {
        if (!CONFIG.ollamaEndpoint) {
            updateStatus('error', 'Ollama endpoint not set');
            return;
        }
        
        updateStatus('processing', 'Fetching Ollama models...');
        updateDebug('Fetching Ollama models from Ollama server');
        
        // Get the base URL (http://localhost:11434)
        const baseUrl = CONFIG.ollamaEndpoint.split('/api/')[0];
        const tagsUrl = `${baseUrl}/api/tags`;
        
        updateDebug(`Fetching models from: ${tagsUrl}`);
        
        // Set up a timeout to detect if Ollama isn't running
        const connectionTimeoutId = setTimeout(() => {
            updateStatus('error', 'Connection to Ollama timed out. Is Ollama running?');
            updateDebug('Ollama connection timeout while fetching models', true);
        }, 5000); // 5 second timeout
        
        // Make API request to get Ollama models
        GM_xmlhttpRequest({
            method: 'GET',
            url: tagsUrl,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000, // 10 second timeout
            onload: function(response) {
                clearTimeout(connectionTimeoutId);
                
                updateDebug(`Ollama models response: Status ${response.status}, Body start: ${response.responseText.substring(0, 100)}`);
                
                try {
                    if (response.status >= 200 && response.status < 300) {
                        const data = JSON.parse(response.responseText);
                        updateDebug(`Parsed model data: ${JSON.stringify(Object.keys(data))}`);
                        
                        // Extract model names from the Ollama response
                        let modelNames = [];
                        
                        if (data.models && Array.isArray(data.models)) {
                            // Newer Ollama format
                            modelNames = data.models.map(model => model.name);
                            updateDebug(`Found models in 'models' array: ${modelNames.join(', ')}`);
                        } else if (data.models && typeof data.models === 'object') {
                            // Alternative format
                            modelNames = Object.keys(data.models);
                            updateDebug(`Found models in 'models' object: ${modelNames.join(', ')}`);
                        } else if (Array.isArray(data)) {
                            // Some versions return an array directly
                            modelNames = data.map(model => model.name || model);
                            updateDebug(`Found models in root array: ${modelNames.join(', ')}`);
                        } else {
                            // Fallback - look for any property that might contain models
                            for (const key in data) {
                                if (Array.isArray(data[key])) {
                                    modelNames = data[key].map(model => model.name || model);
                                    updateDebug(`Found models in '${key}' array: ${modelNames.join(', ')}`);
                                    break;
                                }
                            }
                        }
                        
                        if (modelNames.length === 0) {
                            updateStatus('error', 'No models found on Ollama server');
                            updateDebug('Ollama is running but no models are installed. Raw response: ' + response.responseText, true);
                            // Show a special message for no models
                            const noModelsMessage = 'No models installed on Ollama server. Please run "ollama pull llama3" or another model from the command line.';
                            showNotification('No Models Found', noModelsMessage);
                            return;
                        }
                        
                        CONFIG.availableOllamaModels = modelNames;
                        
                        // Update the model dropdown
                        const modelSelect = document.getElementById('smart-rewriter-ollama-model');
                        if (modelSelect) {
                            modelSelect.innerHTML = '';
                            modelNames.forEach(model => {
                                const option = document.createElement('option');
                                option.value = model;
                                option.textContent = model;
                                if (model === CONFIG.ollamaModel) {
                                    option.selected = true;
                                }
                                modelSelect.appendChild(option);
                            });
                        }
                        
                        // If current model is not in the list, select the first available
                        if (!modelNames.includes(CONFIG.ollamaModel)) {
                            CONFIG.ollamaModel = modelNames[0];
                            updateDebug(`Current model not found. Switching to available model: ${CONFIG.ollamaModel}`);
                            
                            // Update the dropdown to show the selected model
                            if (modelSelect && modelSelect.options.length > 0) {
                                modelSelect.options[0].selected = true;
                            }
                            
                            // Show a notification to the user
                            const modelChangedMessage = `Model "${CONFIG.ollamaModel}" was selected as your default model`;
                            showNotification('Using Available Model', modelChangedMessage);
                        }
                        
                        updateStatus('connected', `Found ${modelNames.length} Ollama model(s)`);
                        updateDebug('Available models: ' + modelNames.join(', '));
                        
                        // Save updated config
                        saveConfig();
                    } else {
                        let errorMessage = 'Failed to fetch Ollama models';
                        try {
                            const errorData = JSON.parse(response.responseText);
                            if (errorData.error) {
                                errorMessage = `Ollama error: ${errorData.error}`;
                            }
                        } catch (e) {
                            // Use default message if parsing fails
                        }
                        updateStatus('error', errorMessage);
                        updateDebug(`Ollama API error (${response.status}): ${response.responseText}`, true);
                    }
                } catch (error) {
                    updateStatus('error', 'Error parsing Ollama response');
                    updateDebug(`Parse error: ${error.message}. Response: ${response.responseText.substring(0, 200)}`, true);
                }
            },
            onerror: function(error) {
                clearTimeout(connectionTimeoutId);
                updateStatus('error', 'Cannot connect to Ollama. Is it running?');
                updateDebug(`Network error: ${error ? JSON.stringify(error) : 'Unknown network error'}`, true);
            },
            ontimeout: function() {
                clearTimeout(connectionTimeoutId);
                updateStatus('error', 'Request to Ollama timed out');
                updateDebug('Request timed out after 10 seconds', true);
            }
        });
    }
    
    // Show a notification to the user
    function showNotification(title, message) {
        const notificationEl = document.createElement('div');
        notificationEl.style.position = 'fixed';
        notificationEl.style.bottom = '20px';
        notificationEl.style.left = '20px';
        notificationEl.style.background = 'white';
        notificationEl.style.boxShadow = '0 2px 15px rgba(0,0,0,0.2)';
        notificationEl.style.borderRadius = '6px';
        notificationEl.style.padding = '15px';
        notificationEl.style.zIndex = '10000';
        notificationEl.style.fontSize = '14px';
        notificationEl.style.maxWidth = '300px';
        
        notificationEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; color: #2196f3;">${title}</h3>
                <button id="dismiss-notification" style="background: none; border: none; cursor: pointer; font-size: 18px;">×</button>
            </div>
            <p style="margin: 0;">${message}</p>
        `;
        
        document.body.appendChild(notificationEl);
        
        // Add dismiss button functionality
        document.getElementById('dismiss-notification').addEventListener('click', function() {
            notificationEl.remove();
        });
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (document.body.contains(notificationEl)) {
                notificationEl.remove();
            }
        }, 8000);
    }

    // Detect and process input elements
    function processInputElements() {
        // Process textareas
        document.querySelectorAll('textarea').forEach(textarea => {
            createRewriteButton(textarea);
        });
        
        // Process text inputs
        document.querySelectorAll('input[type="text"]').forEach(input => {
            createRewriteButton(input);
        });
        
        // Process contenteditable elements
        document.querySelectorAll('[contenteditable="true"]').forEach(element => {
            createRewriteButton(element);
        });
    }

    // Observe DOM changes to detect dynamically added inputs
    function observeDOMChanges() {
        const observer = new MutationObserver(mutations => {
            let shouldProcess = false;
            
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length) {
                    shouldProcess = true;
                }
            });
            
            if (shouldProcess) {
                processInputElements();
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Initialize the script    // Check Ollama connection status
    function checkOllamaConnection() {
        updateDebug('Checking Ollama connection...');
        
        if (!CONFIG.ollamaEndpoint) {
            updateDebug('Ollama endpoint not set, skipping connection check');
            updateStatus('error', 'Ollama endpoint not set. Open settings to configure it.');
            return;
        }
        
        // Get the base URL (http://localhost:11434)
        const baseUrl = CONFIG.ollamaEndpoint.split('/api/')[0];
        const versionUrl = `${baseUrl}/api/version`;
        
        updateDebug(`Checking Ollama connection at: ${versionUrl}`);
        
        // Make a minimal request to check if Ollama is running
        GM_xmlhttpRequest({
            method: 'GET',
            url: versionUrl,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000,
            onload: function(response) {
                updateDebug(`Ollama version response: Status ${response.status}, Body: ${response.responseText.substring(0, 100)}`);
                
                if (response.status >= 200 && response.status < 300) {
                    try {
                        const versionData = JSON.parse(response.responseText);
                        updateStatus('connected', `Connected to Ollama (${versionData.version || 'unknown version'})`);
                        updateDebug(`Ollama connection successful. Version: ${JSON.stringify(versionData)}`);
                        
                        // Now fetch models if connection successful
                        fetchOllamaModels();
                    } catch (error) {
                        updateStatus('connected', 'Connected to Ollama');
                        updateDebug(`Ollama connected but couldn't parse version: ${error.message}`);
                        fetchOllamaModels();
                    }
                } else {
                    updateStatus('error', 'Ollama server returned an error');
                    updateDebug(`Ollama connection error: ${response.status} ${response.statusText}`, true);
                    showOllamaInstallInstructions();
                }
            },
            onerror: function(error) {
                updateStatus('error', 'Cannot connect to Ollama. Make sure it\'s running.');
                updateDebug(`Ollama connection failed - server might not be running. Error: ${JSON.stringify(error)}`, true);
                showOllamaInstallInstructions();
            },
            ontimeout: function() {
                updateStatus('error', 'Connection to Ollama timed out');
                updateDebug('Ollama connection timeout', true);
                showOllamaInstallInstructions();
            }
        });
    }
      // Show instructions for installing/starting Ollama
    function showOllamaInstallInstructions() {
        // Create a notification with instructions
        const instructionsEl = document.createElement('div');
        instructionsEl.style.position = 'fixed';
        instructionsEl.style.top = '20px';
        instructionsEl.style.right = '20px';
        instructionsEl.style.width = '400px';
        instructionsEl.style.background = 'white';
        instructionsEl.style.boxShadow = '0 2px 15px rgba(0,0,0,0.2)';
        instructionsEl.style.borderRadius = '6px';
        instructionsEl.style.padding = '15px';
        instructionsEl.style.zIndex = '10000';
        instructionsEl.style.fontSize = '14px';
        instructionsEl.style.lineHeight = '1.5';
        
        instructionsEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; color: #d32f2f;">Ollama Connection Error</h3>
                <button id="dismiss-ollama-instructions" style="background: none; border: none; cursor: pointer; font-size: 18px;">×</button>
            </div>
            <p><b>Smart Text Rewriter requires Ollama to be running locally.</b></p>
            <ol>
                <li>Install <a href="https://ollama.ai" target="_blank" style="color: #2196f3;">Ollama</a> from ollama.ai</li>
                <li>Make sure the Ollama application is running</li>
                <li>Open a command prompt or terminal and run: <br><code style="background: #f5f5f5; padding: 3px; border-radius: 3px;">ollama pull llama3</code></li>
                <li>Refresh this page or click the "Refresh Available Models" button in Settings</li>
            </ol>
            <p style="font-size: 12px; color: #666;">You can install any model you prefer: llama3, mistral, phi3, etc.</p>
            <div style="display: flex; justify-content: center; margin-top: 10px;">
                <button id="open-ollama-settings" style="background: #2196f3; color: white; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer;">Open Settings</button>
            </div>
        `;
        
        document.body.appendChild(instructionsEl);
        
        // Add dismiss button functionality
        document.getElementById('dismiss-ollama-instructions').addEventListener('click', function() {
            instructionsEl.remove();
        });
        
        // Add open settings button functionality
        document.getElementById('open-ollama-settings').addEventListener('click', function() {
            instructionsEl.remove();
            // Open settings to configure Ollama
            const settingsEl = document.querySelector('.smart-rewriter-settings');
            if (settingsEl) {
                settingsEl.style.display = 'block';
            }
        });
        
        // Auto-remove after 60 seconds
        setTimeout(() => {
            if (document.body.contains(instructionsEl)) {
                instructionsEl.remove();
            }
        }, 60000);
    }    function init() {
        loadConfig();
        addStyles();
        createUI();
        processInputElements();
        observeDOMChanges();
        
        updateDebug('Smart Text Rewriter initialized');
        
        // Show an immediate status message to let the user know we're checking for Ollama
        updateStatus('processing', 'Connecting to Ollama...');
        
        // Check Ollama connection with a slight delay to ensure UI is ready
        setTimeout(checkOllamaConnection, 1000);
        
        // If debug mode is enabled, show a toggle button
        if (CONFIG.debugMode) {
            addDebugToggle();
        }
    }
    
    // Add a toggle button for the debug panel
    function addDebugToggle() {
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = 'Debug';
        toggleBtn.style.position = 'fixed';
        toggleBtn.style.bottom = '10px';
        toggleBtn.style.right = '10px';
        toggleBtn.style.zIndex = '10002';
        toggleBtn.style.padding = '5px 10px';
        toggleBtn.style.background = '#333';
        toggleBtn.style.color = '#4caf50';
        toggleBtn.style.border = 'none';
        toggleBtn.style.borderRadius = '4px';
        toggleBtn.style.cursor = 'pointer';
        
        toggleBtn.addEventListener('click', function() {
            const debugEl = document.querySelector('.smart-rewriter-debug');
            if (debugEl) {
                debugEl.classList.toggle('visible');
            }
        });
        
        document.body.appendChild(toggleBtn);
    }

    // Start the script
    init();
})();
