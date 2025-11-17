/**
 * Authentication Routes
 *
 * Handles user signup, signin, and session management
 */

import { Hono } from 'hono';
import type { Env } from '../types/env';
import type { User, SubscriptionTier } from '@savetoread/shared';
import { sign } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/crypto';

const app = new Hono<{ Bindings: Env }>();

/**
 * Sign up new user
 */
app.post('/signup', async (c) => {
  try {
    const { email, password, displayName } = await c.req.json<{
      email: string;
      password: string;
      displayName: string;
    }>();

    // Validate input
    if (!email || !password || !displayName) {
      return c.json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Missing required fields' }
      }, 400);
    }

    // Check if user already exists
    const existingUser = await c.env.USERS.get(`email:${email}`);
    if (existingUser) {
      return c.json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'User with this email already exists' }
      }, 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = crypto.randomUUID();
    const user: User = {
      id: userId,
      email,
      displayName,
      subscriptionTier: 'free' as SubscriptionTier,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store user data
    await c.env.USERS.put(`user:${userId}`, JSON.stringify(user));
    await c.env.USERS.put(`email:${email}`, userId);
    await c.env.USERS.put(`user:${userId}:password`, passwordHash);

    // Generate JWT token
    const token = await sign(
      { userId: user.id, email: user.email },
      c.env.JWT_SECRET
    );

    return c.json({
      success: true,
      data: { user, token }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({
      success: false,
      error: { code: 'SIGNUP_ERROR', message: 'Failed to create user' }
    }, 500);
  }
});

/**
 * Sign in existing user
 */
app.post('/signin', async (c) => {
  try {
    const { email, password } = await c.req.json<{
      email: string;
      password: string;
    }>();

    // Validate input
    if (!email || !password) {
      return c.json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Missing required fields' }
      }, 400);
    }

    // Get user ID from email
    const userId = await c.env.USERS.get(`email:${email}`);
    if (!userId) {
      return c.json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      }, 401);
    }

    // Get user data and password hash
    const userData = await c.env.USERS.get(`user:${userId}`);
    const passwordHash = await c.env.USERS.get(`user:${userId}:password`);

    if (!userData || !passwordHash) {
      return c.json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      }, 401);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, passwordHash);
    if (!isValidPassword) {
      return c.json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      }, 401);
    }

    const user: User = JSON.parse(userData);

    // Generate JWT token
    const token = await sign(
      { userId: user.id, email: user.email },
      c.env.JWT_SECRET
    );

    return c.json({
      success: true,
      data: { user, token }
    });
  } catch (error) {
    console.error('Signin error:', error);
    return c.json({
      success: false,
      error: { code: 'SIGNIN_ERROR', message: 'Failed to sign in' }
    }, 500);
  }
});

/**
 * Sign out (client-side token deletion)
 */
app.post('/signout', async (c) => {
  return c.json({ success: true, data: undefined });
});

/**
 * Get current user
 */
app.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing authorization header' }
    }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const { verify: verifyJWT } = await import('../utils/jwt');
    const payload = await verifyJWT(token, c.env.JWT_SECRET);

    const userData = await c.env.USERS.get(`user:${payload.userId}`);
    if (!userData) {
      return c.json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      }, 404);
    }

    const user: User = JSON.parse(userData);

    return c.json({ success: true, data: user });
  } catch (error) {
    return c.json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
    }, 401);
  }
});

/**
 * Refresh token
 */
app.post('/refresh', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing authorization header' }
    }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const { verify: verifyJWT } = await import('../utils/jwt');
    const payload = await verifyJWT(token, c.env.JWT_SECRET);

    // Generate new token
    const newToken = await sign(
      { userId: payload.userId as string, email: payload.email as string },
      c.env.JWT_SECRET
    );

    return c.json({ success: true, data: { token: newToken } });
  } catch (error) {
    return c.json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
    }, 401);
  }
});

export { app as authRoutes };
