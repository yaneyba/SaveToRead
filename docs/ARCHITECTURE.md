# ReadItLater Architecture

## Overview

ReadItLater is a modern read-it-later application built with a serverless-first architecture using Cloudflare's edge computing platform. The application follows clean architecture principles with clear separation of concerns between frontend, backend, and data layers.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Hosting**: Cloudflare Pages
- **State Management**: React Context + Hooks
- **Data Access Pattern**: DataProvider Factory Pattern

### Backend
- **Runtime**: Cloudflare Workers (Edge Computing)
- **API Framework**: Hono (lightweight, fast)
- **Storage**: Workers KV (metadata), Durable Objects (sessions, rate limiting)
- **Authentication**: JWT-based with jose library
- **Payments**: Stripe API

### External Integrations
- **Cloud Storage**: Google Drive, Dropbox, OneDrive (OAuth 2.0)
- **Billing**: Stripe Checkout & Customer Portal

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Vite + React + TypeScript                    │ │
│  │                                                         │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │        DataProvider Factory Pattern              │ │ │
│  │  │  ┌─────────────┐    ┌──────────────┐            │ │ │
│  │  │  │IDataProvider│◄───│ApiDataProvider│            │ │ │
│  │  │  └─────────────┘    └──────────────┘            │ │ │
│  │  │         ▲                  │                     │ │ │
│  │  │         │                  │                     │ │ │
│  │  │    ┌────┴────┐             │                     │ │ │
│  │  │    │MockData │             │                     │ │ │
│  │  │    │Provider │             │                     │ │ │
│  │  │    └─────────┘             │                     │ │ │
│  │  └────────────────────────────┼──────────────────── │ │ │
│  │                                │                     │ │ │
│  │  Components: ArticleList, Reader, Settings, etc.    │ │ │
│  └────────────────────────────────┼───────────────────────┘ │
└─────────────────────────────────── ┼───────────────────────┘
                                     │ HTTPS/JSON
                                     │
┌────────────────────────────────────▼─────────────────────────┐
│                    Cloudflare Workers                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  Hono API Framework                     │  │
│  │                                                         │  │
│  │  Routes:                                                │  │
│  │  ├─ /auth          (signup, signin, token refresh)     │  │
│  │  ├─ /api/articles  (CRUD, snapshots)                   │  │
│  │  ├─ /api/storage   (OAuth, file operations)            │  │
│  │  ├─ /api/subscription (Stripe integration)             │  │
│  │  ├─ /api/settings  (user preferences)                  │  │
│  │  └─ /api/analytics (reading stats, tracking)           │  │
│  │                                                         │  │
│  │  Middleware:                                            │  │
│  │  ├─ Auth (JWT verification)                            │  │
│  │  ├─ CORS                                               │  │
│  │  ├─ Error Handler                                      │  │
│  │  └─ Rate Limiting (via Durable Objects)               │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                    │                 │
        ┌───────────┼─────────────────┼──────────────┐
        │           │                 │              │
        ▼           ▼                 ▼              ▼
  ┌─────────┐ ┌─────────┐     ┌──────────┐   ┌──────────────┐
  │Workers  │ │ Durable │     │  OAuth   │   │   External   │
  │   KV    │ │ Objects │     │ Services │   │   Services   │
  │         │ │         │     │          │   │              │
  │ - Users │ │-Rate    │     │- Google  │   │  - Stripe    │
  │ - Articles│ Limiter │     │  Drive   │   │  - Article   │
  │ - OAuth │ │- Reading│     │- Dropbox │   │    Parser    │
  │  Tokens │ │ Session │     │- OneDrive│   │              │
  └─────────┘ └─────────┘     └──────────┘   └──────────────┘
                                     │
                                     │ OAuth 2.0
                                     │
                         ┌───────────▼────────────┐
                         │   User's Cloud Storage │
                         │  (Google/Dropbox/One)  │
                         │                        │
                         │  - Article snapshots   │
                         │  - PDF/HTML exports    │
                         └────────────────────────┘
```

## Data Flow

### 1. Authentication Flow

```
User → Frontend → ApiDataProvider → Workers /auth/signin
                                    ├─ Verify credentials (KV)
                                    ├─ Generate JWT token
                                    └─ Return user + token
                                         │
