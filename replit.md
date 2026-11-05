# Cipher Markets

Cipher Markets is a secure trading analytics workspace for reviewing portfolio performance, trade history, and risk posture.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/trading-analytics` — responsive React dashboard and trading ledger
- `artifacts/api-server/src/routes/trading.ts` — trading overview, performance, and trade endpoints
- `lib/api-spec/openapi.yaml` — source of truth for the typed trading API
- `lib/api-client-react/src/generated` — generated React Query client
- `lib/db/src/schema` — shared database schema location

## Architecture decisions

- Supabase access stays server-side through the managed connector; browser code only talks to the API.
- The frontend uses generated OpenAPI hooks so request and response contracts stay aligned.
- The dashboard keeps a small demo dataset available when the connected Supabase project has no `trades` table yet.

## Product

Users can review portfolio health, compare performance to a benchmark, inspect risk posture, analyze strategy contribution, and maintain a searchable trade ledger.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Re-run API codegen after changing `lib/api-spec/openapi.yaml`.
- The API currently reads Supabase `trades` rows when available and retains session-local demo trades as a safe empty-project fallback.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
