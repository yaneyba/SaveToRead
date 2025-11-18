/**
 * Snapshot Generation Service
 *
 * Handles creation of PDF and HTML snapshots with various styling options
 */

import type { Browser } from '@cloudflare/puppeteer';

export interface SnapshotOptions {
  format: 'pdf' | 'html' | 'epub' | 'markdown' | 'text';
  styling?: {
    fontSize?: string;
    fontFamily?: string;
    lineHeight?: number;
    maxWidth?: string;
    theme?: 'light' | 'dark' | 'sepia';
  };
  includeImages?: boolean;
  includeStyles?: boolean;
  embedAssets?: boolean;
}

export interface SnapshotResult {
  content: Uint8Array | string;
  mimeType: string;
  filename: string;
  size: number;
}

/**
 * Generate PDF snapshot using Cloudflare Browser Rendering
 */
export async function generatePdfSnapshot(
  url: string,
  title: string,
  browser: Browser,
  options: SnapshotOptions['styling'] = {}
): Promise<SnapshotResult> {
  const page = await browser.newPage();

  try {
    // Navigate to the article URL
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Apply custom styling if provided
    if (options) {
      await page.addStyleTag({
        content: `
          * {
            ${options.fontSize ? `font-size: ${options.fontSize} !important;` : ''}
            ${options.fontFamily ? `font-family: ${options.fontFamily} !important;` : ''}
            ${options.lineHeight ? `line-height: ${options.lineHeight} !important;` : ''}
          }
          body {
            ${options.maxWidth ? `max-width: ${options.maxWidth};` : 'max-width: 800px;'}
            margin: 0 auto;
            padding: 2rem;
            ${options.theme === 'dark' ? 'background: #1a1a1a; color: #e0e0e0;' : ''}
            ${options.theme === 'sepia' ? 'background: #f4ecd8; color: #5c4a2f;' : ''}
          }
          /* Hide navigation, ads, and other clutter */
          nav, .navigation, .navbar, .header-nav,
          aside, .sidebar, .ad, .advertisement,
          .social-share, .comments, footer { display: none !important; }

          /* Clean up the content area */
          article, .article, .content, main {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        `
      });
    }

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; padding: 5px; width: 100%; text-align: center;">
          ${title}
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; padding: 5px; width: 100%; text-align: center;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `
    });

    const filename = `${sanitizeFilename(title)}.pdf`;

    return {
      content: new Uint8Array(pdfBuffer),
      mimeType: 'application/pdf',
      filename,
      size: pdfBuffer.byteLength
    };
  } finally {
    await page.close();
  }
}

/**
 * Generate archive-quality HTML snapshot with embedded assets
 */
export async function generateHtmlSnapshot(
  url: string,
  title: string,
  browser: Browser,
  options: { embedAssets?: boolean; includeStyles?: boolean } = {}
): Promise<SnapshotResult> {
  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    let html: string;

    if (options.embedAssets) {
      // Get full HTML with embedded images as base64
      html = await page.evaluate(() => {
        // Clone the document
        const clone = document.cloneNode(true) as Document;

        // Remove scripts and unwanted elements
        const unwantedSelectors = [
          'script', 'noscript', 'iframe',
          'nav', '.navigation', '.navbar', '.header-nav',
          'aside', '.sidebar', '.ad', '.advertisement',
          '.social-share', '.comments', 'footer'
        ];

        unwantedSelectors.forEach(selector => {
          clone.querySelectorAll(selector).forEach(el => el.remove());
        });

        // Convert images to base64
        const images = clone.querySelectorAll('img') as NodeListOf<HTMLImageElement>;
        const promises: Promise<void>[] = [];

        images.forEach(img => {
          if (img.src && img.src.startsWith('http')) {
            promises.push(
              fetch(img.src)
                .then(res => res.blob())
                .then(blob => {
                  return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                  });
                })
                .then(base64 => {
                  img.src = base64;
                })
                .catch(() => {
                  // If image fails to load, remove it
                  img.remove();
                })
            );
          }
        });

        return Promise.all(promises).then(() => {
          return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="SaveToRead">
  <meta name="saved-from" content="${window.location.href}">
  <meta name="saved-date" content="${new Date().toISOString()}">
  <title>${clone.querySelector('title')?.textContent || 'Saved Article'}</title>
  <style>
    body {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    pre {
      background: #f5f5f5;
      padding: 1rem;
      overflow-x: auto;
    }
    code {
      background: #f5f5f5;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
    }
    .savetoread-metadata {
      border-top: 2px solid #eee;
      margin-top: 3rem;
      padding-top: 1rem;
      font-size: 0.9rem;
      color: #666;
    }
  </style>
</head>
${clone.documentElement.outerHTML}
</html>`;
        });
      });
    } else {
      // Simple HTML snapshot without embedded assets
      html = await page.content();

      // Clean up the HTML
      html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    }

    // Add metadata footer
    html = html.replace('</body>', `
      <div class="savetoread-metadata">
        <p><strong>Saved from:</strong> <a href="${url}">${url}</a></p>
        <p><strong>Saved on:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Saved with:</strong> SaveToRead</p>
      </div>
      </body>
    `);

    const filename = `${sanitizeFilename(title)}.html`;
    const encoder = new TextEncoder();
    const content = encoder.encode(html);

    return {
      content: html,
      mimeType: 'text/html',
      filename,
      size: content.length
    };
  } finally {
    await page.close();
  }
}

