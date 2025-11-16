/**
 * Dropbox OAuth Service
 *
 * Handles OAuth flow and API interactions for Dropbox
 */

import type { Env } from '../../types/env';
import type { OAuthTokens, UserInfo, StorageQuota } from './google-drive';

export class DropboxOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(env: Env) {
    this.clientId = env.DROPBOX_CLIENT_ID;
    this.clientSecret = env.DROPBOX_CLIENT_SECRET;
    this.redirectUri = `${env.APP_URL}/oauth/callback`;
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state,
      token_access_type: 'offline'
    });

    return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }

    const data = await response.json<any>();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json<any>();

    return {
      accessToken: data.access_token,
      refreshToken,
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope
    };
  }

  /**
   * Get user info
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(null)
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const data = await response.json<any>();

    return {
      id: data.account_id,
      email: data.email,
      name: data.name.display_name
    };
  }

  /**
   * Get storage quota
   */
  async getQuota(accessToken: string): Promise<StorageQuota> {
    const response = await fetch('https://api.dropboxapi.com/2/users/get_space_usage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(null)
    });

    if (!response.ok) {
      throw new Error('Failed to get storage quota');
    }

    const data = await response.json<any>();

    return {
      used: data.used,
      total: data.allocation.allocated
    };
  }

  /**
   * Upload file to Dropbox
   */
  async uploadFile(
    accessToken: string,
    path: string,
    content: ArrayBuffer
  ): Promise<{ id: string; name: string; path_display: string }> {
    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Dropbox-API-Arg': JSON.stringify({
          path,
          mode: 'add',
          autorename: true,
          mute: false
        }),
        'Content-Type': 'application/octet-stream'
      },
      body: content
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload file: ${error}`);
    }

    return await response.json<any>();
  }

  /**
   * Download file from Dropbox
   */
  async downloadFile(accessToken: string, path: string): Promise<ArrayBuffer> {
    const response = await fetch('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Dropbox-API-Arg': JSON.stringify({ path })
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    return await response.arrayBuffer();
  }

  /**
   * Delete file from Dropbox
   */
  async deleteFile(accessToken: string, path: string): Promise<void> {
    const response = await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path })
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }
}
