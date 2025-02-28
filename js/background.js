// Background script for DocYOLO Legends extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('DocYOLO Legends extension installed');
  
  // Initialize default settings
  chrome.storage.sync.get(['enabled', 'theme'], (result) => {
    // Only set defaults if they don't exist
    const settings = {};
    
    if (result.enabled === undefined) {
      settings.enabled = true;
    }
    
    if (result.theme === undefined) {
      settings.theme = 'light';
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

// Listen for tab updates to inject content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    // You can add URL filtering here if you want to limit which sites the legends appear on
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