# SaveToRead - Modern Save-To-Read Application

A full-stack save-to-read application built with Vite, React, TypeScript, and Cloudflare Workers using an npm workspaces monorepo architecture.

## Architecture

### Frontend
- **Framework**: Vite + React + TypeScript
- **Hosting**: Cloudflare Pages
- **State Management**: React Context + Hooks
- **Data Access**: DataProvider Factory Pattern

### Backend
- **Runtime**: Cloudflare Workers with Hono framework
- **Storage**: Cloudflare KV + Durable Objects
- **OAuth Providers**: Google Drive, Dropbox, OneDrive
- **Payments**: Stripe Integration

### Monorepo Structure (NPM Workspaces)
- **Single `node_modules`** at root for all workspaces
- **Shared types** package used by frontend and workers
- **Consistent versioning** across all dependencies

## Project Structure

```
SaveToRead/
├── node_modules/          # Hoisted dependencies (all workspaces)
├── package.json           # Root package with workspace config
├── package-lock.json      # Lockfile for all workspaces
├── frontend/              # Vite + React frontend workspace
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── providers/     # Data provider implementations
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # Main app component
│   ├── dist/              # Build output (gitignored)
│   ├── package.json       # Frontend dependencies
│   └── vite.config.ts     # Vite configuration
├── workers/               # Cloudflare Workers workspace
│   ├── src/
│   │   ├── routes/        # API routes (Hono)
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Auth & validation middleware
│   │   └── index.ts       # Worker entry point
│   ├── wrangler.toml      # Cloudflare Workers config
│   └── package.json       # Workers dependencies
├── shared/                # Shared types workspace
│   ├── src/
│   │   └── types/
│   │       └── index.ts   # TypeScript interfaces & types
│   ├── dist/              # Compiled types (gitignored)
│   └── package.json       # Shared package config
├── extension/             # Browser extension
│   ├── manifest.json      # Extension manifest (v3)
│   ├── background.js      # Service worker
│   ├── popup/             # Extension popup UI
│   └── icons/             # Extension icons
└── docs/                  # Documentation
    ├── ARCHITECTURE.md
    ├── DEPLOYMENT.md
    ├── GETTING_STARTED.md
    ├── SECURITY.md
    └── LANDING_PAGE.md

```

## Vision

**Save articles, create snapshots, and store everything in your own cloud storage.**

Google Drive, Dropbox, or OneDrive—you choose where your data lives.

## Features

### Core Features (Free Forever)
- 📚 Save and organize articles with tags
- 🖱️ **Browser extension** with right-click context menu
- 📄 Offline snapshots (PDF/HTML) stored in **your cloud storage**
- ☁️ Cloud storage integration (Google Drive, Dropbox, OneDrive)
- ✍️ Reading interface with focus mode
- 🔐 Secure OAuth-based storage linking
- 📤 Full data export and portability

### Premium Features ($3/month)
- 🔄 Multiple cloud storage connections (backup to 2+ clouds)
- 📑 Advanced snapshot formats (EPUB, Markdown)
- ⚡ Priority snapshot processing queue
- 🔧 Bulk operations (re-snapshot, re-tag, export)
- 🔌 API access for automation

### Roadmap
See [docs/ROADMAP.md](./docs/ROADMAP.md) for our product roadmap and vision.

## Getting Started

### Prerequisites
- **Node.js** 18+ (with npm)
- **Wrangler CLI** for Cloudflare Workers
- **Cloudflare account** (free tier works)

### Installation

```bash
# Clone repository
git clone https://github.com/yaneyba/SaveToRead.git
cd SaveToRead

# Install all workspace dependencies (single command!)
npm install
```

> **Note**: With npm workspaces, a single `npm install` at the root installs dependencies for all workspaces (frontend, workers, shared) into one `node_modules` directory.

### Environment Setup

**Frontend** (`frontend/.env`):
```bash
cd frontend
cp .env.example .env
# Edit .env with your API URL and OAuth client IDs
```

**Workers** (`workers/.dev.vars`):
```bash
cd workers
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your secrets and API keys
```

## Development

### Start Development Servers

**Option 1: Run from root using npm workspaces**
```bash
# Frontend (from root)
npm run dev

# Workers (from root, separate terminal)
npm run dev:workers
```

**Option 2: Run from individual workspaces**
```bash
# Terminal 1 - Frontend
cd frontend
npm run dev
# Runs on http://localhost:5173

# Terminal 2 - Workers
cd workers
npm run dev
# Runs on http://localhost:8787
```

### Build & Type Checking

```bash
# Build all workspaces
npm run build

# Type check all workspaces
npm run type-check

# Lint all workspaces
npm run lint
```

## Deployment

### Deploy Everything

```bash
# From root - deploys both frontend and workers
npm run deploy:frontend
npm run deploy:workers
```

### Frontend (Cloudflare Pages)
```bash
# Build and deploy
npm run deploy:frontend

# Or manually
cd frontend
npm run build
wrangler pages deploy dist --project-name=savetoread
```

**Production URLs:**
- Frontend: https://savetoread.pages.dev
- Workers API: https://savetoread-api.yeb404974.workers.dev

### Workers (Cloudflare Workers)
```bash
# Deploy from root
npm run deploy:workers

# Or from workers directory
cd workers
npm run deploy
```

## Security Best Practices

1. **OAuth Token Storage**: Encrypted in Workers KV with user-specific keys
2. **API Authentication**: JWT-based with short expiry times
3. **Storage Proxying**: All cloud storage requests go through Workers (no direct client access)
4. **Content Security Policy**: Strict CSP headers on all pages
5. **Rate Limiting**: Implemented at Worker level using Durable Objects

## Cost Optimization

1. **Workers KV**: Cache frequently accessed metadata
2. **Durable Objects**: Use for session management and rate limiting only
3. **R2**: Consider for large file caching (optional)
4. **CDN Caching**: Aggressive caching for static assets
5. **Bundling**: Code splitting and lazy loading

## License

MIT
