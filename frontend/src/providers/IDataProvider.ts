/**
 * IDataProvider Interface
 *
 * Defines all data access methods for the application.
 * This abstraction allows switching between different implementations
 * (API, Mock, LocalStorage, etc.) without changing component code.
 */

import type {
  User,
  Article,
  CreateArticleInput,
  UpdateArticleInput,
  ListArticlesParams,
  PaginatedResponse,
  Annotation,
  CreateAnnotationInput,
  StorageConnection,
  StorageProvider,
  OAuthCredentials,
  Subscription,
  UserSettings,
  UserAnalytics,
  ApiResponse
} from '@readitlater/shared';

export interface IDataProvider {
  // ============================================================================
  // Authentication
  // ============================================================================

  /**
   * Sign in with email and password
   */
  signIn(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>>;

  /**
   * Sign up with email and password
   */
  signUp(email: string, password: string, displayName: string): Promise<ApiResponse<{ user: User; token: string }>>;

  /**
   * Sign out current user
   */
  signOut(): Promise<ApiResponse<void>>;

  /**
   * Get current authenticated user
   */
  getCurrentUser(): Promise<ApiResponse<User>>;

  /**
   * Refresh authentication token
   */
  refreshToken(): Promise<ApiResponse<{ token: string }>>;

  // ============================================================================
  // Articles
  // ============================================================================

  /**
   * Get paginated list of articles
   */
  listArticles(params?: ListArticlesParams): Promise<ApiResponse<PaginatedResponse<Article>>>;

  /**
   * Get a single article by ID
   */
  getArticle(id: string): Promise<ApiResponse<Article>>;

  /**
   * Create a new article from URL
   */
  createArticle(input: CreateArticleInput): Promise<ApiResponse<Article>>;

  /**
   * Update an existing article
   */
  updateArticle(id: string, input: UpdateArticleInput): Promise<ApiResponse<Article>>;

  /**
   * Delete an article
   */
  deleteArticle(id: string): Promise<ApiResponse<void>>;

  /**
   * Generate snapshot (PDF/HTML) of article
   */
  generateSnapshot(articleId: string, format: 'pdf' | 'html'): Promise<ApiResponse<{ url: string }>>;

  // ============================================================================
  // Annotations & Highlights
  // ============================================================================

  /**
   * Get annotations for an article
   */
  getAnnotations(articleId: string): Promise<ApiResponse<Annotation[]>>;

  /**
   * Create a new annotation
   */
  createAnnotation(input: CreateAnnotationInput): Promise<ApiResponse<Annotation>>;

  /**
   * Update an annotation
   */
  updateAnnotation(id: string, updates: Partial<Annotation>): Promise<ApiResponse<Annotation>>;

  /**
   * Delete an annotation
   */
  deleteAnnotation(id: string): Promise<ApiResponse<void>>;

  // ============================================================================
  // Cloud Storage
  // ============================================================================

  /**
   * Get user's storage connections
   */
  getStorageConnections(): Promise<ApiResponse<StorageConnection[]>>;

  /**
   * Initiate OAuth flow for storage provider
   * Returns authorization URL to redirect user to
   */
  initiateStorageOAuth(provider: StorageProvider): Promise<ApiResponse<{ authUrl: string; state: string }>>;

  /**
   * Complete OAuth flow with authorization code
   */
  completeStorageOAuth(provider: StorageProvider, code: string, state: string): Promise<ApiResponse<StorageConnection>>;

  /**
   * Disconnect a storage provider
   */
  disconnectStorage(connectionId: string): Promise<ApiResponse<void>>;

  /**
   * Sync storage quota and usage
   */
  syncStorageQuota(connectionId: string): Promise<ApiResponse<StorageConnection>>;

  // ============================================================================
  // Subscriptions & Billing
  // ============================================================================

  /**
   * Get user's subscription
   */
  getSubscription(): Promise<ApiResponse<Subscription>>;

  /**
   * Create Stripe checkout session for subscription
   */
  createCheckoutSession(priceId: string): Promise<ApiResponse<{ sessionId: string; url: string }>>;

  /**
   * Create Stripe customer portal session
   */
  createPortalSession(): Promise<ApiResponse<{ url: string }>>;

  /**
   * Cancel subscription at period end
   */
  cancelSubscription(): Promise<ApiResponse<Subscription>>;

  // ============================================================================
  // Settings
  // ============================================================================

  /**
   * Get user settings
   */
  getSettings(): Promise<ApiResponse<UserSettings>>;

  /**
   * Update user settings
   */
  updateSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>>;

  // ============================================================================
  // Analytics
  // ============================================================================

  /**
   * Get user analytics
   */
  getAnalytics(): Promise<ApiResponse<UserAnalytics>>;

  /**
   * Track reading progress
   */
  trackReadingProgress(articleId: string, progress: number): Promise<ApiResponse<void>>;

  // ============================================================================
  // Tags
  // ============================================================================

  /**
   * Get all tags used by the user
   */
  getTags(): Promise<ApiResponse<string[]>>;

  /**
   * Get tag usage statistics
   */
  getTagStats(): Promise<ApiResponse<Record<string, number>>>;
}
