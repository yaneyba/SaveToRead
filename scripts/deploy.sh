#!/bin/bash

# SaveToRead Deployment Script
# Builds and deploys the application to Cloudflare Pages and/or Workers
#
# Usage:
#   ./scripts/deploy.sh              # Deploy both frontend and workers
#   ./scripts/deploy.sh frontend     # Deploy frontend only
#   ./scripts/deploy.sh workers      # Deploy workers only
#   ./scripts/deploy.sh extension    # Build extension only
#   ./scripts/deploy.sh all          # Deploy all (explicit)
#   ./scripts/deploy.sh --force      # Force fresh deployment (no cache)
#   ./scripts/deploy.sh --clean      # Clean build artifacts before deploying

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse arguments
DEPLOY_TARGET="${1:-all}"
FORCE_DEPLOY=false
CLEAN_BUILD=false
BUILD_ONLY=false

# Check for flags
for arg in "$@"; do
  case "$arg" in
    --force)
      FORCE_DEPLOY=true
      ;;
    --clean)
      CLEAN_BUILD=true
      ;;
    --build-only)
      BUILD_ONLY=true
      ;;
  esac
done

# Extract target (first non-flag argument)
if [[ "$1" =~ ^-- ]]; then
  DEPLOY_TARGET="${2:-all}"
  if [[ "$2" =~ ^-- ]]; then
    DEPLOY_TARGET="all"
  fi
fi

# Validate deployment target
case "$DEPLOY_TARGET" in
  frontend|workers|extension|all|both)
    ;;
  *)
    echo -e "${RED}❌ Invalid deployment target: $DEPLOY_TARGET${NC}"
    echo "Usage: $0 [frontend|workers|extension|all|both] [--force] [--clean] [--build-only]"
    echo ""
    echo "Options:"
    echo "  frontend      Deploy frontend only"
    echo "  workers       Deploy workers only"
    echo "  extension     Build extension only"
    echo "  all/both      Deploy all (default)"
    echo "  --force       Force fresh deployment bypassing Cloudflare cache"
    echo "  --clean       Clean build artifacts before deploying"
    echo "  --build-only  Build only, do not deploy"
    exit 1
    ;;
esac

# Normalize 'both' to 'all'
if [ "$DEPLOY_TARGET" = "both" ]; then
  DEPLOY_TARGET="all"
fi

# Set deployment flags for Cloudflare Pages
CACHE_FLAGS=""
if [ "$FORCE_DEPLOY" = true ]; then
  # Force Cloudflare to bypass cache and do a fresh deployment
  CACHE_FLAGS="--commit-dirty=true --no-bundle"
  echo -e "${YELLOW}⚡ Force deployment mode enabled (bypassing Cloudflare cache)${NC}"
fi

