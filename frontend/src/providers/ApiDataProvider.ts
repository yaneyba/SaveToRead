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
} from '@readitlater/shared';
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

      const result: ApiResponse<T> = await response.json();

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
    const result = await this.post<{ user: User; token: string }>('/auth/signin', {
      email,
      password
    });

    if (result.success && result.data) {
      this.setAuthToken(result.data.token);
    }

    return result;
  }

  async signUp(email: string, password: string, displayName: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const result = await this.post<{ user: User; token: string }>('/auth/signup', {
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
    const result = await this.post<void>('/auth/signout');
    this.setAuthToken(null);
    return result;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.get<User>('/auth/me');
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const result = await this.post<{ token: string }>('/auth/refresh');

    if (result.success && result.data) {
      this.setAuthToken(result.data.token);
    }

    return result;
  }

  // ============================================================================
  // Articles
  // ============================================================================

  async listArticles(params?: ListArticlesParams): Promise<ApiResponse<PaginatedResponse<Article>>> {
    return this.get<PaginatedResponse<Article>>('/articles', params as Record<string, unknown>);
  }

  async getArticle(id: string): Promise<ApiResponse<Article>> {
    return this.get<Article>(`/articles/${id}`);
  }

  async createArticle(input: CreateArticleInput): Promise<ApiResponse<Article>> {
    return this.post<Article>('/articles', input);
  }

  async updateArticle(id: string, input: UpdateArticleInput): Promise<ApiResponse<Article>> {
    return this.put<Article>(`/articles/${id}`, input);
  }

  async deleteArticle(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/articles/${id}`);
  }

  async generateSnapshot(articleId: string, format: 'pdf' | 'html'): Promise<ApiResponse<{ url: string }>> {
    return this.post<{ url: string }>(`/articles/${articleId}/snapshot`, { format });
  }

  // ============================================================================
  // Annotations
  // ============================================================================

  async getAnnotations(articleId: string): Promise<ApiResponse<Annotation[]>> {
    return this.get<Annotation[]>(`/articles/${articleId}/annotations`);
  }

  async createAnnotation(input: CreateAnnotationInput): Promise<ApiResponse<Annotation>> {
    return this.post<Annotation>('/annotations', input);
  }

  async updateAnnotation(id: string, updates: Partial<Annotation>): Promise<ApiResponse<Annotation>> {
    return this.put<Annotation>(`/annotations/${id}`, updates);
  }

  async deleteAnnotation(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/annotations/${id}`);
  }

  // ============================================================================
  // Cloud Storage
  // ============================================================================

  async getStorageConnections(): Promise<ApiResponse<StorageConnection[]>> {
    return this.get<StorageConnection[]>('/storage/connections');
  }

  async initiateStorageOAuth(provider: StorageProvider): Promise<ApiResponse<{ authUrl: string; state: string }>> {
    return this.post<{ authUrl: string; state: string }>('/storage/oauth/initiate', { provider });
  }

  async completeStorageOAuth(
    provider: StorageProvider,
    code: string,
    state: string
  ): Promise<ApiResponse<StorageConnection>> {
    return this.post<StorageConnection>('/storage/oauth/callback', {
      provider,
      code,
      state
    });
  }

  async disconnectStorage(connectionId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/storage/connections/${connectionId}`);
  }

  async syncStorageQuota(connectionId: string): Promise<ApiResponse<StorageConnection>> {
    return this.post<StorageConnection>(`/storage/connections/${connectionId}/sync`);
  }

  // ============================================================================
  // Subscriptions
  // ============================================================================

  async getSubscription(): Promise<ApiResponse<Subscription>> {
    return this.get<Subscription>('/subscription');
  }

  async createCheckoutSession(priceId: string): Promise<ApiResponse<{ sessionId: string; url: string }>> {
    return this.post<{ sessionId: string; url: string }>('/subscription/checkout', { priceId });
  }

  async createPortalSession(): Promise<ApiResponse<{ url: string }>> {
    return this.post<{ url: string }>('/subscription/portal');
  }

  async cancelSubscription(): Promise<ApiResponse<Subscription>> {
    return this.post<Subscription>('/subscription/cancel');
  }

  // ============================================================================
  // Settings
  // ============================================================================

  async getSettings(): Promise<ApiResponse<UserSettings>> {
    return this.get<UserSettings>('/settings');
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    return this.put<UserSettings>('/settings', settings);
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  async getAnalytics(): Promise<ApiResponse<UserAnalytics>> {
    return this.get<UserAnalytics>('/analytics');
  }

  async trackReadingProgress(articleId: string, progress: number): Promise<ApiResponse<void>> {
    return this.post<void>('/analytics/reading-progress', { articleId, progress });
  }

  // ============================================================================
  // Tags
  // ============================================================================

  async getTags(): Promise<ApiResponse<string[]>> {
    return this.get<string[]>('/tags');
  }

  async getTagStats(): Promise<ApiResponse<Record<string, number>>> {
    return this.get<Record<string, number>>('/tags/stats');
  }
}
