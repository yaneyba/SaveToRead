/**
 * RateLimiter Durable Object
 *
 * Implements rate limiting using Durable Objects for distributed state
 */

export class RateLimiter {
  private state: DurableObjectState;
  private requests: Map<string, number[]> = new Map();

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const key = url.searchParams.get('key');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const window = parseInt(url.searchParams.get('window') || '60000'); // 1 minute default

    if (!key) {
      return new Response(JSON.stringify({ error: 'Missing key' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    switch (action) {
      case 'check': {
        const now = Date.now();
        const timestamps = this.requests.get(key) || [];

        // Remove old requests outside the window
        const validTimestamps = timestamps.filter(ts => now - ts < window);

        if (validTimestamps.length >= limit) {
          return new Response(JSON.stringify({
            allowed: false,
            remaining: 0,
            resetAt: Math.min(...validTimestamps) + window
          }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Add new request
        validTimestamps.push(now);
        this.requests.set(key, validTimestamps);

        return new Response(JSON.stringify({
          allowed: true,
          remaining: limit - validTimestamps.length,
          resetAt: now + window
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      case 'reset': {
        this.requests.delete(key);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  }
}
