/**
 * Environment bindings for Cloudflare Workers
 */

export interface Env {
  // KV Namespaces
  ARTICLES: KVNamespace;
  USERS: KVNamespace;
  OAUTH_TOKENS: KVNamespace;
  SESSIONS: KVNamespace;

  // Durable Objects
  RATE_LIMITER: DurableObjectNamespace;
  READING_SESSION: DurableObjectNamespace;

  // Environment Variables
  JWT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  DROPBOX_CLIENT_ID: string;
  DROPBOX_CLIENT_SECRET: string;
  ONEDRIVE_CLIENT_ID: string;
  ONEDRIVE_CLIENT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  APP_URL: string;
  API_URL: string;
  ENCRYPTION_KEY: string;

  // Index signature required by Hono's Bindings type
  [key: string]: unknown;
}

export interface Context {
  env: Env;
  executionCtx: ExecutionContext;
  userId?: string;
}
