// ==UserScript==
// @name         Smart Text Rewriter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Enhances text fields with rewrite functionality using local LLMs via Ollama
// @author       You
// @match        *://*/*
// @icon         data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✍️</text></svg>
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // Configuration and settings
    const config = {
        enabled: GM_getValue('enabled', true),
        ollamaEndpoint: GM_getValue('ollamaEndpoint', 'http://localhost:11434/api/generate'),
        selectedModel: GM_getValue('selectedModel', 'llama3'),
        keyboardShortcut: GM_getValue('keyboardShortcut', 'Alt+R'),
        quickRewriteShortcut: GM_getValue('quickRewriteShortcut', 'Alt+Shift+R'),
        models: GM_getValue('models', []),
        lastFetchedModels: GM_getValue('lastFetchedModels', 0),
        debug: GM_getValue('debug', false),
        settingsPanelPosition: GM_getValue('settingsPanelPosition', { x: 10, y: 10 }),
        settingsPanelVisible: false,
        lastUsedModes: GM_getValue('lastUsedModes', {}), // Store by element id or path
    };

    // Rewrite modes
    const rewriteModes = {
        'trump': {
            name: '🧑‍💼 Donald Trump',
            prompt: 'Rewrite this text in the style of Donald Trump. Use simple sentences, hyperbole, and phrases like "tremendous", "the best", "believe me", and "huge".',
        },
        'theo': {
            name: '🎤 Theo Von',
            prompt: 'Rewrite this text in the style of comedian Theo Von. Use Southern expressions, unique metaphors, and his signature offbeat observations.',
        },
        'joey': {
            name: '🔥 Joey Diaz',
            prompt: 'Rewrite this text in the style of Joey Diaz. Use his intense storytelling style, strong language, and Cuban-American expressions.',
        },
        'academic': {
            name: '📚 Academic',
            prompt: 'Rewrite this text in an academic style. Use formal language, proper citations, and thorough explanations.',
        },
        'millennial': {
            name: '😎 Casual Millennial',
            prompt: 'Rewrite this text in a casual millennial style. Use conversational tone, some abbreviations, and a relaxed approach.',
        },
        'dating': {
            name: '❤️ Guy looking for a girlfriend',
            prompt: 'Rewrite this text as if you are someone looking for a romantic connection. Be authentic, kind, and a bit flirty but respectful.',
        },
        'adult': {
            name: '🌶️ Adult / Explicit',
            prompt: 'Rewrite this text with adult/explicit content. Use provocative language and mature themes.',
        }
    };

    // Custom modes from user
    const customModes = GM_getValue('customModes', {});
    // Merge custom modes with default modes
    Object.assign(rewriteModes, customModes);

    // Logging system
    const logger = {
        log: function(message, data) {
            if (config.debug) {
                console.log(`[Smart Text Rewriter] ${message}`, data || '');
            }
        },
        error: function(message, error) {
            console.error(`[Smart Text Rewriter] ${message}`, error || '');
            updateDebugInfo(`ERROR: ${message} ${error ? JSON.stringify(error) : ''}`);
        }
    };    // Main initialization
    function init() {
        logger.log('Initializing Smart Text Rewriter');
        console.log('[Smart Text Rewriter] Initializing script...');
        
        // Debug mode on by default for troubleshooting
        config.debug = true;
        
        // Check if script is enabled
        if (!config.enabled) {
            logger.log('Script is disabled, initialization paused');
            return;
        }
        
        // Add styles
        addStyles();
        
        // Create settings panel
        createSettingsPanel();
        
        // Add custom mode button to settings panel
        addCustomModeButton();
        
        // Setup keyboard shortcuts
        setupKeyboardShortcuts();
        
        // Setup mode cycling shortcuts
        setupModeCycling();
        
        // Setup context menu
        setupContextMenu();
        
        // Show prominent notification
        showNotification('Smart Text Rewriter is starting up! Buttons should appear next to text fields.', 5000);
        
        // Add rewrite buttons to text fields
        setupRewriteButtons();
        
        // Detect text input fields immediately and repeatedly
        detectTextInputs();
        
        // More aggressive repeated detection
        setInterval(detectTextInputs, 2000); // Check every 2 seconds
        
        // Setup observers for dynamically added elements
        setupObservers();
        
        // Fetch available models
        fetchOllamaModels();
        
        // Shadow DOM traversal to find text inputs in modern web apps - run more frequently
        setTimeout(traverseShadowDOM, 1000); // First check after 1 second
        setInterval(traverseShadowDOM, 3000); // Keep checking periodically
        
        // Register smart reply keyboard shortcut
        document.addEventListener('keydown', function(e) {
            if (e.key === 's' && e.altKey && e.shiftKey) {
                const activeElement = document.activeElement;
                if (isTextInput(activeElement)) {
                    smartReply(activeElement);
                    e.preventDefault();
                }
            }
        });
        
        // Create a debug button that's always visible
        createDebugButton();
        
        logger.log('Initialization complete');
        console.log('[Smart Text Rewriter] Initialization complete');
    }// Add CSS styles
    function addStyles() {
        GM_addStyle(`
            #str-settings-panel {
                position: fixed;
                z-index: 9999;
                background: #2c3e50;
                color: #ecf0f1;
                border: 1px solid #34495e;
                border-radius: 8px;
                padding: 15px;
                width: 320px;
                box-shadow: 0 6px 12px rgba(0,0,0,0.3);
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 14px;
                display: none;
                transition: all 0.3s ease;
            }
            
            #str-settings-panel.visible {
                display: block;
            }
            
            #str-settings-panel h3 {
                margin-top: 0;
                padding-bottom: 8px;
                border-bottom: 2px solid #3498db;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: #3498db;
                font-size: 18px;
            }
            
            #str-settings-panel h3 span {
                cursor: move;
                font-weight: 600;
            }
            
            #str-settings-panel h3 button {
                background: none;
                border: none;
                color: #e74c3c;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                transition: color 0.2s;
            }
            
            #str-settings-panel h3 button:hover {
                color: #c0392b;
            }
            
            #str-settings-panel .str-row {
                margin-bottom: 15px;
                padding: 5px 0;
            }
            
            #str-settings-panel label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
                color: #f1c40f;
            }
            
            #str-settings-panel select, 
            #str-settings-panel input[type="text"] {
                width: 100%;
                padding: 8px 10px;
                background: #34495e;
                color: #ecf0f1;
                border: 1px solid #7f8c8d;
                border-radius: 4px;
                font-size: 14px;
                transition: border-color 0.3s;
            }
            
            #str-settings-panel select:focus, 
            #str-settings-panel input[type="text"]:focus {
                border-color: #3498db;
                outline: none;
            }
            
            #str-settings-panel select option {
                background: #34495e;
                color: #ecf0f1;
            }
            
            #str-settings-panel input[type="checkbox"] {
                width: auto;
                margin-right: 8px;
                accent-color: #3498db;
            }
            
            #str-settings-panel button {
                background: #3498db;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 12px;
                cursor: pointer;
                font-weight: 600;
                transition: background 0.3s;
                width: 100%;
            }
            
            #str-settings-panel button:hover {
                background: #2980b9;
            }
            
            #str-settings-panel .str-status {
                padding: 8px;
                margin-top: 12px;
                border-radius: 4px;
                text-align: center;
                font-weight: 600;
            }
            
            #str-settings-panel .str-status.connected {
                background-color: #27ae60;
                color: white;
            }
              #str-settings-panel .str-status.error {
                background-color: #e74c3c;
                color: white;
            }
            
            #str-settings-panel .str-tips {
                background-color: #34495e;
                color: #ecf0f1;
                padding: 10px;
                border-radius: 4px;
                font-size: 12px;
                line-height: 1.5;
                margin-top: 5px;
            }
            
            #str-settings-panel .str-debug-info {
                margin-top: 12px;
                padding: 8px;
                background: #1a252f;
                border: 1px solid #34495e;
                border-radius: 4px;
                font-family: 'Consolas', 'Courier New', monospace;
                font-size: 12px;
                color: #2ecc71;
                max-height: 150px;
                overflow-y: auto;
                display: none;
            }
            
            #str-settings-panel .str-debug-info.visible {
                display: block;
            }
            
            .str-context-menu {
                position: absolute;
                z-index: 10000;
                background: #2c3e50;
                color: #ecf0f1;
                border: 1px solid #34495e;
                border-radius: 6px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                padding: 5px 0;
                display: none;
                min-width: 180px;
            }
            
            .str-context-menu.visible {
                display: block;
            }
            
            .str-context-menu-item {
                padding: 8px 12px;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .str-context-menu-item:hover {
                background-color: #3498db;
            }
            
            .str-context-menu-separator {
                margin: 5px 0;
                border-top: 1px solid #34495e;
            }
              .str-rewriting-indicator {
                position: absolute;
                padding: 5px 10px;
                background: rgba(52, 152, 219, 0.9);
                color: white;
                border-radius: 4px;
                font-size: 13px;
                font-weight: bold;
                pointer-events: none;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            
            .str-rewrite-button {
                position: absolute;
                width: 32px;
                height: 32px;
                background: #3498db;
                color: white;
                border: none;
                border-radius: 50%;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                z-index: 9998;
                transition: all 0.2s ease;
            }
            
            .str-rewrite-button:hover {
                background: #2980b9;
                transform: scale(1.1);
            }
            
            .str-rewrite-button .str-tooltip {
                position: absolute;
                background: #2c3e50;
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%) translateY(-5px);
                opacity: 0;
                transition: all 0.2s ease;
                pointer-events: none;
            }
            
            .str-rewrite-button:hover .str-tooltip {
                opacity: 1;
                transform: translateX(-50%) translateY(-10px);
            }
            
            .str-mode-dropdown {
                position: absolute;
                background: #2c3e50;
                color: #ecf0f1;
                border: 1px solid #34495e;
                border-radius: 4px;
                width: 200px;
                z-index: 9999;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                display: none;
            }
            
            .str-mode-dropdown.visible {
                display: block;
            }
            
            .str-mode-dropdown-item {
                padding: 8px 12px;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .str-mode-dropdown-item:hover {
                background: #3498db;
            }
        `);
    }

    // Create settings panel
    function createSettingsPanel() {
        const panel = document.createElement('div');
        panel.id = 'str-settings-panel';
        
        panel.innerHTML = `
            <h3>
                <span>Smart Text Rewriter</span>
                <button id="str-close-settings">×</button>
            </h3>
            
            <div class="str-row">
                <label for="str-enabled">Enable Script</label>
                <input type="checkbox" id="str-enabled" ${config.enabled ? 'checked' : ''}>
            </div>
            
            <div class="str-row">
                <label for="str-model-select">Ollama Model</label>
                <select id="str-model-select">
                    <option value="loading">Loading models...</option>
                </select>
            </div>
            
            <div class="str-row">
                <label for="str-endpoint">Ollama API Endpoint</label>
                <input type="text" id="str-endpoint" value="${config.ollamaEndpoint}">
            </div>
            
            <div class="str-row">
                <label for="str-default-mode">Default Rewrite Mode</label>
                <select id="str-default-mode">
                    ${Object.entries(rewriteModes).map(([key, mode]) => 
                        `<option value="${key}">${mode.name}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="str-row">
                <button id="str-test-connection">Test Ollama Connection</button>
            </div>
              <div class="str-row">
                <div id="str-status" class="str-status">
                    Status: Unknown
                </div>
            </div>
            
            <div class="str-row">
                <label>Usage Tips</label>
                <div class="str-tips">
                    • Click the ✍️ button that appears next to text fields<br>
                    • Right-click the ✍️ button to select a rewrite mode<br>
                    • Use Alt+Shift+R to quickly rewrite with last used mode
                </div>
            </div>
            
            <div class="str-row">
                <label>
                    <input type="checkbox" id="str-debug-mode" ${config.debug ? 'checked' : ''}>
                    Debug Mode
                </label>
            </div>
            
            <div id="str-debug-info" class="str-debug-info ${config.debug ? 'visible' : ''}">
                Debug information will appear here.
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Make settings panel draggable
        makeElementDraggable(panel, '#str-settings-panel h3');
        
        // Event listeners for settings panel
        document.getElementById('str-close-settings').addEventListener('click', toggleSettingsPanel);
        document.getElementById('str-enabled').addEventListener('change', toggleEnabled);
        document.getElementById('str-endpoint').addEventListener('change', updateEndpoint);
        document.getElementById('str-model-select').addEventListener('change', updateSelectedModel);
        document.getElementById('str-debug-mode').addEventListener('change', toggleDebugMode);
        document.getElementById('str-test-connection').addEventListener('click', testOllamaConnection);
        
        // Set panel position if saved
        if (config.settingsPanelPosition) {
            panel.style.left = `${config.settingsPanelPosition.x}px`;
            panel.style.top = `${config.settingsPanelPosition.y}px`;
        }
    }

    // Make an element draggable
    function makeElementDraggable(element, handleSelector) {
        const handle = element.querySelector(handleSelector) || element;
        let isDragging = false;
        let offsetX, offsetY;
        
        handle.addEventListener('mousedown', startDrag);
        
        function startDrag(e) {
            if (e.target.tagName === 'BUTTON') return; // Don't drag when clicking buttons
            
            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
            
            e.preventDefault();
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
            
            // Save position for next page load
            config.settingsPanelPosition = { x, y };
            GM_setValue('settingsPanelPosition', config.settingsPanelPosition);
        }
        
        function stopDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
        }
    }

    // Toggle settings panel visibility
    function toggleSettingsPanel() {
        const panel = document.getElementById('str-settings-panel');
        config.settingsPanelVisible = !config.settingsPanelVisible;
        
        if (config.settingsPanelVisible) {
            panel.classList.add('visible');
        } else {
            panel.classList.remove('visible');
        }
    }

    // Toggle script enabled/disabled
    function toggleEnabled(e) {
        config.enabled = e.target.checked;
        GM_setValue('enabled', config.enabled);
        logger.log(`Script ${config.enabled ? 'enabled' : 'disabled'}`);
        updateStatus();
    }

    // Update Ollama API endpoint
    function updateEndpoint(e) {
        config.ollamaEndpoint = e.target.value;
        GM_setValue('ollamaEndpoint', config.ollamaEndpoint);
        logger.log(`API endpoint updated to: ${config.ollamaEndpoint}`);
        
        // Fetch models when endpoint changes
        fetchOllamaModels();
    }

    // Update selected model
    function updateSelectedModel(e) {
        config.selectedModel = e.target.value;
        GM_setValue('selectedModel', config.selectedModel);
        logger.log(`Selected model updated to: ${config.selectedModel}`);
    }

    // Toggle debug mode
    function toggleDebugMode(e) {
        config.debug = e.target.checked;
        GM_setValue('debug', config.debug);
        logger.log(`Debug mode ${config.debug ? 'enabled' : 'disabled'}`);
        
        const debugInfo = document.getElementById('str-debug-info');
        if (config.debug) {
            debugInfo.classList.add('visible');
        } else {
            debugInfo.classList.remove('visible');
        }
    }

    // Update debug info display
    function updateDebugInfo(message) {
        const debugInfo = document.getElementById('str-debug-info');
        if (debugInfo) {
            const timestamp = new Date().toLocaleTimeString();
            const entry = document.createElement('div');
            entry.textContent = `[${timestamp}] ${message}`;
            
            debugInfo.appendChild(entry);
            debugInfo.scrollTop = debugInfo.scrollHeight;
            
            // Limit entries to last 50
            while (debugInfo.children.length > 50) {
                debugInfo.removeChild(debugInfo.firstChild);
            }
        }
    }

    // Update connection status in settings panel
    function updateStatus(status = null) {
        const statusElement = document.getElementById('str-status');
        if (!statusElement) return;
        
        if (status) {
            if (status === 'connected') {
                statusElement.textContent = 'Status: Connected';
                statusElement.className = 'str-status connected';
            } else if (status === 'error') {
                statusElement.textContent = 'Status: Connection Error';
                statusElement.className = 'str-status error';
            }
        } else {
            if (!config.enabled) {
                statusElement.textContent = 'Status: Disabled';
                statusElement.className = 'str-status';
            } else {
                statusElement.textContent = 'Status: Unknown';
                statusElement.className = 'str-status';
            }
        }
    }

    // Fetch available Ollama models
    function fetchOllamaModels() {
        const now = Date.now();
        
        // Only fetch models if it's been more than 1 hour or we have none
        if (now - config.lastFetchedModels < 3600000 && config.models.length > 0) {
            populateModelDropdown(config.models);
            return;
        }
        
        logger.log('Fetching available Ollama models');
        
        // Example URL for Ollama models - adjust if needed
        const modelsUrl = config.ollamaEndpoint.replace('/api/generate', '/api/tags');
        
        GM_xmlhttpRequest({
            method: 'GET',
            url: modelsUrl,
            onload: function(response) {
                try {
                    if (response.status === 200) {
                        const data = JSON.parse(response.responseText);
                        if (data.models) {
                            config.models = data.models.map(model => model.name);
                            
                            // Save models and timestamp
                            GM_setValue('models', config.models);
                            GM_setValue('lastFetchedModels', now);
                            
                            populateModelDropdown(config.models);
                            updateStatus('connected');
                            logger.log('Models fetched successfully', config.models);
                        } else {
                            // Handle API response format changes
                            logger.error('Unexpected API response format', data);
                            updateStatus('error');
                        }
                    } else {
                        logger.error('Failed to fetch models', response);
                        updateStatus('error');
                    }
                } catch (error) {
                    logger.error('Error processing models response', error);
                    updateStatus('error');
                }
            },
            onerror: function(error) {
                logger.error('Error fetching models', error);
                updateStatus('error');
            }
        });
    }

    // Populate model dropdown with available models
    function populateModelDropdown(models) {
        const modelSelect = document.getElementById('str-model-select');
        if (!modelSelect) return;
        
        // Clear existing options
        modelSelect.innerHTML = '';
        
        if (models && models.length > 0) {
            // Add detected models
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
            
            // Set previously selected model if it exists
            if (config.selectedModel && models.includes(config.selectedModel)) {
                modelSelect.value = config.selectedModel;
            } else if (models.length > 0) {
                // Default to first model
                config.selectedModel = models[0];
                GM_setValue('selectedModel', config.selectedModel);
            }
        } else {
            // No models found
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No models detected';
            modelSelect.appendChild(option);
        }
    }

    // Test connection to Ollama API
    function testOllamaConnection() {
        logger.log('Testing connection to Ollama API');
        updateDebugInfo('Testing Ollama connection...');
        
        GM_xmlhttpRequest({
            method: 'POST',
            url: config.ollamaEndpoint,
            data: JSON.stringify({
                model: config.selectedModel,
                prompt: 'Say "Connection successful" in one short sentence.',
                stream: false
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            onload: function(response) {
                try {
                    if (response.status === 200) {
                        const data = JSON.parse(response.responseText);
                        updateStatus('connected');
                        updateDebugInfo(`Connection successful! Model response: ${data.response}`);
                        logger.log('Connection test successful', data);
                    } else {
                        updateStatus('error');
                        updateDebugInfo(`Connection failed: ${response.status} ${response.statusText}`);
                        logger.error('Connection test failed', response);
                    }
                } catch (error) {
                    updateStatus('error');
                    updateDebugInfo(`Connection error: ${error.message}`);
                    logger.error('Error during connection test', error);
                }
            },
            onerror: function(error) {
                updateStatus('error');
                updateDebugInfo(`Connection error: ${error.message}`);
                logger.error('Connection test error', error);
            }
        });
    }

    // Setup keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Toggle settings panel
            if (e.key === 'r' && e.altKey && !e.shiftKey) {
                toggleSettingsPanel();
                e.preventDefault();
            }
            
            // Quick rewrite with last mode
            if (e.key === 'r' && e.altKey && e.shiftKey) {
                const activeElement = document.activeElement;
                if (isTextInput(activeElement)) {
                    quickRewrite(activeElement);
                    e.preventDefault();
                }
            }
            
            // Emergency disable with ESC when settings panel is open
            if (e.key === 'Escape' && config.settingsPanelVisible) {
                toggleSettingsPanel();
                e.preventDefault();
            }
        });
    }    // Setup context menu for rewriting text
    function setupContextMenu() {
        // Create context menu element
        const contextMenu = document.createElement('div');
        contextMenu.className = 'str-context-menu';
        document.body.appendChild(contextMenu);
        
        // Add event listener for right-click on text inputs
        document.addEventListener('contextmenu', function(e) {
            if (!config.enabled) return;
            
            // Check if the target is a text input or has a text input parent (for handling click areas around inputs)
            let target = e.target;
            let isTextInputElement = isTextInput(target);
            
            // If the target isn't a text input, check if any parent up to 3 levels is a text input
            if (!isTextInputElement) {
                let parent = target.parentElement;
                let depth = 0;
                while (parent && depth < 3) {
                    if (isTextInput(parent)) {
                        target = parent;
                        isTextInputElement = true;
                        break;
                    }
                    parent = parent.parentElement;
                    depth++;
                }
            }
            
            // If we found a text input element, show the context menu
            if (isTextInputElement) {
                // Show custom context menu
                showContextMenu(e, target, contextMenu);
                e.preventDefault();
                updateDebugInfo("Context menu opened for text input");
            }
        });
        
        // Close context menu when clicking elsewhere or pressing Escape
        document.addEventListener('click', function(e) {
            // Only close if click wasn't on the context menu itself
            if (!e.target.closest('.str-context-menu')) {
                contextMenu.classList.remove('visible');
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                contextMenu.classList.remove('visible');
            }
        });
        
        // Prevent the context menu from closing when clicking inside it
        contextMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }    // Show context menu for text rewriting
    function showContextMenu(event, target, contextMenu) {
        // Clear previous content
        contextMenu.innerHTML = '';
        
        // Add header
        const header = document.createElement('div');
        header.className = 'str-context-menu-header';
        header.textContent = 'Smart Text Rewriter';
        contextMenu.appendChild(header);
        
        // Add main rewrite option
        const rewriteOption = document.createElement('div');
        rewriteOption.className = 'str-context-menu-item str-rewrite-option';
        rewriteOption.setAttribute('data-action', 'rewrite');
        rewriteOption.innerHTML = '<span class="str-icon">✍️</span> Rewrite Text';
        rewriteOption.addEventListener('click', function() {
            const mode = getLastUsedMode(target);
            rewriteText(target, mode);
            contextMenu.classList.remove('visible');
        });
        contextMenu.appendChild(rewriteOption);
        
        // Add separator
        const separator = document.createElement('div');
        separator.className = 'str-context-menu-separator';
        contextMenu.appendChild(separator);
        
        // Add rewrite modes
        Object.entries(rewriteModes).forEach(([key, mode]) => {
            const option = document.createElement('div');
            option.className = 'str-context-menu-item str-rewrite-option';
            option.setAttribute('data-mode', key);
            option.innerHTML = `<span class="str-icon">${mode.name.split(' ')[0]}</span> ${mode.name}`;
            option.addEventListener('click', function() {
                rewriteText(target, key);
                contextMenu.classList.remove('visible');
            });
            contextMenu.appendChild(option);
        });
        
        // Position the context menu - ensure it's within viewport bounds
        const rect = contextMenu.getBoundingClientRect();
        let left = event.pageX;
        let top = event.pageY;
        
        // Check right edge
        if (left + 250 > window.innerWidth) {
            left = window.innerWidth - 250;
        }
        
        // Check bottom edge
        if (top + rect.height > window.innerHeight) {
            top = window.innerHeight - rect.height;
        }
        
        contextMenu.style.left = `${left}px`;
        contextMenu.style.top = `${top}px`;
        contextMenu.classList.add('visible');
        
        // Focus the first item for keyboard navigation
        setTimeout(() => {
            const firstItem = contextMenu.querySelector('.str-rewrite-option');
            if (firstItem) firstItem.focus();
        }, 100);
    }

    // Detect all text input areas on the page
    function detectTextInputs() {
        // Select all text inputs, textareas, and contenteditable elements
        const textInputs = document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
        logger.log(`Detected ${textInputs.length} text input fields`);
    }    // Setup observers for dynamically added elements
    function setupObservers() {
        // Mutation Observer for detecting new elements
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        // Check if the added node is a text input
                        if (node.nodeType === Node.ELEMENT_NODE && isTextInput(node)) {
                            logger.log('New text input detected', node);
                            // Note: We don't need to explicitly add buttons here since
                            // they are added dynamically on focus via the event listener
                        }
                        
                        // Check for text inputs within added nodes
                        if (node.nodeType === Node.ELEMENT_NODE && node.querySelectorAll) {
                            const textInputs = node.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
                            if (textInputs.length > 0) {
                                logger.log(`Detected ${textInputs.length} text inputs in added content`);
                                // The global focus event will handle adding buttons to these inputs
                            }
                        }
                    });
                }
            });
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // IntersectionObserver for detecting visible elements
        const intersectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && isTextInput(entry.target)) {
                    logger.log('Text input entered viewport', entry.target);
                }
            });
        });
        
        // Observe all text inputs
        document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]').forEach(input => {
            intersectionObserver.observe(input);
        });
    }    // Check if an element is a text input
    function isTextInput(element) {
        if (!element || !element.tagName) return false;
        
        const tagName = element.tagName.toLowerCase();
        
        return (
            tagName === 'textarea' || 
            (tagName === 'input' && element.type === 'text') ||
            (element.getAttribute('contenteditable') === 'true')
        );
    }
    
    // Check if an element is visible
    function isElementVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        
        return !(
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.opacity === '0' ||
            element.offsetWidth === 0 ||
            element.offsetHeight === 0
        );
    }

    // Get the text from an input element
    function getTextFromInput(element) {
        if (!element) return '';
        
        if (element.tagName.toLowerCase() === 'textarea' || 
            (element.tagName.toLowerCase() === 'input' && element.type === 'text')) {
            return element.value;
        } else if (element.getAttribute('contenteditable') === 'true') {
            return element.innerText;
        }
        
        return '';
    }

    // Set text to an input element
    function setTextToInput(element, text) {
        if (!element) return;
        
        if (element.tagName.toLowerCase() === 'textarea' || 
            (element.tagName.toLowerCase() === 'input' && element.type === 'text')) {
            element.value = text;
            
            // Trigger input event for React and other frameworks
            const event = new Event('input', { bubbles: true });
            element.dispatchEvent(event);
        } else if (element.getAttribute('contenteditable') === 'true') {
            element.innerText = text;
            
            // Trigger input event for React and other frameworks
            const event = new InputEvent('input', { bubbles: true });
            element.dispatchEvent(event);
        }
    }

    // Check if an element is visible
    function isElementVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        
        return !(
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.opacity === '0' ||
            element.offsetWidth === 0 ||
            element.offsetHeight === 0
        );
    }

    // Get last used mode for a specific element
    function getLastUsedMode(element) {
        // Generate a unique identifier for the element
        const elementId = element.id || 
                        element.name || 
                        `${element.tagName}_${Array.from(element.parentNode.children).indexOf(element)}`;
        
        return config.lastUsedModes[elementId] || Object.keys(rewriteModes)[0];
    }    // Save last used mode for a specific element
    function saveLastUsedMode(element, mode) {
        // Generate a unique identifier for the element
        const elementId = element.id || 
                        element.name || 
                        `${element.tagName}_${Array.from(element.parentNode.children).indexOf(element)}`;
        
        config.lastUsedModes[elementId] = mode;
        GM_setValue('lastUsedModes', config.lastUsedModes);
    }
    
    // Generate a unique ID for an element
    function generateUniqueId(element) {
        // Create a unique identifier based on element attributes and position
        const tagName = element.tagName.toLowerCase();
        const path = [];
        let currentElem = element;
        
        while (currentElem && currentElem !== document.body) {
            let index = 0;
            let sibling = currentElem;
            
            while (sibling) {
                if (sibling.nodeType === Node.ELEMENT_NODE) {
                    index++;
                }
                sibling = sibling.previousSibling;
            }
            
            path.unshift(`${currentElem.tagName.toLowerCase()}:nth-child(${index})`);
            currentElem = currentElem.parentNode;
        }
        
        // Create a hash of the path
        let hash = 0;
        const pathStr = path.join(' > ');
        for (let i = 0; i < pathStr.length; i++) {
            hash = ((hash << 5) - hash) + pathStr.charCodeAt(i);
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return `element_${Math.abs(hash)}`;
    }// Rewrite text using Ollama API - New fixed implementation
    function rewriteText(element, mode) {
        if (!config.enabled || !element) {
            logger.log('Rewrite aborted - script disabled or invalid element');
            return;
        }
        
        const text = getTextFromInput(element);
        if (!text.trim()) {
            logger.log('No text to rewrite');
            showNotification('⚠️ No text to rewrite! Please enter some text first.', 2000);
            return;
        }
        
        // Save the selected mode for this element
        saveLastUsedMode(element, mode);
        
        // Get mode config
        const modeConfig = rewriteModes[mode];
        if (!modeConfig) {
            logger.error(`Invalid mode: ${mode}`);
            showNotification('⚠️ Invalid rewrite mode selected!', 2000);
            return;
        }
        
        // Show rewriting indicator
        showNotification(`Rewriting in ${modeConfig.name} style...`, 60000);
        const indicator = showRewritingIndicator(element);
        
        logger.log(`Rewriting text with mode: ${mode}`, text.substring(0, 50) + '...');
        updateDebugInfo(`Rewriting with mode: ${modeConfig.name}`);
          // Prepare API request
        const requestData = {
            model: config.selectedModel,
            prompt: `${modeConfig.prompt}\n\nOriginal text:\n${text}\n\nRewritten text:`,
            stream: false
        };
        
        // Call Ollama API
        GM_xmlhttpRequest({
            method: 'POST',
            url: config.ollamaEndpoint,
            data: JSON.stringify(requestData),
            headers: {
                'Content-Type': 'application/json'
            },
            onload: function(response) {
                try {
                    if (response.status === 200) {
                        const data = JSON.parse(response.responseText);
                        if (data.response) {
                            // Update the element with rewritten text
                            const rewrittenText = data.response.trim();
                            setTextToInput(element, rewrittenText);
                            
                            logger.log('Text rewritten successfully');
                            updateDebugInfo(`Rewrite successful: ${rewrittenText.substring(0, 50)}...`);
                            updateStatus('connected');
                            
                            // Show success notification
                            hideAllNotifications();
                            showNotification(`✅ Text rewritten in ${modeConfig.name} style!`, 2000);
                        } else {
                            logger.error('No response from API', data);
                            updateDebugInfo('Rewrite failed: No valid response from API');
                            showNotification('⚠️ Rewrite failed: No valid response from Ollama API', 3000);
                        }
                    } else {
                        logger.error('Rewrite API request failed', response);
                        updateDebugInfo(`Rewrite failed: ${response.status} ${response.statusText}`);
                        updateStatus('error');
                        showNotification(`⚠️ Rewrite failed: ${response.status} ${response.statusText}. Is Ollama running?`, 5000);
                    }
                } catch (error) {
                    logger.error('Error processing API response', error);
                    updateDebugInfo(`Rewrite error: ${error.message}`);
                    updateStatus('error');
                    showNotification(`⚠️ Error: ${error.message}. Is Ollama running?`, 5000);
                } finally {
                    // Remove the rewriting indicator
                    hideRewritingIndicator(indicator);
                }
            },
            onerror: function(error) {
                logger.error('Error making API request', error);
                updateDebugInfo(`Rewrite error: ${error.message}`);
                updateStatus('error');
                hideRewritingIndicator(indicator);
                showNotification(`⚠️ Error connecting to Ollama API. Is it running at ${config.ollamaEndpoint}?`, 5000);
            }
        });
    }
    
    // Show a rewriting indicator next to the element
    function showRewritingIndicator(element) {
        const rect = element.getBoundingClientRect();
        const indicator = document.createElement('div');
        indicator.className = 'str-rewriting-indicator';
        indicator.textContent = '✍️ Rewriting...';
        indicator.style.fontWeight = 'bold';
        indicator.style.animation = 'pulse 1.5s infinite';
        
        // Add pulse animation
        GM_addStyle(`
            @keyframes pulse {
                0% { opacity: 0.7; }
                50% { opacity: 1; }
                100% { opacity: 0.7; }
            }
        `);
        
        // Position the indicator
        indicator.style.left = `${rect.left}px`;
        indicator.style.top = `${rect.top - 30}px`;
        
        document.body.appendChild(indicator);
        return indicator;
    }
    
    // Hide rewriting indicator
    function hideRewritingIndicator(indicator) {
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }
    
    // Quick rewrite with last used mode
    function quickRewrite(element) {
        if (!config.enabled || !element) return;
        
        const mode = getLastUsedMode(element);
        rewriteText(element, mode);
        
        logger.log(`Quick rewrite with mode: ${mode}`);
    }
    
    // Hide all notification elements
    function hideAllNotifications() {
        document.querySelectorAll('div[style*="position: fixed"][style*="transform: translateX(-50%)"]').forEach(el => {
            if (el.parentNode) el.parentNode.removeChild(el);
        });
    }    // Setup rewrite buttons for text fields - New implementation
    function setupRewriteButtons() {
        // Add an initial notification to show the script is active
        showNotification('Smart Text Rewriter is active! Click in any text field to see rewrite buttons.', 3000);
        
        // Global event listener for input fields
        document.addEventListener('click', function(e) {
            if (!config.enabled) return;
            
            // Check if clicked on or near text input
            const nearbyInput = findNearbyTextInput(e.target, e.clientX, e.clientY);
            if (nearbyInput) {
                addRewriteButton(nearbyInput);
                logger.log('Added button after user click near input field');
            }
        });

        // Global event listener for focus on text fields
        document.addEventListener('focus', function(e) {
            if (!config.enabled) return;
            
            if (isTextInput(e.target)) {
                addRewriteButton(e.target);
                logger.log('Added button after input field focus');
            }
        }, true);
        
        // Add rewrite buttons to all currently visible text inputs
        const allInputs = document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
        logger.log(`Found ${allInputs.length} text inputs on page load`);
        
        allInputs.forEach(input => {
            addRewriteButton(input);
            logger.log('Added button to input on initial load');
        });

        // Set a periodic check for text inputs that might appear later
        setInterval(detectTextInputs, 5000);
    }
    
    // Find a text input near the clicked position
    function findNearbyTextInput(element, x, y) {
        // Check if element itself is a text input
        if (isTextInput(element)) {
            return element;
        }
        
        // Look for text inputs near the clicked position
        const inputElements = document.elementsFromPoint(x, y);
        for (const el of inputElements) {
            if (isTextInput(el)) {
                return el;
            }
        }
        
        // Check parent elements (often clicks happen on child elements of inputs)
        let parent = element.parentElement;
        let depth = 0;
        
        while (parent && depth < 3) {
            if (isTextInput(parent)) {
                return parent;
            }
            parent = parent.parentElement;
            depth++;
        }
        
        return null;
    }    // Add a rewrite button for a text input
    function addRewriteButton(element) {
        if (!element || !config.enabled) return;
        
        // Generate an ID for the element if it doesn't have one
        const elementId = element.id || generateUniqueId(element);
        
        // Check if a button already exists for this element
        let button = document.querySelector(`.str-rewrite-button[data-for="${elementId}"]`);
        
        // If button exists, just make sure it's correctly positioned
        if (button) {
            positionRewriteButton(button, element);
            return;
        }
        
        // Create a new button
        button = document.createElement('button');
        button.className = 'str-rewrite-button';
        button.innerHTML = '✍️<span class="str-tooltip">Smart Rewrite</span>';
        button.setAttribute('data-for', elementId);
        
        // Make the button VERY visible - bigger and more prominent
        button.style.position = 'fixed'; // Changed from absolute to fixed
        button.style.zIndex = '999999'; // Increased z-index
        button.style.background = 'red'; // Pure red to be more noticeable
        button.style.color = 'white';
        button.style.fontSize = '24px'; // Increased size
        button.style.width = '50px'; // Increased width
        button.style.height = '50px'; // Increased height
        button.style.borderRadius = '50%';
        button.style.border = '3px solid yellow'; // Bold yellow border
        button.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)'; // Stronger shadow
        button.style.cursor = 'pointer';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.animation = 'pulse-animation 2s infinite'; // Add animation
        
        // Add pulsing animation
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes pulse-animation {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(styleSheet);
        
        // Position the button
        positionRewriteButton(button, element);
        
        // Add click event to rewrite with default/last mode
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const mode = getLastUsedMode(element);
            rewriteText(element, mode);
        });
        
        // Right-click to show mode selection
        button.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showModeDropdown(e, element, button);
        });
        
        // Add the button to the document
        document.body.appendChild(button);
        console.log('[Smart Text Rewriter] Added button to element', element);
        showNotification('Rewrite button added! Click it to rewrite text.', 3000);
        
        // Log debug information
        logger.log('Button created for element:', element);
        logger.log('Button properties:', {
            position: button.style.position,
            zIndex: button.style.zIndex,
            background: button.style.background,
            dimensions: `${button.style.width}x${button.style.height}`
        });
        
        // Debug notification
        showNotification('Debug: Button should be visible now!', 2000);
    }    // Position a rewrite button next to its text input
    function positionRewriteButton(button, element) {
        if (!element || !button) return;
        
        try {
            const rect = element.getBoundingClientRect();
            const scrollX = window.scrollX || window.pageXOffset;
            const scrollY = window.scrollY || window.pageYOffset;
            
            // Fixed positioning in viewport coordinates
            button.style.position = 'fixed';
            
            // Position to the right of the input with some spacing
            button.style.left = `${rect.right + 20}px`;
            button.style.top = `${rect.top + (rect.height/2) - 25}px`;
            
            // Alternative position if near the edge of the viewport
            if (rect.right + 70 > window.innerWidth) {
                // Move to the left of the input if near right edge
                button.style.left = `${rect.left - 70}px`;
            }
            
            // Make sure the button is in the document
            if (!button.parentNode) {
                document.body.appendChild(button);
                console.log('[Smart Text Rewriter] Added button to document body');
                showNotification('Rewrite button added! Click it to rewrite text.', 2000);
            }
            
            // Debug info
            console.log('[Smart Text Rewriter] Button positioned at:', {
                left: button.style.left,
                top: button.style.top,
                elementRect: {
                    left: rect.left,
                    right: rect.right,
                    top: rect.top,
                    bottom: rect.bottom,
                    width: rect.width,
                    height: rect.height
                }
            });
        } catch (error) {
            console.error('[Smart Text Rewriter] Error positioning button:', error);
            
            // Fallback position in case of error
            button.style.top = '100px';
            button.style.left = '100px';
            
            // Make sure the button is in the document even if there's an error
            if (!button.parentNode) {
                document.body.appendChild(button);
            }
        }
    }
    
    // Remove a rewrite button
    function removeRewriteButton(button) {
        if (button && button.parentNode) {
            button.parentNode.removeChild(button);
        }
    }
    
    // Show a notification message
    function showNotification(message, duration = 2000) {
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '10px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.padding = '10px 20px';
        notification.style.background = '#3498db';
        notification.style.color = 'white';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '10000';
        notification.style.fontWeight = 'bold';
        notification.style.textAlign = 'center';
        notification.innerHTML = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.5s';
                
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 500);
            }
        }, duration);
        
        return notification;
    }
    
    // Register Tampermonkey menu commands
    GM_registerMenuCommand('⚙️ Toggle Settings Panel', toggleSettingsPanel);
    GM_registerMenuCommand('✅ Toggle Enabled/Disabled', function() {
        config.enabled = !config.enabled;
        GM_setValue('enabled', config.enabled);
        updateStatus();
        
        // Show feedback notification
        const message = document.createElement('div');
        message.style.position = 'fixed';
        message.style.top = '10px';
        message.style.left = '50%';
        message.style.transform = 'translateX(-50%)';
        message.style.padding = '10px 20px';
        message.style.background = config.enabled ? '#27ae60' : '#e74c3c';
        message.style.color = 'white';
        message.style.borderRadius = '4px';
        message.style.zIndex = '10000';
        message.style.fontWeight = 'bold';
        message.textContent = `Smart Text Rewriter ${config.enabled ? 'Enabled' : 'Disabled'}`;
        
        document.body.appendChild(message);
        setTimeout(() => {
            if (message.parentNode) message.parentNode.removeChild(message);
        }, 2000);
    });
    
    // Initialize the script
    init();

    // Shadow DOM traversal to find text inputs in modern web apps
    function traverseShadowDOM() {
        // Function to recursively find shadow roots
        function findShadowRoots(node, foundRoots = []) {
            if (!node) return foundRoots;
            
            // Check if node has shadow root
            if (node.shadowRoot) {
                foundRoots.push(node.shadowRoot);
                
                // Find text inputs in this shadow root
                const shadowInputs = node.shadowRoot.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
                logger.log(`Found ${shadowInputs.length} text inputs in shadow DOM`);
                
                // Apply observers to shadow root
                setupObserverForNode(node.shadowRoot);
                
                // Add rewrite buttons to visible inputs
                shadowInputs.forEach(input => {
                    if (isElementVisible(input)) {
                        addRewriteButton(input);
                    }
                });
            }
            
            // Check children of this node
            const children = node.querySelectorAll('*');
            children.forEach(child => {
                findShadowRoots(child, foundRoots);
            });
            
            return foundRoots;
        }
        
        // Start from document body
        findShadowRoots(document.body);
        
        logger.log('Shadow DOM traversal complete');
    }
    
    // Setup observer for specific node
    function setupObserverForNode(node) {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(addedNode => {
                        // Check if the added node is a text input
                        if (addedNode.nodeType === Node.ELEMENT_NODE && isTextInput(addedNode)) {
                            logger.log('New text input detected in observed node', addedNode);
                        }
                        
                        // Find text inputs in added node
                        if (addedNode.nodeType === Node.ELEMENT_NODE && addedNode.querySelectorAll) {
                            const textInputs = addedNode.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
                            if (textInputs.length > 0) {
                                logger.log(`Detected ${textInputs.length} text inputs in added content`);
                            }
                        }
                    });
                }
            });
        });
        
        // Start observing
        observer.observe(node, {
            childList: true,
            subtree: true
        });
    }
    
    // Site-specific enhancements and context extraction
    const siteSpecificConfig = {
        // Twitter/X
        'twitter.com': {
            selectors: {
                tweetEditor: '[data-testid="tweetTextarea_0"]',
                replyEditor: '[data-testid="tweetTextarea_0"]',
                contextTweet: '[data-testid="tweet"]'
            },
            extractContext: function() {
                // Extract tweet being replied to
                const contextTweets = document.querySelectorAll(this.selectors.contextTweet);
                if (contextTweets.length > 0) {
                    // Get the last one (most recent in thread)
                    const contextTweet = contextTweets[contextTweets.length - 1];
                    return contextTweet.textContent.trim();
                }
                return '';
            },
            characterLimit: 280
        },
        
        // Reddit
        'reddit.com': {
            selectors: {
                commentEditor: '.commentArea textarea',
                postEditor: '.submit-page textarea',
                contextPost: '.sitetable.nestedlisting .entry .md'
            },
            extractContext: function() {                // Extract post or comment being replied to
                const contextPosts = document.querySelectorAll(this.selectors.contextPost);
                if (contextPosts.length > 0) {
                    // Get the last one (direct parent)
                    const contextPost = contextPosts[contextPosts.length - 1];
                    return contextPost.textContent.trim();
                }
                return '';
            }
        },
        
        // Gmail
        'mail.google.com': {
            selectors: {
                emailEditor: '.Am.Al.editable',
                contextEmails: '.h7'
            },
            extractContext: function() {
                // Extract previous email threads
                const contextEmails = document.querySelectorAll(this.selectors.contextEmails);
                let context = '';
                contextEmails.forEach(email => {
                    context += email.textContent.trim() + '\n\n';
                });
                return context;
            }
        }
    };
    
    // Get site-specific configuration for current site
    function getCurrentSiteConfig() {
        const hostname = window.location.hostname;
        
        // Check for each known site
        for (const site in siteSpecificConfig) {
            if (hostname.includes(site)) {
                return siteSpecificConfig[site];
            }
        }
        
        // Default config
        return null;
    }
    
    // Extract context for smart reply
    function extractTextContext() {
        const siteConfig = getCurrentSiteConfig();
        if (siteConfig && typeof siteConfig.extractContext === 'function') {
            const context = siteConfig.extractContext();
            logger.log('Extracted context:', context);
            updateDebugInfo(`Extracted context (${context.length} chars)`);
            return context;
        }
        return '';
    }
    
    // Smart reply with context awareness
    function smartReply(element) {
        if (!config.enabled || !element) return;
        
        const text = getTextFromInput(element);
        const context = extractTextContext();
        
        // Show rewriting indicator
        const indicator = showRewritingIndicator(element);
        
        // Get the appropriate mode
        const mode = getLastUsedMode(element);
        const promptTemplate = rewriteModes[mode]?.prompt || rewriteModes[Object.keys(rewriteModes)[0]].prompt;
        
        // Add context to the prompt if available
        let enhancedPrompt = promptTemplate;
        if (context) {
            enhancedPrompt += `\n\nContext (what you're replying to):\n"${context}"\n\n`;
        }
        
        // Handle site-specific character limits
        const siteConfig = getCurrentSiteConfig();
        if (siteConfig && siteConfig.characterLimit) {
            enhancedPrompt += `\nKeep your response under ${siteConfig.characterLimit} characters.\n`;
        }
        
        // Prepare API request
        const requestData = {
            model: config.selectedModel,
            prompt: `${enhancedPrompt}\n\nOriginal text (or blank if starting from scratch):\n"${text}"\n\nSmart reply:`,
            stream: false
        };
        
        logger.log('Smart reply with context awareness', { mode, context: context.substring(0, 100) + '...' });
        updateDebugInfo(`Smart reply using ${mode} mode with context`);
        
        // Call Ollama API
        GM_xmlhttpRequest({
            method: 'POST',
            url: config.ollamaEndpoint,
            data: JSON.stringify(requestData),
            headers: {
                'Content-Type': 'application/json'
            },
            onload: function(response) {
                try {
                    if (response.status === 200) {
                        const data = JSON.parse(response.responseText);
                        if (data.response) {
                            // Update the element with smart reply
                            setTextToInput(element, data.response.trim());
                            logger.log('Smart reply created successfully');
                            updateDebugInfo(`Smart reply created: ${data.response.substring(0, 50)}...`);
                            updateStatus('connected');
                        } else {
                            logger.error('No response from API', data);
                            updateDebugInfo('Smart reply failed: No valid response from API');
                        }
                    } else {
                        logger.error('Smart reply API request failed', response);
                        updateDebugInfo(`Smart reply failed: ${response.status} ${response.statusText}`);
                        updateStatus('error');
                    }
                } catch (error) {
                    logger.error('Error processing API response', error);
                    updateDebugInfo(`Smart reply error: ${error.message}`);
                    updateStatus('error');
                } finally {
                    // Remove the rewriting indicator
                    hideRewritingIndicator(indicator);
                }
            },
            onerror: function(error) {
                logger.error('Error making API request', error);
                updateDebugInfo(`Smart reply error: ${error.message}`);
                updateStatus('error');
                hideRewritingIndicator(indicator);
            }
        });
    }

    // Function to add a custom rewrite mode
    function addCustomMode() {
        // Create a modal for adding custom modes
        const modal = document.createElement('div');
        modal.className = 'str-modal';
        
        modal.innerHTML = `
            <div class="str-modal-content">
                <h3>Add Custom Rewrite Mode</h3>
                <div class="str-row">
                    <label for="str-custom-name">Mode Name (with emoji):</label>
                    <input type="text" id="str-custom-name" placeholder="🎭 My Custom Mode">
                </div>
                <div class="str-row">
                    <label for="str-custom-prompt">Prompt Template:</label>
                    <textarea id="str-custom-prompt" rows="5" placeholder="Rewrite this text in a specific style..."></textarea>
                </div>
                <div class="str-row str-buttons">
                    <button id="str-custom-save">Save Mode</button>
                    <button id="str-custom-cancel">Cancel</button>
                </div>
            </div>
        `;
        
        // Add modal CSS
        GM_addStyle(`
            .str-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .str-modal-content {
                background: #2c3e50;
                color: #ecf0f1;
                padding: 20px;
                border-radius: 8px;
                width: 400px;
                max-width: 90%;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            }
            
            .str-modal textarea {
                width: 100%;
                padding: 8px 10px;
                background: #34495e;
                color: #ecf0f1;
                border: 1px solid #7f8c8d;
                border-radius: 4px;
                font-size: 14px;
                font-family: 'Segoe UI', Arial, sans-serif;
                resize: vertical;
            }
            
            .str-buttons {
                display: flex;
                gap: 10px;
            }
            
            .str-buttons button {
                flex: 1;
            }
        `);
        
        document.body.appendChild(modal);
        
        // Setup event listeners
        document.getElementById('str-custom-save').addEventListener('click', function() {
            const name = document.getElementById('str-custom-name').value.trim();
            const prompt = document.getElementById('str-custom-prompt').value.trim();
            
            if (!name || !prompt) {
                alert('Please fill in both fields!');
                return;
            }
            
            // Generate a unique key for the mode
            const key = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');
            
            // Add to custom modes
            customModes[key] = {
                name: name,
                prompt: prompt
            };
            
            // Save to GM storage
            GM_setValue('customModes', customModes);
            
            // Update rewrite modes object
            Object.assign(rewriteModes, customModes);
            
            // Update dropdown in settings panel
            const modeSelect = document.getElementById('str-default-mode');
            if (modeSelect) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = name;
                modeSelect.appendChild(option);
            }
            
            // Close modal
            modal.remove();
            
            updateDebugInfo(`Added custom mode: ${name}`);
        });
        
        document.getElementById('str-custom-cancel').addEventListener('click', function() {
            modal.remove();
        });
    }
    
    // Add "Add Custom Mode" button to settings panel
    function addCustomModeButton() {
        const settingsPanel = document.getElementById('str-settings-panel');
        if (!settingsPanel) return;
        
        const customModeRow = document.createElement('div');
        customModeRow.className = 'str-row';
        
        const button = document.createElement('button');
        button.id = 'str-add-custom-mode';
        button.textContent = '+ Add Custom Mode';
        button.addEventListener('click', addCustomMode);
        
        customModeRow.appendChild(button);
        
        // Add before debug mode row
        const debugModeRow = settingsPanel.querySelector('div.str-row:last-of-type');
        if (debugModeRow) {
            settingsPanel.insertBefore(customModeRow, debugModeRow);
        } else {
            settingsPanel.appendChild(customModeRow);
        }
    }

    // Add mode cycling with number keys (Alt+1-9)
    function setupModeCycling() {
        document.addEventListener('keydown', function(e) {
            // Check for Alt + number key (1-9)
            if (e.altKey && e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                
                // Convert to zero-based index
                const index = parseInt(e.key) - 1;
                
                // Get all modes
                const modes = Object.keys(rewriteModes);
                
                // Check if index is valid
                if (index < modes.length) {
                    const mode = modes[index];
                    
                    // If there's an active text input, apply this mode
                    const activeElement = document.activeElement;
                    if (isTextInput(activeElement)) {
                        rewriteText(activeElement, mode);
                        
                        // Show feedback
                        const rect = activeElement.getBoundingClientRect();
                        const feedback = document.createElement('div');
                        feedback.style.position = 'absolute';
                        feedback.style.left = `${rect.left}px`;
                        feedback.style.top = `${rect.bottom + 5}px`;
                        feedback.style.backgroundColor = '#3498db';
                        feedback.style.color = 'white';
                        feedback.style.padding = '5px 10px';
                        feedback.style.borderRadius = '4px';
                        feedback.style.zIndex = '10000';
                        feedback.style.fontWeight = 'bold';
                        feedback.textContent = `Mode: ${rewriteModes[mode].name}`;
                        
                        document.body.appendChild(feedback);
                        setTimeout(() => {
                            if (feedback.parentNode) feedback.parentNode.removeChild(feedback);
                        }, 1500);
                    }
                }
            }
        });
    }

    // Initialize mode cycling
    setupModeCycling();

    // Show mode dropdown for selecting rewrite mode
    function showModeDropdown(event, element, button) {
        // Create dropdown if it doesn't exist
        let dropdown = document.querySelector('.str-mode-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'str-mode-dropdown';
            document.body.appendChild(dropdown);
        }
        
        // Clear previous content
        dropdown.innerHTML = '';
        
        // Add header
        const header = document.createElement('div');
        header.className = 'str-mode-dropdown-header';
        header.textContent = 'Select Rewrite Mode';
        header.style.padding = '8px 12px';
        header.style.fontWeight = 'bold';
        header.style.borderBottom = '1px solid #34495e';
        dropdown.appendChild(header);
        
        // Add modes
        Object.entries(rewriteModes).forEach(([key, mode]) => {
            const item = document.createElement('div');
            item.className = 'str-mode-dropdown-item';
            item.textContent = mode.name;
            item.setAttribute('data-mode', key);
            
            item.addEventListener('click', function() {
                rewriteText(element, key);
                dropdown.classList.remove('visible');
            });
            
            dropdown.appendChild(item);
        });
        
        // Position the dropdown near the button
        const rect = button.getBoundingClientRect();
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.top = `${rect.bottom + 5}px`;
        
        // Show the dropdown
        dropdown.classList.add('visible');
        
        // Close dropdown when clicking elsewhere
        const closeDropdown = function(e) {
            if (!dropdown.contains(e.target) && e.target !== button) {
                dropdown.classList.remove('visible');
                document.removeEventListener('click', closeDropdown);
            }
        };
        
        // Delay adding the event listener to prevent immediate closing
        setTimeout(() => {
            document.addEventListener('click', closeDropdown);
        }, 10);
    }

    // Create a debug button that's always visible in the corner
    function createDebugButton() {
        const button = document.createElement('button');
        button.textContent = 'STR Debug';
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.zIndex = '999999';
        button.style.background = 'blue';
        button.style.color = 'white';
        button.style.padding = '10px 15px';
        button.style.borderRadius = '5px';
        button.style.border = '2px solid white';
        button.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        button.style.cursor = 'pointer';
        button.style.fontSize = '16px';
        
        button.addEventListener('click', function() {
            // Show current status of the script
            const status = {
                enabled: config.enabled,
                buttonsAdded: document.querySelectorAll('.str-rewrite-button').length,
                textInputsFound: document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]').length,
                settingsPanelVisible: config.settingsPanelVisible,
                selectedModel: config.selectedModel,
                endpoint: config.ollamaEndpoint
            };
            
            console.log('[Smart Text Rewriter] Status:', status);
            
            // Force add buttons to all text inputs
            const allInputs = document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
            
            showNotification(`Found ${allInputs.length} text inputs. Adding buttons...`, 3000);
            
            allInputs.forEach(input => {
                addRewriteButton(input);
            });
            
            // Show notification
            showNotification(`Debug info: Found ${allInputs.length} text inputs, added ${document.querySelectorAll('.str-rewrite-button').length} buttons`, 5000);
        });
        
        document.body.appendChild(button);
    }
})();
