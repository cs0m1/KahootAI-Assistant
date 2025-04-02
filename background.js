// Open options page on install
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Open options page
        chrome.runtime.openOptionsPage(() => {
            // Send a message to the options page to scroll to API section
            chrome.runtime.sendMessage({ action: 'scrollToApiSection' });
        });
    }
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openOptions") {
        chrome.runtime.openOptionsPage();
    }
});
