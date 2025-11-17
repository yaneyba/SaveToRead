/**
 * Storage Routes
 *
 * Handles cloud storage OAuth flows and file operations
 */

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { StorageProvider } from '@savetoread/shared';
import { GoogleDriveOAuth } from '../services/oauth/google-drive';
import { DropboxOAuth } from '../services/oauth/dropbox';
import { OneDriveOAuth } from '../services/oauth/onedrive';
import { encrypt, decrypt } from '../utils/crypto';

const app = new Hono<{ Bindings: Env; Variables: { userId?: string } }>();

/**
 * Get all storage connections for user
 */
app.get('/connections', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const connectionsKey = `user:${userId}:storage:connections`;
    const connectionsData = await c.env.OAUTH_TOKENS.get(connectionsKey);
    const connections = connectionsData ? JSON.parse(connectionsData) : [];

    return c.json({ success: true, data: connections });
  } catch (error) {
    return c.json({
      success: false,
      error: { code: 'STORAGE_ERROR', message: 'Failed to fetch connections' }
    }, 500);
  }
});

/**
 * Initiate OAuth flow for a storage provider
 */
app.post('/oauth/initiate', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const { provider } = await c.req.json<{ provider: StorageProvider }>();

    let oauthService;
    switch (provider) {
      case StorageProvider.GOOGLE_DRIVE:
        oauthService = new GoogleDriveOAuth(c.env);
        break;
      case StorageProvider.DROPBOX:
        oauthService = new DropboxOAuth(c.env);
        break;
      case StorageProvider.ONEDRIVE:
        oauthService = new OneDriveOAuth(c.env);
        break;
      default:
        return c.json({
          success: false,
          error: { code: 'INVALID_PROVIDER', message: 'Invalid storage provider' }
        }, 400);
    }

    const state = crypto.randomUUID();
    const authUrl = oauthService.getAuthorizationUrl(state);

    // Store state with userId for verification
    await c.env.OAUTH_TOKENS.put(
      `oauth:state:${state}`,
      JSON.stringify({ userId, provider }),
      { expirationTtl: 600 } // 10 minutes
    );

    return c.json({
      success: true,
      data: { authUrl, state }
    });
  } catch (error) {
    console.error('OAuth initiate error:', error);
    return c.json({
      success: false,
      error: { code: 'OAUTH_ERROR', message: 'Failed to initiate OAuth flow' }
    }, 500);
  }
});

/**
 * Complete OAuth flow (callback handler)
 */
