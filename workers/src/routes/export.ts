/**
 * Export & Import Routes
 *
 * Handles data portability, export, and import operations
 */

import { Hono } from 'hono';
import type { Env } from '../types/env';
import type { Article, User, StorageConnection, UserSettings } from '@savetoread/shared';

const app = new Hono<{ Bindings: Env; Variables: { userId?: string } }>();

/**
 * Export all articles and metadata to JSON
 */
app.get('/all', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    // Get all articles
    const articleIdsKey = `user:${userId}:articles`;
    const articleIdsData = await c.env.ARTICLES.get(articleIdsKey);
    const articleIds: string[] = articleIdsData ? JSON.parse(articleIdsData) : [];

    const articles: Article[] = [];
    for (const articleId of articleIds) {
      const articleData = await c.env.ARTICLES.get(`article:${articleId}`);
      if (articleData) {
        articles.push(JSON.parse(articleData));
      }
    }

    // Get user info
    const userData = await c.env.USERS.get(`user:${userId}`);
    const user: User | null = userData ? JSON.parse(userData) : null;

    // Get settings
    const settingsData = await c.env.USERS.get(`user:${userId}:settings`);
    const settings: UserSettings | null = settingsData ? JSON.parse(settingsData) : null;

    // Get storage connections (without tokens for security)
    const connectionsData = await c.env.USERS.get(`user:${userId}:storage:connections`);
    const connections: StorageConnection[] = connectionsData ? JSON.parse(connectionsData) : [];

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      user,
      settings,
      storageConnections: connections.map(conn => ({
        ...conn,
        // Exclude sensitive data
        id: undefined,
        userId: undefined
      })),
      articles,
      metadata: {
        totalArticles: articles.length,
        archivedArticles: articles.filter(a => a.isArchived).length,
        favoriteArticles: articles.filter(a => a.isFavorite).length,
        tags: [...new Set(articles.flatMap(a => a.tags))]
      }
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="savetoread-export-${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return c.json({
      success: false,
      error: { code: 'EXPORT_ERROR', message: 'Failed to export data' }
    }, 500);
  }
});

/**
 * Export articles metadata to CSV
 */
app.get('/csv', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const articleIdsKey = `user:${userId}:articles`;
    const articleIdsData = await c.env.ARTICLES.get(articleIdsKey);
    const articleIds: string[] = articleIdsData ? JSON.parse(articleIdsData) : [];

    const articles: Article[] = [];
    for (const articleId of articleIds) {
      const articleData = await c.env.ARTICLES.get(`article:${articleId}`);
      if (articleData) {
        articles.push(JSON.parse(articleData));
      }
    }

    // CSV headers
    const headers = ['ID', 'Title', 'URL', 'Author', 'Tags', 'Favorite', 'Archived', 'Read Progress', 'Created At', 'Updated At', 'PDF URL', 'HTML URL'];
    const csvRows = [headers.join(',')];

    // CSV data rows
    for (const article of articles) {
      const row = [
        article.id,
        `"${(article.title || '').replace(/"/g, '""')}"`,
        `"${article.url}"`,
        `"${(article.author || '').replace(/"/g, '""')}"`,
        `"${article.tags.join(';')}"`,
        article.isFavorite ? 'Yes' : 'No',
        article.isArchived ? 'Yes' : 'No',
        article.readProgress,
        article.createdAt,
        article.updatedAt,
        article.snapshotPdfUrl || '',
        article.snapshotHtmlUrl || ''
      ];
      csvRows.push(row.join(','));
    }

    const csv = csvRows.join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="savetoread-articles-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return c.json({
      success: false,
      error: { code: 'CSV_ERROR', message: 'Failed to export CSV' }
    }, 500);
  }
});

/**
 * Import from Pocket
 */
