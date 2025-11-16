# Security Best Practices

## Overview

Security is paramount in ReadItLater, especially given that we handle user authentication, OAuth tokens for cloud storage providers, and payment information. This document outlines the security measures implemented and best practices to follow.

## Authentication & Authorization

### JWT Token Security

**Implementation:**
- Algorithm: HS256 (HMAC with SHA-256)
- Expiry: 7 days (configurable)
- Payload: Minimal (userId, email only)
- Storage: Client-side localStorage

**Best Practices:**

```typescript
// ✅ Good: Short-lived tokens
const token = await sign(payload, secret, '7d');

// ❌ Bad: Long-lived tokens
const token = await sign(payload, secret, '365d');

// ✅ Good: Verify on every request
const payload = await verify(token, secret);

// ❌ Bad: Trust client-provided user ID
const userId = request.headers.get('X-User-Id'); // Never do this!
```

**Security Measures:**
1. **Secret Rotation**: Rotate JWT_SECRET regularly (monthly recommended)
2. **Revocation**: Implement token blacklist for compromised tokens
3. **HTTPS Only**: Never transmit tokens over HTTP
4. **httpOnly Cookies**: Consider using httpOnly cookies instead of localStorage

### Password Security

**Current Implementation (Demo):**
```typescript
// SHA-256 hashing
const hash = await crypto.subtle.digest('SHA-256', passwordBuffer);
```

**Production Implementation:**
```typescript
// ⚠️ IMPORTANT: Use proper password hashing in production
// Recommended: Argon2id, bcrypt, or scrypt

// Example with a proper library:
import { hash, verify } from '@node-rs/argon2';

// Hash password
const passwordHash = await hash(password, {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4
});

// Verify password
const isValid = await verify(passwordHash, password);
```

**Requirements:**
- Minimum 8 characters
- Require uppercase, lowercase, numbers, and symbols
- Implement rate limiting on login attempts
- Account lockout after failed attempts

### Session Management

**Best Practices:**
1. **Short Sessions**: Default to 7-day expiry
2. **Refresh Tokens**: Implement refresh token rotation
3. **Device Tracking**: Log active sessions per user
4. **Logout All Devices**: Provide user control
5. **Suspicious Activity**: Alert on unusual login patterns

## OAuth Token Security

### Encryption at Rest

All OAuth tokens are encrypted before storage in Workers KV.

**Implementation:**

```typescript
// Encryption
const encrypted = await encrypt(
  JSON.stringify(tokens),
  env.ENCRYPTION_KEY
);

// Store encrypted tokens
await env.OAUTH_TOKENS.put(`connection:${id}:tokens`, encrypted);

// Retrieval and decryption
const encryptedTokens = await env.OAUTH_TOKENS.get(`connection:${id}:tokens`);
const tokens = JSON.parse(await decrypt(encryptedTokens, env.ENCRYPTION_KEY));
```

**Encryption Details:**
- Algorithm: AES-GCM (256-bit)
- Key Derivation: PBKDF2 with 100,000 iterations
- IV: Random 12 bytes per encryption
- Authentication: Built into GCM mode

**Key Management:**

```bash
# Generate strong encryption key (32 characters)
openssl rand -base64 32

# Store in Wrangler secrets (never in code!)
wrangler secret put ENCRYPTION_KEY
```

**Best Practices:**
1. **Key Rotation**: Rotate encryption keys annually
2. **Separate Keys**: Different keys per environment
3. **Hardware Security Modules**: Consider HSM for production
4. **Backup Keys**: Secure backup of encryption keys
5. **No Hardcoding**: Never commit keys to repository

### OAuth Flow Security

**State Parameter:**
```typescript
// Generate cryptographically secure state
const state = crypto.randomUUID();

// Store with short TTL
await env.OAUTH_TOKENS.put(
  `oauth:state:${state}`,
  JSON.stringify({ userId, provider }),
  { expirationTtl: 600 } // 10 minutes
);
```

**PKCE (Proof Key for Code Exchange):**
```typescript
// For enhanced security, implement PKCE:
const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);

// Include in OAuth flow
authUrl += `&code_challenge=${codeChallenge}&code_challenge_method=S256`;
```

