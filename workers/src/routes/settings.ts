/**
 * Settings Routes
 *
 * Handles user settings and preferences
 */

import { Hono } from 'hono';
import type { Env } from '../types/env';
import type { UserSettings } from '@readitlater/shared';

const app = new Hono<{ Bindings: Env; Variables: { userId?: string } }>();

/**
 * Get user settings
 */
app.get('/', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const settingsData = await c.env.USERS.get(`user:${userId}:settings`);

    const settings: UserSettings = settingsData ? JSON.parse(settingsData) : {
      userId,
      theme: 'auto',
      fontSize: 16,
      fontFamily: 'system-ui',
      readingWidth: 'normal',
      autoArchive: false,
      defaultTags: [],
      notifications: {
        email: true,
        push: false,
        digest: 'weekly'
      }
    };

    return c.json({ success: true, data: settings });
  } catch (error) {
    return c.json({
      success: false,
      error: { code: 'SETTINGS_ERROR', message: 'Failed to get settings' }
    }, 500);
  }
});

/**
 * Update user settings
 */
app.put('/', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const updates = await c.req.json<Partial<UserSettings>>();

    const settingsData = await c.env.USERS.get(`user:${userId}:settings`);
    const currentSettings: UserSettings = settingsData ? JSON.parse(settingsData) : {
      userId,
      theme: 'auto',
      fontSize: 16,
      fontFamily: 'system-ui',
      readingWidth: 'normal',
      autoArchive: false,
      defaultTags: [],
      notifications: {
        email: true,
        push: false,
        digest: 'weekly'
      }
    };

    const updatedSettings: UserSettings = {
      ...currentSettings,
      ...updates,
      userId // Ensure userId is not changed
    };

    await c.env.USERS.put(`user:${userId}:settings`, JSON.stringify(updatedSettings));

    return c.json({ success: true, data: updatedSettings });
  } catch (error) {
    return c.json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to update settings' }
    }, 500);
  }
});

export { app as settingsRoutes };
