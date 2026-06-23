.PHONY: dev server web install clean

# Run backend + frontend so the app is available on ONE URL.
#   - "make dev" → uses http://localhost:5173 (Vite with API proxy)
dev:
	@echo "🚀 Starting server + web UI (single URL at :5173)..."
	@make -j2 server web

server:
	@echo "📡 [server] Go on :5000..."
	@go run ./cmd/server

web:
	@echo "🖥️  [web] Vite on :5173..."
	@cd web && (command -v pnpm >/dev/null 2>&1 && pnpm dev || npm run dev)

# Install dependencies
install:
	@echo "Installing web UI deps..."
	@cd web && (command -v pnpm >/dev/null 2>&1 && pnpm install || npm install)
	@echo "Go deps auto managed."

# Build single binary (embeds the web UI)
build:
	@echo "📦 Building web UI..."
	@cd web && (command -v pnpm >/dev/null 2>&1 && pnpm install && pnpm build || npm install && npm run build)
	@echo "🔨 Building Go binary (embed web UI)..."
	@go build -tags embed -o letterofheart ./cmd/server
	@echo "✅ Single binary: ./letterofheart"
	@echo "   ./letterofheart   → http://localhost:5000 (full app)"

# Clean
clean:
	@rm -rf web/dist
	@rm -f letterofheart
	@echo "Cleaned."