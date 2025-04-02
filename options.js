// Save settings when changes are made
function saveOptions(e) {
    const autoHide = document.getElementById('autoHide').checked;
    const hideDelay = document.getElementById('hideDelay').value;
    const apiKey = document.getElementById('apiKey').value;
    const position = document.getElementById('position').value;
    const size = document.getElementById('size').value;
    const opacity = document.getElementById('opacity').value;
    
    chrome.storage.local.set({
        autoHide: autoHide,
        hideDelay: hideDelay,
        apiKey: apiKey,
        position: position,
        size: size,
        opacity: opacity
    }, () => {
        // Notify content script of settings change
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: "settingsUpdated",
                    settings: { autoHide, hideDelay, apiKey, position, size, opacity }
                });
            });
        });

        // Show saved message
        const status = document.getElementById('saveStatus');
        status.classList.add('visible');
        setTimeout(() => {
            status.classList.remove('visible');
        }, 2000);

        // Log settings change
        console.log('[Kahoot Viewer Settings] Saved:', { autoHide, apiKey: '***', position, size });
    });
}

// Load saved settings
function loadOptions() {
    chrome.storage.local.get({
        autoHide: true,  // default values
        hideDelay: '3',
        apiKey: '',
        position: 'top-right',
        size: 'medium',
        opacity: '100'
    }, (items) => {
        document.getElementById('autoHide').checked = items.autoHide;
        document.getElementById('hideDelay').value = items.hideDelay;
        document.getElementById('apiKey').value = items.apiKey;
        document.getElementById('position').value = items.position;
        document.getElementById('size').value = items.size;
        document.getElementById('opacity').value = items.opacity;
        document.getElementById('opacityValue').textContent = items.opacity;
        updateOpacityWarning(items.opacity);
        console.log('[Kahoot Viewer Settings] Loaded:', items);
    });
}

// Add event listeners
document.addEventListener('DOMContentLoaded', loadOptions);
document.getElementById('autoHide').addEventListener('change', saveOptions);
document.getElementById('hideDelay').addEventListener('input', saveOptions);
document.getElementById('apiKey').addEventListener('input', saveOptions);
document.getElementById('position').addEventListener('change', saveOptions);
document.getElementById('size').addEventListener('change', saveOptions);

// Handle opacity slider changes
function updateOpacityWarning(value) {
    const warning = document.getElementById('opacityWarning');
    warning.style.display = value < 10 ? 'inline' : 'none';
}

document.getElementById('opacity').addEventListener('input', (e) => {
    document.getElementById('opacityValue').textContent = e.target.value;
    updateOpacityWarning(e.target.value);
    saveOptions();
});

// Listen for scrollToApiSection message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrollToApiSection') {
        // Wait for the DOM to be fully loaded
        setTimeout(() => {
            const apiSection = document.getElementById('api-section');
            if (apiSection) {
                apiSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }
});
