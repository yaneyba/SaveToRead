/**
 * Tests for content extraction service
 */

import { describe, it, expect } from 'vitest';
import { extractArticleContent } from './content-extraction';

describe('Content Extraction Service', () => {
  it('should extract content from a valid URL', async () => {
    const url = 'https://www.bbc.com/news';

    const result = await extractArticleContent(url, {
      useJinaAI: true,
      timeout: 15000
    });

    expect(result).toBeDefined();
    expect(result.title).toBeTruthy();
    expect(result.extractionMethod).toBeDefined();
    expect(['jina-ai', 'basic-html', 'fallback']).toContain(result.extractionMethod);
  }, 20000); // 20 second timeout for network request

  it('should handle invalid URLs gracefully', async () => {
    const url = 'https://this-domain-definitely-does-not-exist-12345.com';

    const result = await extractArticleContent(url, {
      useJinaAI: false,
      timeout: 5000
    });

    expect(result).toBeDefined();
    expect(result.extractionMethod).toBe('fallback');
    expect(result.extractionError).toBeTruthy();
  }, 10000);

  it('should extract word count and reading time', async () => {
    const url = 'https://example.com';

    const result = await extractArticleContent(url, {
      useJinaAI: false,
      timeout: 10000
    });

    expect(result).toBeDefined();
    expect(typeof result.wordCount).toBe('number');
    expect(typeof result.readingTimeMinutes).toBe('number');
  }, 15000);

  it('should use Jina AI as primary method when enabled', async () => {
    const url = 'https://github.com';

    const result = await extractArticleContent(url, {
      useJinaAI: true,
      timeout: 15000
    });

    expect(result).toBeDefined();
    // Jina AI should succeed for most public URLs
    if (!result.extractionError) {
      expect(result.extractionMethod).toBe('jina-ai');
    }
  }, 20000);

  it('should fallback to basic HTML when Jina AI is disabled', async () => {
    const url = 'https://example.com';

    const result = await extractArticleContent(url, {
      useJinaAI: false,
      timeout: 10000
    });

    expect(result).toBeDefined();
    expect(['basic-html', 'fallback']).toContain(result.extractionMethod);
  }, 15000);
});
