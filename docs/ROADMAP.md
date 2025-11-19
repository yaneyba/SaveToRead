# SaveToRead Roadmap

## Vision

**Save articles, create snapshots, and store everything in your own cloud storage.**

Google Drive, Dropbox, or OneDrive—you choose where your data lives.

## Core Principles

1. **User Data Ownership** - Your data lives in YOUR cloud storage, not ours
2. **Simplicity** - Focus on doing three things exceptionally well: save, snapshot, store
3. **Privacy** - We never see your content; it goes directly to your cloud
4. **No Lock-In** - Your data is yours, in standard formats (PDF, HTML), accessible anytime

---

## Current Status (v0.2 - November 2025) ✅

### Recently Completed Features (November 2025)
- ✅ **Automatic Content Extraction** - Jina AI integration for intelligent article parsing
- ✅ **Professional Dashboard** - Modern UI with stats, filters, and search
- ✅ **Grid/List View Toggle** - Flexible article display modes (mobile auto-adapts)
- ✅ **Pagination System** - Configurable page sizes (6, 12, 24, 48 articles)
- ✅ **Real-time Sync** - Extension saves notify dashboard instantly with toast notifications
- ✅ **Browser Extension** - Context menu save for pages, links, and selections
- ✅ **Offline Queue** - Save articles when offline, sync when back online
- ✅ **Reading Interface** - Clean reader with article metadata and navigation
- ✅ **Toast Notifications** - Non-intrusive feedback for user actions
- ✅ **Click-outside Close** - Improved UX for dropdowns and menus
- ✅ **Mobile Responsive** - Full mobile optimization with touch gestures
- ✅ **SEO Optimization** - Meta tags, structured data, sitemap, robots.txt

### Core Features Implemented
- ✅ Save articles from URLs with automatic content extraction
- ✅ Browser extension with right-click context menu (Save Page, Save Link, Save Selection)
- ✅ Create offline snapshots (PDF/HTML/EPUB/Markdown/Plain Text)
- ✅ Cloud storage integration (Google Drive, Dropbox, OneDrive)
- ✅ OAuth-based secure storage linking
- ✅ Article organization with tags, favorites, and archive
- ✅ Reading interface with progress tracking
- ✅ Duplicate detection to prevent saving same URL twice
- ✅ Word count and reading time estimation
- ✅ Import from Pocket, Instapaper, Raindrop.io
- ✅ Bulk operations (delete, tag, archive, favorite, re-snapshot)
- ✅ Export to JSON and CSV formats

---

## Phase 1: Core Stability ✅ COMPLETE

### Snapshot Improvements ✅
- ✅ Better PDF rendering with custom styling options
- ✅ Archive-quality HTML snapshots with embedded assets
- ✅ Automatic snapshot on article save (configurable)
- ✅ Batch snapshot generation (up to 50 articles)

### Cloud Storage Enhancements 🔄
- ✅ Automatic organization (by date, tags, domain)
- ✅ Conflict resolution for duplicate saves
- ⏳ Configurable folder structure (partially done)
- ⏳ Storage quota monitoring and warnings (needed)
- ⏳ Verify snapshot integrity after upload (needed)

### Browser Extension ✅
- ✅ Context menu save (page, link, selection)
- ✅ Save queue for offline mode
- ✅ Browser notifications for save status
- ✅ Token sync between website and extension
- ⏳ One-click toolbar button save (UX improvement)
- ⏳ Keyboard shortcuts for power users (needed)

---

## Phase 2: Enhanced User Experience (Current Focus)

**Goal: Polish the core experience and improve usability**

### Dashboard Improvements
- ⏳ Dark mode support
- ⏳ Customizable article card layouts
- ⏳ Advanced filtering (by date range, word count, reading time)
- ⏳ Saved search queries
- ⏳ Keyboard shortcuts for navigation

### Reading Experience
- ⏳ Focus mode with distraction-free reading
- ⏳ Adjustable typography settings (font, size, line height)
- ⏳ Reading position sync across devices
- ⏳ Highlights and annotations
- ⏳ Text-to-speech integration

