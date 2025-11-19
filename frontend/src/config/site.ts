/**
 * Site Configuration
 *
 * Global settings and constants for the application
 */

export const SITE_CONFIG = {
  // Pagination settings
  pagination: {
    defaultPageSize: 12,
    pageSizeOptions: [6, 12, 24, 48],
  },

  // App information
  name: 'SaveToRead',
  description: 'Your personal reading library, stored in your own cloud storage.',
  url: 'https://savetoread.com',
  
  // Feature flags
  features: {
    enableOfflineMode: false,
    enableCollaborativeReading: false,
    enableAIInsights: false,
  },
} as const;