app.post('/oauth/callback', async (c) => {
  try {
    const { provider, code, state } = await c.req.json<{
      provider: StorageProvider;
      code: string;
      state: string;
    }>();

    // Verify state
    const stateData = await c.env.OAUTH_TOKENS.get(`oauth:state:${state}`);
    if (!stateData) {
      return c.json({
        success: false,
        error: { code: 'INVALID_STATE', message: 'Invalid or expired state' }
      }, 400);
    }

    const { userId, provider: storedProvider } = JSON.parse(stateData);

    if (provider !== storedProvider) {
      return c.json({
        success: false,
        error: { code: 'PROVIDER_MISMATCH', message: 'Provider mismatch' }
      }, 400);
    }

    // Exchange code for tokens
    let oauthService;
    switch (provider) {
      case StorageProvider.GOOGLE_DRIVE:
        oauthService = new GoogleDriveOAuth(c.env);
        break;
      case StorageProvider.DROPBOX:
        oauthService = new DropboxOAuth(c.env);
        break;
      case StorageProvider.ONEDRIVE:
        oauthService = new OneDriveOAuth(c.env);
        break;
      default:
        return c.json({
          success: false,
          error: { code: 'INVALID_PROVIDER', message: 'Invalid storage provider' }
        }, 400);
    }

    const tokens = await oauthService.exchangeCodeForTokens(code);
    const userInfo = await oauthService.getUserInfo(tokens.accessToken);

    // Encrypt and store tokens
    const encryptedTokens = await encrypt(
      JSON.stringify(tokens),
      c.env.ENCRYPTION_KEY
    );

    const connectionId = crypto.randomUUID();
    const connection = {
      id: connectionId,
      userId,
      provider,
      providerUserId: userInfo.id,
      email: userInfo.email,
      displayName: userInfo.name,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store encrypted tokens
    await c.env.OAUTH_TOKENS.put(
      `connection:${connectionId}:tokens`,
      encryptedTokens
    );

    // Store connection metadata
    await c.env.OAUTH_TOKENS.put(
      `connection:${connectionId}:metadata`,
      JSON.stringify(connection)
    );

    // Update user's connections list
    const connectionsKey = `user:${userId}:storage:connections`;
    const existingConnections = await c.env.OAUTH_TOKENS.get(connectionsKey);
    const connections = existingConnections ? JSON.parse(existingConnections) : [];
    connections.push(connection);
    await c.env.OAUTH_TOKENS.put(connectionsKey, JSON.stringify(connections));

    // Clean up state
    await c.env.OAUTH_TOKENS.delete(`oauth:state:${state}`);

    return c.json({ success: true, data: connection });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json({
      success: false,
      error: { code: 'OAUTH_ERROR', message: 'Failed to complete OAuth flow' }
    }, 500);
  }
});

/**
 * Disconnect a storage provider
 */
app.delete('/connections/:connectionId', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const connectionId = c.req.param('connectionId');

    // Verify connection belongs to user
    const metadataKey = `connection:${connectionId}:metadata`;
    const metadata = await c.env.OAUTH_TOKENS.get(metadataKey);

    if (!metadata) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Connection not found' }
      }, 404);
    }

    const connection = JSON.parse(metadata);
    if (connection.userId !== userId) {
      return c.json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      }, 403);
    }

    // Delete tokens and metadata
    await c.env.OAUTH_TOKENS.delete(`connection:${connectionId}:tokens`);
    await c.env.OAUTH_TOKENS.delete(metadataKey);

    // Update user's connections list
    const connectionsKey = `user:${userId}:storage:connections`;
    const existingConnections = await c.env.OAUTH_TOKENS.get(connectionsKey);
    if (existingConnections) {
      const connections = JSON.parse(existingConnections);
      const updated = connections.filter((c: any) => c.id !== connectionId);
      await c.env.OAUTH_TOKENS.put(connectionsKey, JSON.stringify(updated));
    }

    return c.json({ success: true, data: undefined });
  } catch (error) {
    console.error('Disconnect error:', error);
    return c.json({
      success: false,
      error: { code: 'STORAGE_ERROR', message: 'Failed to disconnect storage' }
    }, 500);
  }
});

/**
 * Sync storage quota
 */
app.post('/connections/:connectionId/sync', async (c) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } }, 401);
  }

  try {
    const connectionId = c.req.param('connectionId');

    // Get connection metadata
    const metadataKey = `connection:${connectionId}:metadata`;
    const metadata = await c.env.OAUTH_TOKENS.get(metadataKey);

    if (!metadata) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Connection not found' }
      }, 404);
    }

    const connection = JSON.parse(metadata);
    if (connection.userId !== userId) {
      return c.json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      }, 403);
    }

    // Get tokens
    const encryptedTokens = await c.env.OAUTH_TOKENS.get(`connection:${connectionId}:tokens`);
    if (!encryptedTokens) {
      return c.json({
        success: false,
        error: { code: 'TOKENS_NOT_FOUND', message: 'Tokens not found' }
      }, 404);
    }

    const tokensData = await decrypt(encryptedTokens, c.env.ENCRYPTION_KEY);
    const tokens = JSON.parse(tokensData);

    // Get quota based on provider
    let oauthService;
    switch (connection.provider) {
      case StorageProvider.GOOGLE_DRIVE:
        oauthService = new GoogleDriveOAuth(c.env);
        break;
      case StorageProvider.DROPBOX:
        oauthService = new DropboxOAuth(c.env);
        break;
      case StorageProvider.ONEDRIVE:
        oauthService = new OneDriveOAuth(c.env);
        break;
      default:
        return c.json({
          success: false,
          error: { code: 'INVALID_PROVIDER', message: 'Invalid storage provider' }
        }, 400);
    }

    const quota = await oauthService.getQuota(tokens.accessToken);

    // Update connection with quota info
    connection.quotaUsed = quota.used;
    connection.quotaTotal = quota.total;
    connection.lastSyncAt = new Date().toISOString();
    connection.updatedAt = new Date().toISOString();

    await c.env.OAUTH_TOKENS.put(metadataKey, JSON.stringify(connection));

    return c.json({ success: true, data: connection });
  } catch (error) {
    console.error('Sync quota error:', error);
    return c.json({
      success: false,
      error: { code: 'SYNC_ERROR', message: 'Failed to sync quota' }
    }, 500);
  }
});

export { app as storageRoutes };
