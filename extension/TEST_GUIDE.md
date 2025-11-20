# SaveToRead Extension - Test Verification Guide

This guide helps verify the toast notification and performance improvements implemented for the SaveToRead extension.

## Prerequisites

1. **Install Dependencies:**
   ```bash
   cd /home/user/SaveToRead
   npm install
   ```

2. **Build Frontend:**
   ```bash
   npm run build --workspace=frontend
   ```

3. **Load Extension:**
   - Open Chrome/Edge browser
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select `/home/user/SaveToRead/extension` folder

4. **Open SaveToRead Dashboard:**
   - In development: `http://localhost:5173`
   - In production: `https://savetoread.com`
   - Login with your account

## Test Cases

### Test 1: Immediate Toast Notification ✓

**Objective:** Verify "Saving to Read..." toast appears immediately when saving

**Steps:**
1. Open SaveToRead dashboard in one tab
2. Open any article/webpage in another tab (e.g., https://example.com)
3. Right-click on the page → Select "Save Page to Read"

**Expected Results:**
- ✅ Dashboard tab immediately shows blue/info toast: "Saving to Read..."
- ✅ After 1-2 seconds, green/success toast appears: "Article saved successfully!"
- ✅ Article list auto-refreshes and new article appears
- ✅ Both toasts fade out after 3 seconds each

**Console Logs to Verify:**
```
[SaveToRead] Saving article: {url, title, autoSnapshot, hasHighlight}
[SaveToRead] Notifying X SaveToRead tabs with action: savingStarted
[SaveToRead] Successfully notified tab X
[Dashboard] Saving started event received, showing toast
[SaveToRead] Notification results: X/X successful
[SaveToRead] Article saved from extension, refreshing...
[Dashboard] Article saved event received, showing toast
```

---

### Test 2: Multiple Dashboard Tabs ✓

**Objective:** Verify all open dashboard tabs receive notifications

**Steps:**
1. Open 3 dashboard tabs
2. Open an article in a 4th tab
3. Save the article using context menu

**Expected Results:**
- ✅ All 3 dashboard tabs show "Saving to Read..." toast simultaneously
- ✅ All 3 dashboard tabs show "Article saved successfully!" toast after completion
- ✅ All 3 dashboard tabs auto-refresh their article lists
- ✅ Console shows: `Notification results: 3/3 successful`

**Console Logs:**
```
[SaveToRead] Notifying 3 SaveToRead tabs with action: savingStarted
[SaveToRead] Successfully notified tab 123
[SaveToRead] Successfully notified tab 456
[SaveToRead] Successfully notified tab 789
[SaveToRead] Notification results: 3/3 successful
```

---

### Test 3: Loading Tab Edge Case ✓

**Objective:** Verify notifications work even if dashboard tab is still loading

**Steps:**
1. Start loading dashboard (but don't wait for it to finish)
2. Immediately switch to another tab
3. Save an article while dashboard is still loading

**Expected Results:**
- ✅ Console shows: `Tab X not ready, waiting...`
- ✅ Extension waits 500ms for tab to load
- ✅ Toast still appears (might be slightly delayed)
- ✅ Article list refreshes after page loads

---

### Test 4: Keyboard Shortcut ⌨️

**Objective:** Verify keyboard shortcut triggers same notification flow

**Steps:**
1. Open dashboard tab
2. Open an article tab
3. Press `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)

**Expected Results:**
- ✅ Same behavior as context menu
- ✅ "Saving to Read..." toast appears immediately
- ✅ Success toast appears after save
- ✅ Article list auto-refreshes

---

### Test 5: Popup Save Button 🔘

**Objective:** Verify extension popup triggers notifications

**Steps:**
1. Open dashboard tab
2. Open an article tab
3. Click extension icon in toolbar
4. Click "Save This Page" button

**Expected Results:**
- ✅ Same notification flow as context menu
- ✅ Both toasts appear in dashboard
- ✅ Article list refreshes

---

### Test 6: No Dashboard Tab Open 🚫

**Objective:** Verify extension works even without dashboard open

**Steps:**
1. Close all dashboard tabs
2. Save an article using context menu

**Expected Results:**
- ✅ Chrome notification appears: "Saving article..."
- ✅ Chrome notification updates: "✓ Saved: [article title]"
- ✅ Badge shows "…" then "✓"
- ✅ Console shows: `Notifying 0 SaveToRead tabs`
- ✅ Article is still saved successfully

---

### Test 7: Network Error Handling 🌐

**Objective:** Verify offline/error behavior

**Steps:**
1. Open dashboard
2. Open DevTools → Network tab
3. Set network to "Offline"
4. Try to save an article

**Expected Results:**
- ✅ "Saving to Read..." toast appears
- ✅ Article added to offline queue
- ✅ Badge shows queue count (orange): "1"
- ✅ Chrome notification: "⏳ Queued for later (offline)"
- ✅ When back online, queue processes automatically
- ✅ Success toast appears after queue processing

---

### Test 8: Message Passing Timeout ⏱️

**Objective:** Verify save doesn't hang if tab notification fails

**Steps:**
1. Open dashboard but block content script from loading (use DevTools)
2. Save an article

**Expected Results:**
- ✅ Extension doesn't wait more than 200ms for notification
- ✅ Article save proceeds regardless
- ✅ Console shows failed notification but save succeeds

---

## Performance Metrics

### Timing Expectations:
- **Toast appearance:** < 100ms after clicking "Save Page to Read"
- **API call start:** < 200ms after click
- **Success toast:** 500ms - 2000ms (depends on API latency)
- **Article list refresh:** Immediately after success toast

### Console Performance Check:
1. Open DevTools Console
2. Enable timestamps: Settings → Preferences → Console → Show timestamps
3. Save an article
4. Verify sequence:
   ```
   [timestamp] Saving article...
   [+50ms]    Notifying tabs with action: savingStarted
   [+100ms]   Dashboard: Saving started event received
   [+150ms]   Calling API...
   [+1500ms]  Response received
   [+1550ms]  Notifying tabs with action: articleSaved
   [+1600ms]  Dashboard: Article saved event received
   ```

---

## Debugging Tips

### Enable Verbose Logging:
All logs are prefixed with `[SaveToRead]` or `[Dashboard]`

**Filter in Console:**
```
/SaveToRead|Dashboard/
```

### Check Extension Service Worker:
1. Go to `chrome://extensions/`
2. Find SaveToRead extension
3. Click "service worker" link
4. View background script logs

### Check Content Script:
1. Open dashboard tab
2. Open DevTools on dashboard
3. View content script logs

### Verify Event Listeners:
Run in dashboard console:
```javascript
// Check if listeners are registered
getEventListeners(window)
// Should show: savetoread:savingStarted, savetoread:articleSaved

// Manually trigger event to test
window.dispatchEvent(new CustomEvent('savetoread:savingStarted', {
  detail: { url: 'https://test.com', title: 'Test' }
}))
// Should show "Saving to Read..." toast
```

---

## Known Issues & Workarounds

### Issue: Toast doesn't appear
**Cause:** Content script not loaded
**Solution:** Refresh dashboard page

### Issue: Article list doesn't refresh
**Cause:** Event listener not registered
**Solution:** Check console for errors, ensure React app mounted

### Issue: Notification timeout
**Cause:** Dashboard tab in background (browser throttling)
**Solution:** This is expected; extension will retry

---

## Success Criteria ✅

All tests should pass with:
- ✅ No console errors
- ✅ Toasts appear in correct order
- ✅ Article list auto-refreshes
- ✅ Timing under 200ms for initial toast
- ✅ All dashboard tabs receive notifications

## Reporting Issues

If any test fails, provide:
1. Browser version
2. Extension version (1.1.0)
3. Console logs (full output)
4. Steps to reproduce
5. Expected vs actual behavior

---

**Last Updated:** 2025-11-20
**Test Coverage:** Toast notifications, performance improvements, message passing reliability
