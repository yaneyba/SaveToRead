# Getting Started with SaveToRead

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/SaveToRead.git
cd SaveToRead

# Install root dependencies
npm install
```

### 2. Set Up Development Environment

#### Install Wrangler CLI
```bash
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

#### Create KV Namespaces (Development)
```bash
cd workers

# Create development KV namespaces
wrangler kv:namespace create "ARTICLES" --preview
wrangler kv:namespace create "USERS" --preview
wrangler kv:namespace create "OAUTH_TOKENS" --preview
wrangler kv:namespace create "SESSIONS" --preview
```

Update `workers/wrangler.toml` with the preview IDs.

#### Set Up Environment Variables

**Workers:**
```bash
cd workers
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` with your development credentials:
```bash
JWT_SECRET=dev-secret-change-in-production
GOOGLE_CLIENT_ID=your-dev-google-client-id
GOOGLE_CLIENT_SECRET=your-dev-google-client-secret
DROPBOX_CLIENT_ID=your-dev-dropbox-client-id
DROPBOX_CLIENT_SECRET=your-dev-dropbox-client-secret
ONEDRIVE_CLIENT_ID=your-dev-onedrive-client-id
ONEDRIVE_CLIENT_SECRET=your-dev-onedrive-client-secret
STRIPE_SECRET_KEY=sk_test_your-test-key
STRIPE_WEBHOOK_SECRET=whsec_your-test-webhook-secret
APP_URL=http://localhost:3000
API_URL=http://localhost:8787
ENCRYPTION_KEY=$(openssl rand -base64 32)
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```bash
VITE_API_URL=http://localhost:8787
VITE_GOOGLE_CLIENT_ID=your-dev-google-client-id
VITE_DROPBOX_CLIENT_ID=your-dev-dropbox-client-id
VITE_ONEDRIVE_CLIENT_ID=your-dev-onedrive-client-id
VITE_STRIPE_PUBLIC_KEY=pk_test_your-test-key
```

### 3. Start Development Servers

**Terminal 1 - Workers:**
```bash
cd workers
npm install
npm run dev
# API running at http://localhost:8787
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:3000
```

### 4. Test the Application

Open http://localhost:3000 in your browser.

**Create an account:**
1. Click "Sign Up"
2. Enter email, password, and display name
3. Click "Create Account"

**Add your first article:**
1. Enter a URL in the "Add Article" input
2. Click "Add Article"
3. Your article appears in the list

## Project Structure

```
SaveToRead/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── providers/     # Data providers
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── public/            # Static assets
│   ├── package.json
│   ├── vite.config.ts     # Vite configuration
│   └── tsconfig.json      # TypeScript config
│
├── workers/               # Cloudflare Workers
│   ├── src/
│   │   ├── routes/        # API routes
│   │   │   ├── auth.ts
│   │   │   ├── articles.ts
│   │   │   ├── storage.ts
│   │   │   ├── subscription.ts
│   │   │   ├── settings.ts
│   │   │   └── analytics.ts
│   │   ├── services/      # Business logic
│   │   │   └── oauth/     # OAuth implementations
│   │   ├── middleware/    # Middleware functions
│   │   ├── utils/         # Utility functions
│   │   ├── durable-objects/ # Durable Objects
│   │   ├── types/         # TypeScript types
│   │   └── index.ts       # Entry point
│   ├── wrangler.toml      # Wrangler config
│   └── package.json
│
├── shared/                # Shared types
│   ├── src/
│   │   └── types/
│   │       └── index.ts   # All shared types
│   └── package.json
│
└── docs/                  # Documentation
    ├── ARCHITECTURE.md
    ├── SECURITY.md
    ├── DEPLOYMENT.md
    └── GETTING_STARTED.md
```

## Understanding the DataProvider Pattern

The DataProvider pattern is central to this application's architecture.

### What is it?

The DataProvider is an abstraction layer that sits between your React components and the backend API. It defines a consistent interface for all data operations.

### Why use it?

1. **Testability**: Easy to swap with mock data for tests
2. **Flexibility**: Switch between different backends without changing components
3. **Type Safety**: Full TypeScript support
4. **Separation of Concerns**: Components focus on UI, providers handle data

### How it works

**1. Interface Definition** (`IDataProvider.ts`):
```typescript
interface IDataProvider {
  signIn(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>>;
  createArticle(input: CreateArticleInput): Promise<ApiResponse<Article>>;
  // ... more methods
}
```

**2. Implementation** (`ApiDataProvider.ts`):
```typescript
class ApiDataProvider implements IDataProvider {
  async signIn(email: string, password: string) {
    return this.post('/auth/signin', { email, password });
  }