app.post('/import/pocket', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const { data } = await c.req.json<{ data: any[] }>();

    if (!Array.isArray(data)) {
      return c.json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Invalid import data format' }
      }, 400);
    }

    const imported = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const item of data) {
      try {
        // Pocket export format
        const articleId = crypto.randomUUID();
        const article: Article = {
          id: articleId,
          userId,
          url: item.resolved_url || item.given_url,
          title: item.resolved_title || item.given_title || 'Untitled',
          excerpt: item.excerpt,
          tags: item.tags ? Object.keys(item.tags) : [],
          isFavorite: item.favorite === '1',
          isArchived: item.status === '1',
          readProgress: item.status === '1' ? 100 : 0,
          createdAt: new Date(parseInt(item.time_added) * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        };

        await c.env.ARTICLES.put(`article:${articleId}`, JSON.stringify(article));

        // Update user's article list
        const articleIdsKey = `user:${userId}:articles`;
        const articleIdsData = await c.env.ARTICLES.get(articleIdsKey);
        const articleIds: string[] = articleIdsData ? JSON.parse(articleIdsData) : [];
        articleIds.push(articleId);
        await c.env.ARTICLES.put(articleIdsKey, JSON.stringify(articleIds));

        imported.success++;
      } catch (error) {
        imported.failed++;
        imported.errors.push(`Failed to import article: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return c.json({
      success: true,
      data: {
        totalItems: data.length,
        imported: imported.success,
        failed: imported.failed,
        errors: imported.errors
      }
    });
  } catch (error) {
    console.error('Pocket import error:', error);
    return c.json({
      success: false,
      error: { code: 'IMPORT_ERROR', message: 'Failed to import from Pocket' }
    }, 500);
  }
});

/**
 * Import from Instapaper
 */
app.post('/import/instapaper', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const { csvData } = await c.req.json<{ csvData: string }>();

    if (!csvData) {
      return c.json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'CSV data is required' }
      }, 400);
    }

    // Parse CSV
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1);

    const imported = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const line of data) {
      if (!line.trim()) continue;

      try {
        const values = line.split(',');
        const articleId = crypto.randomUUID();

        // Instapaper CSV format: URL, Title, Selection, Folder
        const article: Article = {
          id: articleId,
          userId,
          url: values[0]?.replace(/^"|"$/g, ''),
          title: values[1]?.replace(/^"|"$/g, '') || 'Untitled',
          excerpt: values[2]?.replace(/^"|"$/g, ''),
          tags: values[3] ? [values[3].replace(/^"|"$/g, '')] : [],
          isFavorite: false,
          isArchived: values[3]?.toLowerCase() === 'archive',
          readProgress: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await c.env.ARTICLES.put(`article:${articleId}`, JSON.stringify(article));

        // Update user's article list
        const articleIdsKey = `user:${userId}:articles`;
        const articleIdsData = await c.env.ARTICLES.get(articleIdsKey);
        const articleIds: string[] = articleIdsData ? JSON.parse(articleIdsData) : [];
        articleIds.push(articleId);
        await c.env.ARTICLES.put(articleIdsKey, JSON.stringify(articleIds));

        imported.success++;
      } catch (error) {
        imported.failed++;
        imported.errors.push(`Failed to import article: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return c.json({
      success: true,
      data: {
        totalItems: data.length - 1,
        imported: imported.success,
        failed: imported.failed,
        errors: imported.errors
      }
    });
  } catch (error) {
    console.error('Instapaper import error:', error);
    return c.json({
      success: false,
      error: { code: 'IMPORT_ERROR', message: 'Failed to import from Instapaper' }
    }, 500);
  }
});

/**
 * Import from Raindrop.io
 */
app.post('/import/raindrop', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const { data } = await c.req.json<{ data: any[] }>();

    if (!Array.isArray(data)) {
      return c.json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Invalid import data format' }
      }, 400);
    }

    const imported = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const item of data) {
      try {
        const articleId = crypto.randomUUID();
        const article: Article = {
          id: articleId,
          userId,
          url: item.link,
          title: item.title || 'Untitled',
          excerpt: item.excerpt || item.note,
          imageUrl: item.cover,
          tags: item.tags || [],
          isFavorite: item.important || false,
          isArchived: false,
          readProgress: 0,
          createdAt: item.created ? new Date(item.created).toISOString() : new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await c.env.ARTICLES.put(`article:${articleId}`, JSON.stringify(article));

        // Update user's article list
        const articleIdsKey = `user:${userId}:articles`;
        const articleIdsData = await c.env.ARTICLES.get(articleIdsKey);
        const articleIds: string[] = articleIdsData ? JSON.parse(articleIdsData) : [];
        articleIds.push(articleId);
        await c.env.ARTICLES.put(articleIdsKey, JSON.stringify(articleIds));

        imported.success++;
      } catch (error) {
        imported.failed++;
        imported.errors.push(`Failed to import article: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return c.json({
      success: true,
      data: {
        totalItems: data.length,
        imported: imported.success,
        failed: imported.failed,
        errors: imported.errors
      }
    });
  } catch (error) {
    console.error('Raindrop import error:', error);
    return c.json({
      success: false,
      error: { code: 'IMPORT_ERROR', message: 'Failed to import from Raindrop.io' }
    }, 500);
  }
});

export { app as exportRoutes };
