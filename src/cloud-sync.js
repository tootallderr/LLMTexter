/**
 * Smart Text Rewriter - Cloud Sync
 * 
 * This module handles synchronizing user settings with a cloud service.
 */

class CloudSync {
    constructor(config) {
        this.config = config;
        this.syncEndpoint = config.syncEndpoint || 'https://your-sync-service.com/api/sync';
        this.userId = config.userId || '';
        this.syncKey = config.syncKey || '';
        this.lastSyncTime = config.lastSyncTime || 0;
        this.syncEnabled = config.syncEnabled || false;
        this.syncInterval = 1000 * 60 * 30; // 30 minutes
    }
    
    /**
     * Initializes sync if enabled
     */
    init() {
        if (!this.syncEnabled) {
            return;
        }
        
        // Check if we need to sync on startup
        if (Date.now() - this.lastSyncTime > this.syncInterval) {
            this.pullFromCloud();
        }
        
        // Set up periodic sync
        setInterval(() => {
            if (this.syncEnabled) {
                this.sync();
            }
        }, this.syncInterval);
    }
    
    /**
     * Enables or disables sync
     * @param {boolean} enabled - Whether sync should be enabled
     */
    setSyncEnabled(enabled) {
        this.syncEnabled = enabled;
        this.config.syncEnabled = enabled;
        
        if (enabled) {
            // Pull from cloud immediately when enabling
            this.pullFromCloud();
        }
    }
    
    /**
     * Sets the user ID for sync
     * @param {string} userId - The user ID
     */
    setUserId(userId) {
        this.userId = userId;
        this.config.userId = userId;
    }
    
    /**
     * Sets the sync key for encryption
     * @param {string} syncKey - The sync key
     */
    setSyncKey(syncKey) {
        this.syncKey = syncKey;
        this.config.syncKey = syncKey;
    }
    
    /**
     * Performs a two-way sync
     */
    sync() {
        // First pull from cloud
        this.pullFromCloud()
            .then(() => {
                // Then push local changes
                return this.pushToCloud();
            })
            .catch(error => {
                console.error('Smart Text Rewriter: Sync error', error);
            });
    }
    
    /**
     * Pulls settings from the cloud
     * @returns {Promise} - Promise that resolves when the pull is complete
     */
    pullFromCloud() {
        return new Promise((resolve, reject) => {
            if (!this.userId) {
                reject(new Error('User ID not set'));
                return;
            }
            
            // Make API request
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${this.syncEndpoint}?userId=${encodeURIComponent(this.userId)}&lastSync=${this.lastSyncTime}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.syncKey}`
                },
                onload: (response) => {
                    try {
                        if (response.status >= 200 && response.status < 300) {
                            const data = JSON.parse(response.responseText);
                            
                            if (data.settings) {
                                // Merge the received settings
                                this.mergeSettings(data.settings);
                                this.lastSyncTime = Date.now();
                                this.config.lastSyncTime = this.lastSyncTime;
                                resolve();
                            } else {
                                resolve(); // No new settings
                            }
                        } else {
                            reject(new Error(`API error: ${response.status}`));
                        }
                    } catch (error) {
                        reject(error);
                    }
                },
                onerror: (error) => {
                    reject(error);
                }
            });
        });
    }
    
    /**
     * Pushes settings to the cloud
     * @returns {Promise} - Promise that resolves when the push is complete
     */
    pushToCloud() {
        return new Promise((resolve, reject) => {
            if (!this.userId) {
                reject(new Error('User ID not set'));
                return;
            }
            
            // Prepare settings to sync
            const settings = {
                rewriteModes: this.getCustomModes(),
                apiSettings: {
                    apiEndpoint: this.config.apiEndpoint,
                    defaultMode: this.config.defaultMode
                },
                uiSettings: {
                    showRewriteButton: this.config.showRewriteButton,
                    debugMode: this.config.debugMode
                },
                excludedTags: this.config.excludedTags,
                includedTags: this.config.includedTags,
                customShortcuts: this.config.customShortcuts
            };
            
            // Make API request
            GM_xmlhttpRequest({
                method: 'POST',
                url: this.syncEndpoint,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.syncKey}`
                },
                data: JSON.stringify({
                    userId: this.userId,
                    timestamp: Date.now(),
                    settings: settings
                }),
                onload: (response) => {
                    try {
                        if (response.status >= 200 && response.status < 300) {
                            this.lastSyncTime = Date.now();
                            this.config.lastSyncTime = this.lastSyncTime;
                            resolve();
                        } else {
                            reject(new Error(`API error: ${response.status}`));
                        }
                    } catch (error) {
                        reject(error);
                    }
                },
                onerror: (error) => {
                    reject(error);
                }
            });
        });
    }
    
    /**
     * Gets custom modes for syncing
     * @returns {Object} - Custom modes
     */
    getCustomModes() {
        const customModes = {};
        for (const [key, mode] of Object.entries(this.config.REWRITE_MODES)) {
            if (mode.isCustom) {
                customModes[key] = mode;
            }
        }
        return customModes;
    }
    
    /**
     * Merges received settings with local settings
     * @param {Object} settings - Settings received from cloud
     */
    mergeSettings(settings) {
        // Merge custom modes
        if (settings.rewriteModes) {
            for (const [key, mode] of Object.entries(settings.rewriteModes)) {
                this.config.REWRITE_MODES[key] = mode;
            }
        }
        
        // Merge API settings
        if (settings.apiSettings) {
            if (settings.apiSettings.apiEndpoint) {
                this.config.apiEndpoint = settings.apiSettings.apiEndpoint;
            }
            if (settings.apiSettings.defaultMode) {
                this.config.defaultMode = settings.apiSettings.defaultMode;
            }
        }
        
        // Merge UI settings
        if (settings.uiSettings) {
            if (typeof settings.uiSettings.showRewriteButton !== 'undefined') {
                this.config.showRewriteButton = settings.uiSettings.showRewriteButton;
            }
            if (typeof settings.uiSettings.debugMode !== 'undefined') {
                this.config.debugMode = settings.uiSettings.debugMode;
            }
        }
        
        // Merge tags
        if (settings.excludedTags) {
            this.config.excludedTags = settings.excludedTags;
        }
        if (settings.includedTags) {
            this.config.includedTags = settings.includedTags;
        }
        
        // Merge shortcuts
        if (settings.customShortcuts) {
            this.config.customShortcuts = settings.customShortcuts;
        }
    }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudSync;
}
