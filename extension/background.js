/**
 * SaveToRead Browser Extension - Background Service Worker
 * Handles context menu creation and article saving
 */

const API_URL = 'https://savetoread-api.yeb404974.workers.dev';
const APP_URL = 'https://savetoread.pages.dev';

// Create context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
  // Context menu for links
  chrome.contextMenus.create({
    id: 'save-link-to-read',
    title: 'Save to SaveToRead',
    contexts: ['link']
  });

  // Context menu for pages
  chrome.contextMenus.create({
    id: 'save-page-to-read',
    title: 'Save Page to SaveToRead',
    contexts: ['page']
  });

  // Context menu for selected text with link
  chrome.contextMenus.create({
    id: 'save-selection-to-read',
    title: 'Save Selection to SaveToRead',
    contexts: ['selection']
  });

  console.log('SaveToRead extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let url = '';
  let title = '';

  // Determine URL and title based on context
  if (info.menuItemId === 'save-link-to-read') {
    url = info.linkUrl;
    title = info.selectionText || 'Saved Link';
  } else if (info.menuItemId === 'save-page-to-read') {
    url = info.pageUrl;
    title = tab.title || 'Saved Page';
  } else if (info.menuItemId === 'save-selection-to-read') {
    url = info.pageUrl;
    title = info.selectionText?.substring(0, 100) || tab.title;
  }

  if (!url) {
    console.error('No URL found to save');
    return;
  }

  // Save the article
  await saveArticle(url, title);
});

/**
 * Save article to SaveToRead
 */
async function saveArticle(url, title) {
  try {
    // Get auth token from storage
    const { authToken } = await chrome.storage.sync.get('authToken');

    if (!authToken) {
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
    const notificationId = await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SaveToRead',
      message: 'Saving article...'
    });

    // Call API to save article
    const response = await fetch(`${API_URL}/api/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        url: url,
        tags: []
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // Update notification with success
      chrome.notifications.update(notificationId, {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'SaveToRead',
        message: `✓ Saved: ${title}`,
        buttons: [{ title: 'View' }]
      });

      // Store article ID for "View" button
      chrome.storage.local.set({
        [`notification_${notificationId}`]: result.data.id
      });

      // Auto-clear notification after 5 seconds
      setTimeout(() => {
        chrome.notifications.clear(notificationId);
      }, 5000);
    } else {
      throw new Error(result.error?.message || 'Failed to save article');
    }
  } catch (error) {
    console.error('Error saving article:', error);

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SaveToRead Error',
      message: `Failed to save: ${error.message}`
    });
  }
}

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
        await saveArticle(tabs[0].url, tabs[0].title);
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
