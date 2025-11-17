/**
 * OneDrive OAuth Service
 *
 * Handles OAuth flow and API interactions for Microsoft OneDrive
 */

import type { Env } from '../../types/env';
import type { OAuthTokens, UserInfo, StorageQuota } from './google-drive';

export class OneDriveOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(env: Env) {
    this.clientId = env.ONEDRIVE_CLIENT_ID;
    this.clientSecret = env.ONEDRIVE_CLIENT_SECRET;
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
      scope: 'files.readwrite offline_access user.read',
      state
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code'
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
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
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
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope
    };
  }

  /**
   * Get user info
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const data = await response.json<any>();

    return {
      id: data.id,
      email: data.userPrincipalName || data.mail,
      name: data.displayName
    };
  }

  /**
   * Get storage quota
   */
  async getQuota(accessToken: string): Promise<StorageQuota> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/drive', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get storage quota');
    }

    const data = await response.json<any>();

    return {
      used: data.quota.used,
      total: data.quota.total
    };
  }

  /**
   * Upload file to OneDrive
   */
  async uploadFile(
    accessToken: string,
    fileName: string,
    content: ArrayBuffer
  ): Promise<{ id: string; name: string; webUrl: string }> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:/SaveForLater/${fileName}:/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream'
        },
        body: content
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload file: ${error}`);
    }

    return await response.json<any>();
  }

  /**
   * Download file from OneDrive
   */
  async downloadFile(accessToken: string, fileId: string): Promise<ArrayBuffer> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    return await response.arrayBuffer();
  }

  /**
   * Delete file from OneDrive
   */
  async deleteFile(accessToken: string, fileId: string): Promise<void> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }
}