  async createArticle(input: CreateArticleInput) {
    return this.post('/articles', input);
  }
}
```

**3. Factory** (`DataProviderFactory.ts`):
```typescript
class DataProviderFactory {
  static getInstance(): IDataProvider {
    // Returns API or Mock provider based on config
    return new ApiDataProvider(config);
  }
}
```

**4. Usage in Components**:
```typescript
function ArticleList() {
  const dataProvider = useDataProvider();
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    async function loadArticles() {
      const response = await dataProvider.listArticles();
      if (response.success) {
        setArticles(response.data.items);
      }
    }
    loadArticles();
  }, [dataProvider]);

  return <div>{/* Render articles */}</div>;
}
```

## Common Development Tasks

### Adding a New API Endpoint

**1. Define types in shared package:**
```typescript
// shared/src/types/index.ts
export interface Tag {
  name: string;
  count: number;
}
```

**2. Add to IDataProvider:**
```typescript
// frontend/src/providers/IDataProvider.ts
interface IDataProvider {
  getTags(): Promise<ApiResponse<Tag[]>>;
}
```

**3. Implement in ApiDataProvider:**
```typescript
// frontend/src/providers/ApiDataProvider.ts
async getTags(): Promise<ApiResponse<Tag[]>> {
  return this.get<Tag[]>('/tags');
}
```

**4. Implement in MockDataProvider:**
```typescript
// frontend/src/providers/MockDataProvider.ts
async getTags(): Promise<ApiResponse<Tag[]>> {
  return this.mockResponse([
    { name: 'typescript', count: 15 },
    { name: 'react', count: 10 }
  ]);
}
```

**5. Create Workers route:**
```typescript
// workers/src/routes/tags.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/', async (c) => {
  const userId = c.get('userId');
  // Implement logic
  return c.json({ success: true, data: tags });
});

export { app as tagRoutes };
```

**6. Register route:**
```typescript
// workers/src/index.ts
import { tagRoutes } from './routes/tags';

app.route('/api/tags', tagRoutes);
```

### Adding a New Component

```bash
cd frontend/src/components

# Create new component
touch TagCloud.tsx
```

```typescript
// TagCloud.tsx
import { useState, useEffect } from 'react';
import { useDataProvider } from '../providers/DataProviderFactory';

export function TagCloud() {
  const dataProvider = useDataProvider();
  const [tags, setTags] = useState([]);

  useEffect(() => {
    async function loadTags() {
      const response = await dataProvider.getTags();
      if (response.success) {
        setTags(response.data);
      }
    }
    loadTags();
  }, [dataProvider]);

  return (
    <div className="tag-cloud">
      {tags.map(tag => (
        <span key={tag.name} className="tag">
          {tag.name} ({tag.count})
        </span>
      ))}
    </div>
  );
}
```

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Workers tests
cd workers
npm test

# Type checking
npm run type-check --workspaces
```

### Debugging

**Frontend:**
```typescript
// Enable React DevTools
// Install browser extension

// Debug data provider calls
const dataProvider = useDataProvider();
console.log('Fetching articles...');
const response = await dataProvider.listArticles();
console.log('Response:', response);
```

**Workers:**
```bash
# Stream logs in real-time
wrangler tail

# With pretty formatting
wrangler tail --format pretty

# Filter by status
wrangler tail --status error
```

## Next Steps

1. **Read the Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **Review Security**: See [SECURITY.md](./SECURITY.md)
3. **Deploy to Production**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
4. **Customize the UI**: Edit components in `frontend/src/components`
5. **Add Features**: Follow the patterns established in existing code

## Getting Help

- Check [GitHub Issues](https://github.com/yourusername/SaveToRead/issues)
- Read [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- Consult [Hono Documentation](https://hono.dev/)
- Review [React Documentation](https://react.dev/)

## Tips for Success

1. **Start Small**: Get the basics working before adding features
2. **Test Often**: Use the MockDataProvider for fast iteration
3. **Follow Patterns**: Consistent code is maintainable code
4. **TypeScript**: Let the type system help you
5. **Security First**: Never commit secrets, always validate inputs
6. **Document Changes**: Update docs when adding features