### Performance & Reliability
- ⏳ Snapshot generation queue with retry logic
- ⏳ Better error handling and user feedback
- ⏳ Health monitoring dashboard
- ⏳ Automatic cleanup of failed uploads
- ⏳ Rate limiting respect for cloud providers

---

## Phase 3: Data Portability & Advanced Features

**Goal: Give users complete control over their data**

### Export & Backup
- ✅ Bulk export all articles + snapshots
- ✅ Export metadata to JSON/CSV
- ✅ Import from Pocket, Instapaper, Raindrop.io
- ⏳ Automatic periodic backups to cloud
- ⏳ Data portability dashboard UI

### Cloud Provider Expansion
- ⏳ Box.com support
- ⏳ pCloud support
- ⏳ Nextcloud/Owncloud (self-hosted)
- ⏳ Multiple simultaneous providers (backup to 2+ clouds)
- ⏳ Local storage option (no cloud required)

### Smart Organization
- ⏳ Auto-tagging based on content
- ⏳ Full-text search (indexed locally or in cloud)
- ⏳ Collections and folders
- ⏳ Related articles suggestions

### Snapshot Intelligence
- ⏳ Reader mode extraction improvements
- ⏳ Image optimization for smaller snapshots
- ⏳ Video/audio preservation options
- ⏳ Web annotation preservation

---

## Phase 4: Platform & Ecosystem

**Goal: Make SaveToRead accessible everywhere**

### Progressive Web App
- ✅ Service worker for offline access
- ✅ PWA manifest with shortcuts
- ⏳ Install prompts
- ⏳ Background sync improvements
- ⏳ Push notifications for reminders

### Developer Experience
- ⏳ Comprehensive API documentation
- ⏳ Webhooks for snapshot completion
- ⏳ CLI tool for power users
- ⏳ Docker compose for self-hosting
- ⏳ Public API with rate limits

### Community Features (Optional)
- ⏳ Share individual snapshots via time-limited links
- ⏳ Public reading lists (metadata only)
- ⏳ Community snapshot templates

---

## Known Issues & Technical Debt

### Active Issues
1. **Cloudflare Browser Rendering Rate Limits**
   - Free tier: 2 requests/minute
   - Impacts snapshot generation
   - Need queue system or alternative rendering method
   - See: `docs/KNOWN_ISSUES.md`

### Security Improvements Needed
- ⏳ Migrate password hashing from SHA-256 to Argon2
- ⏳ Implement token rotation for OAuth
- ⏳ Add 2FA support for SaveToRead accounts
- ⏳ Security audit of cloud storage token handling

### Architecture Refactoring
- ⏳ Add comprehensive test coverage (>80%)
- ⏳ Implement proper logging and monitoring
- ⏳ Set up staging environment
- ⏳ Document all APIs with OpenAPI spec

---

## Non-Goals (Staying True to Vision)

We **intentionally avoid** these features to stay focused:

### ❌ Analytics & Tracking
- No reading analytics dashboards
- No engagement metrics
- No user behavior tracking

### ❌ Social Features
- No social network integration
- No comments/discussions
- No discovery/recommendation algorithms

### ❌ Content Creation
- No built-in note-taking app
- No markdown editor
- No Notion/Obsidian competitor features

### ❌ Monetization Distractions
- No ads
- No affiliate links
- No content upsells

### ❌ Platform Lock-In
- No proprietary formats
- No exclusive features tied to our platform
- No data that can't be exported

---

## Monetization (Aligned with Vision)

### Free Tier (Forever)
- Unlimited article saves
- Unlimited snapshots (subject to rate limits)
- 1 cloud storage connection
- Standard snapshot formats (PDF, HTML)
- Browser extension
- Import/export capabilities

### Premium Tier ($3/month or $30/year) - Future
- Multiple cloud storage connections
- Advanced snapshot formats (EPUB, Markdown)
- Automatic backups to multiple clouds
- Priority snapshot queue (no rate limits)
- Bulk operations
- API access
- Custom snapshot templates

