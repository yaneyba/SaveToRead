/**
 * Articles Routes
 *
 * Handles article CRUD operations, snapshots, and annotations
 */

import { Hono } from 'hono';
import type { Env } from '../types/env';
import type { Article, CreateArticleInput, UpdateArticleInput } from '@savetoread/shared';
import puppeteer from '@cloudflare/puppeteer';
import {
  generatePdfSnapshot,
  generateHtmlSnapshot,
  generateEpubSnapshot,
  generateMarkdownSnapshot,
  generateTextSnapshot,
  type SnapshotOptions
} from '../services/snapshot';
import {
  uploadFileToGoogleDrive,
  uploadFileToDropbox,
  uploadFileToOneDrive
} from '../services/oauth/storage-upload';
import {
  normalizeUrl,
  areDuplicateUrls,
  analyzeContent
} from '../services/content-analysis';
import { extractArticleContent } from '../services/content-extraction';
import { generateFolderPath } from '../utils/folder-path';
import { verifySnapshotIntegrity } from '../utils/integrity-check';

const app = new Hono<{ Bindings: Env; Variables: { userId?: string } }>();

/**
 * List articles with pagination and filters
 */
app.get('/', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '20');
    const search = c.req.query('search');
    const tags = c.req.query('tags')?.split(',').filter(Boolean);
    const isFavorite = c.req.query('isFavorite') === 'true' ? true : undefined;
    const isArchived = c.req.query('isArchived') === 'true' ? true : undefined;

    // Get all article IDs for user
    const articleIdsKey = `user:${userId}:articles`;
    const articleIdsData = await c.env.ARTICLES.get(articleIdsKey);
    const articleIds: string[] = articleIdsData ? JSON.parse(articleIdsData) : [];

    // Fetch all articles
    const articles: Article[] = [];
    for (const articleId of articleIds) {
      const articleData = await c.env.ARTICLES.get(`article:${articleId}`);
      if (articleData) {
        const article: Article = JSON.parse(articleData);

        // Apply filters
        if (search && !article.title?.toLowerCase().includes(search.toLowerCase())) {
          continue;
        }
        if (tags && !tags.some(tag => article.tags.includes(tag))) {
          continue;
        }
        if (isFavorite !== undefined && article.isFavorite !== isFavorite) {
          continue;
        }
        if (isArchived !== undefined && article.isArchived !== isArchived) {
          continue;
        }

        articles.push(article);
      }
    }

    // Sort by createdAt descending
    articles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Paginate
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedArticles = articles.slice(start, end);

    return c.json({
      success: true,
      data: {
        items: paginatedArticles,
        total: articles.length,
        page,
        pageSize,
        hasMore: end < articles.length
      }
    });
  } catch (error) {
    console.error('List articles error:', error);
    return c.json({
      success: false,
      error: { code: 'LIST_ERROR', message: 'Failed to list articles' }
    }, 500);
  }
});

/**
 * Get single article
 */
app.get('/:id', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const articleId = c.req.param('id');
    const articleData = await c.env.ARTICLES.get(`article:${articleId}`);

    if (!articleData) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article not found' }
      }, 404);
    }

    const article: Article = JSON.parse(articleData);

    // Verify ownership
    if (article.userId !== userId) {
      return c.json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      }, 403);
    }

    return c.json({ success: true, data: article });
  } catch (error) {
    console.error('Get article error:', error);
    return c.json({
      success: false,
      error: { code: 'GET_ERROR', message: 'Failed to get article' }
    }, 500);
  }
});

/**
 * Check if URL is a duplicate
 */
app.post('/check-duplicate', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const { url } = await c.req.json<{ url: string }>();

    if (!url) {
      return c.json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'URL is required' }
      }, 400);
    }

    // Check for duplicates
    const articleIdsKey = `user:${userId}:articles`;
    const articleIdsData = await c.env.ARTICLES.get(articleIdsKey);
    const articleIds: string[] = articleIdsData ? JSON.parse(articleIdsData) : [];

    for (const existingId of articleIds) {
      const existingData = await c.env.ARTICLES.get(`article:${existingId}`);
      if (existingData) {
        const existing: Article = JSON.parse(existingData);
        if (areDuplicateUrls(url, existing.url)) {
          return c.json({
            success: true,
            data: {
              isDuplicate: true,
              existingArticle: existing
            }
          });
        }
      }
    }

    return c.json({
      success: true,
      data: {
        isDuplicate: false
      }
    });
  } catch (error) {
    console.error('Check duplicate error:', error);
    return c.json({
      success: false,
      error: { code: 'CHECK_ERROR', message: 'Failed to check for duplicates' }
    }, 500);
  }
});

