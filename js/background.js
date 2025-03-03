// Background script for DocYOLO Legends extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('DocYOLO Legends extension installed');
  
  // Initialize default settings
  chrome.storage.sync.get(['theme', 'allowedDomains'], (result) => {
    // Only set defaults if they don't exist
    const settings = {};
    
    if (result.theme === undefined) {
      settings.theme = 'light';
    }
    
    if (result.allowedDomains === undefined) {
      settings.allowedDomains = ['roboflow.com'];
    }
    
    // Save default settings if needed
    if (Object.keys(settings).length > 0) {
      chrome.storage.sync.set(settings);
    }
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getLabels') {
    // In a real application, you might fetch this from an API or storage
    const labels = [
      { id: 0, name: 'Title', color: '#C7FC00' },
      { id: 1, name: 'Plain Text', color: '#8622FF' },
      { id: 2, name: 'Abandon', color: '#FE0056' },
      { id: 3, name: 'Figure', color: '#00FFCE' },
      { id: 4, name: 'Figure Caption', color: '#FF8000' },
      { id: 5, name: 'Table', color: '#00B7EB' },
      { id: 6, name: 'Table Caption', color: '#FFFF00' },
      { id: 7, name: 'Table Footnote', color: '#FF00FF' },
      { id: 8, name: 'Isolate Formula', color: '#0E7AFE' },
      { id: 9, name: 'Formula Caption', color: '#FFABAB' }
    ];
    sendResponse({ labels });
  }
  return true; // Keep the message channel open for async responses
});

// Function to check if a URL is a Roboflow domain
function isRoboflowDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname === 'roboflow.com' || hostname.endsWith('.roboflow.com');
  } catch (e) {
    return false;
  }
}

// Listen for tab updates to inject content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Inject on all domains, but the content script will handle enabling/disabling
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['js/content.js']
    }).catch(err => console.error('Error injecting content script:', err));
    
    chrome.scripting.insertCSS({
      target: { tabId: tabId },
      files: ['css/legends.css']
    }).catch(err => console.error('Error injecting CSS:', err));
  }
}); 