**Redirect URI Validation:**
```typescript
// ✅ Good: Whitelist allowed redirect URIs
const allowedRedirects = [
  'https://readitlater.app/oauth/callback',
  'http://localhost:3000/oauth/callback' // Dev only
];

if (!allowedRedirects.includes(redirectUri)) {
  throw new Error('Invalid redirect URI');
}
```

### Token Refresh Strategy

```typescript
// Check if token is expired or about to expire
if (tokens.expiresAt < Date.now() + 5 * 60 * 1000) { // 5 min buffer
  // Refresh token
  const newTokens = await oauthService.refreshAccessToken(tokens.refreshToken);

  // Re-encrypt and store
  await updateTokens(connectionId, newTokens);
}
```

## API Security

### Input Validation

**Always validate and sanitize inputs:**

```typescript
// ✅ Good: Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  throw new Error('Invalid email format');
}

// ✅ Good: Sanitize URL
const url = new URL(input); // Throws if invalid
if (!['http:', 'https:'].includes(url.protocol)) {
  throw new Error('Invalid protocol');
}

// ✅ Good: Validate UUID
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(id)) {
  throw new Error('Invalid ID');
}
```

### SQL Injection Prevention

While we use KV (not SQL), key injection is still possible:

```typescript
// ❌ Bad: Direct string concatenation
const key = `user:${userId}:${input}`;

// ✅ Good: Validate and sanitize
const sanitized = input.replace(/[^a-zA-Z0-9-_]/g, '');
const key = `user:${userId}:${sanitized}`;
```

### XSS Prevention

**Frontend:**
- React automatically escapes output
- Never use `dangerouslySetInnerHTML` without sanitization
- Use DOMPurify for user-generated HTML

```typescript
import DOMPurify from 'dompurify';

// ✅ Good: Sanitize HTML before rendering
const clean = DOMPurify.sanitize(userContent);
```

**API:**
- Set Content Security Policy headers
- Escape JSON responses (handled by Hono)

### CSRF Protection

**Same-Site Cookies:**
```typescript
// Set SameSite attribute on cookies
Set-Cookie: session=abc123; SameSite=Strict; Secure; HttpOnly
```

**CSRF Tokens:**
```typescript
// For state-changing operations
const csrfToken = crypto.randomUUID();
await env.SESSIONS.put(`csrf:${userId}`, csrfToken, { expirationTtl: 3600 });

// Verify on POST/PUT/DELETE requests
const providedToken = request.headers.get('X-CSRF-Token');
if (providedToken !== storedToken) {
  throw new Error('Invalid CSRF token');
}
```

### Rate Limiting

**Implementation using Durable Objects:**

```typescript
// Rate limit by user ID or IP
const limiter = env.RATE_LIMITER.get(
  env.RATE_LIMITER.idFromName(userId)
);

const response = await limiter.fetch(
  `https://limiter?action=check&key=${userId}&limit=100&window=60000`
);