Frontend ← token stored in localStorage ┘
```

### 2. Article Creation Flow

```
User adds URL → Frontend → ApiDataProvider → Workers /api/articles
                                             ├─ Verify JWT
                                             ├─ Parse article content
                                             ├─ Store in KV
                                             └─ Return article object
```

### 3. Cloud Storage OAuth Flow

```
User clicks "Link Google Drive" → Frontend → Workers /api/storage/oauth/initiate
                                              ├─ Generate state token
                                              ├─ Store state in KV (10 min TTL)
                                              └─ Return authorization URL
                                                   │
User redirected to Google OAuth ─────────────────┘
                                                   │
User authorizes ───────────────────────────────────┘
                                                   │
Callback with code → Frontend → Workers /api/storage/oauth/callback
                                 ├─ Verify state
                                 ├─ Exchange code for tokens
                                 ├─ Encrypt tokens with AES-GCM
                                 ├─ Store encrypted tokens in KV
                                 └─ Return connection object
```

### 4. Snapshot Generation Flow

```
User clicks "Save as PDF" → Frontend → Workers /api/articles/{id}/snapshot
                                       ├─ Verify ownership
                                       ├─ Get article content
                                       ├─ Generate PDF
                                       ├─ Get user's cloud storage tokens
                                       ├─ Upload to cloud storage
                                       ├─ Update article with snapshot URL
                                       └─ Return snapshot URL
