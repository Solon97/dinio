#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "==> Starting Supabase local..."
(cd "$ROOT_DIR" && npx -y supabase start) || true

echo "==> Resetting database (migrations only, no seed.sql)..."
(cd "$ROOT_DIR" && npx -y supabase db reset --no-seed)

echo "==> Running JS seed script..."
node "$SCRIPT_DIR/seed.mjs"

echo "==> Done. Test user: dev@dinio.test / dev123456"