/**
 * Create new article
 */
app.post('/', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const input: CreateArticleInput = await c.req.json();

    if (!input.url) {
      return c.json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'URL is required' }
      }, 400);
    }

    // Check for duplicates
    const articleIdsKey = `user:${userId}:articles`;
    const articleIdsData = await c.env.ARTICLES.get(articleIdsKey);
    const articleIds: string[] = articleIdsData ? JSON.parse(articleIdsData) : [];

    let duplicateArticle: Article | null = null;
    for (const existingId of articleIds) {
      const existingData = await c.env.ARTICLES.get(`article:${existingId}`);
      if (existingData) {
        const existing: Article = JSON.parse(existingData);
        if (areDuplicateUrls(input.url, existing.url)) {
          duplicateArticle = existing;
          break;
        }
      }
    }

    // If duplicate found, return it with a warning
    if (duplicateArticle) {
      return c.json({
        success: false,
        error: {
          code: 'DUPLICATE_ARTICLE',
          message: 'This article has already been saved',
          details: { existingArticle: duplicateArticle }
        }
      }, 409); // 409 Conflict
    }

    // Extract article content from URL
    let extractedContent;
    try {
      extractedContent = await extractArticleContent(input.url, {
        useJinaAI: true,
        timeout: 15000 // Increased timeout for better reliability
      });

      // Log extraction method for debugging
      console.log(`Article extracted using ${extractedContent.extractionMethod} for ${input.url}`);

      if (extractedContent.extractionError) {
        console.warn(`Extraction error: ${extractedContent.extractionError}`);
      }
    } catch (error) {
      console.error('Content extraction failed:', error);
      // Use fallback data
      extractedContent = {
        title: new URL(input.url).hostname,
        content: '',
        excerpt: 'Failed to extract content',
        wordCount: 0,
        readingTimeMinutes: 0,
        extractionMethod: 'fallback',
        extractionError: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    const articleId = crypto.randomUUID();

    const article: Article = {
      id: articleId,
      userId,
      url: input.url,
      title: extractedContent.title,
      author: extractedContent.author,
      content: extractedContent.content,
      excerpt: extractedContent.excerpt,
      imageUrl: extractedContent.imageUrl,
      publishedDate: extractedContent.publishedDate,
      tags: input.tags || [],
      isFavorite: false,
      isArchived: false,
      readProgress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: extractedContent.wordCount,
      readingTimeMinutes: extractedContent.readingTimeMinutes
    };

    // Store article
    await c.env.ARTICLES.put(`article:${articleId}`, JSON.stringify(article));

    // Update user's article list (reuse articleIds from duplicate check above)
    articleIds.push(articleId);
    await c.env.ARTICLES.put(articleIdsKey, JSON.stringify(articleIds));

    // Check if automatic snapshot generation is enabled
    const settingsKey = `user:${userId}:settings`;
    const settingsData = await c.env.USERS.get(settingsKey);

    if (settingsData) {
      const settings = JSON.parse(settingsData);

      if (settings.snapshot?.autoGenerate) {
        // Trigger snapshot generation asynchronously
        // Don't wait for it to complete, return the article immediately
        c.executionCtx.waitUntil(
          generateAutomaticSnapshot(
            c.env,
            article,
            userId,
            settings.snapshot
          )
        );
      }
    }

    return c.json({ success: true, data: article }, 201);
  } catch (error) {
    console.error('Create article error:', error);
    return c.json({
      success: false,
      error: { code: 'CREATE_ERROR', message: 'Failed to create article' }
    }, 500);
  }
});

/**
 * Update article
 */
