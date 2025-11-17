/**
 * ApiDataProvider
 *
 * Implementation of IDataProvider that communicates with the API backend.
 * Handles authentication, request/response formatting, and error handling.
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
  Subscription,
  UserSettings,
  UserAnalytics,
  ApiResponse
} from '@savetoread/shared';
import { IDataProvider } from './IDataProvider';

export interface ApiDataProviderConfig {
  baseUrl: string;
  timeout?: number;
}

export class ApiDataProvider implements IDataProvider {
  private baseUrl: string;
  private timeout: number;
  private authToken: string | null = null;

  constructor(config: ApiDataProviderConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;

    // Load token from localStorage
    this.authToken = localStorage.getItem('auth_token');
  }

  // ============================================================================
  // Private HTTP Methods
  // ============================================================================

  private async request<T>(
    method: string,
    path: string,
    data?: unknown,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
        ...options
      });

      clearTimeout(timeoutId);

      // Try to parse JSON response
      let result: ApiResponse<T>;
      try {
        result = await response.json();
      } catch (jsonError) {
        // Handle non-JSON or empty responses
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: `Server returned invalid JSON response (status ${response.status})`
          }
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: result.error || {
            code: 'UNKNOWN_ERROR',
            message: `Request failed with status ${response.status}`
          }
        };
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: {
              code: 'TIMEOUT',
              message: 'Request timeout'
            }
          };
        }

        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: error.message
          }
        };
      }

      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred'
        }
      };
    }
  }

  private get<T>(path: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const queryString = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return this.request<T>('GET', path + queryString);
  }

  private post<T>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, data);
  }

  private put<T>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, data);
  }

  private delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path);
  }

  private setAuthToken(token: string | null): void {
    this.authToken = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // ============================================================================
  // Authentication
  // ============================================================================

  async signIn(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const result = await this.post<{ user: User; token: string }>('/api/auth/signin', {
      email,
      password
    });

    if (result.success && result.data) {
      this.setAuthToken(result.data.token);
    }

    return result;
  }

  async signUp(email: string, password: string, displayName: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const result = await this.post<{ user: User; token: string }>('/api/auth/signup', {
      email,
      password,
      displayName
    });

    if (result.success && result.data) {
      this.setAuthToken(result.data.token);
    }

    return result;
  }

  async signOut(): Promise<ApiResponse<void>> {
    const result = await this.post<void>('/api/auth/signout');
    this.setAuthToken(null);
    return result;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.get<User>('/api/auth/me');
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const result = await this.post<{ token: string }>('/api/auth/refresh');

    if (result.success && result.data) {
      this.setAuthToken(result.data.token);
    }

    return result;
  }

  // ============================================================================
  // Articles
  // ============================================================================

  async listArticles(params?: ListArticlesParams): Promise<ApiResponse<PaginatedResponse<Article>>> {
    return this.get<PaginatedResponse<Article>>('/api/articles', params as Record<string, unknown>);
  }

  async getArticle(id: string): Promise<ApiResponse<Article>> {
    return this.get<Article>(`/api/articles/${id}`);
  }

  async createArticle(input: CreateArticleInput): Promise<ApiResponse<Article>> {
    return this.post<Article>('/api/articles', input);
  }

  async updateArticle(id: string, input: UpdateArticleInput): Promise<ApiResponse<Article>> {
    return this.put<Article>(`/api/articles/${id}`, input);
  }

  async deleteArticle(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/articles/${id}`);
  }

  async generateSnapshot(articleId: string, format: 'pdf' | 'html'): Promise<ApiResponse<{ url: string }>> {
    return this.post<{ url: string }>(`/api/articles/${articleId}/snapshot`, { format });
  }

  // ============================================================================
  // Annotations
  // ============================================================================

  async getAnnotations(articleId: string): Promise<ApiResponse<Annotation[]>> {
    return this.get<Annotation[]>(`/api/articles/${articleId}/annotations`);
  }

  async createAnnotation(input: CreateAnnotationInput): Promise<ApiResponse<Annotation>> {
    return this.post<Annotation>('/api/annotations', input);
  }

  async updateAnnotation(id: string, updates: Partial<Annotation>): Promise<ApiResponse<Annotation>> {
    return this.put<Annotation>(`/api/annotations/${id}`, updates);
  }

  async deleteAnnotation(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/annotations/${id}`);
  }

  // ============================================================================
  // Cloud Storage
  // ============================================================================

  async getStorageConnections(): Promise<ApiResponse<StorageConnection[]>> {
    return this.get<StorageConnection[]>('/api/storage/connections');
  }

  async initiateStorageOAuth(provider: StorageProvider): Promise<ApiResponse<{ authUrl: string; state: string }>> {
    return this.post<{ authUrl: string; state: string }>('/api/storage/oauth/initiate', { provider });
  }

  async completeStorageOAuth(
    provider: StorageProvider,
    code: string,
    state: string
  ): Promise<ApiResponse<StorageConnection>> {
    return this.post<StorageConnection>('/api/storage/oauth/callback', {
      provider,
      code,
      state
    });
  }

  async disconnectStorage(connectionId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/api/storage/connections/${connectionId}`);
  }

  async syncStorageQuota(connectionId: string): Promise<ApiResponse<StorageConnection>> {
    return this.post<StorageConnection>(`/api/storage/connections/${connectionId}/sync`);
  }

  // ============================================================================
  // Subscriptions
  // ============================================================================

  async getSubscription(): Promise<ApiResponse<Subscription>> {
    return this.get<Subscription>('/api/subscription');
  }

  async createCheckoutSession(priceId: string): Promise<ApiResponse<{ sessionId: string; url: string }>> {
    return this.post<{ sessionId: string; url: string }>('/api/subscription/checkout', { priceId });
  }

  async createPortalSession(): Promise<ApiResponse<{ url: string }>> {
    return this.post<{ url: string }>('/api/subscription/portal');
  }

  async cancelSubscription(): Promise<ApiResponse<Subscription>> {
    return this.post<Subscription>('/api/subscription/cancel');
  }

  // ============================================================================
  // Settings
  // ============================================================================

  async getSettings(): Promise<ApiResponse<UserSettings>> {
    return this.get<UserSettings>('/api/settings');
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    return this.put<UserSettings>('/api/settings', settings);
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  async getAnalytics(): Promise<ApiResponse<UserAnalytics>> {
    return this.get<UserAnalytics>('/api/analytics');
  }

  async trackReadingProgress(articleId: string, progress: number): Promise<ApiResponse<void>> {
    return this.post<void>('/api/analytics/reading-progress', { articleId, progress });
  }

  // ============================================================================
  // Tags
  // ============================================================================

  async getTags(): Promise<ApiResponse<string[]>> {
    return this.get<string[]>('/api/tags');
  }

  async getTagStats(): Promise<ApiResponse<Record<string, number>>> {
    return this.get<Record<string, number>>('/api/tags/stats');
  }
}
