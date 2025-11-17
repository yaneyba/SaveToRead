# Deployment Guide

## Overview

This guide covers deploying SaveForLater to production using Cloudflare's ecosystem. The application consists of two main components:
1. **Frontend**: React app hosted on Cloudflare Pages
2. **Workers**: API backend running on Cloudflare Workers

## Prerequisites

### Required Accounts
- Cloudflare account (free tier works for development)
- Stripe account (for payments)
- OAuth app registrations for:
  - Google Cloud Console (Google Drive)
  - Dropbox App Console
  - Microsoft Azure (OneDrive)

### Required Tools
```bash
# Node.js 18 or higher
node --version

# npm or pnpm
npm --version

# Wrangler CLI
npm install -g wrangler

# Git
git --version
```

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/SaveForLater.git
cd SaveForLater
npm install
```

### 2. Configure OAuth Applications

#### Google Drive Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Drive API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://yourdomain.com/oauth/callback` (production)
     - `http://localhost:3000/oauth/callback` (development)
5. Note your `Client ID` and `Client Secret`

#### Dropbox Setup

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Create a new app:
   - Choose "Scoped access"
   - Access type: "Full Dropbox"
   - Name your app
3. Configure OAuth 2:
   - Redirect URIs: Same as Google above
   - Permissions: `files.content.write`, `files.content.read`
4. Note your `App key` and `App secret`

#### OneDrive Setup