if [ "$CLEAN_BUILD" = true ]; then
  echo -e "${YELLOW}🧹 Clean build mode enabled${NC}"
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🚀 SaveToRead Deployment Starting...${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 Target: $DEPLOY_TARGET${NC}"
if [ "$FORCE_DEPLOY" = true ] || [ "$CLEAN_BUILD" = true ] || [ "$BUILD_ONLY" = true ]; then
  echo -e "${YELLOW}🔧 Flags: force=${FORCE_DEPLOY}, clean=${CLEAN_BUILD}, build-only=${BUILD_ONLY}${NC}"
fi
echo ""

# Function to clean build artifacts
clean_artifacts() {
  local target=$1
  echo -e "${BLUE}🧹 Cleaning $target build artifacts...${NC}"
  
  if [ "$target" = "frontend" ] || [ "$target" = "all" ]; then
    rm -rf frontend/dist frontend/.vite frontend/.wrangler frontend/node_modules/.vite
    echo -e "${GREEN}  ✓ Frontend artifacts cleaned${NC}"
  fi
  
  if [ "$target" = "workers" ] || [ "$target" = "all" ]; then
    rm -rf workers/dist workers/.wrangler
    echo -e "${GREEN}  ✓ Workers artifacts cleaned${NC}"
  fi
  
  if [ "$target" = "extension" ] || [ "$target" = "all" ]; then
    rm -rf extension/dist
    echo -e "${GREEN}  ✓ Extension artifacts cleaned${NC}"
  fi
  
  echo ""
}

# Function to deploy frontend
deploy_frontend() {
  local start_time=$(date +%s)
  
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}📦 Building Frontend Application...${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  cd frontend
  
  # Install dependencies if needed
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 Installing frontend dependencies...${NC}"
    npm ci
  fi
  
  # Build with cache busting
  if [ "$FORCE_DEPLOY" = true ]; then
    # Clear Vite cache for force deployments
    rm -rf .vite node_modules/.vite
    echo -e "${YELLOW}  ⚡ Vite cache cleared${NC}"
  fi
  
  npm run build
  local build_status=$?
  cd ..

  if [ $build_status -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
  else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
  fi

  if [ "$BUILD_ONLY" = true ]; then
    echo -e "${YELLOW}🛑 Build only mode: Skipping deployment${NC}"
    return 0
  fi

  echo ""
  echo -e "${BLUE}🌍 Deploying to Cloudflare Pages...${NC}"
  
  # Add commit hash to force cache invalidation if needed
  if [ "$FORCE_DEPLOY" = true ]; then
    COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
    echo -e "${CYAN}  📌 Commit: $COMMIT_HASH${NC}"
  fi
  
  cd frontend
  WRANGLER_LOG=none wrangler pages deploy dist \
    --project-name=savetoread \
    --branch=main \
    $CACHE_FLAGS
  cd ..

  local deploy_status=$?
  
  if [ $deploy_status -eq 0 ]; then
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    echo -e "${GREEN}✅ Frontend deployment successful (${duration}s)${NC}"
    echo -e "${CYAN}🔗 Production: https://savetoread.pages.dev${NC}"
  else
    echo -e "${RED}❌ Frontend deployment failed${NC}"
    exit 1
  fi
}

# Function to deploy workers
deploy_workers() {
  local start_time=$(date +%s)
  
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}⚡ Deploying Cloudflare Workers...${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  cd workers
  
  # Install dependencies if needed
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 Installing workers dependencies...${NC}"
    npm ci
  fi
  
  # Type check
  echo -e "${YELLOW}🔍 Running type check...${NC}"
  npm run build
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Workers type check failed${NC}"
    cd ..
    exit 1
  fi
  
  if [ "$BUILD_ONLY" = true ]; then
    echo -e "${YELLOW}🛑 Build only mode: Skipping deployment${NC}"
    cd ..
    return 0
  fi

  echo -e "${YELLOW}🚀 Deploying worker...${NC}"
  WRANGLER_LOG=none wrangler deploy --minify
  local deploy_status=$?
  cd ..

  if [ $deploy_status -eq 0 ]; then
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    echo -e "${GREEN}✅ Workers deployment successful (${duration}s)${NC}"
    echo -e "${CYAN}🔗 API URL: Check wrangler.toml for worker routes${NC}"
  else
    echo -e "${RED}❌ Workers deployment failed${NC}"
    exit 1
  fi
}

# Function to build extension
build_extension() {
  local start_time=$(date +%s)
  
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}🔌 Building Browser Extension...${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  cd extension
  mkdir -p dist
  
  # Copy extension files to dist
  echo -e "${YELLOW}📋 Copying extension files...${NC}"
  cp manifest.json dist/
  cp background.js dist/
  cp content.js dist/
  cp set-token.html dist/ 2>/dev/null || true
  cp -r popup dist/
  cp -r icons dist/
  
  cd ..

  if [ $? -eq 0 ]; then
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    echo -e "${GREEN}✅ Extension build successful (${duration}s)${NC}"
    echo -e "${CYAN}📁 Built extension: extension/dist/${NC}"
    echo ""
    echo "📦 To test the extension:"
    echo "  • Chrome: chrome://extensions → Load unpacked → Select extension/dist"
    echo "  • Firefox: about:debugging → Load Temporary Add-on → Select extension/dist/manifest.json"
  else
    echo -e "${RED}❌ Extension build failed${NC}"
    exit 1
  fi
}

# Record total start time
TOTAL_START=$(date +%s)

# Clean build artifacts if requested
if [ "$CLEAN_BUILD" = true ]; then
  clean_artifacts "$DEPLOY_TARGET"
fi

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
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Deployment Complete! (Total: ${TOTAL_DURATION}s)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📋 Quick Tests:"
if [ "$DEPLOY_TARGET" = "frontend" ] || [ "$DEPLOY_TARGET" = "all" ]; then
  echo "  • Frontend: curl -I https://savetoread.pages.dev"
fi
if [ "$DEPLOY_TARGET" = "workers" ] || [ "$DEPLOY_TARGET" = "all" ]; then
  echo "  • API Health: curl https://your-worker-url/api/articles"
  echo "  • Auth Check: curl https://your-worker-url/api/auth/me"
fi
echo ""
echo "📊 Monitoring:"
if [ "$DEPLOY_TARGET" = "workers" ] || [ "$DEPLOY_TARGET" = "all" ]; then
  echo "  • Worker Logs: wrangler tail"
fi
if [ "$DEPLOY_TARGET" = "frontend" ] || [ "$DEPLOY_TARGET" = "all" ]; then
  echo "  • Pages Logs: wrangler pages deployment tail --project-name=savetoread"
fi
echo "  • Dashboard: https://dash.cloudflare.com"
echo ""
echo "💡 Tips:"
echo "  • Use --force to bypass Cloudflare cache on deployment"
echo "  • Use --clean to remove local build artifacts before deploying"
echo "  • If you see stale content, try: ./scripts/deploy.sh --force --clean"
echo "  • For debugging: WRANGLER_LOG=debug ./scripts/deploy.sh"
echo ""
