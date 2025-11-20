/**
 * SaveToRead Extension Test Helper
 *
 * Run this in the browser console (on the dashboard page) to test event handling
 * Usage: Copy and paste into DevTools console on https://savetoread.com
 */

const SaveToReadTestHelper = {
  /**
   * Test if event listeners are registered
   */
  checkListeners() {
    console.log('=== Checking Event Listeners ===');

    // Check if getEventListeners is available (Chrome DevTools only)
    if (typeof getEventListeners === 'function') {
      const listeners = getEventListeners(window);

      const savingStartedListeners = listeners['savetoread:savingStarted'] || [];
      const articleSavedListeners = listeners['savetoread:articleSaved'] || [];

      console.log('✓ savetoread:savingStarted listeners:', savingStartedListeners.length);
      console.log('✓ savetoread:articleSaved listeners:', articleSavedListeners.length);

      if (savingStartedListeners.length === 0 || articleSavedListeners.length === 0) {
        console.warn('⚠️ Missing event listeners! Dashboard may not be loaded.');
        return false;
      }

      console.log('✅ All event listeners registered correctly');
      return true;
    } else {
      console.log('⚠️ getEventListeners not available (use Chrome DevTools)');
      console.log('Skipping listener check...');
      return true;
    }
  },

  /**
   * Simulate saving started event
   */
  testSavingStarted() {
    console.log('\n=== Testing "Saving Started" Event ===');

    const event = new CustomEvent('savetoread:savingStarted', {
      detail: {
        url: 'https://example.com/test-article',
        title: 'Test Article - Saving Started'
      }
    });

    console.log('Dispatching event:', event);
    window.dispatchEvent(event);
    console.log('✅ Event dispatched - Check for "Saving to Read..." toast');
  },

  /**
   * Simulate article saved event
   */
  testArticleSaved() {
    console.log('\n=== Testing "Article Saved" Event ===');

    const mockArticle = {
      id: 'test-' + Date.now(),
      url: 'https://example.com/test-article',
      title: 'Test Article - Saved Successfully',
      userId: 'test-user',
      tags: ['test'],
      isFavorite: false,
      isArchived: false,
      readProgress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const event = new CustomEvent('savetoread:articleSaved', {
      detail: mockArticle
    });

    console.log('Dispatching event:', event);
    window.dispatchEvent(event);
    console.log('✅ Event dispatched - Check for "Article saved successfully!" toast');
  },

  /**
   * Test complete save flow (both events in sequence)
   */
  testCompleteFlow() {
    console.log('\n=== Testing Complete Save Flow ===');
    console.log('This simulates the full extension save sequence...\n');

    // Test saving started
    this.testSavingStarted();

    // Wait 1.5 seconds, then test article saved
    setTimeout(() => {
      this.testArticleSaved();
      console.log('\n✅ Complete flow test finished - Check for both toasts');
    }, 1500);
  },

  /**
   * Test rapid succession saves (stress test)
   */
  testRapidSaves() {
    console.log('\n=== Testing Rapid Save Events ===');
    console.log('This tests multiple saves in quick succession...\n');

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        console.log(`Save #${i + 1}:`);
        this.testSavingStarted();

        setTimeout(() => {
          this.testArticleSaved();
        }, 800);
      }, i * 2000);
    }

    console.log('✅ Dispatching 3 saves over 6 seconds - Watch for toasts');
  },

  /**
   * Verify extension is installed and content script is loaded
   */
  checkExtension() {
    console.log('\n=== Checking Extension Status ===');

    // Check if on savetoread domain
    const isCorrectDomain = window.location.hostname.includes('savetoread.com') ||
                           window.location.hostname.includes('savetoread.pages.dev') ||
                           window.location.hostname === 'localhost';

    if (!isCorrectDomain) {
      console.warn('⚠️ Not on SaveToRead domain!');
      console.log('Current domain:', window.location.hostname);
      console.log('Extension content script may not be loaded.');
      return false;
    }

    console.log('✅ On SaveToRead domain:', window.location.hostname);

    // Check if content script has run (by looking for auth token sync)
    if (localStorage.getItem('auth_token')) {
      console.log('✅ Auth token found in localStorage');
    } else {
      console.log('⚠️ No auth token in localStorage (user may not be logged in)');
    }

    return true;
  },

  /**
   * Run all tests
   */
  runAll() {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  SaveToRead Extension Test Suite        ║');
    console.log('╚══════════════════════════════════════════╝\n');

    // Step 1: Check extension
    if (!this.checkExtension()) {
      console.error('❌ Extension check failed. Please ensure:');
      console.error('   1. You are on savetoread.com or localhost');
      console.error('   2. Extension is installed and loaded');
      console.error('   3. Content script is running');
      return;
    }

    // Step 2: Check listeners
    this.checkListeners();

    // Step 3: Run flow test
    console.log('\nStarting complete flow test in 2 seconds...');
    setTimeout(() => {
      this.testCompleteFlow();
    }, 2000);
  },

  /**
   * Print usage instructions
   */
  help() {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  SaveToRead Test Helper - Commands      ║');
    console.log('╚══════════════════════════════════════════╝\n');
    console.log('Available commands:');
    console.log('');
    console.log('  SaveToReadTestHelper.runAll()');
    console.log('    → Run all tests (recommended)');
    console.log('');
    console.log('  SaveToReadTestHelper.testSavingStarted()');
    console.log('    → Test "Saving to Read..." toast');
    console.log('');
    console.log('  SaveToReadTestHelper.testArticleSaved()');
    console.log('    → Test "Article saved successfully!" toast');
    console.log('');
    console.log('  SaveToReadTestHelper.testCompleteFlow()');
    console.log('    → Test full save sequence (both toasts)');
    console.log('');
    console.log('  SaveToReadTestHelper.testRapidSaves()');
    console.log('    → Stress test with multiple rapid saves');
    console.log('');
    console.log('  SaveToReadTestHelper.checkListeners()');
    console.log('    → Verify event listeners are registered');
    console.log('');
    console.log('  SaveToReadTestHelper.checkExtension()');
    console.log('    → Verify extension and content script');
    console.log('');
    console.log('  SaveToReadTestHelper.help()');
    console.log('    → Show this help message');
    console.log('');
  }
};

// Auto-display help on load
console.log('%c SaveToRead Extension Test Helper Loaded! ', 'background: #10b981; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
console.log('');
console.log('Quick start: SaveToReadTestHelper.runAll()');
console.log('Full help:   SaveToReadTestHelper.help()');
console.log('');

// Export to global scope
window.SaveToReadTestHelper = SaveToReadTestHelper;
