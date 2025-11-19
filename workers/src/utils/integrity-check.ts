/**
 * Snapshot Integrity Verification
 *
 * Verifies uploaded snapshots match original content
 */

import type { StorageIntegrityCheck } from '@savetoread/shared';

/**
 * Calculate SHA-256 checksum of content
 */
export async function calculateChecksum(content: Uint8Array | string): Promise<string> {
  const encoder = new TextEncoder();
  const data = typeof content === 'string' ? encoder.encode(content) : content;

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Verify snapshot integrity after upload
 */
export async function verifySnapshotIntegrity(
  articleId: string,
  snapshotUrl: string,
  originalContent: Uint8Array | string,
  originalSize: number
): Promise<StorageIntegrityCheck> {
  try {
    // Calculate original checksum
    const originalChecksum = await calculateChecksum(originalContent);

    // Fetch uploaded file to verify
    const response = await fetch(snapshotUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch snapshot: ${response.statusText}`);
    }

    const uploadedContent = new Uint8Array(await response.arrayBuffer());
    const uploadedChecksum = await calculateChecksum(uploadedContent);
    const uploadedSize = uploadedContent.length;

    const isValid = originalChecksum === uploadedChecksum && originalSize === uploadedSize;

    return {
      articleId,
      snapshotUrl,
      originalSize,
      verifiedSize: uploadedSize,
      checksum: uploadedChecksum,
      isValid,
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Integrity check failed:', error);

    return {
      articleId,
      snapshotUrl,
      originalSize,
      verifiedSize: 0,
      checksum: '',
      isValid: false,
      checkedAt: new Date().toISOString()
    };
  }
}

/**
 * Quick size-only verification (faster, less thorough)
 */
export async function verifySnapshotSize(
  snapshotUrl: string,
  expectedSize: number
): Promise<boolean> {
  try {
    const response = await fetch(snapshotUrl, { method: 'HEAD' });

    if (!response.ok) {
      return false;
    }

    const contentLength = response.headers.get('content-length');
    if (!contentLength) {
      return false;
    }

    const actualSize = parseInt(contentLength, 10);
    // Allow 1% variance for compression differences
    const tolerance = expectedSize * 0.01;

    return Math.abs(actualSize - expectedSize) <= tolerance;
  } catch (error) {
    console.error('Size verification failed:', error);
    return false;
  }
}
