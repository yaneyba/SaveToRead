# Deployment Scripts

## Quick Deploy Script

### Usage

```bash
# Deploy frontend to dev
./scripts/deploy.sh frontend dev

# Deploy workers to dev
./scripts/deploy.sh workers dev

# Deploy everything to dev
./scripts/deploy.sh all dev

# Deploy to production
./scripts/deploy.sh frontend prod
./scripts/deploy.sh workers prod
./scripts/deploy.sh all prod
```

### Features

- ✅ Clean build artifacts before deployment
- ✅ Validates git status for production deploys
- ✅ Confirms production deployments
- ✅ Color-coded output
- ✅ Separate dev/prod environments
- ✅ Error handling

### Examples

**Deploy only frontend to development:**
```bash
./scripts/deploy.sh frontend dev
```

**Deploy everything to production:**
```bash
git checkout main
git pull origin main
./scripts/deploy.sh all prod
```

### Notes

- Production deploys require being on `main` branch
- Script warns about uncommitted changes
- Cleans `.wrangler`, `dist`, and Vite cache before building
- Uses proper branch names for Cloudflare Pages deployments
