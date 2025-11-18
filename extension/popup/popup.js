/**
 * SaveToRead Browser Extension - Popup Script
 */

const APP_URL = 'https://savetoread.com';

// DOM Elements
const loadingEl = document.getElementById('loading');
const notLoggedInEl = document.getElementById('not-logged-in');
const loggedInEl = document.getElementById('logged-in');
const successMessageEl = document.getElementById('success-message');
const errorMessageEl = document.getElementById('error-message');

const loginBtn = document.getElementById('login-btn');
const savePageBtn = document.getElementById('save-page-btn');
const viewArticlesBtn = document.getElementById('view-articles-btn');
const logoutBtn = document.getElementById('logout-btn');
const autoSnapshotCheckbox = document.getElementById('auto-snapshot-checkbox');
const queueInfoEl = document.getElementById('queue-info');
const queueCountEl = document.getElementById('queue-count');

const pageTitleEl = document.getElementById('page-title');
const pageUrlEl = document.getElementById('page-url');
const successTextEl = document.getElementById('success-text');
const errorTextEl = document.getElementById('error-text');

// State
let currentTab = null;

// Initialize popup
async function init() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    // Update page info
    if (tab) {
      pageTitleEl.textContent = tab.title || 'Current Page';
      pageUrlEl.textContent = tab.url || '';
    }

    // Check authentication status
    const { authenticated } = await chrome.runtime.sendMessage({ action: 'getAuthStatus' });

    if (authenticated) {
      // Load auto-snapshot preference
      const { autoSnapshot } = await chrome.storage.sync.get({ autoSnapshot: false });
      autoSnapshotCheckbox.checked = autoSnapshot;

      // Load queue info
      const { saveQueue } = await chrome.storage.local.get({ saveQueue: [] });
      if (saveQueue && saveQueue.length > 0) {
        queueCountEl.textContent = saveQueue.length;
        queueInfoEl.style.display = 'flex';
      }
    }

    showState(authenticated ? 'logged-in' : 'not-logged-in');
  } catch (error) {
    console.error('Init error:', error);
    showError('Failed to initialize extension');
  }
}

// Show specific state
function showState(state) {
  loadingEl.style.display = 'none';
  notLoggedInEl.style.display = 'none';
  loggedInEl.style.display = 'none';

  if (state === 'loading') {
    loadingEl.style.display = 'flex';
  } else if (state === 'not-logged-in') {
    notLoggedInEl.style.display = 'block';
  } else if (state === 'logged-in') {
    loggedInEl.style.display = 'block';
  }
}

// Show success message
function showSuccess(message) {
  successTextEl.textContent = message;
  successMessageEl.style.display = 'flex';
  setTimeout(() => {
    successMessageEl.style.display = 'none';
  }, 3000);
}

// Show error message
function showError(message) {
  errorTextEl.textContent = message;
  errorMessageEl.style.display = 'flex';
  setTimeout(() => {
    errorMessageEl.style.display = 'none';
  }, 3000);
}

// Event Listeners
loginBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: `${APP_URL}/login` });
  window.close();
});

savePageBtn.addEventListener('click', async () => {
  try {
    savePageBtn.disabled = true;
    savePageBtn.textContent = 'Saving...';

    // Get auto-snapshot preference
    const { autoSnapshot } = await chrome.storage.sync.get({ autoSnapshot: false });

    const response = await chrome.runtime.sendMessage({ 
      action: 'saveCurrentPage',
      autoSnapshot: autoSnapshot
    });

    if (response.success) {
      showSuccess('Page saved successfully!');
      savePageBtn.textContent = '✓ Saved';
      setTimeout(() => {
        savePageBtn.innerHTML = '<span class="icon">📚</span> Save This Page';
        savePageBtn.disabled = false;
      }, 2000);
    } else {
      throw new Error('Failed to save page');
    }
  } catch (error) {
    console.error('Save error:', error);
    showError('Failed to save page');
    savePageBtn.innerHTML = '<span class="icon">📚</span> Save This Page';
    savePageBtn.disabled = false;
  }
});

// Save auto-snapshot preference when checkbox changes
autoSnapshotCheckbox.addEventListener('change', async () => {
  await chrome.storage.sync.set({ autoSnapshot: autoSnapshotCheckbox.checked });
});

viewArticlesBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: `${APP_URL}/articles` });
  window.close();
});

logoutBtn.addEventListener('click', async () => {
  // Clear auth token
  await chrome.storage.sync.remove('authToken');
  showState('not-logged-in');
  showSuccess('Logged out successfully');
});

// Initialize on load
init();