/**
 * Generate EPUB snapshot for e-readers
 */
export async function generateEpubSnapshot(
  url: string,
  title: string,
  author: string | undefined,
  content: string
): Promise<SnapshotResult> {
  // EPUB is essentially a ZIP file with specific structure
  // For now, this is a simplified implementation
  // A full implementation would use a library like epub-gen

  const opfContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">${crypto.randomUUID()}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>en</dc:language>
    ${author ? `<dc:creator>${escapeXml(author)}</dc:creator>` : ''}
    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0]}Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="content"/>
  </spine>
</package>`;

  const contentXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>${escapeXml(title)}</title>
  <style>
    body { font-family: serif; line-height: 1.6; }
    h1, h2, h3 { font-weight: bold; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  <h1>${escapeXml(title)}</h1>
  ${content}
</body>
</html>`;

  // For now, return the XHTML content
  // A full implementation would create a proper EPUB ZIP structure
  const filename = `${sanitizeFilename(title)}.epub`;
  const encoder = new TextEncoder();
  const encodedContent = encoder.encode(contentXhtml);

  return {
    content: contentXhtml,
    mimeType: 'application/epub+zip',
    filename,
    size: encodedContent.length
  };
}

/**
 * Generate Markdown snapshot with frontmatter
 */
export async function generateMarkdownSnapshot(
  url: string,
  title: string,
  author: string | undefined,
  content: string,
  tags: string[] = []
): Promise<SnapshotResult> {
  const frontmatter = `---
title: ${title}
author: ${author || 'Unknown'}
source: ${url}
saved: ${new Date().toISOString()}
tags: [${tags.join(', ')}]
---

`;

  // Convert HTML content to Markdown (simplified)
  // In a real implementation, use a library like turndown
  let markdown = content
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
    .replace(/<[^>]+>/g, ''); // Remove remaining HTML tags

  const fullMarkdown = frontmatter + markdown;
  const filename = `${sanitizeFilename(title)}.md`;
  const encoder = new TextEncoder();
  const content_encoded = encoder.encode(fullMarkdown);

  return {
    content: fullMarkdown,
    mimeType: 'text/markdown',
    filename,
    size: content_encoded.length
  };
}

/**
 * Extract plain text from HTML content
 */
export async function generateTextSnapshot(
  url: string,
  title: string,
  content: string
): Promise<SnapshotResult> {
  const text = `${title}\n${'='.repeat(title.length)}\n\nSource: ${url}\nSaved: ${new Date().toLocaleString()}\n\n${content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim()}`;

  const filename = `${sanitizeFilename(title)}.txt`;
  const encoder = new TextEncoder();
  const content_encoded = encoder.encode(text);

  return {
    content: text,
    mimeType: 'text/plain',
    filename,
    size: content_encoded.length
  };
}

/**
 * Sanitize filename to remove invalid characters
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9\s\-_]/gi, '')
    .replace(/\s+/g, '-')
    .substring(0, 100)
    .toLowerCase();
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
