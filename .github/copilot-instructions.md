# Copilot Instructions

## Build, test, and run

- `make dev` starts the Go API on `:5000` and the Vite app on `:5173` with `/api` proxied to the backend.
- `./dev.sh` is the alternate dev entry point on macOS/Linux.
- `make build` installs frontend deps if needed, builds `web/dist`, then runs `go build -tags embed -o letterofheart ./cmd/server`.
- `make install` installs the frontend dependencies.
- `make clean` removes `web/dist` and the built binary.
- Backend verification: `go test ./...` (there are no committed Go test files today, but this still checks package compilation).
- Single test: `go test ./... -run TestName` or `go test ./path/to/pkg -run TestName` when a specific test exists.
- Frontend build check: `cd web && npm run build` (or `pnpm build` if pnpm is available).

## High-level architecture

- This is a single Go + React application: `cmd/server` owns the HTTP server, API routes, middleware, static serving, uploads, and admin auth.
- Persistence lives in `internal/db/db.go`; it opens the SQLite database, creates/seeds tables, and exposes all CRUD/query helpers.
- The frontend lives under `web/` and is a Vite + React SPA. Routes are defined in `web/src/app/routes.ts`, with shared shell/state in `web/src/app/Root.tsx`.
- Dev mode uses Vite proxying so the browser talks to one origin. Production can serve the embedded frontend from the Go binary or fall back to `web/dist`.
- Update content is stored as structured JSON blocks (`ContentBlock` / `UpdatePost`) rather than plain text.

## Key conventions

- Use `web/src/app/api.ts` for client requests. It assumes relative `/api` URLs and automatically sends `X-Incognito: 1` when `LOH_ADMIN_INCOGNITO` is set.
- Frontend state is persisted in `localStorage`/`sessionStorage` with `LOH_*` keys such as `LOH_USER_UUID`, `LOH_USER_NICKNAME`, `LOH_DARK_MODE`, `LOH_WRITE_DRAFT`, and `LOH_REPORTED_POSTS`.
- Admin sessions are cookie-based (`loh_session_id`) and enforced server-side by middleware; do not switch this flow to token auth.
- Soft deletion is the normal post delete path; list endpoints mask deleted posts, while hard deletes are reserved for admin routes.
- Audit logging is part of the server flow for admin access and write actions; keep new sensitive admin operations consistent with `logAudit(...)`.
- Week handling is derived from the fixed service start time in `getWeekForTime`; avoid ad hoc week calculations elsewhere.
- The frontend build scripts in `web/package.json` run `prebuild`/`postbuild` asset steps; keep those intact when touching build behavior.
- Vite uses the `@` alias for `web/src`, and `figma:asset/*` resolves to `web/src/assets/*`.
