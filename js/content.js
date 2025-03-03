// Content script for DocYOLO Legends
// This script injects the legends component into web pages

// Global variables
let isEnabled = false; // Default to disabled
let currentTheme = 'light';
let legendContainer = null;
let currentLabels = null;
let isMinimized = false; // Track minimized state

// Check if we're on a Roboflow domain
function isRoboflowApp() {
  const hostname = window.location.hostname;
  return hostname === 'roboflow.com' || hostname.endsWith('.roboflow.com');
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
          <button class="minimize-toggle" aria-label="Minimize legend">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
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
  chrome.storage.sync.get(['theme', 'currentPreset', 'siteSettings', 'isMinimized', 'allowedDomains'], (result) => {
    // Check if we have site-specific settings
    const siteSettings = result.siteSettings || {};
    const hostname = window.location.hostname;
    const allowedDomains = result.allowedDomains || ['roboflow.com'];
    
    // Determine if enabled based on site-specific settings or global setting
    if (siteSettings[hostname] !== undefined) {
      // Use site-specific setting if available
      isEnabled = siteSettings[hostname].enabled;
    } else {
      // By default, only enable on Roboflow domains or domains in the allowedDomains list
      isEnabled = isRoboflowApp() || isDomainAllowed(hostname, allowedDomains);
      
      // Save this setting for this site
      saveSiteSetting(hostname, isEnabled);
    }
    
    // Set theme
    currentTheme = result.theme || 'light';
    const currentPreset = result.currentPreset || 'default';
    
    // Set minimized state
    isMinimized = result.isMinimized || false;
    
    // Apply settings
    toggleVisibility(isEnabled);
    applyTheme(currentTheme);
    applyMinimizedState(isMinimized);
    
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

// Check if a domain is in the allowed domains list
function isDomainAllowed(domain, allowedDomains) {
  // Check if the domain or any parent domain is in the allowed list
  return allowedDomains.some(allowedDomain => {
    return domain === allowedDomain || domain.endsWith('.' + allowedDomain);
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
    legendContainer.classList.remove('hidden');
  } else {
    legendContainer.classList.add('hidden');
  }
}

// Apply minimized state
function applyMinimizedState(minimized) {
  if (!legendContainer) return;
  
  if (minimized) {
    legendContainer.classList.add('minimized');
    
    // Update minimize button to show maximize icon
    const minimizeButton = legendContainer.querySelector('.minimize-toggle');
    if (minimizeButton) {
      minimizeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <line x1="12" y1="5" x2="12" y2="19"></line>
        </svg>
      `;
      minimizeButton.setAttribute('aria-label', 'Maximize legend');
    }
  } else {
    legendContainer.classList.remove('minimized');
    
    // Update minimize button to show minimize icon
    const minimizeButton = legendContainer.querySelector('.minimize-toggle');
    if (minimizeButton) {
      minimizeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      `;
      minimizeButton.setAttribute('aria-label', 'Minimize legend');
    }
  }
}

// Toggle minimized state
function toggleMinimized() {
  isMinimized = !isMinimized;
  applyMinimizedState(isMinimized);
  
  // Save minimized state
  chrome.storage.sync.set({ isMinimized });
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
  const minimizeToggle = document.querySelector('.minimize-toggle');
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
    
    // Update toggle button icon
    const isCollapsed = legendContainer.classList.contains('collapsed');
    legendToggle.innerHTML = isCollapsed ? 
      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>` : 
      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>`;
    
    // Save state to localStorage
    localStorage.setItem('legendCollapsed', legendContainer.classList.contains('collapsed'));
    localStorage.setItem('legendExpanded', legendContainer.classList.contains('expanded'));
  }
  
  // Add event listeners
  legendToggle.addEventListener('click', toggleLegend);
  
  // Add minimize toggle event listener
  if (minimizeToggle) {
    minimizeToggle.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering the header click event
      toggleMinimized();
    });
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
  
  // Make the header draggable
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  
  legendHeader.addEventListener('mousedown', (e) => {
    if (e.target.closest('.legend-toggle') || e.target.closest('.legend-search-header')) return;
    
    isDragging = true;
    dragOffsetX = e.clientX - legendContainer.getBoundingClientRect().left;
    dragOffsetY = e.clientY - legendContainer.getBoundingClientRect().top;
    
    legendContainer.style.transition = 'none';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const x = e.clientX - dragOffsetX;
    const y = e.clientY - dragOffsetY;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - legendContainer.offsetWidth;
    const maxY = window.innerHeight - legendContainer.offsetHeight;
    
    const boundedX = Math.max(0, Math.min(x, maxX));
    const boundedY = Math.max(0, Math.min(y, maxY));
    
    legendContainer.style.left = `${boundedX}px`;
    legendContainer.style.top = `${boundedY}px`;
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      legendContainer.style.transition = '';
      
      // Save position
      const rect = legendContainer.getBoundingClientRect();
      localStorage.setItem('legendPositionX', rect.left);
      localStorage.setItem('legendPositionY', rect.top);
    }
  });
  
  // Restore position from localStorage
  const resetPosition = () => {
    const savedX = localStorage.getItem('legendPositionX');
    const savedY = localStorage.getItem('legendPositionY');
    
    if (savedX !== null && savedY !== null) {
      legendContainer.style.left = `${savedX}px`;
      legendContainer.style.top = `${savedY}px`;
    } else {
      // Default position (bottom right)
      legendContainer.style.right = '20px';
      legendContainer.style.bottom = '20px';
      legendContainer.style.left = 'auto';
      legendContainer.style.top = 'auto';
    }
  };
  
  resetPosition();
  
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
  if (message.action === 'getStatus') {
    // Get allowed domains to check if current domain is allowed
    chrome.storage.sync.get(['allowedDomains'], (result) => {
      const allowedDomains = result.allowedDomains || ['roboflow.com'];
      const hostname = window.location.hostname;
      
      sendResponse({
        enabled: isEnabled,
        hostname: hostname,
        isRoboflowApp: isRoboflowApp(),
        isMinimized: isMinimized,
        isAllowed: isDomainAllowed(hostname, allowedDomains)
      });
    });
    return true; // Keep the message channel open for async response
  } else if (message.action === 'toggleVisibility') {
    isEnabled = message.enabled;
    toggleVisibility(isEnabled);
    saveSiteSetting(window.location.hostname, isEnabled);
    sendResponse({ success: true });
  } else if (message.action === 'toggleMinimized') {
    toggleMinimized();
    sendResponse({ success: true });
  } else if (message.action === 'setTheme') {
    currentTheme = message.theme;
    applyTheme(currentTheme);
    sendResponse({ success: true });
  } else if (message.action === 'updateLabels') {
    if (message.labels) {
      currentLabels = message.labels;
      updateLegendItems(currentLabels);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'No labels provided' });
    }
  }
  return true; // Keep the message channel open for async responses
});

// Run when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectLegendsComponent();
    
    // Listen for storage changes to update settings in real-time
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        if (changes.allowedDomains) {
          // Reload settings if allowed domains change
          loadSettings();
        }
        
        if (changes.isMinimized) {
          // Update minimized state
          isMinimized = changes.isMinimized.newValue;
          applyMinimizedState(isMinimized);
        }
      }
    });
  });
} else {
  // DOM already loaded, inject immediately
  injectLegendsComponent();
  
  // Listen for storage changes to update settings in real-time
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      if (changes.allowedDomains) {
        // Reload settings if allowed domains change
        loadSettings();
      }
      
      if (changes.isMinimized) {
        // Update minimized state
        isMinimized = changes.isMinimized.newValue;
        applyMinimizedState(isMinimized);
      }
    }
  });
} 