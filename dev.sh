#!/bin/bash

# dev.sh - Run Backend + Frontend together on a single URL (http://localhost:5173)
# All /api calls are proxied to the Go backend automatically.

set -e

cleanup() {
  echo ""
  echo "🛑 Shutting down..."
  kill $SERVER_PID $WEB_PID 2>/dev/null || true
  wait $SERVER_PID $WEB_PID 2>/dev/null || true
  echo "✅ Done."
  exit 0
}

trap cleanup SIGINT SIGTERM

echo "🚀 Starting 마음의 편지함 dev environment..."
echo ""

# Start Go server
(
  echo "📡 [server] Go starting on http://localhost:5000"
  go run ./cmd/server
) &
SERVER_PID=$!

sleep 1.5

# Start web UI (Vite)
(
  cd web
  echo "🖥️  [web] Vite starting on http://localhost:5173"
  if command -v pnpm &> /dev/null; then
    pnpm dev
  else
    npm run dev
  fi
) &
WEB_PID=$!

echo ""
echo "✅ Running as one app!"
echo "   • UI (dev):   http://localhost:5173"
echo "   • Full app:   http://localhost:5000 (after 'make build')"
echo "   • Admin UI:   http://localhost:5173/admin"
echo ""
echo "Press Ctrl+C to stop both."

wait $SERVER_PID $WEB_PID