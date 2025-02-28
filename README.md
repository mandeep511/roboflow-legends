# Roboflow Legends Chrome Extension

A Chrome extension that provides smart element detection and captioning powered by Roboflow machine learning models. This extension displays a floating panel in the bottom right corner of web pages, showing color-coded elements for easy reference.

## Features

- 🎨 Color-coded element legends
- 🔍 Search and filter detection elements
- 🌓 Light and dark theme support
- 🖱️ Draggable interface
- ⌨️ Keyboard shortcuts
- 📱 Responsive design

## Installation

### From Chrome Web Store (Coming Soon)

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) (link will be updated when published)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension should now be installed and visible in your toolbar

## Usage

### Basic Usage

1. Click the Roboflow Legends icon in your Chrome toolbar to open the popup
2. Toggle the extension on/off using the switch
3. Select your preferred theme (light, dark, or auto)
4. Visit any web page to see the legends panel in the bottom right corner

### Keyboard Shortcuts

- `Ctrl+Shift+L` (Windows/Linux) or `Cmd+Shift+L` (Mac): Open the popup
- `Ctrl+L` (Windows/Linux) or `Cmd+L` (Mac): Toggle the caption panel visibility
- `Ctrl+F` (Windows/Linux) or `Cmd+F` (Mac): Focus the search box when the legends panel is open

### Customization

- **Move the panel**: Click and drag the header to reposition the panel
- **Reset position**: Double-click the header to reset to the default position
- **Collapse/Expand**: Click the arrow icon or the header to collapse/expand the panel
- **Filter elements**: Type in the search box to filter elements by name

## Development

### Project Structure

```
roboflow-legends/
├── css/
│   ├── index.css       # Popup styles
│   ├── popup.css       # Additional popup styles
│   └── legends.css     # Content script styles
├── js/
│   ├── background.js   # Background script
│   ├── content.js      # Content script
│   └── popup.js        # Popup script
├── images/             # Images, icons, and logo
├── index.html          # Popup HTML
└── manifest.json       # Extension manifest
```

### Building and Testing

1. Make your changes to the code
2. Load the extension in Chrome using Developer mode
3. Test your changes
4. Reload the extension if necessary (`chrome://extensions` > Refresh icon)

### Image Conversion

The extension includes a PowerShell script to convert the SVG logo to PNG files for use as extension icons:

1. Make sure you have [ImageMagick](https://imagemagick.org/script/download.php) installed
   - You can install it using `winget install ImageMagick.ImageMagick` on Windows
2. Open PowerShell in the extension directory
3. Run `.\convert-images.ps1`
4. The script will generate all required icon sizes in the `images` folder

## License

[MIT License](LICENSE)

## Acknowledgements

- Built with modern web technologies
- Icons based on Apple's design principles
- Inspired by Roboflow's machine learning capabilities

## Contact

For questions, issues, or feature requests, please [open an issue](https://github.com/yourusername/roboflow-legends/issues) on GitHub.
