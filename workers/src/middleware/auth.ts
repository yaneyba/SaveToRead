/**
 * Authentication Middleware
 *
 * Verifies JWT tokens and sets userId in context
 */

import { MiddlewareHandler } from 'hono';
import { verify } from '../utils/jwt';
import type { Env } from '../types/env';

export const authMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: { userId?: string } }> = async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header'
      }
    }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verify(token, c.env.JWT_SECRET);

    if (!payload.userId) {
      throw new Error('Invalid token payload');
    }

    // Set userId in context for downstream handlers
    c.set('userId', payload.userId as string);

    await next();
  } catch (error) {
    return c.json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    }, 401);
  }
};
