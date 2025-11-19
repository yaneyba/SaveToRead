/**
 * Content Extraction Service
 *
 * Fetches and extracts article content from URLs using Jina AI Reader API
 * Fallback to basic HTML fetching if Jina AI fails
 */

export interface ExtractedContent {
  title: string;
  author?: string;
  content: string;
  excerpt?: string;
  publishedDate?: string;
  siteName?: string;
  imageUrl?: string;
  wordCount?: number;
  readingTimeMinutes?: number;
  extractionMethod?: 'jina-ai' | 'basic-html' | 'fallback';
  extractionError?: string;
}

export interface ExtractionOptions {
  /**
   * Use Jina AI Reader API for extraction (default: true)
   */
  useJinaAI?: boolean;

  /**
   * Timeout for fetch requests in milliseconds (default: 10000)
   */
  timeout?: number;

  /**
   * Custom headers for the request
   */
  headers?: Record<string, string>;
}

/**
 * Extract content from a URL using Jina AI Reader API
 */
export async function extractArticleContent(
  url: string,
  options: ExtractionOptions = {}
): Promise<ExtractedContent> {
  const { useJinaAI = true, timeout = 10000, headers = {} } = options;

  try {
    // Try Jina AI Reader API first
    if (useJinaAI) {
      const jinaContent = await extractWithJinaAI(url, timeout);
      if (jinaContent) {
        jinaContent.extractionMethod = 'jina-ai';
        return jinaContent;
      }
    }

    // Fallback to basic HTML extraction
    const basicContent = await extractWithBasicFetch(url, timeout, headers);
    basicContent.extractionMethod = 'basic-html';
    return basicContent;
  } catch (error) {
    console.error('Content extraction error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Return minimal data with URL as fallback
    return {
      title: new URL(url).hostname,
      content: '',
      excerpt: 'Failed to extract content from this URL',
      wordCount: 0,
      readingTimeMinutes: 0,
      extractionMethod: 'fallback',
      extractionError: errorMessage
    };
  }
}

/**
 * Extract content using Jina AI Reader API
 * https://jina.ai/reader/
 */
async function extractWithJinaAI(
  url: string,
  timeout: number
): Promise<ExtractedContent | null> {
  try {
    // Jina AI Reader API - prepend r.jina.ai/ to the URL
    const jinaUrl = `https://r.jina.ai/${url}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(jinaUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Return-Format': 'markdown' // Request markdown format
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Jina AI returned status ${response.status} for ${url}`);
      return null;
    }

    const text = await response.text();

    // Parse the markdown response
    const extracted = parseJinaResponse(text, url);

    return extracted;
  } catch (error) {
    console.warn('Jina AI extraction failed:', error);
    return null;
  }
}

/**
 * Parse Jina AI markdown response and extract metadata
 */
function parseJinaResponse(markdown: string, originalUrl: string): ExtractedContent {
  // Jina AI returns markdown with metadata in the format:
  // Title: ...
  // URL Source: ...
  // Markdown Content: ...

  const lines = markdown.split('\n');
  let title = '';
  let author: string | undefined;
  let content = '';
  let excerpt: string | undefined;
  let publishedDate: string | undefined;
  let siteName: string | undefined;
  let imageUrl: string | undefined;

  let inContent = false;
  const contentLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Extract title (usually the first H1 heading)
    if (!title && line.startsWith('# ')) {
      title = line.substring(2).trim();
      continue;
    }

    // Look for metadata patterns (Jina sometimes includes these)
    if (line.toLowerCase().includes('by ') && !author) {
      const byMatch = line.match(/by\s+(.+?)(?:\s+on|\s+\||$)/i);
      if (byMatch) {
        author = byMatch[1].trim();
      }
    }

    // Collect content
    if (line.trim()) {
      contentLines.push(line);
      inContent = true;
    } else if (inContent) {
      contentLines.push('');
    }
  }

  content = contentLines.join('\n').trim();

  // Generate excerpt from first paragraph
  const firstParagraph = content.split('\n\n')[0];
  if (firstParagraph && firstParagraph.length > 20) {
    excerpt = firstParagraph.substring(0, 200).trim();
    if (firstParagraph.length > 200) {
      excerpt += '...';
    }
  }

  // If no title found, use domain name
  if (!title) {
    title = new URL(originalUrl).hostname;
  }

  // Calculate word count and reading time
  const wordCount = countWords(content);
  const readingTimeMinutes = Math.ceil(wordCount / 225); // 225 words per minute

  return {
    title,
    author,
    content,
    excerpt,
    publishedDate,
    siteName,
    imageUrl,
    wordCount,
    readingTimeMinutes
  };
}

