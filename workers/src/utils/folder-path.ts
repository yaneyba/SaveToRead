/**
 * Folder Path Generation Utility
 *
 * Generates cloud storage folder paths based on user preferences
 */

import type { CloudStorageFolderStructure } from '@savetoread/shared';

export interface FolderPathContext {
  title: string;
  url: string;
  tags: string[];
  createdAt: string;
}

/**
 * Generate folder path based on organization strategy
 */
export function generateFolderPath(
  context: FolderPathContext,
  structure?: CloudStorageFolderStructure
): string {
  if (!structure || structure.organizationStrategy === 'flat') {
    return 'SaveToRead';
  }

  const date = new Date(context.createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const domain = extractDomain(context.url);

  let path = 'SaveToRead';

  switch (structure.organizationStrategy) {
    case 'date': {
      const dateFolder = formatDateFolder(year, month, day, structure.dateFormat || 'YYYY-MM');
      path = `${path}/${dateFolder}`;
      break;
    }

    case 'domain': {
      path = `${path}/${domain}`;
      break;
    }

    case 'tags': {
      if (context.tags.length > 0) {
        // Use first tag as primary folder
        const primaryTag = sanitizeFolderName(context.tags[0]);
        path = `${path}/${primaryTag}`;

        // If separateByTag is enabled and there are multiple tags, create subfolders
        if (structure.separateByTag && context.tags.length > 1) {
          const subTags = context.tags.slice(1).map(sanitizeFolderName).join('/');
          path = `${path}/${subTags}`;
        }
      } else {
        path = `${path}/Untagged`;
      }
      break;
    }

    case 'custom': {
      if (structure.customPath) {
        path = `${path}/${parseCustomTemplate(structure.customPath, {
          year: String(year),
          month,
          day,
          domain,
          title: sanitizeFolderName(context.title),
          tag: context.tags.length > 0 ? sanitizeFolderName(context.tags[0]) : 'Untagged'
        })}`;
      }
      break;
    }
  }

  return path;
}

/**
 * Format date folder based on format preference
 */
function formatDateFolder(year: number, month: string, day: string, format: string): string {
  switch (format) {
    case 'YYYY-MM':
      return `${year}-${month}`;
    case 'YYYY/MM':
      return `${year}/${month}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${year}/${month}`;
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Remove www. prefix if present
    const domain = hostname.replace(/^www\./, '');

    // Get main domain (e.g., example.com from subdomain.example.com)
    const parts = domain.split('.');
    if (parts.length > 2) {
      return parts.slice(-2).join('.');
    }

    return domain;
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Parse custom template with variables
 */
function parseCustomTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;

  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  return result;
}

/**
 * Sanitize folder name to remove invalid characters
 */
function sanitizeFolderName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/\.+$/, '') // Remove trailing dots
    .substring(0, 100) // Limit length
    .toLowerCase();
}
