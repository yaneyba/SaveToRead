/**
 * Articles Routes
 *
 * Handles article CRUD operations, snapshots, and annotations
 */

import { Hono } from 'hono';
import type { Env } from '../types/env';
import type { Article, CreateArticleInput, UpdateArticleInput } from '@saveforlater/shared';

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

    // In a real implementation, you would fetch and parse the article content here
    // For now, we'll create a basic article
    const articleId = crypto.randomUUID();
    const article: Article = {
      id: articleId,
      userId,
      url: input.url,
      title: new URL(input.url).hostname, // Placeholder
      tags: input.tags || [],
      isFavorite: false,
      isArchived: false,
      readProgress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store article
    await c.env.ARTICLES.put(`article:${articleId}`, JSON.stringify(article));

    // Update user's article list
    const articleIdsKey = `user:${userId}:articles`;
    const articleIdsData = await c.env.ARTICLES.get(articleIdsKey);
    const articleIds: string[] = articleIdsData ? JSON.parse(articleIdsData) : [];
    articleIds.push(articleId);
    await c.env.ARTICLES.put(articleIdsKey, JSON.stringify(articleIds));

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
 * Generate snapshot (PDF or HTML)
 */
app.post('/:id/snapshot', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const articleId = c.req.param('id');
    const { format } = await c.req.json<{ format: 'pdf' | 'html' }>();

    // In a real implementation, you would generate the snapshot and upload to user's cloud storage
    // For now, return a placeholder URL
    const url = `https://storage.example.com/snapshots/${articleId}.${format}`;

    return c.json({ success: true, data: { url } });
  } catch (error) {
    console.error('Generate snapshot error:', error);
    return c.json({
      success: false,
      error: { code: 'SNAPSHOT_ERROR', message: 'Failed to generate snapshot' }
    }, 500);
  }
});

export { app as articleRoutes };
