# SaveToRead Browser Extension

A browser extension that allows you to save articles, links, and pages to read later with a simple right-click.

## Features

- **Right-Click Context Menu**: Save any link or page with a right-click
- **Quick Save**: Click the extension icon to save the current page
- **Notifications**: Get instant feedback when articles are saved
- **Seamless Integration**: Works with your SaveToRead account

## Installation

### For Development

1. **Build the extension** (icons need to be generated):
   ```bash
   cd extension
   # Add your icon files to the icons/ directory
   # icon16.png, icon32.png, icon48.png, icon128.png
   ```

2. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `extension` directory

3. **Load in Firefox**:
   - Open Firefox and go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Navigate to the `extension` directory and select `manifest.json`

### For Production

The extension will be available on:
- Chrome Web Store
- Firefox Add-ons
- Edge Add-ons

## Usage

### Right-Click Context Menu

1. **Save a Link**:
   - Right-click on any link
   - Select "Save to SaveToRead"

2. **Save Current Page**:
   - Right-click anywhere on the page
   - Select "Save Page to SaveToRead"

3. **Save Selected Text**:
   - Highlight any text
   - Right-click on the selection
   - Select "Save Selection to SaveToRead"

### Extension Popup

1. Click the SaveToRead extension icon in your browser toolbar
2. Click "Save This Page" to save the current tab
3. Click "View My Articles" to open your saved articles

## Authentication

The extension requires you to be logged in to SaveToRead:

1. Click the extension icon
2. Click "Log In"
3. Log in to your SaveToRead account in the opened tab
4. The extension will automatically detect your login

## How It Works

### Context Menu Integration

The extension adds three context menu items:
- **Save to SaveToRead** (on links)
- **Save Page to SaveToRead** (on pages)
- **Save Selection to SaveToRead** (on selected text)

### API Integration

When you save an article:
1. The extension captures the URL and title
2. Sends a request to the SaveToRead API
3. Stores the article in your account
4. Shows a notification with the result

### Authentication Flow

1. Extension checks for auth token in Chrome storage
2. If not found, prompts user to log in
3. Auth token is stored securely using Chrome storage sync
4. Token is included in all API requests

## Development

### Project Structure

```
extension/
├── manifest.json          # Extension manifest (v3)
├── background.js          # Service worker for context menu
├── popup/
│   ├── popup.html        # Extension popup UI
│   ├── popup.css         # Popup styles
│   └── popup.js          # Popup logic
├── icons/
│   ├── icon16.png        # 16x16 icon
│   ├── icon32.png        # 32x32 icon
│   ├── icon48.png        # 48x48 icon
│   └── icon128.png       # 128x128 icon
└── README.md
```

### Building Icons

You need to create icon files in the following sizes:
- 16x16 pixels (icon16.png)
- 32x32 pixels (icon32.png)
- 48x48 pixels (icon48.png)
- 128x128 pixels (icon128.png)

You can use any image editor or online tool to create these icons. The recommended design is:
- Blue background (#2563eb)
- White bookmark or book icon
- Simple, recognizable design

### API Endpoints Used

- `POST /api/articles` - Save new article
  ```json
  {
    "url": "https://example.com/article",
    "tags": []
  }
  ```

### Permissions Explained

- `contextMenus`: Add "Save to SaveToRead" to right-click menu
- `activeTab`: Access current tab URL and title
- `storage`: Store auth token securely
- `notifications`: Show save confirmations
- `host_permissions`: Communicate with SaveToRead API

## Configuration

### API URLs

Update these in the source files if deploying to different environments:

**background.js**:
```javascript
const API_URL = 'https://savetoread-api.yeb404974.workers.dev';
const APP_URL = 'https://savetoread.pages.dev';
```

**popup/popup.js**:
```javascript
const APP_URL = 'https://savetoread.pages.dev';
```

### Local Development

For local development, update URLs to:
```javascript
const API_URL = 'http://localhost:8787';
const APP_URL = 'http://localhost:5173';
```

## Security

- Auth tokens are stored using Chrome's sync storage (encrypted)
- All API requests use HTTPS in production
- No sensitive data is logged or exposed
- Minimal permissions requested

## Browser Compatibility

| Browser | Manifest | Status |
|---------|----------|--------|
| Chrome 88+ | V3 | ✅ Supported |
| Edge 88+ | V3 | ✅ Supported |
| Firefox 109+ | V3 | ✅ Supported |
| Safari | - | 🚧 Planned |

## Troubleshooting

### Extension not saving articles

1. Check if you're logged in (click extension icon)
2. Check browser console for errors
3. Verify API URL is correct
4. Check network tab for failed requests

### Context menu not appearing

1. Reload the extension
2. Refresh the page you're on
3. Check extension is enabled in browser settings

### Notifications not showing

1. Check browser notification permissions
2. Verify notifications are enabled for Chrome
3. Check system notification settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test in both Chrome and Firefox
5. Submit a pull request

## Publishing

### Chrome Web Store

1. Create a developer account
2. Zip the extension directory
3. Upload to Chrome Web Store
4. Fill in store listing details
5. Submit for review

### Firefox Add-ons

1. Create a Mozilla account
2. Zip the extension directory
3. Upload to addons.mozilla.org
4. Fill in listing details
5. Submit for review

## License

MIT - Same as SaveToRead main project

## Links

- [SaveToRead Web App](https://savetoread.pages.dev)
- [GitHub Repository](https://github.com/yaneyba/SaveToRead)
- [API Documentation](../docs/API.md)
