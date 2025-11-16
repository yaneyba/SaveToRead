/**
 * Google Drive OAuth Service
 *
 * Handles OAuth flow and API interactions for Google Drive
 */

import type { Env } from '../../types/env';

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
}

export interface StorageQuota {
  used: number;
  total: number;
}

export class GoogleDriveOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(env: Env) {
    this.clientId = env.GOOGLE_CLIENT_ID;
    this.clientSecret = env.GOOGLE_CLIENT_SECRET;
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
      scope: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
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
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json<any>();

    return {
      accessToken: data.access_token,
      refreshToken, // Keep existing refresh token
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope
    };
  }

  /**
   * Get user info
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
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
      email: data.email,
      name: data.name
    };
  }

  /**
   * Get storage quota
   */
  async getQuota(accessToken: string): Promise<StorageQuota> {
    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get storage quota');
    }

    const data = await response.json<any>();

    return {
      used: parseInt(data.storageQuota.usage || '0'),
      total: parseInt(data.storageQuota.limit || '0')
    };
  }

  /**
   * Upload file to Google Drive
   */
  async uploadFile(
    accessToken: string,
    fileName: string,
    mimeType: string,
    content: ArrayBuffer
  ): Promise<{ id: string; name: string; webViewLink: string }> {
    // Create file metadata
    const metadata = {
      name: fileName,
      mimeType
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const encoder = new TextEncoder();
    const metadataPart = encoder.encode(
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata)
    );

    const contentPart = new Uint8Array([
      ...encoder.encode(delimiter + `Content-Type: ${mimeType}\r\n\r\n`),
      ...new Uint8Array(content),
      ...encoder.encode(closeDelimiter)
    ]);

    const body = new Uint8Array(metadataPart.length + contentPart.length);
    body.set(metadataPart, 0);
    body.set(contentPart, metadataPart.length);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload file: ${error}`);
    }

    return await response.json<any>();
  }

  /**
   * Download file from Google Drive
   */
  async downloadFile(accessToken: string, fileId: string): Promise<ArrayBuffer> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
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
   * Delete file from Google Drive
   */
  async deleteFile(accessToken: string, fileId: string): Promise<void> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
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
