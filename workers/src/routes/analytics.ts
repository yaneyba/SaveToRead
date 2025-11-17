/**
 * Analytics Routes
 *
 * Handles user analytics and reading progress tracking
 */

import { Hono } from 'hono';
import type { Env } from '../types/env';
import type { UserAnalytics } from '@saveforlater/shared';

const app = new Hono<{ Bindings: Env; Variables: { userId?: string } }>();

/**
 * Get user analytics
 */
app.get('/', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const analyticsData = await c.env.USERS.get(`user:${userId}:analytics`);

    const analytics: UserAnalytics = analyticsData ? JSON.parse(analyticsData) : {
      userId,
      totalArticles: 0,
      articlesRead: 0,
      totalReadingTime: 0,
      favoriteArticles: 0,
      tagUsage: {},
      readingStreak: 0
    };

    return c.json({ success: true, data: analytics });
  } catch (error) {
    return c.json({
      success: false,
      error: { code: 'ANALYTICS_ERROR', message: 'Failed to get analytics' }
    }, 500);
  }
});

/**
 * Track reading progress
 */
app.post('/reading-progress', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const { articleId, progress } = await c.req.json<{ articleId: string; progress: number }>();

    // Update article progress
    const articleData = await c.env.ARTICLES.get(`article:${articleId}`);
    if (articleData) {
      const article = JSON.parse(articleData);
      if (article.userId === userId) {
        article.readProgress = progress;
        article.updatedAt = new Date().toISOString();

        if (progress === 100 && !article.readAt) {
          article.readAt = new Date().toISOString();
        }

        await c.env.ARTICLES.put(`article:${articleId}`, JSON.stringify(article));
      }
    }

    return c.json({ success: true, data: undefined });
  } catch (error) {
    return c.json({
      success: false,
      error: { code: 'TRACKING_ERROR', message: 'Failed to track reading progress' }
    }, 500);
  }
});

export { app as analyticsRoutes };
