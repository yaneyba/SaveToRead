/**
 * SaveToRead Browser Extension - Background Service Worker
 * Handles context menu creation and article saving
 */

const API_URL = 'https://api.savetoread.com';
const APP_URL = 'https://savetoread.com';

// Queue for offline saves
let saveQueue = [];

// Load queue from storage on startup
chrome.storage.local.get('saveQueue', (result) => {
  if (result.saveQueue) {
    saveQueue = result.saveQueue;
    // Try to process queue
    processSaveQueue();
  }
});

// Create context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
  // Context menu for links
  chrome.contextMenus.create({
    id: 'save-link-to-read',
    title: 'Save to Read',
    contexts: ['link']
  });

  // Context menu for pages
  chrome.contextMenus.create({
    id: 'save-page-to-read',
    title: 'Save Page to Read',
    contexts: ['page']
  });

  // Context menu for selected text with link
  chrome.contextMenus.create({
    id: 'save-selection-to-read',
    title: 'Save Selection to Read',
    contexts: ['selection']
  });

  console.log('SaveToRead extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('[SaveToRead] Context menu clicked:', info.menuItemId);
  let url = '';
  let title = '';
  let highlight = null;

  // Determine URL and title based on context
  if (info.menuItemId === 'save-link-to-read') {
    url = info.linkUrl;
    title = info.selectionText || 'Saved Link';
  } else if (info.menuItemId === 'save-page-to-read') {
    url = info.pageUrl;
    title = tab.title || 'Saved Page';
  } else if (info.menuItemId === 'save-selection-to-read') {
    url = info.pageUrl;
    title = tab.title || 'Saved Page';
    
    // Get full selection details from content script
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' });
      if (response && response.text) {
        highlight = {
          text: response.text,
          context: response.context
        };
      }
    } catch (error) {
      console.error('Error getting selection:', error);
      // Fallback to info.selectionText
      highlight = {
        text: info.selectionText,
        context: info.selectionText
      };
    }
  }

  if (!url) {
    console.error('No URL found to save');
    return;
  }

  // Prevent saving extension pages, chrome pages, and local files
  if (url.startsWith('chrome://') || 
      url.startsWith('chrome-extension://') || 
      url.startsWith('about:') || 
      url.startsWith('file://')) {
    console.log('[SaveToRead] Blocked attempt to save restricted page:', url);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SaveToRead',
      message: 'Cannot save browser pages or extension pages'
    });
    return;
  }

  // Save the article with optional highlight
  await saveArticle(url, title, false, highlight);
});

/**
 * Save article to SaveToRead
 */
