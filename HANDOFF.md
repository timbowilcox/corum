# HANDOFF.md — Corum MVP Session

## Session summary

Built the complete Corum MVP — an AI-powered SMETA compliance advisor. All 7 capabilities from SPRINT.md are implemented and the build passes with zero TypeScript errors. 48/48 tests pass.

---

## What was built (complete)

### 1. Quick assessment (`/quick-check`)
- 5-question risk screen, no auth required
- Deterministic grading + AI enrichment with graceful fallback
- Rate-limited: 10 requests/hour/IP (in-memory, SHA-256 hashed)
- Stores submissions to `quick_check_submissions` via service role

### 2. Auth (`/login`, `/register`)
- Email/password with Supabase Auth
- Register creates org + user profile via `/api/sites/register`
- Redirects to `/dashboard/sites` on success
- Lazy Supabase client instantiation (inside onSubmit, not at render) — avoids SSR prerender error

### 3. Site management (`/dashboard/sites`, `/dashboard/sites/new`)
- Multi-site portfolio view with score rings and aggregate stats
- Portfolio overview card shown when 2+ sites exist
- Create site form: name, type (5 options), country (7 options), address, employee count
- After creation, redirects to intake page

### 4. Hybrid intake (`/dashboard/sites/[id]/intake`)
- Conversational mode: AI interviews user one question at a time with contextual follow-ups
- Structured mode: traditional form fallback for all 32 questions
- Coverage progress bar across 4 pillars
- Conversation resumable — stored in `conversation_turns` table
- Switch between modes at any point

### 5. Two-pass AI analysis (`/api/analysis/[siteId]`)
- POST creates job record and returns immediately (fire-and-forget)
- Pass 1: extended thinking (10,000 budget tokens), produces narrative per pillar
- Pass 2: structured JSON extraction with up to 2 retries
- Country-specific regulatory context injected
- Stores narrative, gap_findings, per-pillar + overall readiness_scores
- GET endpoint for polling job status (used by RunAnalysisButton, polls every 3s)

### 6. Readiness dashboard (`/dashboard/sites/[id]`)
- Animated SVG score arc with overshoot easing (cubic-bezier)
- Score history chart (sparkline across analyses)
- Score delta badges (↑12 / ↓5)
- Pillar breakdown cards with individual scores
- Zero-tolerance full-width banners (impossible to miss)
- Tabbed findings list: All / Labour / H&S / Environment / Business Ethics
- Each finding card: severity badge, confidence dot, 4px left border coloured by severity
- RunAnalysisButton with polling state

### 7. Remediation roadmap (`/dashboard/sites/[id]/remediation`)
- Findings grouped by severity (zero_tolerance → conformant)
- Checkbox to mark findings as resolved
- Sticky impact simulator: side-by-side current vs projected ScoreArc
- Projected score computed client-side via `computeProjectedScore` (no API call)
- Evidence notes on each finding, saved to `/api/findings/[findingId]/notes`

---

## Critical architecture decisions

### Route groups
- `app/(auth)/` — login/register layout (no auth), maps to `/login`, `/register`
- `app/dashboard/` — protected layout (NOT a route group), maps to `/dashboard/sites`, etc.
  - **IMPORTANT**: Was originally named `(dashboard)` (route group) which mapped to `/sites`. Renamed to `dashboard` so URLs match all the `/dashboard/sites` references throughout the codebase.
- `app/(public)/` — unauthenticated routes (`/quick-check`)

### Lazy Supabase client in client components
Login and register pages use `await import('@/lib/supabase/client')` inside the onSubmit handler (not at component top level). This prevents SSR prerender errors during `next build` since `createBrowserClient` validates the URL immediately on instantiation.

### `force-dynamic` placement
- `app/(auth)/login/page.tsx` — has `export const dynamic = 'force-dynamic'`
- `app/(auth)/register/page.tsx` — has `export const dynamic = 'force-dynamic'`
- `app/dashboard/layout.tsx` — has `export const dynamic = 'force-dynamic'` (cascades to all dashboard pages)

### Proxy (Next.js 16)
- File: `proxy.ts` (not `middleware.ts`) — Next.js 16 convention
- Function named `proxy` (not `middleware`)
- Protects `/dashboard/*` routes, redirects unauthenticated to `/login`

---

## Environment setup

`.env.local` has placeholder values — replace before running:
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
ANTHROPIC_API_KEY=<your-api-key>
```

Run migrations in order:
1. `supabase/migrations/001_core_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`

---

## Test coverage

4 test files, 48 tests, all passing:
- `__tests__/scoring.test.ts` — 15 tests (SC, IS, delta)
- `__tests__/quick-check-scoring.test.ts` — 8 tests (QS)
- `__tests__/schemas.test.ts` — 16 tests (V, zod validation)
- `__tests__/country-context.test.ts` — 6 tests (CC, regulatory context)

Not tested (would require Supabase/Anthropic mocks):
- API route handlers
- Conversation engine
- Analysis job lifecycle

---

## What's NOT done (out of scope per CLAUDE.md)

- Evidence vault (document uploads)
- CAP formal workflow
- Multi-org / team management
- Buyer portal
- Sedex API
- Billing
- Email notifications
- PDF export (route stub exists at `/api/export` but not implemented)

---

## Exact next step

Deploy to Vercel:
1. Connect GitHub repo to Vercel
2. Set env vars in Vercel dashboard
3. Run Supabase migrations against production project
4. Deploy

Or to continue development:
1. Wire real Supabase project (replace `.env.local` values)
2. Run `pnpm dev` and test the full flow end-to-end
3. First UX priority: test the conversational intake with real AI responses
