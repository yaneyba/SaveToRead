/**
 * MockDataProvider
 *
 * Mock implementation of IDataProvider for development and testing.
 * Returns fake data without making actual API calls.
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
  Subscription,
  UserSettings,
  UserAnalytics,
  ApiResponse
} from '@savetoread/shared';
import {
  SubscriptionTier,
  SubscriptionStatus,
  StorageProvider,
  AnnotationType
} from '@savetoread/shared';
import { IDataProvider } from './IDataProvider';

export class MockDataProvider implements IDataProvider {
  private mockUser: User = {
    id: 'mock-user-1',
    email: 'demo@example.com',
    displayName: 'Demo User',
    subscriptionTier: SubscriptionTier.FREE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  private mockArticles: Article[] = [
    {
      id: '1',
      userId: 'mock-user-1',
      url: 'https://example.com/article-1',
      title: 'Getting Started with TypeScript',
      author: 'John Doe',
      excerpt: 'Learn the basics of TypeScript in this comprehensive guide...',
      tags: ['typescript', 'programming'],
      isFavorite: true,
      isArchived: false,
      readProgress: 45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  private async mockResponse<T>(data: T, delay = 500): Promise<ApiResponse<T>> {
    await new Promise(resolve => setTimeout(resolve, delay));
    return { success: true, data };
  }

  // Authentication
  async signIn(_email: string, _password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.mockResponse({ user: this.mockUser, token: 'mock-token' });
  }

  async signUp(email: string, _password: string, displayName: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.mockResponse({ user: { ...this.mockUser, email, displayName }, token: 'mock-token' });
  }

  async signOut(): Promise<ApiResponse<void>> {
    return this.mockResponse(undefined);
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.mockResponse(this.mockUser);
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return this.mockResponse({ token: 'mock-refreshed-token' });
  }

  // Articles
  async listArticles(params?: ListArticlesParams): Promise<ApiResponse<PaginatedResponse<Article>>> {
    return this.mockResponse({
      items: this.mockArticles,
      total: this.mockArticles.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 20,
      hasMore: false
    });
  }

  async getArticle(id: string): Promise<ApiResponse<Article>> {
    const article = this.mockArticles.find(a => a.id === id);
    return this.mockResponse(article || this.mockArticles[0]);
  }

  async createArticle(input: CreateArticleInput): Promise<ApiResponse<Article>> {
    const newArticle: Article = {
      id: `article-${Date.now()}`,
      userId: this.mockUser.id,
      url: input.url,
      title: 'New Article',
      tags: input.tags || [],
      isFavorite: false,
      isArchived: false,
      readProgress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.mockArticles.push(newArticle);
    return this.mockResponse(newArticle);
  }

  async updateArticle(id: string, input: UpdateArticleInput): Promise<ApiResponse<Article>> {
    const article = this.mockArticles.find(a => a.id === id);
    if (article) {
      Object.assign(article, input, { updatedAt: new Date().toISOString() });
      return this.mockResponse(article);
    }
    return this.mockResponse(this.mockArticles[0]);
  }

  async deleteArticle(id: string): Promise<ApiResponse<void>> {
    const index = this.mockArticles.findIndex(a => a.id === id);
    if (index !== -1) {
      this.mockArticles.splice(index, 1);
    }
    return this.mockResponse(undefined);
  }

  async generateSnapshot(articleId: string, format: 'pdf' | 'html'): Promise<ApiResponse<{ url: string }>> {
    return this.mockResponse({ url: `https://storage.example.com/snapshots/${articleId}.${format}` });
  }

  // Annotations
  async getAnnotations(_articleId: string): Promise<ApiResponse<Annotation[]>> {
    return this.mockResponse([]);
  }

  async createAnnotation(input: CreateAnnotationInput): Promise<ApiResponse<Annotation>> {
    const annotation: Annotation = {
      id: `annotation-${Date.now()}`,
      articleId: input.articleId,
      userId: this.mockUser.id,
      type: input.type,
      text: input.text,
      note: input.note,
      color: input.color,
      position: input.position,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return this.mockResponse(annotation);
  }

  async updateAnnotation(_id: string, updates: Partial<Annotation>): Promise<ApiResponse<Annotation>> {
    const annotation: Annotation = {
      id: `annotation-${Date.now()}`,
      articleId: 'mock-article',
      userId: this.mockUser.id,
      type: updates.type || AnnotationType.HIGHLIGHT,
      text: updates.text || '',
      position: updates.position || { startOffset: 0, endOffset: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return this.mockResponse(annotation);
  }

  async deleteAnnotation(_id: string): Promise<ApiResponse<void>> {
    return this.mockResponse(undefined);
  }

  // Storage
  async getStorageConnections(): Promise<ApiResponse<StorageConnection[]>> {
    return this.mockResponse([]);
  }

  async initiateStorageOAuth(provider: StorageProvider): Promise<ApiResponse<{ authUrl: string; state: string }>> {
    return this.mockResponse({
      authUrl: `https://oauth.example.com/authorize?provider=${provider}`,
      state: 'mock-state'
    });
  }

  async completeStorageOAuth(provider: StorageProvider, _code: string, _state: string): Promise<ApiResponse<StorageConnection>> {
    const connection: StorageConnection = {
      id: `connection-${Date.now()}`,
      userId: this.mockUser.id,
      provider,
      providerUserId: 'provider-user-id',
      email: 'user@example.com',
      displayName: 'User Name',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return this.mockResponse(connection);
  }

  async disconnectStorage(_connectionId: string): Promise<ApiResponse<void>> {
    return this.mockResponse(undefined);
  }

  async syncStorageQuota(connectionId: string): Promise<ApiResponse<StorageConnection>> {
    const connection: StorageConnection = {
      id: connectionId,
      userId: this.mockUser.id,
      provider: StorageProvider.GOOGLE_DRIVE,
      providerUserId: 'provider-user-id',
      email: 'user@example.com',
      displayName: 'User Name',
      isActive: true,
      quotaUsed: 1024 * 1024 * 500, // 500 MB
      quotaTotal: 1024 * 1024 * 1024 * 15, // 15 GB
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return this.mockResponse(connection);
  }

  // Subscriptions
  async getSubscription(): Promise<ApiResponse<Subscription>> {
    const subscription: Subscription = {
      id: 'sub-1',
      userId: this.mockUser.id,
      tier: SubscriptionTier.FREE,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return this.mockResponse(subscription);
  }

  async createCheckoutSession(_priceId: string): Promise<ApiResponse<{ sessionId: string; url: string }>> {
    return this.mockResponse({
      sessionId: 'mock-session-id',
      url: 'https://checkout.stripe.com/mock-session'
    });
  }

  async createPortalSession(): Promise<ApiResponse<{ url: string }>> {
    return this.mockResponse({ url: 'https://billing.stripe.com/mock-portal' });
  }

  async cancelSubscription(): Promise<ApiResponse<Subscription>> {
    return this.getSubscription();
  }

  // Settings
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    const settings: UserSettings = {
      userId: this.mockUser.id,
      theme: 'auto',
      fontSize: 16,
      fontFamily: 'system-ui',
      readingWidth: 'normal',
      autoArchive: false,
      defaultTags: [],
      notifications: {
        email: true,
        push: false,
        digest: 'weekly'
      },
      snapshot: {
        autoGenerate: false,
        defaultFormat: 'pdf',
        uploadToCloud: true,
        embedAssets: true
      }
    };
    return this.mockResponse(settings);
  }

  async updateSettings(_settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    return this.getSettings();
  }

  // Analytics
  async getAnalytics(): Promise<ApiResponse<UserAnalytics>> {
    const analytics: UserAnalytics = {
      userId: this.mockUser.id,
      totalArticles: 42,
      articlesRead: 28,
      totalReadingTime: 540,
      favoriteArticles: 12,
      tagUsage: { typescript: 15, javascript: 20, react: 10 },
      readingStreak: 7
    };
    return this.mockResponse(analytics);
  }

  async trackReadingProgress(_articleId: string, _progress: number): Promise<ApiResponse<void>> {
    return this.mockResponse(undefined);
  }

  // Tags
  async getTags(): Promise<ApiResponse<string[]>> {
    return this.mockResponse(['typescript', 'javascript', 'react', 'node.js', 'programming']);
  }

  async getTagStats(): Promise<ApiResponse<Record<string, number>>> {
    return this.mockResponse({
      typescript: 15,
      javascript: 20,
      react: 10,
      'node.js': 8,
      programming: 25
    });
  }
}
