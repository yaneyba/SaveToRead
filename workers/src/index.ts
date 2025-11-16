/**
 * Main Worker Entry Point
 *
 * Uses Hono framework for routing and middleware
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './types/env';

// Route handlers
import { authRoutes } from './routes/auth';
import { articleRoutes } from './routes/articles';
import { storageRoutes } from './routes/storage';
import { subscriptionRoutes } from './routes/subscription';
import { settingsRoutes } from './routes/settings';
import { analyticsRoutes } from './routes/analytics';

// Middleware
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';

// Durable Objects
export { RateLimiter } from './durable-objects/RateLimiter';
export { ReadingSession } from './durable-objects/ReadingSession';

const app = new Hono<{ Bindings: Env; Variables: { userId?: string } }>();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => origin, // Allow all origins in development, restrict in production
  credentials: true
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (no auth required)
app.route('/api/auth', authRoutes);

// Protected routes (auth required)
app.use('/api/articles/*', authMiddleware);
app.use('/api/storage/*', authMiddleware);
app.use('/api/subscription/*', authMiddleware);
app.use('/api/settings/*', authMiddleware);
app.use('/api/analytics/*', authMiddleware);

app.route('/api/articles', articleRoutes);
app.route('/api/storage', storageRoutes);
app.route('/api/subscription', subscriptionRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/analytics', analyticsRoutes);

// Error handling
app.onError(errorHandler);

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  }, 404);
});

export default app;
