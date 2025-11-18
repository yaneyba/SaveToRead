/**
 * SaveToRead Browser Extension - Content Script
 * Handles text selection and highlighting
 */

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
