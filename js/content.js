// Content script for DocYOLO Legends
// This script injects the legends component into web pages

// Global variables
let isEnabled = false; // Default to disabled
let currentTheme = 'light';
let legendContainer = null;
let currentLabels = null;

// Check if we're on app.roboflow.com
function isRoboflowApp() {
  return window.location.hostname === 'app.roboflow.com';
}

// Create and inject the legends HTML
function injectLegendsComponent() {
  // Check if already injected
  if (document.querySelector('.docyolo-legends-container')) {
    return;
  }
  
  // Create container for legends
  const legendsContainer = document.createElement('div');
  legendsContainer.className = 'docyolo-legends-container';
  legendsContainer.innerHTML = `
    <div class="legend-container" data-theme="light">
      <div class="legend-header">
        <div class="legend-title-area">
          <div class="legend-title">Element Legends</div>
          <div class="legend-search-header">
            <input type="text" placeholder="Filter..." aria-label="Filter caption elements">
            <svg class="search-icon-header" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
        <div class="legend-controls">
          <button class="theme-toggle" aria-label="Toggle dark/light theme">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          </button>
          <button class="legend-toggle" aria-label="Toggle legend visibility">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
      <div class="legend-content">
        <div class="legend-items">
          <!-- Labels will be dynamically inserted here -->
        </div>
      </div>
    </div>
  `;
  
  // Append to body
  document.body.appendChild(legendsContainer);
  
  // Save reference to the legend container
  legendContainer = document.querySelector('.legend-container');
  
  // Initialize the legends functionality
  initializeLegends();
  
  // Load saved settings
  loadSettings();
}

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(['enabled', 'theme', 'currentPreset', 'siteSettings'], (result) => {
    // Check if we have site-specific settings
    const siteSettings = result.siteSettings || {};
    const hostname = window.location.hostname;
    
    // Determine if enabled based on site-specific settings or global setting
    if (siteSettings[hostname] !== undefined) {
      // Use site-specific setting if available
      isEnabled = siteSettings[hostname].enabled;
    } else {
      // Otherwise use global setting or default (enabled only for app.roboflow.com)
      isEnabled = result.enabled !== undefined ? result.enabled : isRoboflowApp();
      
      // Save this setting for this site
      saveSiteSetting(hostname, isEnabled);
    }
    
    // Set theme
    currentTheme = result.theme || 'light';
    const currentPreset = result.currentPreset || 'default';
    
    // Apply settings
    toggleVisibility(isEnabled);
    applyTheme(currentTheme);
    
    // Load preset if not default
    if (currentPreset !== 'default' && localStorage.getItem('legendPresets')) {
      const presets = JSON.parse(localStorage.getItem('legendPresets') || '{}');
      if (presets[currentPreset]) {
        currentLabels = presets[currentPreset].labels;
        updateLegendItems(currentLabels);
      }
    }
  });
}

// Save site-specific setting
function saveSiteSetting(hostname, enabled) {
  chrome.storage.sync.get(['siteSettings'], (result) => {
    const siteSettings = result.siteSettings || {};
    siteSettings[hostname] = { enabled };
    chrome.storage.sync.set({ siteSettings });
  });
}

// Toggle visibility of the legend
function toggleVisibility(show) {
  if (!legendContainer) return;
  
  if (show) {
    legendContainer.style.display = 'block';
  } else {
    legendContainer.style.display = 'none';
  }
}

// Apply theme to the legend
function applyTheme(theme) {
  if (!legendContainer) return;
  
  // Check for system dark mode preference
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Handle auto theme based on system preference
  if (theme === 'auto') {
    legendContainer.setAttribute('data-theme', prefersDarkMode ? 'dark' : 'light');
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (currentTheme === 'auto') {
        legendContainer.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        updateThemeIcon(e.matches);
      }
    });
  } else {
    legendContainer.setAttribute('data-theme', theme);
  }
  
  // Update theme icon
  updateThemeIcon(theme === 'dark' || (theme === 'auto' && prefersDarkMode));
}

// Update the theme toggle icon based on current theme
function updateThemeIcon(isDark) {
  const themeToggle = document.querySelector('.theme-toggle');
  if (!themeToggle) return;
  
  if (isDark) {
    themeToggle.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
  } else {
    themeToggle.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
  }
}

