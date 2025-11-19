# Known Issues

## Cloudflare Browser Rendering Rate Limits

### Issue
When generating PDF or HTML snapshots, users may encounter the error:
```
Unable to create new browser: code: 429: message: Rate limit exceeded
```

### Cause
Cloudflare Workers Browser Rendering API has rate limits:
- **Free Plan**: 2 requests per minute
- **Paid Plan**: Higher limits based on plan tier

### Current Mitigation
- Added proper error handling with user-friendly message
- Returns HTTP 429 status code
- Suggests user to try again in a few minutes

### Recommended Solutions

#### Short-term:
1. **Queue-based snapshot generation**: Instead of generating on-demand, queue requests and process them in batches
2. **Cache snapshots**: Store generated snapshots in KV/R2 and reuse them
3. **User-facing rate limit indicator**: Show "X snapshots remaining this minute"

#### Long-term:
1. **Alternative snapshot methods**:
   - Use article content from extraction service instead of browser rendering
   - Generate PDFs from extracted markdown using a PDF library
   - Pre-generate snapshots during article save (background processing)

2. **Upgrade Cloudflare plan**: For production, consider paid plan with higher limits

3. **External snapshot service**: 
   - Use dedicated PDF generation service (Puppeteer on dedicated server)
   - Use third-party APIs (PDFShift, DocRaptor, etc.)

### Code Location
- Error handling: `workers/src/routes/articles.ts` (line ~485)
- Frontend handling: `frontend/src/pages/Reader.tsx` (line ~50)

### Related Documentation
- [Cloudflare Browser Rendering Limits](https://developers.cloudflare.com/workers/runtime-apis/browser-rendering/#limits)
- [Snapshot Implementation](./features/CONTENT_EXTRACTION_IMPLEMENTATION.md)
