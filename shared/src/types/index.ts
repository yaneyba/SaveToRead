/**
 * Shared types for SaveToRead application
 * Used by both frontend and workers
 */

// ============================================================================
// User & Authentication
// ============================================================================

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  subscriptionTier: SubscriptionTier;
  createdAt: string;
  updatedAt: string;
}

export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// ============================================================================
// Articles
// ============================================================================

export interface Article {
  id: string;
  userId: string;
  url: string;
  title: string;
  author?: string;
  excerpt?: string;
  content?: string;
  imageUrl?: string;
  publishedDate?: string; // Original publication date from article
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;
  readProgress: number; // 0-100
  createdAt: string;
  updatedAt: string;
  readAt?: string;
  // Storage references
  snapshotPdfUrl?: string;
  snapshotHtmlUrl?: string;
  storageProvider?: StorageProvider;
  // Content metrics
  wordCount?: number;
  readingTimeMinutes?: number; // Estimated reading time in minutes
}

export interface CreateArticleInput {
  url: string;
  tags?: string[];
}

export interface UpdateArticleInput {
  title?: string;
  tags?: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
  readProgress?: number;
}

// ============================================================================
// Annotations & Highlights
// ============================================================================

export interface Annotation {
  id: string;
  articleId: string;
  userId: string;
  type: AnnotationType;
  text: string;
  note?: string;
  color?: string;
  position: AnnotationPosition;
  createdAt: string;
  updatedAt: string;
}

export enum AnnotationType {
  HIGHLIGHT = 'highlight',
  NOTE = 'note',
  BOOKMARK = 'bookmark'
}

export interface AnnotationPosition {
  startOffset: number;
  endOffset: number;
  startNode?: string;
  endNode?: string;
}

export interface CreateAnnotationInput {
  articleId: string;
  type: AnnotationType;
  text: string;
  note?: string;
  color?: string;
  position: AnnotationPosition;
}

// ============================================================================
// Cloud Storage
// ============================================================================

export enum StorageProvider {
  GOOGLE_DRIVE = 'google_drive',
  DROPBOX = 'dropbox',
  ONEDRIVE = 'onedrive'
}

export interface StorageConnection {
  id: string;
  userId: string;
  provider: StorageProvider;
  providerUserId: string;
  email: string;
  displayName: string;
  isActive: boolean;
  quotaUsed?: number;
  quotaTotal?: number;
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
}

export interface OAuthCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
}

export interface StorageFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  modifiedAt: string;
}

// ============================================================================
// API Requests & Responses
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ListArticlesParams {
  page?: number;
  pageSize?: number;
  tags?: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Subscriptions & Billing
// ============================================================================

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  TRIALING = 'trialing'
}

export interface PricingPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId?: string;
}

// ============================================================================
// Settings
// ============================================================================

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  fontFamily: string;
  readingWidth: 'narrow' | 'normal' | 'wide';
  autoArchive: boolean;
  defaultTags: string[];
  notifications: NotificationSettings;
  snapshot: SnapshotSettings;
}

export interface SnapshotSettings {
  autoGenerate: boolean;
  defaultFormat: 'pdf' | 'html' | 'both';
  uploadToCloud: boolean;
  embedAssets: boolean;
  customStyling?: {
    fontSize?: string;
    fontFamily?: string;
    lineHeight?: number;
    maxWidth?: string;
    theme?: 'light' | 'dark' | 'sepia';
  };
  organizationStrategy?: 'date' | 'domain' | 'tags' | 'none';
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  digest: 'daily' | 'weekly' | 'never';
}

// ============================================================================
// Analytics
// ============================================================================

export interface UserAnalytics {
  userId: string;
  totalArticles: number;
  articlesRead: number;
  totalReadingTime: number; // minutes
  favoriteArticles: number;
  tagUsage: Record<string, number>;
  readingStreak: number; // days
  lastReadAt?: string;
}

// ============================================================================
// Browser Extension Events
// ============================================================================

/**
 * Custom event dispatched when article saving starts
 */
export interface SaveToReadSavingStartedEvent extends CustomEvent {
  type: 'savetoread:savingStarted';
  detail: {
    url: string;
    title: string;
  };
}

/**
 * Custom event dispatched when article is successfully saved
 */
export interface SaveToReadArticleSavedEvent extends CustomEvent {
  type: 'savetoread:articleSaved';
  detail: Article;
}

/**
 * Union type for all SaveToRead custom events
 */
export type SaveToReadCustomEvent = SaveToReadSavingStartedEvent | SaveToReadArticleSavedEvent;

/**
 * Extension event type map for type-safe event listeners
 */
export interface SaveToReadEventMap {
  'savetoread:savingStarted': SaveToReadSavingStartedEvent;
  'savetoread:articleSaved': SaveToReadArticleSavedEvent;
}