app.put('/:id', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const articleId = c.req.param('id');
    const updates: UpdateArticleInput = await c.req.json();

    const articleData = await c.env.ARTICLES.get(`article:${articleId}`);
    if (!articleData) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article not found' }
      }, 404);
    }

    const article: Article = JSON.parse(articleData);

    // Verify ownership
    if (article.userId !== userId) {
      return c.json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      }, 403);
    }

    // Update article
    const updatedArticle: Article = {
      ...article,
      ...updates,
      id: article.id,
      userId: article.userId,
      url: article.url,
      createdAt: article.createdAt,
      updatedAt: new Date().toISOString()
    };

    await c.env.ARTICLES.put(`article:${articleId}`, JSON.stringify(updatedArticle));

    return c.json({ success: true, data: updatedArticle });
  } catch (error) {
    console.error('Update article error:', error);
    return c.json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to update article' }
    }, 500);
  }
});

/**
 * Delete article
 */
app.delete('/:id', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const articleId = c.req.param('id');
    const articleData = await c.env.ARTICLES.get(`article:${articleId}`);

    if (!articleData) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article not found' }
      }, 404);
    }

    const article: Article = JSON.parse(articleData);

    // Verify ownership
    if (article.userId !== userId) {
      return c.json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      }, 403);
    }

    // Delete article
    await c.env.ARTICLES.delete(`article:${articleId}`);

    // Update user's article list
    const articleIdsKey = `user:${userId}:articles`;
    const articleIdsData = await c.env.ARTICLES.get(articleIdsKey);
    if (articleIdsData) {
      const articleIds: string[] = JSON.parse(articleIdsData);
      const updated = articleIds.filter(id => id !== articleId);
      await c.env.ARTICLES.put(articleIdsKey, JSON.stringify(updated));
    }

    return c.json({ success: true, data: undefined });
  } catch (error) {
    console.error('Delete article error:', error);
    return c.json({
      success: false,
      error: { code: 'DELETE_ERROR', message: 'Failed to delete article' }
    }, 500);
  }
});

/**
 * Generate snapshot (PDF, HTML, EPUB, Markdown, or Text)
 */
app.post('/:id/snapshot', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const articleId = c.req.param('id');
    const { format, styling, uploadToCloud = true } = await c.req.json<{
      format: 'pdf' | 'html' | 'epub' | 'markdown' | 'text';
      styling?: SnapshotOptions['styling'];
      uploadToCloud?: boolean;
    }>();

    // Get the article
    const articleData = await c.env.ARTICLES.get(`article:${articleId}`);
    if (!articleData) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article not found' }
      }, 404);
    }

    const article: Article = JSON.parse(articleData);

    // Verify ownership
    if (article.userId !== userId) {
      return c.json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      }, 403);
    }

    // Launch browser for PDF/HTML generation
    let snapshotResult;
    let browser;

    try {
      if (format === 'pdf' || format === 'html') {
        browser = await puppeteer.launch(c.env.BROWSER);
      }

      // Generate snapshot based on format
      switch (format) {
        case 'pdf':
          if (!browser) throw new Error('Browser not initialized');
          snapshotResult = await generatePdfSnapshot(
            article.url,
            article.title || 'Untitled',
            browser,
            styling
          );
          break;

        case 'html':
          if (!browser) throw new Error('Browser not initialized');
          snapshotResult = await generateHtmlSnapshot(
            article.url,
            article.title || 'Untitled',
            browser,
            { embedAssets: true, includeStyles: true }
          );
          break;

        case 'epub':
          snapshotResult = await generateEpubSnapshot(
            article.url,
            article.title || 'Untitled',
            article.author,
            article.content || ''
          );
          break;

        case 'markdown':
          snapshotResult = await generateMarkdownSnapshot(
            article.url,
            article.title || 'Untitled',
            article.author,
            article.content || '',
            article.tags
          );
          break;

        case 'text':
          snapshotResult = await generateTextSnapshot(
            article.url,
            article.title || 'Untitled',
            article.content || ''
          );
          break;

        default:
          return c.json({
            success: false,
            error: { code: 'INVALID_FORMAT', message: 'Unsupported snapshot format' }
          }, 400);
      }

      // Upload to cloud storage if requested
      let cloudUrl: string | undefined;
      if (uploadToCloud) {
        // Get user's active storage connection
        const connectionsKey = `user:${userId}:storage:connections`;
        const connectionsData = await c.env.USERS.get(connectionsKey);

        if (connectionsData) {
          const connections = JSON.parse(connectionsData);
          const activeConnection = connections.find((conn: any) => conn.isActive);

          if (activeConnection) {
            // Get OAuth tokens
            const tokensKey = `connection:${activeConnection.id}:tokens`;
            const encryptedTokens = await c.env.OAUTH_TOKENS.get(tokensKey);

            if (encryptedTokens) {
              // Decrypt tokens (implementation in oauth service)
              const tokens = JSON.parse(encryptedTokens); // Simplified - should decrypt

              // Import upload function
              const { uploadToCloudStorage } = await import('../services/oauth/storage-upload');

              // Upload to cloud
              const uploadResult = await uploadToCloudStorage(
                activeConnection.provider,
                tokens.access_token,
                snapshotResult.filename,
                snapshotResult.mimeType,
                snapshotResult.content,
                '/SaveToRead/snapshots'
              );

              cloudUrl = uploadResult.webViewLink || uploadResult.downloadUrl;

              // Update article with snapshot URL
              const updatedArticle: Article = {
                ...article,
                ...(format === 'pdf' && { snapshotPdfUrl: cloudUrl }),
                ...(format === 'html' && { snapshotHtmlUrl: cloudUrl }),
                storageProvider: activeConnection.provider,
                updatedAt: new Date().toISOString()
              };

              await c.env.ARTICLES.put(`article:${articleId}`, JSON.stringify(updatedArticle));
            }
          }
        }
      }

      return c.json({
        success: true,
        data: {
          format,
          filename: snapshotResult.filename,
          size: snapshotResult.size,
          mimeType: snapshotResult.mimeType,
          cloudUrl,
          uploadedToCloud: !!cloudUrl
        }
      });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  } catch (error) {
    console.error('Generate snapshot error:', error);
    return c.json({
      success: false,
      error: {
        code: 'SNAPSHOT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate snapshot'
      }
    }, 500);
  }
});

