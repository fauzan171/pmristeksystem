/**
 * Environment configuration that works in both Node.js and Cloudflare Workers.
 *
 * - Node.js: reads from process.env at module-load time (local dev / production server).
 * - Workers: env vars are injected per-request via Hono's context (c.env).
 *   Use `getEnv(c)` inside route handlers to access Workers env bindings.
 */

export interface EnvBindings {
  DATABASE_URL: string;
  PORT: string;
  NODE_ENV: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  WA_SESSION_ENCRYPTION_KEY: string;
  HYPERDRIVE?: Hyperdrive;
}

/** Default / fallback values used in Node.js local development. */
const defaults: EnvBindings = {
  DATABASE_URL: '',
  PORT: '3001',
  NODE_ENV: 'development',
  JWT_SECRET: 'default-secret',
  JWT_EXPIRES_IN: '24h',
  CORS_ORIGIN: 'http://localhost:5173',
  WA_SESSION_ENCRYPTION_KEY: '',
};

/**
 * Static env object for Node.js environments.
 * In Workers this will contain the defaults (process.env is empty at edge).
 * Prefer `getEnv(c)` inside Hono handlers for Workers compatibility.
 */
export const env: EnvBindings = {
  DATABASE_URL: process.env.DATABASE_URL || defaults.DATABASE_URL,
  PORT: process.env.PORT || defaults.PORT,
  NODE_ENV: process.env.NODE_ENV || defaults.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET || defaults.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || defaults.JWT_EXPIRES_IN,
  CORS_ORIGIN: process.env.CORS_ORIGIN || defaults.CORS_ORIGIN,
  WA_SESSION_ENCRYPTION_KEY: process.env.WA_SESSION_ENCRYPTION_KEY || defaults.WA_SESSION_ENCRYPTION_KEY,
};

/**
 * Resolve env vars from Hono context (Cloudflare Workers) or fall back to
 * the static Node.js env object. Use this in middleware / route handlers
 * that need to run in both environments.
 *
 * @example
 * ```ts
 * import { getEnv } from '../config/env';
 * app.get('/api/me', async (c) => {
 *   const { JWT_SECRET } = getEnv(c);
 *   // ...
 * });
 * ```
 */
export function getEnv(c: { env?: Partial<EnvBindings> }): EnvBindings {
  const workerEnv = (c as { env?: Partial<EnvBindings> }).env;
  if (workerEnv && workerEnv.DATABASE_URL) {
    // Running inside Cloudflare Workers — use per-request bindings
    return {
      DATABASE_URL: workerEnv.DATABASE_URL ?? defaults.DATABASE_URL,
      PORT: workerEnv.PORT ?? defaults.PORT,
      NODE_ENV: workerEnv.NODE_ENV ?? defaults.NODE_ENV,
      JWT_SECRET: workerEnv.JWT_SECRET ?? defaults.JWT_SECRET,
      JWT_EXPIRES_IN: workerEnv.JWT_EXPIRES_IN ?? defaults.JWT_EXPIRES_IN,
      CORS_ORIGIN: workerEnv.CORS_ORIGIN ?? defaults.CORS_ORIGIN,
      WA_SESSION_ENCRYPTION_KEY: workerEnv.WA_SESSION_ENCRYPTION_KEY ?? defaults.WA_SESSION_ENCRYPTION_KEY,
      HYPERDRIVE: workerEnv.HYPERDRIVE,
    };
  }
  // Node.js — use the static env resolved from process.env
  return env;
}