// Initialize legends functionality
function initializeLegends() {
  // Get labels from background script
  chrome.runtime.sendMessage({ action: 'getLabels' }, (response) => {
    if (response && response.labels) {
      currentLabels = response.labels;
      setupLegendUI(currentLabels);
    } else {
      console.error('Failed to get labels from background script');
      // Fallback to default labels
      currentLabels = [
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
      setupLegendUI(currentLabels);
    }
  });
}

// Update legend items with new labels
function updateLegendItems(labels) {
  if (!labels || !legendContainer) return;
  
  currentLabels = labels;
  const legendItems = legendContainer.querySelector('.legend-items');
  
  if (legendItems) {
    renderItems(labels);
  }
}

// Setup the legend UI with the provided labels
function setupLegendUI(labels) {
  const legendContainer = document.querySelector('.legend-container');
  const legendItems = document.querySelector('.legend-items');
  const legendToggle = document.querySelector('.legend-toggle');
  const themeToggle = document.querySelector('.theme-toggle');
  const legendHeader = document.querySelector('.legend-header');
  const searchInput = document.querySelector('.legend-search-header input');
  
  // Initialize legend items
  function renderItems(items) {
    legendItems.innerHTML = '';
    
    items.forEach(label => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.dataset.id = label.id;
      
      const colorBox = document.createElement('div');
      colorBox.className = 'legend-color';
      colorBox.style.backgroundColor = label.color;
      
      const labelText = document.createElement('div');
      labelText.className = 'legend-label';
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'legend-name';
      nameSpan.textContent = label.name;
      
      const idSpan = document.createElement('span');
      idSpan.className = 'legend-id';
      idSpan.textContent = `#${label.id}`;
      
      labelText.appendChild(nameSpan);
      labelText.appendChild(idSpan);
      
      item.appendChild(colorBox);
      item.appendChild(labelText);
      legendItems.appendChild(item);
      
      // Add click functionality to highlight/filter elements
      item.addEventListener('click', () => {
        item.classList.toggle('active');
        // Here you could add code to highlight elements in the document
        // that match this category
      });
    });
  }
  
  renderItems(labels);
  
  // Toggle legend visibility
  function toggleLegend() {
    if (legendContainer.classList.contains('collapsed')) {
      // Expand
      legendContainer.classList.remove('collapsed');
      legendContainer.classList.add('expanded');
    } else if (legendContainer.classList.contains('expanded')) {
      // Collapse
      legendContainer.classList.remove('expanded');
      legendContainer.classList.add('collapsed');
    } else {
      // Toggle between default and collapsed
      legendContainer.classList.toggle('collapsed');
    }
    
    // Save state to localStorage
    localStorage.setItem('legendCollapsed', legendContainer.classList.contains('collapsed'));
    localStorage.setItem('legendExpanded', legendContainer.classList.contains('expanded'));
  }
  
  legendHeader.addEventListener('click', (e) => {
    // Don't toggle when clicking on search input or its icon
    if (e.target.closest('.legend-search-header') || e.target === searchInput) {
      return;
    }
    
    if (e.target.closest('.legend-toggle') || e.target === legendHeader || e.target === document.querySelector('.legend-title')) {
      toggleLegend();
    }
  });
  
  // Search/filter functionality
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm === '') {
      renderItems(labels);
    } else {
      const filteredLabels = labels.filter(label => 
        label.name.toLowerCase().includes(searchTerm)
      );
      renderItems(filteredLabels);
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Toggle with Ctrl+L or Cmd+L
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
      e.preventDefault();
      toggleLegend();
    }
    
    // Focus search with Ctrl+F when legend is open
    if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !legendContainer.classList.contains('collapsed')) {
      e.preventDefault();
      searchInput.focus();
    }
  });
  
  // Draggable functionality
  let isDragging = false;
  let offsetX, offsetY;
  
  legendHeader.addEventListener('mousedown', (e) => {
    if (e.target.closest('.legend-toggle') || e.target.closest('.legend-search-header')) return;
    
    isDragging = true;
    offsetX = e.clientX - legendContainer.getBoundingClientRect().left;
    offsetY = e.clientY - legendContainer.getBoundingClientRect().top;
    
    legendContainer.style.transition = 'none';
    legendContainer.style.cursor = 'grabbing';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - legendContainer.offsetWidth;
    const maxY = window.innerHeight - legendContainer.offsetHeight;
    
    legendContainer.style.right = 'auto';
    legendContainer.style.bottom = 'auto';
    legendContainer.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
    legendContainer.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      legendContainer.style.cursor = '';
      legendContainer.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    }
  });
  
  // Restore collapsed/expanded state from localStorage
  if (localStorage.getItem('legendCollapsed') === 'true') {
    legendContainer.classList.add('collapsed');
  } else if (localStorage.getItem('legendExpanded') === 'true') {
    legendContainer.classList.add('expanded');
  }
  
  // Optional: Add a reset position button
  const resetPosition = () => {
    legendContainer.style.left = 'auto';
    legendContainer.style.top = 'auto';
    legendContainer.style.right = '24px';
    legendContainer.style.bottom = '24px';
  };
  
  // Double-click header to reset position
  legendHeader.addEventListener('dblclick', resetPosition);

  // Theme toggle functionality
  themeToggle.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent triggering the header click event
    
    // Toggle between light and dark
    const isDark = legendContainer.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    // Update theme
    legendContainer.setAttribute('data-theme', newTheme);
    currentTheme = newTheme; // Update current theme
    
    // Update icon
    updateThemeIcon(!isDark);
    
    // Save theme preference
    chrome.storage.sync.set({ theme: newTheme });
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleEnabled') {
    isEnabled = message.enabled;
    toggleVisibility(isEnabled);
    
    // Save site-specific setting
    saveSiteSetting(window.location.hostname, isEnabled);
    
    sendResponse({ success: true });
  } else if (message.action === 'setTheme') {
    currentTheme = message.theme;
    applyTheme(currentTheme);
    sendResponse({ success: true });
  } else if (message.action === 'updateLabels') {
    updateLegendItems(message.labels);
    sendResponse({ success: true });
  } else if (message.action === 'getStatus') {
    // Return current status for this site
    sendResponse({ 
      enabled: isEnabled,
      hostname: window.location.hostname,
      isRoboflowApp: isRoboflowApp()
    });
  }
  return true;
});

// Run when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectLegendsComponent);
} else {
  // DOM already loaded, inject immediately
  injectLegendsComponent();
} 