/**
 * Generate snapshot preview (temporary, expires in 1 hour)
 */
app.post('/:id/snapshot/preview', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const articleId = c.req.param('id');
    const { format = 'pdf' } = await c.req.json<{ format?: 'pdf' | 'html' }>();

    // Get article
    const articleData = await c.env.ARTICLES.get(`article:${articleId}`);
    if (!articleData) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article not found' }
      }, 404);
    }

    const article: Article = JSON.parse(articleData);

    // Verify ownership
    if (article.userId !== userId) {
      return c.json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      }, 403);
    }

    // Get user settings for styling
    const settingsKey = `user:${userId}:settings`;
    const settingsData = await c.env.USERS.get(settingsKey);
    const settings = settingsData ? JSON.parse(settingsData) : null;

    // Generate snapshot
    const browser = await puppeteer.launch(c.env.BROWSER);

    try {
      let snapshotResult;

      if (format === 'pdf') {
        snapshotResult = await generatePdfSnapshot(
          article.url,
          article.title || 'Untitled',
          browser,
          settings?.snapshot?.customStyling
        );
      } else {
        snapshotResult = await generateHtmlSnapshot(
          article.url,
          article.title || 'Untitled',
          browser,
          {
            embedAssets: settings?.snapshot?.embedAssets ?? true,
            includeStyles: true
          }
        );
      }

      // Generate preview ID
      const previewId = crypto.randomUUID();

      // Store preview temporarily in KV with 1 hour expiration
      await c.env.ARTICLES.put(
        `preview:${previewId}`,
        typeof snapshotResult.content === 'string'
          ? snapshotResult.content
          : btoa(String.fromCharCode(...snapshotResult.content)),
        { expirationTtl: 3600 } // 1 hour
      );

      // Generate preview URL
      const previewUrl = `/api/articles/preview/${previewId}`;
      const expiresAt = new Date(Date.now() + 3600000).toISOString();

      return c.json({
        success: true,
        data: {
          articleId,
          format,
          previewUrl,
          previewId,
          expiresAt,
          size: snapshotResult.size,
          filename: snapshotResult.filename
        }
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Generate preview error:', error);
    return c.json({
      success: false,
      error: {
        code: 'PREVIEW_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate preview'
      }
    }, 500);
  }
});

