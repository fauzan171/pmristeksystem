#!/bin/bash
set -e

echo "=== RPMS Frontend Deployment to Cloudflare Pages ==="

# Build
echo "Building frontend..."
npm run build

# Deploy
echo "Deploying to Cloudflare Pages..."
npx wrangler pages deploy ./dist --project-name=rpms-app

echo "=== Deployment complete ==="