1. Go to [Azure Portal](https://portal.azure.com)
2. Register a new application:
   - Name: SaveForLater
   - Supported account types: "Multitenant"
   - Redirect URI: Same as Google above
3. API permissions:
   - Microsoft Graph: `Files.ReadWrite`, `User.Read`
4. Create a client secret
5. Note your `Application (client) ID` and `Client secret`

### 3. Configure Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your API keys:
   - Test: `sk_test_...`
   - Production: `sk_live_...`
3. Create products and prices for subscription tiers
4. Configure webhook endpoint:
   - URL: `https://api.yourdomain.com/webhooks/stripe`
   - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Note your webhook signing secret

## Cloudflare Setup

### 1. Create KV Namespaces

```bash
cd workers

# Create production namespaces
wrangler kv:namespace create "ARTICLES"
wrangler kv:namespace create "USERS"
wrangler kv:namespace create "OAUTH_TOKENS"
wrangler kv:namespace create "SESSIONS"

# Create preview namespaces (for development)
wrangler kv:namespace create "ARTICLES" --preview
wrangler kv:namespace create "USERS" --preview
wrangler kv:namespace create "OAUTH_TOKENS" --preview
wrangler kv:namespace create "SESSIONS" --preview
```

### 2. Update wrangler.toml

Update `workers/wrangler.toml` with your namespace IDs:

```toml
[[kv_namespaces]]
binding = "ARTICLES"
id = "YOUR_ARTICLES_NAMESPACE_ID"
preview_id = "YOUR_ARTICLES_PREVIEW_ID"

[[kv_namespaces]]
binding = "USERS"
id = "YOUR_USERS_NAMESPACE_ID"
preview_id = "YOUR_USERS_PREVIEW_ID"

[[kv_namespaces]]
binding = "OAUTH_TOKENS"
id = "YOUR_OAUTH_TOKENS_NAMESPACE_ID"
preview_id = "YOUR_OAUTH_TOKENS_PREVIEW_ID"

[[kv_namespaces]]
binding = "SESSIONS"
id = "YOUR_SESSIONS_NAMESPACE_ID"
preview_id = "YOUR_SESSIONS_PREVIEW_ID"
```

### 3. Set Environment Variables

#### Development (.dev.vars)

```bash
cd workers
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:
```bash
JWT_SECRET=your-development-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DROPBOX_CLIENT_ID=your-dropbox-client-id
DROPBOX_CLIENT_SECRET=your-dropbox-client-secret
ONEDRIVE_CLIENT_ID=your-onedrive-client-id
ONEDRIVE_CLIENT_SECRET=your-onedrive-client-secret
STRIPE_SECRET_KEY=sk_test_your-stripe-test-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
APP_URL=http://localhost:3000
API_URL=http://localhost:8787
ENCRYPTION_KEY=your-32-char-encryption-key-here
```

#### Production (Wrangler Secrets)

```bash
cd workers

# Set each secret individually
wrangler secret put JWT_SECRET
# Enter your production JWT secret when prompted

wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put DROPBOX_CLIENT_ID
wrangler secret put DROPBOX_CLIENT_SECRET
wrangler secret put ONEDRIVE_CLIENT_ID
wrangler secret put ONEDRIVE_CLIENT_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put ENCRYPTION_KEY

# Non-sensitive variables can go in wrangler.toml
# [env.production.vars]
# APP_URL = "https://yourdomain.com"
# API_URL = "https://api.yourdomain.com"
```

## Deployment

### Development Environment

#### Start Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

#### Start Workers
```bash
cd workers
npm install
wrangler dev
# Runs on http://localhost:8787
```

### Production Deployment

#### 1. Deploy Workers

```bash
cd workers

# Build and deploy
npm run deploy

# Or deploy to specific environment
wrangler deploy --env production
```

**Verify deployment:**
```bash
curl https://your-worker.your-subdomain.workers.dev/health
```

#### 2. Deploy Frontend to Cloudflare Pages

**Option A: Via Wrangler**

```bash
cd frontend

# Build production bundle
npm run build

# Deploy to Pages
wrangler pages deploy dist --project-name=saveforlater
```

**Option B: Via Git Integration**

1. Go to Cloudflare Dashboard → Pages
2. Create a new project
3. Connect your Git repository
4. Configure build settings:
   - Build command: `cd frontend && npm install && npm run build`
   - Build output directory: `frontend/dist`
   - Root directory: `/`
5. Add environment variables:
   ```
   VITE_API_URL=https://your-worker.your-subdomain.workers.dev
   VITE_GOOGLE_CLIENT_ID=...
   VITE_DROPBOX_CLIENT_ID=...
   VITE_ONEDRIVE_CLIENT_ID=...
   VITE_STRIPE_PUBLIC_KEY=...
   ```
6. Deploy

**Option C: Via GitHub Actions**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy-workers:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: |
          cd workers
          npm ci

      - name: Deploy Workers
        run: |
          cd workers
          npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Build
        run: |
          cd frontend
          npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
          VITE_STRIPE_PUBLIC_KEY: ${{ secrets.VITE_STRIPE_PUBLIC_KEY }}

      - name: Deploy to Cloudflare Pages
        run: |
          cd frontend
          npx wrangler pages deploy dist --project-name=saveforlater
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

#### 3. Configure Custom Domain

**Workers:**
1. Go to Cloudflare Dashboard → Workers
2. Select your worker
3. Triggers → Add Custom Domain
4. Enter: `api.yourdomain.com`

**Pages:**
1. Go to Cloudflare Dashboard → Pages
2. Select your project
3. Custom domains → Set up a custom domain
4. Enter: `yourdomain.com` and `www.yourdomain.com`

#### 4. Update OAuth Redirect URIs

Update all OAuth applications with production URLs:
- Google Cloud Console
- Dropbox App Console
- Microsoft Azure Portal

Change redirect URIs from `localhost` to `https://yourdomain.com/oauth/callback`

## Post-Deployment Verification

### 1. Health Check

```bash
# Workers health
curl https://api.yourdomain.com/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-15T12:00:00.000Z"}
```

### 2. Test Authentication

```bash
# Sign up
curl -X POST https://api.yourdomain.com/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","displayName":"Test User"}'

# Expected: 200 with user object and token
```

### 3. Test OAuth Flow

1. Open `https://yourdomain.com` in browser
2. Sign in
3. Go to Settings → Storage
4. Click "Connect Google Drive"
5. Verify OAuth flow completes successfully

### 4. Monitor Logs

```bash
# Stream Workers logs
wrangler tail

# Filter for errors
wrangler tail --status error
```

## Database Migrations

While we use KV (not a traditional database), you may need to migrate data between namespaces or update data structure.

### Example Migration Script

```typescript
// scripts/migrate-articles.ts
import { ARTICLES_OLD, ARTICLES_NEW } from './namespaces';

async function migrateArticles() {
  const keys = await ARTICLES_OLD.list();

  for (const key of keys.keys) {
    const value = await ARTICLES_OLD.get(key.name);
    if (value) {
      const oldArticle = JSON.parse(value);

      // Transform to new structure
      const newArticle = {
        ...oldArticle,
        newField: 'default value'
      };

      await ARTICLES_NEW.put(key.name, JSON.stringify(newArticle));
    }
  }

  console.log(`Migrated ${keys.keys.length} articles`);
}

migrateArticles();
```

## Rollback Procedure

### Workers Rollback

```bash
# List recent deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback --message "Rolling back due to bug"
```

### Pages Rollback

1. Go to Cloudflare Dashboard → Pages
2. Select your project
3. Deployments tab
4. Find previous successful deployment
5. Click "Rollback to this deployment"

## Monitoring & Alerting

### Cloudflare Analytics

1. Workers Dashboard → Analytics
2. Monitor:
   - Request volume
   - Error rates
   - Response times
   - CPU usage

### Custom Alerts

Set up alerts in Cloudflare Dashboard:

**Recommended Alerts:**
- Error rate > 5% (5 minutes)
- Request rate drops > 50% (sudden traffic drop)
- CPU time > 10ms average (performance issue)

### External Monitoring

**Uptime Monitoring:**
```bash
# Use services like:
# - UptimeRobot
# - Pingdom
# - Better Uptime

# Endpoint to monitor:
https://api.yourdomain.com/health
```

**Error Tracking:**
```typescript
// Install Sentry for Workers
import * as Sentry from '@sentry/cloudflare';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: 'production'
});
```

## Performance Optimization

### Frontend

**Build Optimization:**
```bash
# Analyze bundle size
cd frontend
npm run build
npx vite-bundle-visualizer
```

**Cloudflare Pages Settings:**
- Enable "Auto minify" (CSS, JS, HTML)
- Enable Brotli compression
- Set appropriate cache headers

### Workers

**KV Optimization:**
```typescript
// Cache frequently accessed data
const cache = caches.default;
const cacheKey = new Request(`https://cache/user/${userId}`);

// Try cache first
let response = await cache.match(cacheKey);
if (!response) {
  // Fetch from KV
  const data = await env.USERS.get(`user:${userId}`);
  response = new Response(data, {
    headers: { 'Cache-Control': 'max-age=300' }
  });
  await cache.put(cacheKey, response.clone());
}
```

**Code Splitting:**
```typescript
// Lazy load heavy dependencies
const heavyModule = await import('./heavy-module');
```

## Backup & Disaster Recovery

### KV Backup Script

```bash
# scripts/backup-kv.sh
#!/bin/bash

NAMESPACE_ID="your-namespace-id"
BACKUP_DIR="./backups/$(date +%Y%m%d)"

mkdir -p "$BACKUP_DIR"

# List all keys
wrangler kv:key list --namespace-id="$NAMESPACE_ID" > "$BACKUP_DIR/keys.json"

# Download all values (for small datasets)
for key in $(cat "$BACKUP_DIR/keys.json" | jq -r '.[].name'); do
  wrangler kv:key get "$key" --namespace-id="$NAMESPACE_ID" > "$BACKUP_DIR/$key.json"
done
```

### Restore Script

```bash
# scripts/restore-kv.sh
#!/bin/bash

NAMESPACE_ID="your-namespace-id"
BACKUP_DIR="./backups/20240115"

for file in "$BACKUP_DIR"/*.json; do
  key=$(basename "$file" .json)
  if [ "$key" != "keys" ]; then
    wrangler kv:key put "$key" --path="$file" --namespace-id="$NAMESPACE_ID"
  fi
done
```

## Scaling Considerations

### Workers Limits

| Resource | Free | Bundled ($5/mo) | Enterprise |
|----------|------|-----------------|------------|
| Requests | 100k/day | 10M/month | Custom |
| CPU Time | 10ms | 50ms | Custom |
| Script Size | 1 MB | 1 MB | Custom |

### Scaling Strategy

**1. Enable Rate Limiting** (prevents abuse)
**2. Implement Caching** (reduces KV reads)
**3. Use Durable Objects Sparingly** (more expensive)
**4. Optimize Bundle Size** (faster cold starts)
**5. Monitor Usage** (stay within limits)

## Troubleshooting

### Common Issues

**Issue: Workers not accessible**
```bash
# Check deployment status
wrangler deployments list

# Check routes
wrangler routes list

# Verify custom domain DNS
dig api.yourdomain.com
```

**Issue: KV namespace not found**
```bash
# List namespaces
wrangler kv:namespace list

# Verify wrangler.toml IDs match
```

**Issue: OAuth callback fails**
```
Error: Invalid redirect URI

Solution:
1. Verify OAuth app redirect URIs match exactly
2. Check for http vs https
3. Ensure no trailing slashes
```

**Issue: High error rates**
```bash
# Stream logs to debug
wrangler tail --format pretty

# Filter for specific errors
wrangler tail --status error
```

## Support & Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Hono Framework](https://hono.dev/)
- [Stripe API Reference](https://stripe.com/docs/api)
- [OAuth 2.0 Spec](https://oauth.net/2/)

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables set
- [ ] OAuth apps configured
- [ ] Stripe webhooks configured
- [ ] KV namespaces created
- [ ] DNS records configured
- [ ] SSL certificates active

### Deployment
- [ ] Workers deployed successfully
- [ ] Frontend deployed to Pages
- [ ] Custom domains configured
- [ ] Health checks passing
- [ ] OAuth flows tested
- [ ] Payment flows tested

### Post-Deployment
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Backup script scheduled
- [ ] Documentation updated
- [ ] Team notified
- [ ] Changelog published
