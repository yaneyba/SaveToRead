# ReadItLater - Modern Read-It-Later Application

A full-stack read-it-later application built with Vite, React, TypeScript, and Cloudflare Workers.

## Architecture

### Frontend
- **Framework**: Vite + React + TypeScript
- **Hosting**: Cloudflare Pages
- **State Management**: React Context + Hooks
- **Data Access**: DataProvider Factory Pattern

### Backend
- **Runtime**: Cloudflare Workers
- **Storage**: Workers KV + Durable Objects
- **OAuth Providers**: Google Drive, Dropbox, OneDrive
- **Payments**: Stripe Integration

## Project Structure

```
ReadItLater/
├── frontend/              # Vite + React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── providers/     # Data provider implementations
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   └── types/         # TypeScript types
│   └── public/
├── workers/               # Cloudflare Workers
│   ├── api/              # API endpoints
│   ├── auth/             # Authentication workers
│   ├── oauth/            # OAuth flow handlers
│   └── storage/          # Storage proxy workers
├── shared/               # Shared types and utilities
│   └── types/
└── docs/                 # Documentation

```

## Features

### Core Features
- 📚 Save and organize articles with tags
- 📄 Offline snapshots (PDF/HTML) stored in user's cloud storage
- ✍️ Reading interface with annotations and highlights
- 🔄 Progress synchronization across devices
- 🔐 Secure OAuth-based storage linking

### Premium Features
- ☁️ Cloud storage integration (Google Drive, Dropbox, OneDrive)
- 📊 Advanced analytics
- 🎨 Custom themes
- 📱 Mobile apps

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- Wrangler CLI (Cloudflare Workers)
- Cloudflare account

### Installation

```bash
# Install dependencies
npm install

# Frontend development
cd frontend
npm run dev

# Workers development
cd workers
wrangler dev
```

### Environment Variables

See `.env.example` files in respective directories.

## Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Workers Development
```bash
cd workers
wrangler dev
```

### Type Checking
```bash
npm run type-check
```

## Deployment

### Frontend (Cloudflare Pages)
```bash
cd frontend
npm run build
wrangler pages deploy dist
```

### Workers
```bash
cd workers
wrangler deploy
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
