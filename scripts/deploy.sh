#!/bin/bash

# SaveToRead Deployment Script
# Builds and deploys the application to Cloudflare Pages and/or Workers
#
# Usage:
#   ./scripts/deploy.sh           # Deploy both frontend and workers
#   ./scripts/deploy.sh frontend  # Deploy frontend only
#   ./scripts/deploy.sh workers   # Deploy workers only
#   ./scripts/deploy.sh all       # Deploy both (explicit)
#   ./scripts/deploy.sh --force   # Force fresh deployment (no cache)

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse arguments
DEPLOY_TARGET="${1:-all}"
FORCE_DEPLOY=false

# Check for --force flag
if [[ "$1" == "--force" ]] || [[ "$2" == "--force" ]]; then
  FORCE_DEPLOY=true
  if [[ "$1" == "--force" ]]; then
    DEPLOY_TARGET="${2:-all}"
  fi
fi

case "$DEPLOY_TARGET" in
  frontend|workers|extension|all|both)
    ;;
  *)
    echo -e "${RED}❌ Invalid deployment target: $DEPLOY_TARGET${NC}"
    echo "Usage: $0 [frontend|workers|extension|all|both] [--force]"
    echo ""
    echo "Options:"
    echo "  frontend   Deploy frontend only"
    echo "  workers    Deploy workers only"
    echo "  extension  Build extension only"
    echo "  all/both   Deploy all (default)"
    echo "  --force    Force fresh deployment bypassing cache"
    exit 1
    ;;
esac

# Normalize 'both' to 'all'
if [ "$DEPLOY_TARGET" = "both" ]; then
  DEPLOY_TARGET="all"
fi

# Set deployment flags
CACHE_FLAGS=""
if [ "$FORCE_DEPLOY" = true ]; then
  CACHE_FLAGS="--commit-dirty=true"
  echo -e "${YELLOW}⚡ Force deployment mode enabled (bypassing cache)${NC}"
fi

echo "🚀 SaveToRead Deployment Starting..."
echo -e "${YELLOW}📋 Target: $DEPLOY_TARGET${NC}"
echo ""

# Function to deploy frontend
deploy_frontend() {
  local start_time=$(date +%s)
  
  echo -e "${BLUE}📦 Building frontend application...${NC}"
  
  # Clean build artifacts
  cd frontend
  rm -rf dist .wrangler node_modules/.vite
  
  npm run build
  cd ..

  if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ Frontend build successful${NC}"
  else
      echo -e "${RED}❌ Frontend build failed${NC}"
      exit 1
  fi

  echo ""
  echo -e "${BLUE}🌍 Deploying to Cloudflare Pages...${NC}"
  cd frontend
  WRANGLER_LOG=none wrangler pages deploy dist --project-name=savetoread $CACHE_FLAGS
  cd ..

  if [ $? -eq 0 ]; then
      local end_time=$(date +%s)
      local duration=$((end_time - start_time))
      echo -e "${GREEN}✅ Frontend deployment successful (${duration}s)${NC}"
      echo "🔗 Production: https://savetoread.pages.dev"
      echo "🔗 Dev: https://dev.savetoread.pages.dev"
  else
      echo -e "${RED}❌ Frontend deployment failed${NC}"
      exit 1
  fi
}

# Function to deploy workers
deploy_workers() {
  local start_time=$(date +%s)
  
  echo -e "${BLUE}📦 Deploying Workers API...${NC}"
  cd workers
  WRANGLER_LOG=none wrangler deploy
  cd ..

  if [ $? -eq 0 ]; then
      local end_time=$(date +%s)
      local duration=$((end_time - start_time))
      echo -e "${GREEN}✅ Workers deployment successful (${duration}s)${NC}"
      echo "🔗 API URL: https://savetoread-api.yeb404974.workers.dev"
  else
      echo -e "${RED}❌ Workers deployment failed${NC}"
      exit 1
  fi
}

# Function to build extension
build_extension() {
  local start_time=$(date +%s)
  
  echo -e "${BLUE}🔌 Building browser extension...${NC}"
  
  # Clean build artifacts
  cd extension
  rm -rf dist
  mkdir -p dist
  
  # Copy extension files to dist
  cp manifest.json dist/
  cp background.js dist/
  cp -r popup dist/
  cp -r icons dist/
  
  cd ..

  if [ $? -eq 0 ]; then
      local end_time=$(date +%s)
      local duration=$((end_time - start_time))
      echo -e "${GREEN}✅ Extension build successful (${duration}s)${NC}"
      echo "📁 Built extension available in: extension/dist/"
      echo ""
      echo "📦 To test the extension:"
      echo "  Chrome: chrome://extensions → Load unpacked → Select extension/dist"
      echo "  Firefox: about:debugging → Load Temporary Add-on → Select extension/dist/manifest.json"
  else
      echo -e "${RED}❌ Extension build failed${NC}"
      exit 1
  fi
}

# Record total start time
TOTAL_START=$(date +%s)

# Execute deployments based on target
if [ "$DEPLOY_TARGET" = "frontend" ]; then
  deploy_frontend
elif [ "$DEPLOY_TARGET" = "workers" ]; then
  deploy_workers
elif [ "$DEPLOY_TARGET" = "extension" ]; then
  build_extension
else
  # Deploy all
  deploy_frontend
  echo ""
  deploy_workers
  echo ""
  build_extension
fi

# Calculate total time
TOTAL_END=$(date +%s)
TOTAL_DURATION=$((TOTAL_END - TOTAL_START))

echo ""
echo -e "${GREEN}🎉 Deployment Complete! (Total: ${TOTAL_DURATION}s)${NC}"
echo ""
echo "📋 Quick Tests:"
echo "  • Homepage: curl -I https://savetoread.pages.dev"
echo "  • API Health: curl https://savetoread-api.yeb404974.workers.dev/api/articles"
echo ""
echo "📊 Monitoring:"
echo "  • Logs: wrangler tail (Workers) or wrangler pages deployment tail (Pages)"
echo "  • Dashboard: https://dash.cloudflare.com"
echo ""
