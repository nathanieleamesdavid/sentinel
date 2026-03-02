# Sentinel — Next.js Architecture Spec

> Biotech intelligence dashboard. Crawls research sources, synthesizes signals with Claude, manifests insights across multiple visualization dimensions.

**Stack:** Next.js 14 (App Router) / TypeScript / Vercel Postgres / shadcn/ui + Tailwind / Anthropic SDK / Vercel Cron

---

## Project Structure

```
sentinel/
├── specs/                        # This document, future specs
├── archive/                      # Old Python/FastAPI code for reference
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout, fonts, global providers
│   │   ├── page.tsx              # Dashboard (single-page app)
│   │   ├── api/
│   │   │   ├── insights/
│   │   │   │   ├── route.ts              # GET /api/insights
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts          # GET /api/insights/:id
│   │   │   │       ├── read/route.ts     # PATCH /api/insights/:id/read
│   │   │   │       └── comments/route.ts # GET, POST /api/insights/:id/comments
│   │   │   ├── domains/route.ts          # GET /api/domains
│   │   │   ├── stats/route.ts            # GET /api/stats
│   │   │   └── crawl/
│   │   │       ├── route.ts              # POST /api/crawl (manual trigger)
│   │   │       └── cron/route.ts         # GET /api/crawl/cron (Vercel Cron target)
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives (button, card, badge, etc.)
│   │   ├── layout/               # App shell components
│   │   │   ├── header.tsx
│   │   │   ├── nav-tabs.tsx
│   │   │   └── domain-sidebar.tsx
│   │   ├── views/                # The 5 dashboard views
│   │   │   ├── digest-view.tsx
│   │   │   ├── landscape-view.tsx
│   │   │   ├── world-map-view.tsx
│   │   │   ├── body-map-view.tsx
│   │   │   └── tracker-view.tsx
│   │   ├── insights/             # Insight-specific components
│   │   │   ├── insight-card.tsx
│   │   │   ├── insight-detail-panel.tsx
│   │   │   └── comment-form.tsx
│   │   └── visualizations/       # D3/SVG visualization wrappers
│   │       ├── world-map.tsx
│   │       └── body-map.tsx
│   ├── lib/                      # Core logic (no React, no UI)
│   │   ├── db/
│   │   │   ├── schema.ts         # Drizzle ORM table definitions
│   │   │   ├── client.ts         # Vercel Postgres connection
│   │   │   ├── queries.ts        # Reusable query functions
│   │   │   └── migrations/       # Drizzle migration files
│   │   ├── crawlers/
│   │   │   ├── pubmed.ts         # PubMed E-utilities crawler
│   │   │   ├── clinical-trials.ts # ClinicalTrials.gov v2 crawler
│   │   │   ├── news.ts           # RSS feed crawler
│   │   │   └── index.ts          # Orchestrator: runs all crawlers
│   │   ├── synthesis/
│   │   │   └── synthesize.ts     # Claude API call + structured output parsing
│   │   └── constants.ts          # Domains, paths, search terms, feed URLs
│   ├── hooks/                    # React hooks
│   │   ├── use-insights.ts       # Fetch + filter insights
│   │   ├── use-domains.ts        # Domain list + counts
│   │   └── use-stats.ts          # Dashboard stats
│   └── types/
│       └── index.ts              # Shared TypeScript types
├── public/
│   └── vitruvian.jpg             # Body map background image
├── drizzle.config.ts             # Drizzle ORM config
├── vercel.json                   # Cron schedule config
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Module Breakdown

### 1. Data Layer — `src/lib/db/`

ORM: **Drizzle** (lightweight, type-safe, first-class Vercel Postgres support).

#### `schema.ts` — Table Definitions

Three tables, migrated from the existing SQLite schema:

| Table | Purpose |
|-------|---------|
| `insights` | Core data. Title, synthesis, path, urgency, domain, source info, relevance score, country, tags, read status. Deduplicated by `url_hash` (unique). |
| `comments` | Team notes attached to insights. FK to `insights.id`. |
| `crawl_log` | Audit trail. Source, items found, new items inserted, timestamp. |

Key changes from SQLite:
- `id` becomes `serial` (Postgres auto-increment)
- `tags` stored as `jsonb` instead of text
- `ingested_at` / `created_at` use Postgres `timestamp with time zone` with `defaultNow()`
- `is_read` becomes proper `boolean`

#### `client.ts` — Connection

Single shared client using `@vercel/postgres` + Drizzle adapter. Connection string from `POSTGRES_URL` env var (auto-provisioned by Vercel).

#### `queries.ts` — Query Functions

Pure functions, no request/response coupling. Each returns typed data:

- `getInsights(filters)` — paginated, filterable by domain/path/days_back
- `getInsightById(id)` — single insight
- `getDomainCounts()` — aggregate counts per domain
- `getStats()` — total, path1, path2, unread counts
- `markAsRead(id)` — set `is_read = true`
- `insertInsight(data)` — upsert with `url_hash` conflict handling
- `getComments(insightId)` — comments for an insight
- `insertComment(insightId, author, text)` — add comment
- `logCrawl(source, found, newItems)` — audit entry

---

### 2. Crawlers — `src/lib/crawlers/`

Each crawler is a standalone async function. No shared state. Returns an array of raw items to be synthesized.

#### `pubmed.ts`

- Searches PubMed E-utilities for aging/longevity terms
- Parses XML responses (use `fast-xml-parser`)
- Returns `{ title, abstract, sourceUrl, publishedDate }[]`
- Rate-limited with delays between requests

#### `clinical-trials.ts`

- Queries ClinicalTrials.gov v2 REST API
- Filters for recruiting/not-yet-recruiting longevity studies
- Returns same shape as PubMed

#### `news.ts`

- Parses RSS feeds from STAT News, FierceBiotech, Endpoints News
- Keyword filtering for longevity relevance
- Uses `rss-parser` npm package

#### `index.ts` — Orchestrator

```typescript
export async function runCrawl(lookbackDays: number): Promise<CrawlResult>
```

- Calls all three crawlers
- For each raw item: calls `synthesize()`, filters by relevance >= 4, inserts into DB
- Deduplicates via `url_hash` (MD5 of source URL)
- Logs results to `crawl_log`
- Returns summary stats

---

### 3. AI Synthesis — `src/lib/synthesis/`

#### `synthesize.ts`

```typescript
export async function synthesize(
  item: RawItem,
  sourceType: 'pubmed' | 'clinical_trial' | 'news'
): Promise<SynthesisResult | null>
```

- Calls Claude (`claude-sonnet-4-6`) via Anthropic SDK
- Prompt includes Medeed business context, two investment paths, required JSON schema
- Extracts: `synthesis`, `path`, `urgency`, `domain`, `company`, `stage`, `tags`, `relevance_score`, `country`
- Returns `null` on parse failure (logged, not thrown)
- Max tokens: 600

---

### 4. API Routes — `src/app/api/`

Thin handlers. Each route does: parse request → call query function → return JSON.

| Route | Method | Handler |
|-------|--------|---------|
| `/api/insights` | GET | List insights with optional `days_back`, `limit`, `domain`, `path` query params |
| `/api/insights/[id]` | GET | Single insight by ID |
| `/api/insights/[id]/read` | PATCH | Mark insight as read |
| `/api/insights/[id]/comments` | GET | List comments for insight |
| `/api/insights/[id]/comments` | POST | Add comment (`{ author, text }`) |
| `/api/domains` | GET | Domain list with insight counts |
| `/api/stats` | GET | Dashboard summary (total, path1, path2, unread) |
| `/api/crawl` | POST | Manual crawl trigger (runs `runCrawl` with 7-day lookback) |
| `/api/crawl/cron` | GET | Vercel Cron target (protected by `CRON_SECRET`, runs `runCrawl`) |

---

### 5. UI Components

#### Layout — `src/components/layout/`

| Component | Responsibility |
|-----------|---------------|
| `header.tsx` | App title, last-refreshed timestamp, manual crawl trigger button |
| `nav-tabs.tsx` | Tab bar switching between the 5 views (digest, landscape, world, body, tracker) |
| `domain-sidebar.tsx` | Toggle buttons for filtering by therapeutic domain (9 domains) |

#### Views — `src/components/views/`

Each view is a self-contained component that receives filtered insights as props.

| Component | What it renders |
|-----------|----------------|
| `digest-view.tsx` | Scrollable feed of `InsightCard` components. Click to select. |
| `landscape-view.tsx` | Grid of domain cards showing insight counts and top signals per domain. |
| `world-map-view.tsx` | Wrapper around the D3 world map visualization. |
| `body-map-view.tsx` | Wrapper around the SVG body map visualization. |
| `tracker-view.tsx` | Stub — "Coming soon" placeholder for company pipeline tracking. |

#### Insights — `src/components/insights/`

| Component | What it renders |
|-----------|----------------|
| `insight-card.tsx` | Card showing title, domain badge, urgency indicator, path, date, synthesis preview. |
| `insight-detail-panel.tsx` | Slide-out panel with full synthesis, metadata, tags, source link, comments. |
| `comment-form.tsx` | Text input + submit for adding team notes to an insight. |

#### Visualizations — `src/components/visualizations/`

These wrap non-React libraries (D3, SVG) in React components using `useRef` + `useEffect`.

| Component | What it renders |
|-----------|----------------|
| `world-map.tsx` | D3 Natural Earth projection. Country centroids with urgency-colored ripple rings. Hover tooltips. |
| `body-map.tsx` | Vitruvian Man background image with SVG overlay. Animated domain hotspot circles at anatomical positions. |

---

### 6. React Hooks — `src/hooks/`

Data-fetching hooks using `fetch` + `useState`/`useEffect` (or SWR if we want caching/revalidation).

| Hook | Returns |
|------|---------|
| `use-insights.ts` | `{ insights, loading, error, refetch }` — accepts filter params (domain, path, days_back) |
| `use-domains.ts` | `{ domains, loading }` — domain list with counts |
| `use-stats.ts` | `{ stats, loading }` — total/path1/path2/unread |

---

### 7. Types — `src/types/index.ts`

Shared TypeScript types used across client and server:

```typescript
type Path = 1 | 2
type Urgency = 'high' | 'medium' | 'low'
type Domain = 'cancer' | 'immune' | 'epigenetic' | 'cognitive' | 'metabolic' | 'musculo' | 'vascular' | 'sensory' | 'sleep'
type SourceType = 'pubmed' | 'clinical_trial' | 'news'
type Stage = 'preclinical' | 'phase1' | 'phase2' | 'phase3' | 'approved'

