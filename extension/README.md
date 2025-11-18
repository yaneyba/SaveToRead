# SaveToRead Browser Extension

A powerful browser extension that allows you to save articles, links, and pages to read later with automatic snapshots, offline support, and keyboard shortcuts.

## Features

### 🎯 Core Features
- **Right-Click Context Menu**: Save any link or page with a right-click
- **Quick Save**: Click the extension icon to save the current page
- **⌨️ Keyboard Shortcuts**: 
  - `Ctrl+Shift+S` (Mac: `Cmd+Shift+S`) - Save current page
  - `Ctrl+Shift+A` (Mac: `Cmd+Shift+A`) - Open articles
- **📸 Auto-Snapshot**: Automatically generate PDF/HTML snapshots when saving
- **✍️ Text Highlighting**: Save selected text as highlights with your articles
- **📴 Offline Mode**: Queue articles when offline, auto-sync when back online
- **🔔 Smart Notifications**: Get instant feedback when articles are saved
- **Seamless Integration**: Works with your SaveToRead account

### ✨ New in v1.1.0
- ⌨️ Keyboard shortcuts for power users
- 📸 Optional auto-snapshot generation
- 📴 Offline save queue with automatic retry
- ✍️ Save text selections as highlights
- 🎯 Queue status indicator in popup
- 🔄 Background sync for queued articles

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

### Keyboard Shortcuts (New!)

Save articles even faster with keyboard shortcuts:

1. **Save Current Page**: `Ctrl+Shift+S` (Mac: `Cmd+Shift+S`)
   - Works on any webpage
   - Respects your auto-snapshot preference
   - Shows notification when saved

2. **Open Articles**: `Ctrl+Shift+A` (Mac: `Cmd+Shift+A`)
   - Quickly jump to your saved articles
   - Opens in a new tab

### Right-Click Context Menu

1. **Save a Link**:
   - Right-click on any link
   - Select "Save to SaveToRead"

2. **Save Current Page**:
   - Right-click anywhere on the page
   - Select "Save Page to SaveToRead"

3. **Save Selected Text as Highlight**:
   - Highlight any text
   - Right-click on the selection
   - Select "Save Selection to SaveToRead"
   - The text will be saved as a note/highlight with the article

### Extension Popup

1. Click the SaveToRead extension icon in your browser toolbar
2. **Toggle Auto-Snapshot**: Check the box to automatically generate snapshots (PDF/HTML)
3. Click "Save This Page" to save the current tab
4. Click "View My Articles" to open your saved articles
5. **Queue Status**: See how many articles are queued for offline sync

### Offline Mode

The extension works even when you're offline:

1. **Automatic Queuing**: Articles are automatically queued when you're offline
2. **Visual Indicator**: Badge shows number of queued articles
3. **Auto-Sync**: Queue is processed automatically when connection is restored
4. **Manual Retry**: Queue is checked every minute for failed saves

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
├── background.js          # Service worker for context menu & offline queue
├── content.js             # Content script for text selection
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

### Key Features Implementation

**Keyboard Shortcuts** (`manifest.json`):
```json
{
  "commands": {
    "save-current-page": {
      "suggested_key": {
        "default": "Ctrl+Shift+S",
        "mac": "Command+Shift+S"
      }
    }
  }
}
```

**Offline Queue** (`background.js`):
- Stores failed saves in `chrome.storage.local`
- Retries automatically when online
- Shows badge with queue count
- Processes queue every minute

**Text Selection** (`content.js`):
- Captures selected text and context
- Communicates with background script
- Saves highlights as article notes

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
    "tags": [],
    "autoSnapshot": true,
    "notes": "Highlighted text: ..."
  }
  ```

### Permissions Explained

- `contextMenus`: Add "Save to SaveToRead" to right-click menu
- `activeTab`: Access current tab URL and title
- `storage`: Store auth token and offline queue securely
- `notifications`: Show save confirmations and queue status
- `host_permissions`: Communicate with SaveToRead API
- `content_scripts`: Capture text selections for highlights

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
5. Look for queued items (orange badge on extension icon)

### Context menu not appearing

1. Reload the extension
2. Refresh the page you're on
3. Check extension is enabled in browser settings

### Notifications not showing

1. Check browser notification permissions
2. Verify notifications are enabled for Chrome
3. Check system notification settings

### Keyboard shortcuts not working

1. Check for conflicts in `chrome://extensions/shortcuts`
2. Manually reassign shortcuts if needed
3. Restart browser after changing shortcuts

### Articles stuck in queue

1. Check internet connection
2. Verify you're logged in
3. Click extension icon to see queue status
4. Queue retries automatically every minute
5. Check browser console for errors

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
