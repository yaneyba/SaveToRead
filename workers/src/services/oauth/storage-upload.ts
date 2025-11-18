/**
 * Cloud Storage Upload Helpers
 *
 * Functions to upload files to various cloud storage providers
 */

import { StorageProvider } from '@savetoread/shared';

export interface UploadResult {
  fileId: string;
  webViewLink?: string;
  downloadUrl?: string;
}

/**
 * Upload file to Google Drive
 */
export async function uploadFileToGoogleDrive(
  accessToken: string,
  fileName: string,
  mimeType: string,
  content: Uint8Array | string,
  folderId?: string
): Promise<UploadResult> {
  const metadata = {
    name: fileName,
    mimeType,
    ...(folderId && { parents: [folderId] })
  };

  // Convert content to blob if it's a string
  const blob = typeof content === 'string'
    ? new TextEncoder().encode(content)
    : content;

  // Create multipart form data
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataBlob = new TextEncoder().encode(
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata)
  );

  const fileBlob = new Uint8Array([
    ...new TextEncoder().encode(
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n`
    ),
    ...blob,
    ...new TextEncoder().encode(closeDelimiter)
  ]);

  const multipartBody = new Uint8Array([
    ...metadataBlob,
    ...fileBlob
  ]);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartBody
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Drive upload failed: ${error}`);
  }

  const data = await response.json() as { id: string; webViewLink?: string };

  return {
    fileId: data.id,
    webViewLink: data.webViewLink
  };
}

/**
 * Upload file to Dropbox
 */
export async function uploadFileToDropbox(
  accessToken: string,
  fileName: string,
  content: Uint8Array | string,
  folderPath: string = '/SaveToRead'
): Promise<UploadResult> {
  const blob = typeof content === 'string'
    ? new TextEncoder().encode(content)
    : content;

  const path = `${folderPath}/${fileName}`.replace('//', '/');

  const response = await fetch(
    'https://content.dropboxapi.com/2/files/upload',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path,
          mode: 'add',
          autorename: true,
          mute: false
        })
      },
      body: blob
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dropbox upload failed: ${error}`);
  }

  const data = await response.json() as { id: string; path_display: string };

  // Get a shared link for the file
  const linkResponse = await fetch(
    'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path: data.path_display })
    }
  );

  let webViewLink: string | undefined;
  if (linkResponse.ok) {
    const linkData = await linkResponse.json() as { url: string };
    webViewLink = linkData.url;
  }

  return {
    fileId: data.id,
    webViewLink
  };
}

/**
 * Upload file to OneDrive
 */
export async function uploadFileToOneDrive(
  accessToken: string,
  fileName: string,
  content: Uint8Array | string,
  folderPath: string = '/SaveToRead'
): Promise<UploadResult> {
  const blob = typeof content === 'string'
    ? new TextEncoder().encode(content)
    : content;

  // For files larger than 4MB, we'd need to use upload sessions
  // For now, we'll use simple upload (max 4MB)
  const encodedFileName = encodeURIComponent(fileName);
  const encodedFolderPath = folderPath.split('/').map(p => encodeURIComponent(p)).join('/');
  const uploadPath = `${encodedFolderPath}/${encodedFileName}`.replace('//', '/');

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:${uploadPath}:/content`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream'
      },
      body: blob
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OneDrive upload failed: ${error}`);
  }

  const data = await response.json() as { id: string; webUrl?: string };

  return {
    fileId: data.id,
    webViewLink: data.webUrl
  };
}

/**
 * Upload file to appropriate cloud storage provider
 */
export async function uploadToCloudStorage(
  provider: StorageProvider,
  accessToken: string,
  fileName: string,
  mimeType: string,
  content: Uint8Array | string,
  folderPath?: string
): Promise<UploadResult> {
  switch (provider) {
    case StorageProvider.GOOGLE_DRIVE:
      return uploadFileToGoogleDrive(accessToken, fileName, mimeType, content, folderPath);
    case StorageProvider.DROPBOX:
      return uploadFileToDropbox(accessToken, fileName, content, folderPath);
    case StorageProvider.ONEDRIVE:
      return uploadFileToOneDrive(accessToken, fileName, content, folderPath);
    default:
      throw new Error(`Unsupported storage provider: ${provider}`);
  }
}
