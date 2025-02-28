// Popup script for DocYOLO Legends extension

document.addEventListener('DOMContentLoaded', () => {
  const enabledToggle = document.getElementById('enabled-toggle');
  const themeSelect = document.getElementById('theme-select');
  const previewItems = document.querySelector('.preview-items');
  const logoElement = document.querySelector('.logo');
  const presetSelect = document.getElementById('preset-select');
  const savePresetBtn = document.getElementById('save-preset-btn');
  const deletePresetBtn = document.getElementById('delete-preset-btn');
  const addLegendBtn = document.getElementById('add-legend-btn');
  const editorItems = document.querySelector('.editor-items');
  const savePresetModal = document.getElementById('save-preset-modal');
  const presetNameInput = document.getElementById('preset-name');
  const cancelSavePresetBtn = document.getElementById('cancel-save-preset');
  const confirmSavePresetBtn = document.getElementById('confirm-save-preset');
  
  // Current working labels
  let currentLabels = [];
  let currentPreset = 'default';
  let currentSite = '';
  let isRoboflowApp = false;
  
  // Check for system dark mode preference
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Get current tab info
  function getCurrentTabInfo() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getStatus' }, (response) => {
            if (response) {
              currentSite = response.hostname;
              isRoboflowApp = response.isRoboflowApp;
              resolve(response);
            } else {
              resolve({ enabled: false, hostname: 'unknown', isRoboflowApp: false });
            }
          });
        } else {
          resolve({ enabled: false, hostname: 'unknown', isRoboflowApp: false });
        }
      });
    });
  }
  
  // Initialize popup
  async function initPopup() {
    // Get current tab status
    const tabStatus = await getCurrentTabInfo();
    
    // Update site info in UI
    updateSiteInfo(tabStatus.hostname, tabStatus.isRoboflowApp);
    
    // Load saved settings
    chrome.storage.sync.get(['enabled', 'theme', 'currentPreset', 'siteSettings'], (result) => {
      // Set default values if not found
      const siteSettings = result.siteSettings || {};
      const theme = result.theme || 'light';
      currentPreset = result.currentPreset || 'default';
      
      // Use site-specific enabled setting if available, otherwise use global
      let enabled;
      if (siteSettings[currentSite]) {
        enabled = siteSettings[currentSite].enabled;
      } else {
        enabled = result.enabled !== undefined ? result.enabled : isRoboflowApp;
      }
      
      // Update UI to match saved settings
      enabledToggle.checked = enabled;
      themeSelect.value = theme;
      presetSelect.value = currentPreset;
      
      // Apply theme to popup
      applyTheme(theme);
      
      // Load presets and labels
      loadPresets();
    });
  }
  
  // Update site info in UI
  function updateSiteInfo(hostname, isRoboflow) {
    const siteInfoElement = document.getElementById('site-info');
    if (siteInfoElement) {
      siteInfoElement.textContent = hostname;
      siteInfoElement.classList.toggle('roboflow-site', isRoboflow);
    }
  }
  
  // Toggle extension enabled/disabled
  enabledToggle.addEventListener('change', () => {
    const enabled = enabledToggle.checked;
    
    // Save site-specific setting
    chrome.storage.sync.get(['siteSettings'], (result) => {
      const siteSettings = result.siteSettings || {};
      siteSettings[currentSite] = { enabled };
      
      // Save settings
      chrome.storage.sync.set({ siteSettings });
      
      // Send message to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleEnabled', enabled });
        }
      });
    });
  });
  
  // Change theme
  themeSelect.addEventListener('change', () => {
    const theme = themeSelect.value;
    
    // Save setting
    chrome.storage.sync.set({ theme });
    
    // Apply theme to popup
    applyTheme(theme);
    
    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'setTheme', theme });
      }
    });
  });
  
  // Apply theme to popup
  function applyTheme(theme) {
    const body = document.body;
    
    // Handle auto theme based on system preference
    if (theme === 'auto') {
      body.setAttribute('data-theme', prefersDarkMode ? 'dark' : 'light');
    } else {
      body.setAttribute('data-theme', theme);
    }
    
    // Add logo animation on theme change
    if (logoElement) {
      logoElement.classList.add('logo-pulse');
      setTimeout(() => {
        logoElement.classList.remove('logo-pulse');
      }, 500);
    }
    
    // Listen for system theme changes if in auto mode
    if (theme === 'auto') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (themeSelect.value === 'auto') {
          body.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      });
    }
  }
  
  // Load and display legend items
  function loadLegendItems() {
    if (currentPreset === 'default') {
      // Get labels from background script for default preset
      chrome.runtime.sendMessage({ action: 'getLabels' }, (response) => {
        if (response && response.labels) {
          currentLabels = response.labels;
          renderPreviewItems(currentLabels);
          renderEditorItems(currentLabels);
        } else {
          console.error('Failed to get labels from background script');
          // Fallback to default labels
          currentLabels = getDefaultLabels();
          renderPreviewItems(currentLabels);
          renderEditorItems(currentLabels);
        }
      });
    } else {
      // Load from localStorage for custom presets
      const presets = JSON.parse(localStorage.getItem('legendPresets') || '{}');
      if (presets[currentPreset]) {
        currentLabels = presets[currentPreset].labels;
        renderPreviewItems(currentLabels);
        renderEditorItems(currentLabels);
        
        // Update content script with these labels
        updateContentScriptLabels(currentLabels);
      }
    }
  }
  
  // Get default labels
  function getDefaultLabels() {
    return [
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
  }
  
  // Update content script with current labels
  function updateContentScriptLabels(labels) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'updateLabels', 
          labels: labels 
        });
      }
    });
  }
  
  // Render preview items
  function renderPreviewItems(labels) {
    previewItems.innerHTML = '';
    
    // Show only first 6 items to keep the popup compact
    const displayLabels = labels.slice(0, 6);
    
    displayLabels.forEach(label => {
      const item = document.createElement('div');
      item.className = 'preview-item';
      
      const colorBox = document.createElement('div');
      colorBox.className = 'preview-color';
      colorBox.style.backgroundColor = label.color;
      
      const labelText = document.createElement('div');
      labelText.className = 'preview-label';
      labelText.textContent = label.name;
      
      item.appendChild(colorBox);
      item.appendChild(labelText);
      previewItems.appendChild(item);
    });
    
    // Add "more" indicator if there are more than 6 items
    if (labels.length > 6) {
      const moreItem = document.createElement('div');
      moreItem.className = 'preview-item';
      moreItem.style.justifyContent = 'center';
      
      const moreText = document.createElement('div');
      moreText.className = 'preview-label';
      moreText.textContent = `+${labels.length - 6} more`;
      moreText.style.fontStyle = 'italic';
      
      moreItem.appendChild(moreText);
      previewItems.appendChild(moreItem);
    }
  }
  
  // Render editor items
  function renderEditorItems(labels) {
    editorItems.innerHTML = '';
    
    labels.forEach((label, index) => {
      const item = document.createElement('div');
      item.className = 'editor-item';
      item.dataset.id = label.id;
      
      const idInput = document.createElement('input');
      idInput.type = 'number';
      idInput.className = 'editor-id';
      idInput.value = label.id;
      idInput.min = 0;
      idInput.title = 'ID';
      idInput.addEventListener('change', () => updateLabel(index, 'id', parseInt(idInput.value)));
      
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'editor-name';
      nameInput.value = label.name;
      nameInput.placeholder = 'Name';
      nameInput.title = 'Name';
      nameInput.addEventListener('change', () => updateLabel(index, 'name', nameInput.value));
      
      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.className = 'editor-color';
      colorInput.value = label.color;
      colorInput.title = 'Color';
      colorInput.addEventListener('change', () => updateLabel(index, 'color', colorInput.value));
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-item-btn';
      deleteBtn.title = 'Delete';
      deleteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      deleteBtn.addEventListener('click', () => deleteLabel(index));
      
      item.appendChild(idInput);
      item.appendChild(nameInput);
      item.appendChild(colorInput);
      item.appendChild(deleteBtn);
      
      editorItems.appendChild(item);
    });
  }
  
  // Update a label property
  function updateLabel(index, property, value) {
    if (index >= 0 && index < currentLabels.length) {
      currentLabels[index][property] = value;
      renderPreviewItems(currentLabels);
      
      // If using a custom preset, save changes
      if (currentPreset !== 'default') {
        saveCurrentPreset();
      }
      
      // Update content script
      updateContentScriptLabels(currentLabels);
    }
  }
  
  // Delete a label
  function deleteLabel(index) {
    if (index >= 0 && index < currentLabels.length) {
      currentLabels.splice(index, 1);
      renderPreviewItems(currentLabels);
      renderEditorItems(currentLabels);
      
      // If using a custom preset, save changes
      if (currentPreset !== 'default') {
        saveCurrentPreset();
      }
      
      // Update content script
      updateContentScriptLabels(currentLabels);
    }
  }
  
  // Add a new label
  function addNewLabel() {
    // Find the next available ID
    const usedIds = currentLabels.map(label => label.id);
    let nextId = 0;
    while (usedIds.includes(nextId)) {
      nextId++;
    }
    
    // Generate a random color
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    
    // Add new label
    const newLabel = {
      id: nextId,
      name: `Label ${nextId}`,
      color: randomColor
    };
    
    currentLabels.push(newLabel);
    renderPreviewItems(currentLabels);
    renderEditorItems(currentLabels);
    
    // If using a custom preset, save changes
    if (currentPreset !== 'default') {
      saveCurrentPreset();
    }
    
    // Update content script
    updateContentScriptLabels(currentLabels);
  }
  
  // Load presets from localStorage
  function loadPresets() {
    const presets = JSON.parse(localStorage.getItem('legendPresets') || '{}');
    
    // Clear existing options except default
    while (presetSelect.options.length > 1) {
      presetSelect.remove(1);
    }
    
    // Add presets to dropdown
    Object.keys(presets).forEach(presetName => {
      const option = document.createElement('option');
      option.value = presetName;
      option.textContent = presetName;
      presetSelect.appendChild(option);
    });
    
    // Set current preset
    if (presetSelect.querySelector(`option[value="${currentPreset}"]`)) {
      presetSelect.value = currentPreset;
    } else {
      presetSelect.value = 'default';
      currentPreset = 'default';
    }
    
    // Load legend items for current preset
    loadLegendItems();
  }
  
  // Save current preset
  function saveCurrentPreset() {
    if (currentPreset === 'default') return;
    
    const presets = JSON.parse(localStorage.getItem('legendPresets') || '{}');
    presets[currentPreset] = {
      name: currentPreset,
      labels: currentLabels
    };
    
    localStorage.setItem('legendPresets', JSON.stringify(presets));
  }
  
  // Save as new preset
  function saveAsNewPreset(presetName) {
    if (!presetName) return;
    
    const presets = JSON.parse(localStorage.getItem('legendPresets') || '{}');
    presets[presetName] = {
      name: presetName,
      labels: currentLabels
    };
    
    localStorage.setItem('legendPresets', JSON.stringify(presets));
    
    // Update current preset
    currentPreset = presetName;
    chrome.storage.sync.set({ currentPreset });
    
    // Reload presets
    loadPresets();
  }
  
  // Delete current preset
  function deleteCurrentPreset() {
    if (currentPreset === 'default') return;
    
    const presets = JSON.parse(localStorage.getItem('legendPresets') || '{}');
    delete presets[currentPreset];
    
    localStorage.setItem('legendPresets', JSON.stringify(presets));
    
    // Reset to default
    currentPreset = 'default';
    chrome.storage.sync.set({ currentPreset });
    
    // Reload presets
    loadPresets();
  }
  
  // Event Listeners
  
  // Add new label button
  addLegendBtn.addEventListener('click', addNewLabel);
  
  // Preset select change
  presetSelect.addEventListener('change', () => {
    currentPreset = presetSelect.value;
    chrome.storage.sync.set({ currentPreset });
    loadLegendItems();
  });
  
  // Save preset button
  savePresetBtn.addEventListener('click', () => {
    savePresetModal.style.display = 'flex';
    presetNameInput.value = '';
    presetNameInput.focus();
  });
  
  // Delete preset button
  deletePresetBtn.addEventListener('click', () => {
    if (currentPreset !== 'default') {
      if (confirm(`Are you sure you want to delete the preset "${currentPreset}"?`)) {
        deleteCurrentPreset();
      }
    } else {
      alert('Cannot delete the default preset.');
    }
  });
  
  // Cancel save preset
  cancelSavePresetBtn.addEventListener('click', () => {
    savePresetModal.style.display = 'none';
  });
  
  // Confirm save preset
  confirmSavePresetBtn.addEventListener('click', () => {
    const presetName = presetNameInput.value.trim();
    if (presetName) {
      saveAsNewPreset(presetName);
      savePresetModal.style.display = 'none';
    } else {
      alert('Please enter a preset name.');
    }
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === savePresetModal) {
      savePresetModal.style.display = 'none';
    }
  });
  
  // Handle Enter key in preset name input
  presetNameInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      confirmSavePresetBtn.click();
    }
  });
  
  // Initialize popup
  initPopup();
}); 