```

## DataProvider Pattern

The DataProvider pattern is the cornerstone of the frontend architecture. It provides:

### Benefits

1. **Abstraction**: Components don't need to know where data comes from
2. **Testability**: Easy to swap with MockDataProvider for testing
3. **Flexibility**: Can switch between API, localStorage, or other implementations
4. **Type Safety**: Full TypeScript support with shared types

### Interface Definition

```typescript
interface IDataProvider {
  // Authentication
  signIn(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>>;
  signUp(email: string, password: string, displayName: string): Promise<ApiResponse<{ user: User; token: string }>>;

  // Articles
  listArticles(params?: ListArticlesParams): Promise<ApiResponse<PaginatedResponse<Article>>>;
  createArticle(input: CreateArticleInput): Promise<ApiResponse<Article>>;

  // Storage
  getStorageConnections(): Promise<ApiResponse<StorageConnection[]>>;
  initiateStorageOAuth(provider: StorageProvider): Promise<ApiResponse<{ authUrl: string; state: string }>>;

  // ... and more
}
```

### Factory Pattern

```typescript
class DataProviderFactory {
  static getInstance(): IDataProvider {
    // Returns singleton instance based on configuration
    // Can be API, Mock, or other implementations
  }
}
```

### Usage in Components

```typescript
function ArticleList() {
  const dataProvider = useDataProvider();
  const { articles, loading } = useArticles(); // Uses dataProvider internally

  // Component doesn't know or care about implementation details
}
```

## Storage Strategy

### Workers KV Usage

Workers KV is used for:
- User metadata and credentials
- Article metadata (title, tags, progress)
- OAuth tokens (encrypted)
- Session data

**Key Patterns:**
- `user:{userId}` - User profile
- `user:{userId}:articles` - List of article IDs
- `article:{articleId}` - Article metadata
- `connection:{connectionId}:tokens` - Encrypted OAuth tokens

### Durable Objects Usage

Durable Objects provide strong consistency for:
- **RateLimiter**: Distributed rate limiting per user/IP
- **ReadingSession**: Real-time reading progress sync via WebSockets

### External Storage (User's Cloud)

Large files are stored in the user's own cloud storage:
- Article snapshots (PDF/HTML)
- Exported collections
- Attachments

**Benefits:**
- No storage costs for the application
- User owns their data
- Leverage existing cloud quotas

## Security Architecture

### Authentication

- **JWT Tokens**: Short-lived (7 days), signed with HS256
- **Token Storage**: localStorage on client, never in KV
- **Password Hashing**: SHA-256 (demo - use bcrypt/argon2 in production)

### OAuth Token Management

1. **Encryption**: All OAuth tokens encrypted with AES-GCM before storage
2. **Key Derivation**: PBKDF2 with 100,000 iterations
3. **Per-User Keys**: Unique encryption keys derived from master key + user ID
4. **No Direct Access**: Frontend never sees OAuth tokens
5. **Proxy Pattern**: All cloud storage requests go through Workers

### API Security

- **CORS**: Configured per environment
- **Rate Limiting**: Via Durable Objects
- **Input Validation**: All inputs validated and sanitized
- **Error Handling**: Generic error messages (no information leakage)

## Scalability Considerations

### Edge Computing Benefits

- **Global Distribution**: Workers run in 200+ locations
- **Low Latency**: Responses from nearest edge location
- **Auto-scaling**: Handles traffic spikes automatically
- **No Cold Starts**: Workers have minimal startup time

### Performance Optimizations

1. **KV Caching**: Frequently accessed data cached at the edge
2. **Pagination**: All list endpoints support pagination
3. **Code Splitting**: Frontend bundles split by route
4. **Lazy Loading**: Components loaded on demand
5. **CDN Caching**: Static assets cached globally

### Limitations & Solutions

| Limitation | Impact | Solution |
|-----------|--------|----------|
| KV eventual consistency | Article list may be stale | Use Durable Objects for critical operations |
| Workers 50ms CPU time | Long-running tasks fail | Offload to external services |
| KV 25 MiB value limit | Large content storage | Store in user's cloud storage |
| 100k requests/day (free) | API rate limiting | Implement caching, upgrade plan |

## Cost Optimization

### Cloudflare Costs

**Workers (Bundled Plan - $5/mo):**
- 10M requests/month included
- Additional: $0.50/million requests

**KV:**
- Storage: $0.50/GB-month
- Reads: $0.50/10M reads
- Writes: $5/million writes

**Durable Objects:**
- Requests: $0.15/million requests
- Duration: $12.50/million GB-seconds

### Optimization Strategies

1. **Minimize KV Writes**: Batch updates where possible
2. **Cache Aggressively**: Use KV as a cache with TTLs
3. **Lazy Loading**: Only fetch data when needed
4. **Compression**: Compress large values before storing in KV
5. **User Storage**: Store large files in user's cloud (zero cost)

### Estimated Monthly Costs

**For 1,000 active users:**
- Workers: $5 (bundled plan)
- KV: ~$2 (storage + reads)
- Durable Objects: ~$3 (rate limiting)
- **Total: ~$10/month**

**For 10,000 active users:**
- Workers: ~$15 ($5 + $10 overage)
- KV: ~$10
- Durable Objects: ~$15
- **Total: ~$40/month**

## Monitoring & Observability

### Cloudflare Analytics

- Request volume and error rates
- Geographic distribution
- Performance metrics (p50, p95, p99)
- Durable Objects metrics

### Custom Logging

```typescript
// Structured logging in Workers
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  userId,
  action: 'create_article',
  articleId,
  duration: elapsed
}));
```

### Error Tracking

Integration options:
- Sentry (for frontend + workers)
- Cloudflare Workers Analytics
- Custom error logging to external service

## Development Workflow

### Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev  # Runs on http://localhost:3000

# Workers
cd workers
npm install
wrangler dev  # Runs on http://localhost:8787
```

### Testing

```bash
# Frontend unit tests
cd frontend
npm test

# Workers tests
cd workers
npm test

# E2E tests
npm run test:e2e
```

### Deployment

```bash
# Deploy frontend to Cloudflare Pages
cd frontend
npm run deploy

# Deploy workers
cd workers
wrangler deploy
```

## Future Enhancements

1. **Browser Extension**: Save articles from any webpage
2. **Mobile Apps**: Native iOS/Android apps
3. **RSS Feed Integration**: Auto-import from RSS feeds
4. **AI Summaries**: Automatic article summarization
5. **Collaborative Collections**: Share article collections
6. **Offline Mode**: Progressive Web App with service workers
7. **Full-Text Search**: Implement search using Cloudflare R2 + external search service
8. **Export Features**: Export to Notion, Obsidian, etc.
