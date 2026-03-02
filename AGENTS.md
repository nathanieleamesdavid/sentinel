# Sentinel — Agent Operations Manual

Read the full architecture spec at [specs/architecture.md](./specs/architecture.md) before making changes.

## Stack

Next.js (App Router) / TypeScript / PostgreSQL (postgres.js + Drizzle ORM) / shadcn/ui + Tailwind / Anthropic SDK

## Local Development

### Prerequisites

- Node.js, pnpm
- PostgreSQL 16 (Homebrew: `brew install postgresql@16`)

### First-time setup

```bash
pnpm install
pnpm db:setup        # init .data/, start postgres on :6432, create db, push schema
pnpm dev             # starts Next.js on http://localhost:4000
```

### Day-to-day

```bash
pnpm db:start        # start postgres
pnpm dev             # start dev server on :4000
pnpm db:stop         # stop postgres when done
```

### Database commands

| Command | What it does |
|---|---|
| `pnpm db:setup` | First-time: init + start + create db + push schema |
| `pnpm db:start` | Start postgres (creates db if it doesn't exist) |
| `pnpm db:stop` | Stop postgres |
| `pnpm db:status` | Check if postgres is running |
| `pnpm db:push` | Push schema changes after editing `src/lib/db/schema.ts` |
| `pnpm db:rebuild` | Nuke everything and rebuild from scratch (destroy + setup) |
| `pnpm db:destroy` | Stop postgres and delete `.data/` entirely |

### Ports

| Service | Port |
|---|---|
| Next.js dev server | 4000 |
| PostgreSQL | 6432 |

### Environment

Env vars live in `.env.local` (gitignored). Required:

| Variable | Purpose |
|---|---|
| `POSTGRES_URL` | Connection string, e.g. `postgres://oscarbatori@localhost:6432/sentinel` |
| `ANTHROPIC_API_KEY` | Claude API key for synthesis |
| `CRON_SECRET` | Bearer token for cron endpoint (any value for local dev) |

### How the database works

PostgreSQL runs natively via `pg_ctl` with its data directory at `.data/` inside the project root. No Docker. The `scripts/db.sh` script manages the full lifecycle. The `.data/` directory is gitignored.

The ORM is Drizzle. Schema lives at `src/lib/db/schema.ts`. The client at `src/lib/db/client.ts` uses `postgres` (postgres.js) which works identically in local dev and on Vercel.

After changing the schema, run `pnpm db:push` to apply changes, or `pnpm db:rebuild` to start fresh.

## Project structure

```
src/
  app/           # Next.js App Router (pages + API routes)
  components/    # React components (ui/, layout/, views/, insights/, visualizations/)
  lib/           # Core logic, no React (db/, crawlers/, synthesis/, constants)
  hooks/         # React data-fetching hooks
  types/         # Shared TypeScript types
scripts/
  db.sh          # PostgreSQL lifecycle management
specs/
  architecture.md  # Full architecture spec
```

## Key patterns

- API routes are thin: parse request, call a query function from `src/lib/db/queries.ts`, return JSON
- Crawlers are standalone async functions in `src/lib/crawlers/`, orchestrated by `index.ts`
- All domain constants (therapeutic areas, search terms, feed URLs) live in `src/lib/constants.ts`
- UI components use shadcn/ui primitives from `src/components/ui/`
