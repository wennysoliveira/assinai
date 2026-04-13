#!/bin/sh
set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FRONTEND_DIST="$REPO_ROOT/artifacts/subscriptions-app/dist/public"
API_PUBLIC="$REPO_ROOT/artifacts/api-server/public"

echo "==> Building frontend..."
BASE_PATH=/ PORT=3000 NODE_ENV=production pnpm --filter @workspace/subscriptions-app run build

echo "==> Copying frontend to API public dir..."
rm -rf "$API_PUBLIC"
cp -r "$FRONTEND_DIST" "$API_PUBLIC"

echo "==> Building API server..."
NODE_ENV=production pnpm --filter @workspace/api-server run build

echo "==> Production build complete."
