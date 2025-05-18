/**
 * Smart Text Rewriter - Input Tagger
 * 
 * This module handles tagging inputs to include or exclude them from the rewrite functionality.
 */

class InputTagger {
    constructor(config) {
        this.config = config;
        this.excludedTags = config.excludedTags || [];
        this.includedTags = config.includedTags || [];
    }
    
    /**
     * Checks if an element should be processed
     * @param {HTMLElement} element - The element to check
     * @returns {boolean} - Whether the element should be processed
     */
    shouldProcess(element) {
        // Get element identifiers
        const identifiers = this.getElementIdentifiers(element);
        
        // Check against excluded tags
        for (const tag of this.excludedTags) {
            if (this.matchesIdentifier(identifiers, tag)) {
                return false;
            }
        }
        
        // If we have include tags, element must match one
        if (this.includedTags.length > 0) {
            for (const tag of this.includedTags) {
                if (this.matchesIdentifier(identifiers, tag)) {
                    return true;
                }
            }
            return false;
        }
        
        // No include tags, and not excluded
        return true;
    }
    
    /**
     * Gets identifiers for an element (id, class, attributes)
     * @param {HTMLElement} element - The element to get identifiers for
     * @returns {Object} - The element identifiers
     */
    getElementIdentifiers(element) {
        return {
            id: element.id,
            tagName: element.tagName.toLowerCase(),
            classes: Array.from(element.classList),
            name: element.getAttribute('name'),
            placeholder: element.getAttribute('placeholder'),
            dataAttributes: this.getDataAttributes(element),
            path: this.getElementPath(element)
        };
    }
    
    /**
     * Gets all data attributes for an element
     * @param {HTMLElement} element - The element to get data attributes for
     * @returns {Object} - The data attributes
     */
    getDataAttributes(element) {
        const result = {};
        for (const attr of element.attributes) {
            if (attr.name.startsWith('data-')) {
                result[attr.name] = attr.value;
            }
        }
        return result;
    }
    
    /**
     * Gets the CSS selector path to an element
     * @param {HTMLElement} element - The element to get the path for
     * @returns {string} - The element path
     */
    getElementPath(element) {
        if (!element || element === document.body) {
            return '';
        }
        
        let selector = element.tagName.toLowerCase();
        
        if (element.id) {
            selector += `#${element.id}`;
            return selector;
        }
        
        if (element.className) {
            const classes = element.className.split(/\s+/).filter(c => c);
            selector += classes.map(c => `.${c}`).join('');
        }
        
        const parent = element.parentNode;
        if (parent) {
            const parentPath = this.getElementPath(parent);
            return parentPath ? `${parentPath} > ${selector}` : selector;
        }
        
        return selector;
    }
    
    /**
     * Checks if element identifiers match a tag pattern
     * @param {Object} identifiers - The element identifiers
     * @param {Object} tag - The tag pattern to match
     * @returns {boolean} - Whether the identifiers match the tag
     */
    matchesIdentifier(identifiers, tag) {
        // Match by ID
        if (tag.id && identifiers.id === tag.id) {
            return true;
        }
        
        // Match by class
        if (tag.class && identifiers.classes.includes(tag.class)) {
            return true;
        }
        
        // Match by name attribute
        if (tag.name && identifiers.name === tag.name) {
            return true;
        }
        
        // Match by tag name
        if (tag.tagName && identifiers.tagName === tag.tagName) {
            return true;
        }
        
        // Match by placeholder
        if (tag.placeholder && identifiers.placeholder === tag.placeholder) {
            return true;
        }
        
        // Match by data attribute
        if (tag.dataAttribute && tag.dataValue) {
            for (const [key, value] of Object.entries(identifiers.dataAttributes)) {
                if (key === tag.dataAttribute && value === tag.dataValue) {
                    return true;
                }
            }
        }
        
        // Match by CSS selector path
        if (tag.path && identifiers.path.includes(tag.path)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Adds a tag to exclude elements
     * @param {Object} tag - The tag to add
     */
    addExcludeTag(tag) {
        this.excludedTags.push(tag);
        this.saveConfig();
    }
    
    /**
     * Adds a tag to include elements
     * @param {Object} tag - The tag to add
     */
    addIncludeTag(tag) {
        this.includedTags.push(tag);
        this.saveConfig();
    }
    
    /**
     * Removes an exclude tag
     * @param {number} index - The index of the tag to remove
     */
    removeExcludeTag(index) {
        if (index >= 0 && index < this.excludedTags.length) {
            this.excludedTags.splice(index, 1);
            this.saveConfig();
        }
    }
    
    /**
     * Removes an include tag
     * @param {number} index - The index of the tag to remove
     */
    removeIncludeTag(index) {
        if (index >= 0 && index < this.includedTags.length) {
            this.includedTags.splice(index, 1);
            this.saveConfig();
        }
    }
    
    /**
     * Saves the configuration
     */
    saveConfig() {
        this.config.excludedTags = this.excludedTags;
        this.config.includedTags = this.includedTags;
        // The main script will handle the actual saving
    }
}

// Export the tagger
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputTagger;
}
