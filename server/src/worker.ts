/**
 * Cloudflare Workers entry point.
 *
 * This file is referenced by wrangler.toml as the `main` module.
 * It simply re-exports the Hono app which natively implements the
 * Fetch API `fetch` handler that Workers expects.
 *
 * For local Node.js development, use `src/index.ts` instead (which
 * uses @hono/node-server).
 */

import app from './app';

export default app;
