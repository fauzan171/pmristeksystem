#!/bin/bash
set -e

echo "============================================"
echo "  RPMS Backend - Cloudflare Workers Deploy"
echo "============================================"
echo ""

# Navigate to server directory
cd "$(dirname "$0")"

# Check if wrangler is authenticated
echo "Checking Wrangler authentication..."
if ! npx wrangler whoami 2>/dev/null | grep -q "Account"; then
  echo ""
  echo "ERROR: Not authenticated with Cloudflare."
  echo "Please run: npx wrangler login"
  exit 1
fi

echo "Authenticated. Proceeding..."
echo ""

# Remind about secrets
echo "IMPORTANT: Make sure the following secrets are set:"
echo "  npx wrangler secret put DATABASE_URL"
echo "  npx wrangler secret put JWT_SECRET"
echo "  npx wrangler secret put JWT_EXPIRES_IN"
echo "  npx wrangler secret put CORS_ORIGIN"
echo "  npx wrangler secret put WA_SESSION_ENCRYPTION_KEY"
echo ""
echo "And update Hyperdrive ID in wrangler.toml if not done."
echo ""

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Deploy
echo ""
echo "Deploying to Cloudflare Workers..."
npx wrangler deploy

echo ""
echo "============================================"
echo "  Deployment complete!"
echo "============================================"