interface Insight { ... }
interface Comment { ... }
interface CrawlLogEntry { ... }
interface SynthesisResult { ... }
interface RawItem { ... }
interface DomainInfo { id: number; name: Domain; label: string; count: number }
interface Stats { total: number; path1: number; path2: number; unread: number }
```

---

### 8. Constants — `src/lib/constants.ts`

All magic values in one place:

- **Domain definitions**: name, label, color, body-map coordinates, description
- **Search terms**: PubMed query terms for aging/longevity research
- **RSS feed URLs**: STAT News, FierceBiotech, Endpoints News
- **Country centroids**: lat/lng for world map plotting
- **Relevance threshold**: minimum score (4) to store an insight

---

### 9. Cron — `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/crawl/cron",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

Every 6 hours, Vercel hits `/api/crawl/cron` which runs the full crawl pipeline. Protected by `CRON_SECRET` env var (Vercel auto-sets and validates this).

---

### 10. Environment Variables

Set in Vercel project settings:

| Variable | Source |
|----------|--------|
| `POSTGRES_URL` | Auto-provisioned by Vercel Postgres |
| `ANTHROPIC_API_KEY` | Manual — Claude API key |
| `CRON_SECRET` | Auto-provisioned by Vercel Cron |

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` | Framework |
| `react`, `react-dom` | UI |
| `typescript` | Type safety |
| `tailwindcss` | Styling |
| `@shadcn/ui` components | Button, Card, Badge, Dialog, Tabs, Sheet, etc. |
| `drizzle-orm` + `drizzle-kit` | ORM + migrations |
| `@vercel/postgres` | Postgres driver |
| `@anthropic-ai/sdk` | Claude API |
| `fast-xml-parser` | PubMed XML parsing |
| `rss-parser` | RSS feed parsing |
| `d3` + `topojson-client` | World map visualization |
| `swr` (optional) | Client-side data fetching with caching |

---

## Build Order

Suggested implementation sequence:

1. **Scaffold** — `create-next-app`, install deps, configure Tailwind + shadcn
2. **Archive** — Move old code to `archive/`
3. **Data layer** — Schema, client, migrations, seed
4. **Types + constants** — Shared types and domain definitions
5. **Synthesis** — Claude integration (can test independently)
6. **Crawlers** — Three crawlers + orchestrator
7. **API routes** — All endpoints
8. **Layout shell** — Header, nav tabs, sidebar
9. **Digest view** — Cards, detail panel, comments (core UX)
10. **Landscape view** — Domain grid
11. **Body map** — SVG visualization
12. **World map** — D3 visualization
13. **Tracker stub** — Placeholder
14. **Cron** — Vercel cron config
15. **Deploy** — Vercel project setup, env vars, Postgres provisioning