if (!response.ok) {
  return c.json({ error: 'Rate limit exceeded' }, 429);
}
```

**Rate Limits:**
- Authentication: 5 attempts per 15 minutes
- Article creation: 100 per hour
- API calls: 1000 per hour
- OAuth flows: 10 per hour

### CORS Configuration

```typescript
// ✅ Production: Whitelist specific origins
app.use('*', cors({
  origin: ['https://readitlater.app'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// ⚠️ Development only: Allow all origins
app.use('*', cors({
  origin: (origin) => origin,
  credentials: true
}));
```

## Data Security

### Encryption in Transit

- **HTTPS Everywhere**: All traffic over TLS 1.3
- **HSTS Headers**: Force HTTPS
- **Certificate Pinning**: In mobile apps

```typescript
// Set security headers
app.use('*', async (c, next) => {
  await next();

  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});
```

### Content Security Policy

```typescript
c.header('Content-Security-Policy', [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.readitlater.app",
  "frame-src https://js.stripe.com"
].join('; '));
```

### Data Minimization

**Collect only necessary data:**
- Email (required for account)
- Display name (required for UX)
- Password hash (required for auth)
- OAuth tokens (required for feature)

**Don't collect:**
- Phone numbers (unless needed)
- Addresses (not needed)
- Social security numbers (never)
- Payment details (handled by Stripe)

### Data Retention

**Implement data retention policies:**
```typescript
// Delete inactive accounts after 2 years
const inactiveDate = new Date();
inactiveDate.setFullYear(inactiveDate.getFullYear() - 2);

if (user.lastLoginAt < inactiveDate.toISOString()) {
  await deleteUserData(userId);
}
```

## Third-Party Integrations

### Stripe Security

**Best Practices:**
1. **Webhook Verification**: Always verify webhook signatures
2. **Test Mode**: Use test keys in development
3. **Secret Management**: Store keys in Wrangler secrets
4. **PCI Compliance**: Never handle card details directly

```typescript
// Verify Stripe webhook signature
const signature = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  await request.text(),
  signature,
  env.STRIPE_WEBHOOK_SECRET
);
```

### Cloud Storage Security

**Principle: Zero Trust**
- Never trust data from cloud storage APIs
- Always verify file ownership before access
- Implement virus scanning for uploaded files
- Set appropriate file permissions

```typescript
// ✅ Good: Verify ownership before access
const connection = await getConnection(connectionId);
if (connection.userId !== userId) {
  throw new Error('Unauthorized');
}
```

## Logging & Monitoring

### Security Logging

**Log security-relevant events:**
```typescript
// Authentication events
console.log(JSON.stringify({
  event: 'login_success',
  userId,
  ip: request.headers.get('CF-Connecting-IP'),
  userAgent: request.headers.get('User-Agent'),
  timestamp: new Date().toISOString()
}));

// Failed authentication
console.log(JSON.stringify({
  event: 'login_failed',
  email,
  ip: request.headers.get('CF-Connecting-IP'),
  reason: 'invalid_credentials',
  timestamp: new Date().toISOString()
}));
```

**Never log:**
- Passwords
- OAuth tokens
- JWT tokens
- Credit card numbers
- Full email addresses in public logs

### Anomaly Detection

**Implement alerts for:**
- Unusual login locations
- Multiple failed login attempts
- High-volume API requests
- Unexpected error rates
- OAuth token refresh failures

## Incident Response

### Security Incident Checklist

1. **Detect**: Monitor for security events
2. **Contain**: Disable affected accounts/features
3. **Investigate**: Analyze logs and identify scope
4. **Remediate**: Fix vulnerability, rotate secrets
5. **Notify**: Inform affected users
6. **Document**: Write post-mortem
7. **Improve**: Update security measures

### Breach Response

**If OAuth tokens are compromised:**
1. Revoke all OAuth connections
2. Force password reset for affected users
3. Rotate encryption keys
4. Notify users via email
5. Report to cloud storage providers

**If user data is leaked:**
1. Contain the breach immediately
2. Assess scope of leaked data
3. Notify affected users within 72 hours
4. Report to authorities if required (GDPR, etc.)
5. Offer credit monitoring if sensitive data leaked

## Compliance

### GDPR Compliance

**User Rights:**
- Right to access: Provide data export
- Right to deletion: Implement account deletion
- Right to portability: Export in JSON format
- Right to rectification: Allow profile updates

```typescript
// Data export
app.get('/api/user/export', async (c) => {
  const userId = c.get('userId');

  const userData = await exportAllUserData(userId);

  return c.json({
    user: userData.user,
    articles: userData.articles,
    annotations: userData.annotations,
    settings: userData.settings,
    exported_at: new Date().toISOString()
  });
});
```

### SOC 2 Considerations

For enterprise customers:
- Access controls and logging
- Encryption at rest and in transit
- Backup and disaster recovery
- Security awareness training
- Vendor security assessments

## Security Checklist

### Pre-Deployment

- [ ] All secrets stored in Wrangler secrets
- [ ] HTTPS enforced on all endpoints
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] OAuth tokens encrypted at rest
- [ ] JWT tokens signed and verified
- [ ] CORS configured properly
- [ ] Security headers set
- [ ] Error messages don't leak information
- [ ] Logging implemented (without sensitive data)

### Post-Deployment

- [ ] Monitor for unusual activity
- [ ] Set up security alerts
- [ ] Regular security audits
- [ ] Dependency updates automated
- [ ] Incident response plan documented
- [ ] Security training for team
- [ ] Penetration testing scheduled

### Ongoing

- [ ] Review logs weekly
- [ ] Rotate secrets quarterly
- [ ] Update dependencies monthly
- [ ] Security audit annually
- [ ] Disaster recovery test quarterly