### Philosophy
Premium features enhance the core workflow but never gate-keep basic functionality. You can use SaveToRead completely free, forever, with your own cloud storage.

---

## Success Metrics

We measure success by:

1. **Feature Completion**: % of planned features shipped
2. **Snapshot Reliability**: % of successful snapshot saves to cloud
3. **User Data Ownership**: % of data stored in user's cloud (target: 100%)
4. **Time to First Save**: From install to first saved article (target: < 2 minutes)
5. **Extension Install Rate**: % of users installing browser extension

We explicitly **do not** measure:
- Time spent in app (we want you to read, not manage)
- Daily active users (it's a utility, not a habit)
- Viral growth (privacy > growth)

---

## Recent Updates

### November 2025
- ✅ Added pagination with configurable page sizes
- ✅ Implemented grid/list view toggle with mobile optimization
- ✅ Fixed infinite fetch loops in pagination
- ✅ Added real-time article sync from extension to dashboard
- ✅ Created toast notification system
- ✅ Improved dropdown and menu close behavior
- ✅ Fixed total article count display
- ✅ Enhanced mobile responsiveness

### October 2025
- ✅ Implemented automatic content extraction with Jina AI
- ✅ Built professional dashboard with modern UX
- ✅ Added SEO optimization (meta tags, structured data, sitemap)
- ✅ Created reusable component architecture
- ✅ Deployed to Cloudflare Pages

---

## Questions or Suggestions?

This roadmap is a living document. If you have ideas that align with our core vision of user data ownership and simplicity, please open an issue or discussion on GitHub.

**Remember: Save. Snapshot. Store in YOUR cloud. That's it.**

**Goal: Solidify the save-snapshot-store workflow**

### Snapshot Improvements
- [ ] Better PDF rendering with custom styling options
- [ ] Archive-quality HTML snapshots with embedded assets
- [ ] Automatic snapshot on article save (configurable)
- [ ] Snapshot preview before saving to cloud
- [ ] Batch snapshot generation

### Cloud Storage Enhancements
- [ ] Configurable folder structure in cloud storage
- [ ] Automatic organization (by date, tags, domain)
- [ ] Storage quota monitoring and warnings
- [ ] Conflict resolution for duplicate saves
- [ ] Verify snapshot integrity after upload

### Browser Extension
- [ ] One-click save with automatic snapshot
- [ ] Save selected text as highlight annotation
- [ ] Keyboard shortcuts for power users
- [ ] Save queue for offline mode
- [ ] Browser compatibility (Chrome, Firefox, Edge, Safari)

---

## Phase 2: Data Portability (Q2 2025)

**Goal: Give users complete control over their data**

### Export & Backup
- [ ] Bulk export all articles + snapshots
- [ ] Export metadata to JSON/CSV for external use
- [ ] Automatic periodic backups to cloud
- [ ] Import from Pocket, Instapaper, Raindrop.io
- [ ] Data portability dashboard

### Cloud Provider Expansion
- [ ] Box.com support
- [ ] pCloud support
- [ ] Nextcloud/Owncloud (self-hosted)
- [ ] Multiple simultaneous providers (backup to 2+ clouds)
- [ ] Local storage option (no cloud required)

### Snapshot Formats
- [ ] EPUB format for e-readers
- [ ] Markdown export with frontmatter
- [ ] Single-file HTML with base64 embedded images
- [ ] Plain text extraction

---

## Phase 3: Polish & Reliability (Q3 2025)

**Goal: Make it rock-solid and delightful to use**

### User Experience
- [ ] Progressive Web App (PWA) for offline access
- [ ] Improved reading interface with focus mode
- [ ] Dark mode for reader
- [ ] Custom snapshot templates
- [ ] Bulk operations (re-snapshot, re-tag, delete)

### Developer Experience
- [ ] Comprehensive API documentation
- [ ] Webhooks for snapshot completion
- [ ] CLI tool for power users
- [ ] Docker compose for self-hosting the entire stack

### Performance & Reliability
- [ ] Snapshot generation queue with retry logic
- [ ] Better error handling and user feedback
- [ ] Health monitoring dashboard
- [ ] Automatic cleanup of failed uploads
- [ ] Rate limiting respect for cloud providers

---

## Phase 4: Advanced Features (Q4 2025)

**Goal: Power user features that respect the core vision**

### Smart Organization
- [ ] Auto-tagging based on content
- [ ] Duplicate detection
- [ ] Reading time estimation
- [ ] Full-text search (indexed locally or in cloud)

### Snapshot Intelligence
- [ ] Reader mode extraction (clean article text)
- [ ] Image optimization for smaller snapshots
- [ ] Video/audio preservation options
- [ ] Web annotation preservation (if available)

### Collaboration (Optional)
- [ ] Share individual snapshots via time-limited links
- [ ] Shared collections (still stored in each user's cloud)
- [ ] Public reading lists (metadata only)

---

## Non-Goals (Staying True to Vision)

We **intentionally avoid** these features to stay focused:

### ❌ Analytics & Tracking
- No reading analytics dashboards
- No engagement metrics
- No user behavior tracking

### ❌ Social Features
- No social network integration
- No comments/discussions
- No discovery/recommendation algorithms

### ❌ Content Creation
- No built-in note-taking app
- No markdown editor
- No Notion/Obsidian competitor features

### ❌ Monetization Distractions
- No ads
- No affiliate links
- No content upsells

### ❌ Platform Lock-In
- No proprietary formats
- No exclusive features tied to our platform
- No data that can't be exported

---

## Monetization (Aligned with Vision)

### Free Tier (Forever)
- Unlimited article saves
- Unlimited snapshots
- 1 cloud storage connection
- Standard snapshot formats (PDF, HTML)

### Premium Tier ($3/month or $30/year)
- Multiple cloud storage connections
- Advanced snapshot formats (EPUB, Markdown)
- Automatic backups to multiple clouds
- Priority snapshot queue
- Bulk operations
- API access

### Philosophy
Premium features enhance the core workflow but never gate-keep basic functionality. You can use SaveToRead completely free, forever, with your own cloud storage.

---

## Technical Debt & Refactoring

### Security
- [ ] Migrate password hashing from SHA-256 to Argon2
- [ ] Implement token rotation for OAuth
- [ ] Add 2FA support for SaveToRead accounts
- [ ] Security audit of cloud storage token handling

### Architecture
- [ ] Add comprehensive test coverage (>80%)
- [ ] Implement proper logging and monitoring
- [ ] Set up staging environment
- [ ] Document all APIs with OpenAPI spec

### Performance
- [ ] Optimize KV read/write patterns
- [ ] Implement proper caching strategy
- [ ] Bundle size optimization
- [ ] Lazy loading for non-critical components

---

## Community & Open Source

- [ ] Public GitHub repository
- [ ] Contributing guidelines
- [ ] Self-hosting documentation
- [ ] Community showcase of custom snapshot templates
- [ ] Public roadmap voting (on features aligned with vision)

---

## Success Metrics

We measure success by:

1. **Snapshot reliability**: % of successful snapshot saves to cloud
2. **User data ownership**: % of data stored in user's cloud vs our servers (target: 100%)
3. **Export usage**: % of users who successfully export their data
4. **Cloud provider diversity**: Number of supported providers
5. **Simplicity**: Time from install to first saved snapshot (target: < 2 minutes)

We explicitly **do not** measure:
- Time spent in app (we want you to read, not manage)
- Daily active users (it's a utility, not a habit)
- Viral growth (privacy > growth)

---

## Questions or Suggestions?

This roadmap is a living document. If you have ideas that align with our core vision of user data ownership and simplicity, please open an issue or discussion on GitHub.

**Remember: Save. Snapshot. Store in YOUR cloud. That's it.**