/**
 * Get snapshot preview content
 */
app.get('/preview/:previewId', async (c) => {
  try {
    const previewId = c.req.param('previewId');

    const previewData = await c.env.ARTICLES.get(`preview:${previewId}`);

    if (!previewData) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Preview not found or expired' }
      }, 404);
    }

    // Determine content type from preview data
    const isPdf = previewData.startsWith('%PDF');
    const contentType = isPdf ? 'application/pdf' : 'text/html';

    // Return raw content
    return new Response(previewData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Get preview error:', error);
    return c.json({
      success: false,
      error: { code: 'PREVIEW_ERROR', message: 'Failed to get preview' }
    }, 500);
  }
});

/**
 * Batch snapshot generation
 */
app.post('/batch/snapshot', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const { articleIds, format, styling } = await c.req.json<{
      articleIds: string[];
      format: 'pdf' | 'html' | 'epub' | 'markdown' | 'text';
      styling?: SnapshotOptions['styling'];
    }>();

    if (!articleIds || articleIds.length === 0) {
      return c.json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Article IDs are required' }
      }, 400);
    }

    // Limit batch size to prevent abuse
    const maxBatchSize = 50;
    if (articleIds.length > maxBatchSize) {
      return c.json({
        success: false,
        error: { code: 'BATCH_TOO_LARGE', message: `Maximum batch size is ${maxBatchSize} articles` }
      }, 400);
    }

    // Trigger batch snapshot generation asynchronously
    c.executionCtx.waitUntil(
      processBatchSnapshots(c.env, userId, articleIds, format, styling)
    );

    return c.json({
      success: true,
      data: {
        message: `Batch snapshot generation started for ${articleIds.length} articles`,
        articleIds,
        format
      }
    });
  } catch (error) {
    console.error('Batch snapshot error:', error);
    return c.json({
      success: false,
      error: { code: 'BATCH_ERROR', message: 'Failed to initiate batch snapshot generation' }
    }, 500);
  }
});

/**
 * Bulk operations (delete, re-tag, archive)
 */
