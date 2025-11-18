/**
 * Content Analysis Utilities
 *
 * Functions for analyzing article content (word count, reading time, etc.)
 */

/**
 * Calculate word count from HTML or plain text content
 */
export function calculateWordCount(content: string): number {
  if (!content) return 0;

  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, ' ');

  // Remove extra whitespace and split into words
  const words = text
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(word => word.length > 0);

  return words.length;
}

/**
 * Estimate reading time based on word count
 * Average reading speed: 200-250 words per minute
 * We use 225 as a middle ground
 */
export function estimateReadingTime(wordCount: number): number {
  const WORDS_PER_MINUTE = 225;
  const minutes = Math.ceil(wordCount / WORDS_PER_MINUTE);
  return Math.max(1, minutes); // Minimum 1 minute
}

/**
 * Calculate both word count and reading time from content
 */
export function analyzeContent(content: string): {
  wordCount: number;
  readingTimeMinutes: number;
} {
  const wordCount = calculateWordCount(content);
  const readingTimeMinutes = estimateReadingTime(wordCount);

  return {
    wordCount,
    readingTimeMinutes
  };
}

/**
 * Normalize URL for duplicate detection
 * Removes trailing slashes, query params (optional), fragments
 */
export function normalizeUrl(url: string, removeQueryParams: boolean = false): string {
  try {
    const urlObj = new URL(url);

    // Remove fragment
    urlObj.hash = '';

    // Optionally remove query parameters
    if (removeQueryParams) {
      urlObj.search = '';
    }

    // Remove trailing slash
    let normalized = urlObj.toString();
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    // Convert to lowercase for case-insensitive comparison
    return normalized.toLowerCase();
  } catch (error) {
    // If URL parsing fails, return original
    return url.toLowerCase();
  }
}

/**
 * Check if two URLs are duplicates
 */
export function areDuplicateUrls(url1: string, url2: string): boolean {
  const normalized1 = normalizeUrl(url1, false);
  const normalized2 = normalizeUrl(url2, false);

  if (normalized1 === normalized2) return true;

  // Also check without query params
  const normalized1NoQuery = normalizeUrl(url1, true);
  const normalized2NoQuery = normalizeUrl(url2, true);

  return normalized1NoQuery === normalized2NoQuery;
}

/**
 * Extract domain from URL for organization
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Generate folder path based on organization strategy
 */
export function generateFolderPath(
  strategy: 'date' | 'domain' | 'tags' | 'none',
  article: {
    createdAt: string;
    url: string;
    tags: string[];
  }
): string {
  const basePath = '/SaveToRead';

  switch (strategy) {
    case 'date': {
      const date = new Date(article.createdAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${basePath}/${year}/${month}`;
    }

    case 'domain': {
      const domain = extractDomain(article.url);
      return `${basePath}/${domain}`;
    }

    case 'tags': {
      if (article.tags.length > 0) {
        // Use first tag
        const tag = article.tags[0].replace(/[^a-z0-9-]/gi, '_');
        return `${basePath}/${tag}`;
      }
      return `${basePath}/untagged`;
    }

    case 'none':
    default:
      return basePath;
  }
}
