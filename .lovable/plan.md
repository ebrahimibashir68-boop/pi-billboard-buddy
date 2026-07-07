# PiBoards Design Studio + Partner Network

Building on the existing `campaigns`, `contracts`, `schedule_slots` MVP. This adds a proper multi-format design studio, a partner registry (simulated now with real-API adapter seams), and a two-stage approval workflow.

## 1. Design Studio (`/studio`)

Single builder with four tabs, one campaign per session:

- **Image ads** — prompt + brand fields → `google/gemini-3.1-flash-image` (Nano Banana 2) via `/v1/images/generations` streaming. 16:9 canvas, live preview on a mock jumbotron frame. Regenerate / iterate. Editable overlay: headline, subline, brand color, logo (upload → data URL for MVP).
- **Text ads** — `google/gemini-3-flash-preview` generates 3 headline+tagline variants tuned to venue (jumbotron / ribbon / street). Pick one, edit inline.
- **Video ads** — 5s billboard clip via `videogen--generate_video` (Seedance 1080p 16:9). Rendered client-side into the mock frame. Slow + expensive → guard with confirm dialog + cost note.
- **Templates** — 6 hand-built billboard templates (Bold Sale, Product Hero, Event Countdown, Quote/Testimonial, Announcement, Minimal Type) with editable text/color/image slots. No AI required.

All four output to the same `campaign_creatives` table (new columns: `kind` enum image/text/video/template, `video_url`, `template_id`, `overlay_json`).

## 2. Partner Network

New tables:
- `ad_partners` — id, name, slug, regions[], venue_categories[], adapter (`simulated` | `broadsign` | `vistar` | `hivestack`), status (`active` | `coming_soon`), logo_url.
- `partner_registrations` — advertiser ↔ partner, status (`pending` | `approved` | `rejected`), api_key_secret_name (nullable, for real adapters).
- `ad_submissions` — creative ↔ partner, ai_check (`pending` | `passed` | `flagged`), ai_notes, partner_review (`pending` | `approved` | `rejected`), partner_notes, submitted_at, decided_at.

Seed 12 real operators (JCDecaux, Clear Channel, Lamar, Outfront, Ströer, JCDecaux MENA, oOh!media, Focus Media, Broadsign Reach, Vistar, Hivestack, Place Exchange) — all `simulated` by default. Adapter interface in `src/lib/partner-adapters/`:

```text
partner-adapters/
  index.ts          // resolveAdapter(partner) -> Adapter
  simulated.ts      // mock approve/reject, mock playback receipts
  broadsign.ts      // stub: reads secret, throws "configure keys"
  vistar.ts
  hivestack.ts
```

Real adapters ship as stubs that read `process.env[api_key_secret_name]` and throw a helpful "add BROADSIGN_API_KEY via Cloud secrets" when missing. User can flip a partner from simulated → real by pasting a key later.

Routes:
- `/partners` — browse network, register (creates `partner_registrations` row, simulated auto-approves in 2s).
- `/partners/$slug` — partner detail, my registration status.

## 3. Two-Stage Approval Workflow

On submit from `/campaigns/$id`:
1. **AI pre-check** — `google/gemini-3-flash-preview` moderates copy + (if image) vision-checks the image URL against policy (no explicit content, no unlicensed IP, no misleading claims). Structured output `{ passed: bool, flags: string[], notes: string }`. Store on `ad_submissions.ai_check`.
2. **Partner review queue** — if AI passed, status → `pending` on partner side. Simulated adapter auto-approves after 5s with fake reviewer id; real adapter would post to partner API and poll. If partner_review = `approved`, escrow contract activates and distribution engine schedules against that partner's venues only.

Partner admin dashboard (`/admin/partners/$slug/queue`) gated by `has_role(_, 'partner_admin')` — lists pending submissions, approve/reject with notes. Same UI works for simulated (self-serve demo) and real (staff use).

## 4. Distribution Update

`distributeCampaign` now filters venues by `approved partner registrations` for the campaign. Each play emits a settlement claim scoped to that partner. On real adapters, `tickPlays` would POST play receipts to the partner's proof-of-play endpoint.

## 5. Data + Migrations

One migration adds:
- `campaign_creatives`: `kind`, `video_url`, `template_id`, `overlay_json`
- Tables: `ad_partners`, `partner_registrations`, `ad_submissions`
- Role: `partner_admin` in `app_role` enum
- RLS: advertisers read own registrations/submissions; partner_admins read/write submissions for their partner (via `partner_admin_assignments` table linking user ↔ partner).
- Seed 12 partners.
- GRANTs on every new table.

## 6. Files

```text
src/routes/_authenticated/studio.tsx                 // 4-tab builder
src/routes/_authenticated/studio.$campaignId.tsx     // continue editing
src/routes/_authenticated/partners.index.tsx
src/routes/_authenticated/partners.$slug.tsx
src/routes/_authenticated/admin.partners.$slug.queue.tsx
src/lib/studio.functions.ts        // generate image (stream), text variants, video
src/lib/partners.functions.ts      // list/register/approve
src/lib/submissions.functions.ts   // submit, ai-precheck, partner-decide
src/lib/partner-adapters/*.ts
src/routes/api/generate-billboard-image.ts   // SSE image stream (needs server route, not createServerFn)
src/routes/api/public/partner-webhooks/$slug.ts  // for real adapters to POST decisions back
```

## 7. Order of work this turn

1. Migration (creatives cols + partner tables + role + seed + RLS/GRANTs).
2. Partner adapter interface + simulated adapter + 3 stubs.
3. Studio server fns + SSE image route + text/video fns.
4. Submissions + AI pre-check + partner queue fns.
5. Routes/UI: studio, partners, partner detail, admin queue.
6. Wire distribution to filter by approved partners.
7. Add `/studio` and `/partners` to home nav.

Confirm and I'll build it.