app.post('/batch/operations', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const { articleIds, operation, params } = await c.req.json<{
      articleIds: string[];
      operation: 'delete' | 'retag' | 'archive' | 'unarchive' | 'favorite' | 'unfavorite' | 're-snapshot';
      params?: any;
    }>();

    if (!articleIds || articleIds.length === 0) {
      return c.json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Article IDs are required' }
      }, 400);
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const articleId of articleIds) {
      try {
        const articleData = await c.env.ARTICLES.get(`article:${articleId}`);
        if (!articleData) {
          results.failed++;
          results.errors.push(`Article ${articleId} not found`);
          continue;
        }

        const article: Article = JSON.parse(articleData);

        // Verify ownership
        if (article.userId !== userId) {
          results.failed++;
          results.errors.push(`Access denied to article ${articleId}`);
          continue;
        }

        switch (operation) {
          case 'delete':
            await c.env.ARTICLES.delete(`article:${articleId}`);
            // Remove from user's article list
            const articleIdsKey = `user:${userId}:articles`;
            const articleIdsData = await c.env.ARTICLES.get(articleIdsKey);
            if (articleIdsData) {
              const ids: string[] = JSON.parse(articleIdsData);
              const updated = ids.filter(id => id !== articleId);
              await c.env.ARTICLES.put(articleIdsKey, JSON.stringify(updated));
            }
            break;

          case 'retag':
            if (params?.tags) {
              article.tags = params.additive ? [...new Set([...article.tags, ...params.tags])] : params.tags;
              article.updatedAt = new Date().toISOString();
              await c.env.ARTICLES.put(`article:${articleId}`, JSON.stringify(article));
            }
            break;

          case 'archive':
            article.isArchived = true;
            article.updatedAt = new Date().toISOString();
            await c.env.ARTICLES.put(`article:${articleId}`, JSON.stringify(article));
            break;

          case 'unarchive':
            article.isArchived = false;
            article.updatedAt = new Date().toISOString();
            await c.env.ARTICLES.put(`article:${articleId}`, JSON.stringify(article));
            break;

          case 'favorite':
            article.isFavorite = true;
            article.updatedAt = new Date().toISOString();
            await c.env.ARTICLES.put(`article:${articleId}`, JSON.stringify(article));
            break;

          case 'unfavorite':
            article.isFavorite = false;
            article.updatedAt = new Date().toISOString();
            await c.env.ARTICLES.put(`article:${articleId}`, JSON.stringify(article));
            break;

          case 're-snapshot':
            c.executionCtx.waitUntil(
              processBatchSnapshots(
                c.env,
                userId,
                [articleId],
                params?.format || 'pdf',
                params?.styling
              )
            );
            break;
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing article ${articleId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return c.json({
      success: true,
      data: {
        operation,
        totalArticles: articleIds.length,
        successful: results.success,
        failed: results.failed,
        errors: results.errors
      }
    });
  } catch (error) {
    console.error('Bulk operations error:', error);
    return c.json({
      success: false,
      error: { code: 'BULK_ERROR', message: 'Failed to perform bulk operation' }
    }, 500);
  }
});

/**
 * Helper function for batch snapshot processing
 */
async function processBatchSnapshots(
  env: Env,
  userId: string,
  articleIds: string[],
  format: 'pdf' | 'html' | 'epub' | 'markdown' | 'text',
  styling?: SnapshotOptions['styling']
): Promise<void> {
  const browser = format === 'pdf' || format === 'html' ? await puppeteer.launch(env.BROWSER) : null;

  // Get user settings for folder structure
  const settingsKey = `user:${userId}:settings`;
  const settingsData = await env.USERS.get(settingsKey);
  const settings = settingsData ? JSON.parse(settingsData) : null;

  try {
    for (const articleId of articleIds) {
      try {
        const articleData = await env.ARTICLES.get(`article:${articleId}`);
        if (!articleData) continue;

        const article: Article = JSON.parse(articleData);
        if (article.userId !== userId) continue;

        // Generate folder path based on user preferences
        const folderPath = generateFolderPath(
          {
            title: article.title || 'Untitled',
            url: article.url,
            tags: article.tags,
            createdAt: article.createdAt
          },
          settings?.snapshot?.folderStructure
        );

        let snapshotResult;

        switch (format) {
          case 'pdf':
            if (!browser) continue;
            snapshotResult = await generatePdfSnapshot(
              article.url,
              article.title || 'Untitled',
              browser,
              styling || settings?.snapshot?.customStyling
            );
            break;

          case 'html':
            if (!browser) continue;
            snapshotResult = await generateHtmlSnapshot(
              article.url,
              article.title || 'Untitled',
              browser,
              {
                embedAssets: settings?.snapshot?.embedAssets ?? true,
                includeStyles: true
              }
            );
            break;

          case 'epub':
            snapshotResult = await generateEpubSnapshot(
              article.url,
              article.title || 'Untitled',
              article.author,
              article.content || ''
            );
            break;

          case 'markdown':
            snapshotResult = await generateMarkdownSnapshot(
              article.url,
              article.title || 'Untitled',
              article.author,
              article.content || '',
              article.tags
            );
            break;

          case 'text':
            snapshotResult = await generateTextSnapshot(
              article.url,
              article.title || 'Untitled',
              article.content || ''
            );
            break;
        }

        if (snapshotResult) {
          // Upload to cloud
          const connectionsKey = `user:${userId}:storage:connections`;
          const connectionsData = await env.USERS.get(connectionsKey);

          if (connectionsData) {
            const connections = JSON.parse(connectionsData);
            const activeConnection = connections.find((conn: any) => conn.isActive);

            if (activeConnection) {
              const tokensKey = `connection:${activeConnection.id}:tokens`;
              const encryptedTokens = await env.OAUTH_TOKENS.get(tokensKey);

              if (encryptedTokens) {
                const tokens = JSON.parse(encryptedTokens);
                const { uploadToCloudStorage } = await import('../services/oauth/storage-upload');

                const uploadResult = await uploadToCloudStorage(
                  activeConnection.provider,
                  tokens.access_token,
                  snapshotResult.filename,
                  snapshotResult.mimeType,
                  snapshotResult.content,
                  folderPath // Use dynamic folder path
                );

                // Update article
                const updatedArticle: Article = {
                  ...article,
                  ...(format === 'pdf' && { snapshotPdfUrl: uploadResult.webViewLink }),
                  ...(format === 'html' && { snapshotHtmlUrl: uploadResult.webViewLink }),
                  storageProvider: activeConnection.provider,
                  updatedAt: new Date().toISOString()
                };

                await env.ARTICLES.put(`article:${articleId}`, JSON.stringify(updatedArticle));
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error processing snapshot for article ${articleId}:`, error);
        // Continue with next article
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Helper function to generate snapshots automatically
 */
async function generateAutomaticSnapshot(
  env: Env,
  article: Article,
  userId: string,
  snapshotSettings: any
): Promise<void> {
  try {
    const formats: ('pdf' | 'html')[] =
      snapshotSettings.defaultFormat === 'both'
        ? ['pdf', 'html']
        : [snapshotSettings.defaultFormat];

    // Generate folder path based on user preferences
    const folderPath = generateFolderPath(
      {
        title: article.title || 'Untitled',
        url: article.url,
        tags: article.tags,
        createdAt: article.createdAt
      },
      snapshotSettings.folderStructure
    );

    // Launch browser once for both formats if needed
    const browser = await puppeteer.launch(env.BROWSER);

    try {
      for (const format of formats) {
        let snapshotResult;

        if (format === 'pdf') {
          snapshotResult = await generatePdfSnapshot(
            article.url,
            article.title || 'Untitled',
            browser,
            snapshotSettings.customStyling
          );
        } else {
          snapshotResult = await generateHtmlSnapshot(
            article.url,
            article.title || 'Untitled',
            browser,
            {
              embedAssets: snapshotSettings.embedAssets,
              includeStyles: true
            }
          );
        }

        // Upload to cloud if enabled
        if (snapshotSettings.uploadToCloud) {
          const connectionsKey = `user:${userId}:storage:connections`;
          const connectionsData = await env.USERS.get(connectionsKey);

          if (connectionsData) {
            const connections = JSON.parse(connectionsData);
            const activeConnection = connections.find((conn: any) => conn.isActive);

            if (activeConnection) {
              const tokensKey = `connection:${activeConnection.id}:tokens`;
              const encryptedTokens = await env.OAUTH_TOKENS.get(tokensKey);

              if (encryptedTokens) {
                const tokens = JSON.parse(encryptedTokens);
                const { uploadToCloudStorage } = await import('../services/oauth/storage-upload');

                // Upload to dynamically generated folder path
                const uploadResult = await uploadToCloudStorage(
                  activeConnection.provider,
                  tokens.access_token,
                  snapshotResult.filename,
                  snapshotResult.mimeType,
                  snapshotResult.content,
                  folderPath // Use dynamic folder path
                );

                // Verify integrity if enabled
                let integrityCheck;
                if (snapshotSettings.verifyIntegrity && uploadResult.webViewLink) {
                  integrityCheck = await verifySnapshotIntegrity(
                    article.id,
                    uploadResult.webViewLink,
                    snapshotResult.content,
                    snapshotResult.size
                  );

                  // Log integrity check result
                  console.log(`Integrity check for ${article.id} (${format}):`, integrityCheck.isValid ? 'PASSED' : 'FAILED');

                  // Store integrity check result
                  if (integrityCheck) {
                    await env.ARTICLES.put(
                      `integrity:${article.id}:${format}`,
                      JSON.stringify(integrityCheck)
                    );
                  }
                }

                // Update article with snapshot URL
                const articleData = await env.ARTICLES.get(`article:${article.id}`);
                if (articleData) {
                  const currentArticle: Article = JSON.parse(articleData);
                  const updatedArticle: Article = {
                    ...currentArticle,
                    ...(format === 'pdf' && { snapshotPdfUrl: uploadResult.webViewLink }),
                    ...(format === 'html' && { snapshotHtmlUrl: uploadResult.webViewLink }),
                    storageProvider: activeConnection.provider,
                    updatedAt: new Date().toISOString()
                  };

                  await env.ARTICLES.put(`article:${article.id}`, JSON.stringify(updatedArticle));
                }
              }
            }
          }
        }
      }
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Automatic snapshot generation error:', error);
    // Silently fail - don't block article creation
  }
}

export { app as articleRoutes };
