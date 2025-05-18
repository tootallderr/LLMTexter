/**
 * Smart Text Rewriter - Keyboard Shortcut Handler
 * 
 * This module handles keyboard shortcuts for the Smart Text Rewriter script.
 */

class KeyboardShortcutHandler {
    constructor(config) {
        this.config = config;
        this.shortcuts = {
            // Default shortcuts
            'alt+r': {
                name: 'Rewrite with last mode',
                action: this.rewriteWithLastMode.bind(this)
            },
            'alt+shift+r': {
                name: 'Open rewrite mode selection',
                action: this.openModeSelection.bind(this)
            },
            'alt+shift+s': {
                name: 'Open settings',
                action: this.openSettings.bind(this)
            }
        };
        
        // Custom shortcuts from config
        if (config.customShortcuts) {
            Object.assign(this.shortcuts, config.customShortcuts);
        }
        
        this.initListeners();
    }
    
    initListeners() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    handleKeyDown(e) {
        // Ignore if in input field or contenteditable (unless it's the target)
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            // This is fine, we want to process shortcuts in text fields
        } else if (e.target.tagName === 'BODY' || e.target.tagName === 'DIV') {
            // Only process in body or general divs if they're not interactive
            if (e.target.getAttribute('role') === 'textbox' || e.target.getAttribute('contenteditable') === 'true') {
                // This is fine, it's a text field
            } else {
                return; // Skip non-text areas
            }
        } else {
            return; // Skip other elements
        }
        
        // Build key combo string
        let combo = '';
        if (e.ctrlKey) combo += 'ctrl+';
        if (e.altKey) combo += 'alt+';
        if (e.shiftKey) combo += 'shift+';
        if (e.metaKey) combo += 'meta+'; // Command key on Mac
        
        // Add the key
        combo += e.key.toLowerCase();
        
        // Check if this combo is a registered shortcut
        if (this.shortcuts[combo]) {
            e.preventDefault();
            this.shortcuts[combo].action(e.target);
        }
    }
    
    rewriteWithLastMode(element) {
        // Get the active element if none provided
        if (!element) {
            element = document.activeElement;
        }
        
        // Check if this is a text element
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT' || element.isContentEditable) {
            // Find the element ID
            const elementId = element.id || `el_${Math.random().toString(36).substr(2, 9)}`;
            if (!element.id) {
                element.id = elementId;
            }
            
            // Get the last used mode
            const mode = this.config.lastUsedModes[elementId] || this.config.defaultMode;
            
            // Trigger rewrite with this mode
            // This will be handled by the main script
            element.dispatchEvent(new CustomEvent('smartRewrite', {
                bubbles: true,
                detail: { mode: mode }
            }));
        }
    }
    
    openModeSelection(element) {
        // Get the active element if none provided
        if (!element) {
            element = document.activeElement;
        }
        
        // Check if this is a text element
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT' || element.isContentEditable) {
            // Find the button for this element
            const buttons = document.querySelectorAll('.smart-rewriter-btn');
            for (const button of buttons) {
                const rect = button.getBoundingClientRect();
                const elRect = element.getBoundingClientRect();
                
                // Check if this button is positioned near the element
                if (Math.abs(rect.top - elRect.top) < 30) {
                    // Click the button to open mode selection
                    button.click();
                    break;
                }
            }
        }
    }
    
    openSettings() {
        // Trigger settings open event
        document.dispatchEvent(new CustomEvent('smartRewriterOpenSettings'));
    }
    
    registerShortcut(combo, name, action) {
        this.shortcuts[combo] = {
            name: name,
            action: action
        };
    }
    
    unregisterShortcut(combo) {
        delete this.shortcuts[combo];
    }
}

// Export the handler
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyboardShortcutHandler;
}