/**
 * Fallback: Extract content using basic HTML fetch
 */
async function extractWithBasicFetch(
  url: string,
  timeout: number,
  headers: Record<string, string>
): Promise<ExtractedContent> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SaveToRead/1.0; +https://savetoread.com)',
        ...headers
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Basic extraction from HTML
    return parseBasicHtml(html, url);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Parse basic HTML and extract metadata using regex
 */
function parseBasicHtml(html: string, url: string): ExtractedContent {
  // Extract title
  let title = '';
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    title = decodeHtmlEntities(titleMatch[1].trim());
  }

  // Try Open Graph title
  if (!title) {
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
      title = decodeHtmlEntities(ogTitleMatch[1]);
    }
  }

  // Extract author
  let author: string | undefined;
  const authorMatch = html.match(/<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i);
  if (authorMatch) {
    author = decodeHtmlEntities(authorMatch[1]);
  }

  // Try Open Graph author
  if (!author) {
    const ogAuthorMatch = html.match(/<meta\s+property=["']article:author["']\s+content=["']([^"']+)["']/i);
    if (ogAuthorMatch) {
      author = decodeHtmlEntities(ogAuthorMatch[1]);
    }
  }

  // Extract description/excerpt
  let excerpt: string | undefined;
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (descMatch) {
    excerpt = decodeHtmlEntities(descMatch[1]);
  }

  // Try Open Graph description
  if (!excerpt) {
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (ogDescMatch) {
      excerpt = decodeHtmlEntities(ogDescMatch[1]);
    }
  }

  // Extract image
  let imageUrl: string | undefined;
  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    imageUrl = ogImageMatch[1];
  }

  // Extract published date
  let publishedDate: string | undefined;
  const dateMatch = html.match(/<meta\s+property=["']article:published_time["']\s+content=["']([^"']+)["']/i);
  if (dateMatch) {
    publishedDate = dateMatch[1];
  }

  // Extract site name
  let siteName: string | undefined;
  const siteNameMatch = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
  if (siteNameMatch) {
    siteName = decodeHtmlEntities(siteNameMatch[1]);
  }

  // Extract main content (very basic - just get text between <p> tags)
  const paragraphs: string[] = [];
  const paragraphRegex = /<p[^>]*>([^<]+(?:<[^/][^>]*>[^<]*<\/[^>]+>[^<]*)*)<\/p>/gi;
  let match;

  while ((match = paragraphRegex.exec(html)) !== null) {
    const text = stripHtmlTags(match[1]).trim();
    if (text.length > 20) { // Only include substantial paragraphs
      paragraphs.push(text);
    }
  }

  const content = paragraphs.join('\n\n');

  // Fallback title
  if (!title) {
    title = new URL(url).hostname;
  }

  // Calculate word count and reading time
  const wordCount = countWords(content);
  const readingTimeMinutes = Math.ceil(wordCount / 225);

  return {
    title,
    author,
    content,
    excerpt,
    publishedDate,
    siteName,
    imageUrl,
    wordCount,
    readingTimeMinutes
  };
}

/**
 * Strip HTML tags from text
 */
function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
    '&rsquo;': '\u2019',
    '&lsquo;': '\u2018',
    '&rdquo;': '\u201D',
    '&ldquo;': '\u201C'
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  // Decode numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });

  // Decode hex entities
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return decoded;
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  if (!text) return 0;

  // Remove markdown syntax
  const cleaned = text
    .replace(/[#*_~`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
    .trim();

  if (!cleaned) return 0;

  const words = cleaned.split(/\s+/).filter(word => word.length > 0);
  return words.length;
}
