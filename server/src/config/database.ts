import { PrismaClient } from '@prisma/client';

/**
 * Prisma client factory that works in both Node.js and Cloudflare Workers.
 *
 * - Node.js: uses the classic singleton pattern via globalThis to avoid
 *   connection-pool exhaustion during hot-reloads in development.
 * - Cloudflare Workers: creates a fresh client per module instance
 *   (Workers isolates are single-request; no global leak risk).
 *
 * For Hyperdrive support in Workers, use `createPrismaClient(connectionString)`
 * inside a Hono middleware that reads env.HYPERDRIVE.connectionString.
 */

// Singleton pattern to avoid connection pool exhaustion in Node.js dev
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

/**
 * Create a PrismaClient with an explicit connection string.
 * Useful in Cloudflare Workers where Hyperdrive provides the connection string.
 *
 * @example
 * ```ts
 * import { createPrismaClient } from '../config/database';
 * app.use('*', async (c, next) => {
 *   const dbUrl = c.env.HYPERDRIVE?.connectionString ?? c.env.DATABASE_URL;
 *   const prisma = createPrismaClient(dbUrl);
 *   c.set('prisma', prisma);
 *   await next();
 * });
 * ```
 */
export function createPrismaClient(connectionString: string): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  });
}