async function saveArticle(url, title, autoSnapshot = false, highlight = null) {
  console.log('[SaveToRead] Saving article:', { url, title, autoSnapshot, hasHighlight: !!highlight });
  
  try {
    // Get auth token from storage
    const { authToken } = await chrome.storage.sync.get('authToken');
    console.log('[SaveToRead] Auth token present:', !!authToken);

    if (!authToken) {
      console.warn('[SaveToRead] No auth token found. Opening login page...');
      // User not logged in - open popup or login page
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'SaveToRead',
        message: 'Please log in to save articles',
        buttons: [{ title: 'Log In' }]
      });

      // Open login page
      chrome.tabs.create({ url: `${APP_URL}/login` });
      return;
    }

    // Show saving notification
    const savingMessage = highlight ? 'Saving article with highlight...' : 'Saving article...';
    const notificationId = await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SaveToRead',
      message: savingMessage
    });

    // Prepare request body
    const requestBody = {
      url: url,
      tags: [],
      autoSnapshot: autoSnapshot
    };

    // Add highlight/notes if present
    if (highlight) {
      requestBody.notes = `Highlighted text:\n\n"${highlight.text}"\n\nContext: ${highlight.context}`;
    }

    // Call API to save article
    console.log('[SaveToRead] Calling API:', `${API_URL}/api/articles`);
    console.log('[SaveToRead] Request body:', requestBody);
    
    const response = await fetch(`${API_URL}/api/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('[SaveToRead] Response status:', response.status);

    if (!response.ok) {
      // If offline or network error, add to queue
      if (!navigator.onLine || response.status >= 500) {
        await addToQueue(url, title, autoSnapshot, highlight);
        chrome.notifications.update(notificationId, {
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'SaveToRead',
          message: '⏳ Queued for later (offline)'
        });
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // Update notification with success
      let message = highlight 
        ? `✓ Saved with highlight: ${title}`
        : autoSnapshot 
        ? `✓ Saved with snapshot: ${title}`
        : `✓ Saved: ${title}`;
      
      chrome.notifications.update(notificationId, {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'SaveToRead',
        message: message,
        buttons: [{ title: 'View' }]
      });

      // Store article ID for "View" button
      chrome.storage.local.set({
        [`notification_${notificationId}`]: result.data.id
      });

      // Notify any open SaveToRead tabs to refresh
      try {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.url && (tab.url.includes('savetoread.com') || tab.url.includes('savetoread.pages.dev'))) {
              chrome.tabs.sendMessage(tab.id, {
                action: 'articleSaved',
                article: result.data
              }).catch(() => {}); // Ignore if content script not loaded
            }
          });
        });
      } catch (error) {
        console.log('Could not notify tabs:', error);
      }

      // Auto-clear notification after 5 seconds
      setTimeout(() => {
        chrome.notifications.clear(notificationId);
      }, 5000);
    } else {
      throw new Error(result.error?.message || 'Failed to save article');
    }
  } catch (error) {
    console.error('Error saving article:', error);

    // If offline, add to queue
    if (!navigator.onLine) {
      await addToQueue(url, title, autoSnapshot, highlight);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'SaveToRead',
        message: '⏳ Queued for later (offline)'
      });
    } else {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'SaveToRead Error',
        message: `Failed to save: ${error.message}`
      });
    }
  }
}

/**
 * Add article to offline queue
 */
async function addToQueue(url, title, autoSnapshot, highlight = null) {
  const queueItem = {
    id: Date.now() + Math.random(),
    url,
    title,
    autoSnapshot,
    highlight,
    timestamp: Date.now()
  };
  
  saveQueue.push(queueItem);
  await chrome.storage.local.set({ saveQueue });
  
  // Update badge to show queue count
  chrome.action.setBadgeText({ text: String(saveQueue.length) });
  chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
}

/**
 * Process the save queue
 */
async function processSaveQueue() {
  if (saveQueue.length === 0) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  if (!navigator.onLine) {
    console.log('Still offline, waiting...');
    return;
  }

  const { authToken } = await chrome.storage.sync.get('authToken');
  if (!authToken) {
    console.log('Not authenticated, cannot process queue');
    return;
  }

  console.log(`Processing ${saveQueue.length} queued articles...`);

  const itemsToProcess = [...saveQueue];
  saveQueue = [];
  await chrome.storage.local.set({ saveQueue: [] });
  chrome.action.setBadgeText({ text: '' });

  let successCount = 0;
  let failCount = 0;

  for (const item of itemsToProcess) {
    try {
      const requestBody = {
        url: item.url,
        tags: [],
        autoSnapshot: item.autoSnapshot
      };

      // Add highlight/notes if present
      if (item.highlight) {
        requestBody.notes = `Highlighted text:\n\n"${item.highlight.text}"\n\nContext: ${item.highlight.context}`;
      }

      const response = await fetch(`${API_URL}/api/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        successCount++;
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to process queue item:', error);
      // Re-add to queue if failed
      saveQueue.push(item);
      failCount++;
    }
  }

  // Update storage with any failed items
  if (saveQueue.length > 0) {
    await chrome.storage.local.set({ saveQueue });
    chrome.action.setBadgeText({ text: String(saveQueue.length) });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  }

  // Show notification about queue processing
  if (successCount > 0) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SaveToRead',
      message: `✓ Processed ${successCount} queued article(s)${failCount > 0 ? `, ${failCount} failed` : ''}`
    });
  }
}

// Listen for online/offline events
self.addEventListener('online', () => {
  console.log('Back online, processing queue...');
  processSaveQueue();
});

// Check queue periodically
setInterval(processSaveQueue, 60000); // Every minute


/**
 * Handle notification button clicks
 */
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // "View" or "Log In" button clicked
    const { [`notification_${notificationId}`]: articleId } = await chrome.storage.local.get(`notification_${notificationId}`);

    if (articleId) {
      // Open article in app
      chrome.tabs.create({ url: `${APP_URL}/articles/${articleId}` });
    } else {
      // Open login page
      chrome.tabs.create({ url: `${APP_URL}/login` });
    }
  }
});

/**
 * Handle messages from popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveCurrentPage') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        await saveArticle(tabs[0].url, tabs[0].title, request.autoSnapshot);
        sendResponse({ success: true });
      }
    });
    return true; // Keep channel open for async response
  }

  if (request.action === 'getAuthStatus') {
    chrome.storage.sync.get('authToken', (result) => {
      sendResponse({ authenticated: !!result.authToken });
    });
    return true;
  }
});

/**
 * Handle keyboard shortcuts
 */
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'save-current-page') {
    // Get current active tab and save it
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      // Get auto-snapshot preference
      const { autoSnapshot } = await chrome.storage.sync.get({ autoSnapshot: false });
      await saveArticle(tab.url, tab.title, autoSnapshot);
    }
  } else if (command === 'view-articles') {
    // Open articles page
    chrome.tabs.create({ url: `${APP_URL}/articles` });
  }
});
