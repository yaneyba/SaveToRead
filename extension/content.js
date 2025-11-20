/**
 * SaveToRead Browser Extension - Content Script
 * Handles text selection and highlighting
 */

// Sync auth token from website to extension (only on savetoread.com)
if (window.location.hostname === 'savetoread.com' || window.location.hostname.endsWith('.savetoread.pages.dev')) {
  let lastSyncedToken = null;

  // Check localStorage for auth token (frontend uses 'auth_token')
  const checkAndSyncToken = () => {
    const token = localStorage.getItem('auth_token');
    if (token && token !== lastSyncedToken) {
      console.log('[SaveToRead Extension] Found new auth token, syncing to extension');
      chrome.storage.sync.set({ authToken: token }, () => {
        console.log('[SaveToRead Extension] Auth token synced successfully');
        lastSyncedToken = token;
      });
    }
  };

  // Check immediately
  checkAndSyncToken();

  // Also listen for storage changes
  window.addEventListener('storage', (e) => {
    if (e.key === 'auth_token') {
      checkAndSyncToken();
    }
  });

  // Check periodically (every 2 seconds) for token changes
  setInterval(checkAndSyncToken, 2000);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText) {
      // Get surrounding context
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const textContent = container.textContent || container.parentNode?.textContent || '';
      
      sendResponse({
        text: selectedText,
        context: textContent.substring(0, 500), // First 500 chars for context
        url: window.location.href,
        title: document.title
      });
    } else {
      sendResponse({ text: null });
    }
  }
  
  // Handle saving started notification
  if (request.action === 'savingStarted') {
    console.log('[SaveToRead] Saving started, dispatching event');
    // Dispatch custom event that React can listen to
    window.dispatchEvent(new CustomEvent('savetoread:savingStarted', {
      detail: { url: request.url, title: request.title }
    }));
    sendResponse({ received: true });
  }

  // Handle article saved notification
  if (request.action === 'articleSaved') {
    console.log('[SaveToRead] Article saved, dispatching event');
    // Dispatch custom event that React can listen to
    window.dispatchEvent(new CustomEvent('savetoread:articleSaved', {
      detail: request.article
    }));
    sendResponse({ received: true });
  }

  return true;
});

// Optional: Highlight saved selections (would need backend support)
function highlightText(text, color = '#ffeb3b') {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.backgroundColor = color;
    span.style.padding = '2px 0';
    span.className = 'savetoread-highlight';
    
    try {
      range.surroundContents(span);
    } catch (e) {
      // If surrounding fails, use a different approach
      console.log('Could not highlight text:', e);
    }
  }
}
