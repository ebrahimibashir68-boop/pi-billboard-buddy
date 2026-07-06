## PiBoards Ad Contracts MVP

End-to-end flow: an advertiser (individual or brand) writes a prompt → AI generates a text+image ad → a Stellar testnet smart contract escrows the Pi-equivalent budget → an AI distribution engine allocates the campaign across billboards → live "broadcast" feed shows plays and settles funds.

### 1. Campaign Builder UI (`/campaigns/new`)
- Form: brand name, product pitch, ad type (text / image / both), target venues (stadium jumbotron, arena LED, street billboard), regions, start/end date, budget in Pi.
- "Generate creative" button calls a `createServerFn` that:
  - uses Lovable AI Gateway `google/gemini-3-flash-preview` for headline + body copy,
  - uses Gemini image model for a 16:9 billboard mockup.
- Preview panel shows the rendered ad on a mock jumbotron/ribbon/billboard frame.

### 2. Smart Contract Layer (Stellar testnet)
- Use `@stellar/stellar-sdk` on the server only.
- On campaign create:
  - server generates a fresh escrow keypair, funds it via Friendbot (testnet),
  - builds a payment/claimable-balance transaction that locks the advertiser's budget with claim predicates: platform can claim as impressions are delivered; advertiser can reclaim after `endDate`.
  - stores contract id, escrow public key, xdr, tx hash.
- `/contracts/$id` page renders: parties, terms, budget, escrow address, txn hash link to Stellar testnet explorer, current state (Draft / Funded / Running / Settled / Refunded).
- "Sign & fund" button: two paths — real Pi wallet (uses existing `PiPayButton`, settles in Pi via Pi API) OR testnet demo mode (auto-funds from Friendbot). Signature (Pi uid + timestamp) hashed and stored as on-contract memo.

### 3. AI Distribution Engine
- Server fn `distributeCampaign({campaignId})`:
  - fetches inventory (venues list already in MCP tool),
  - calls Gemini with campaign + inventory → returns a schedule: array of `{venueId, slotStart, durationSec, costPi}` sized to budget.
  - persists schedule; each play emits a settlement claim against the escrow (in demo mode, just decrements balance and appends a claim transaction to the contract log).
- Live "Broadcast" feed on `/campaigns/$id` polls plays every few seconds, shows venue, timestamp, impressions estimate, Pi debited.

### 4. Data (Lovable Cloud)
Tables: `campaigns`, `campaign_creatives`, `contracts`, `contract_events`, `schedule_slots`. RLS: advertiser reads their own; platform role reads all. `user_roles` table + `has_role` per project standard.

### 5. Routes / files
```text
src/routes/campaigns.index.tsx        list my campaigns
src/routes/campaigns.new.tsx          builder
src/routes/campaigns.$id.tsx          live feed + contract summary
src/routes/contracts.$id.tsx          contract detail + explorer link
src/lib/campaigns.functions.ts        create/list campaigns
src/lib/creative.functions.ts         AI text + image gen
src/lib/contracts.functions.ts        escrow build/fund/claim/refund
src/lib/distribution.functions.ts     AI schedule + tick
src/lib/stellar.server.ts             Stellar SDK wrapper (testnet)
supabase/migrations/*.sql             tables + RLS + grants
```

### 6. Order of work this turn
1. Enable Lovable Cloud (needed for auth, DB, RLS, secrets).
2. Migration: tables + roles + policies + grants.
3. `stellar.server.ts` + `contracts.functions.ts` (Friendbot fund + claimable balance).
4. `creative.functions.ts` + `distribution.functions.ts` (Gemini text + image + schedule; wrap in `NoObjectGeneratedError` fallback).
5. Routes + UI (shadcn cards, use existing token/theme).
6. Home nav link to `/campaigns`.

### Technical notes
- Stellar SDK is Worker-compatible (pure JS, `fetch`-based Horizon). Testnet only — `Horizon: https://horizon-testnet.stellar.org`, Friendbot: `https://friendbot.stellar.org`.
- Real Pi mainnet settlement stays behind the existing `PiPayButton` flow; smart contract itself lives on Stellar testnet because Pi mainnet contracts require Pi Core Team approval and cannot be deployed from this app.
- All AI schema outputs use loose schemas + prompt-side constraints + `NoObjectGeneratedError` recovery (project rule).
- Image gen goes to Lovable AI Gateway `/v1/images/generations`, stored as data URL in `campaign_creatives.image_url` for the MVP (swap to Cloud Storage later).
- Costs: each AI call is metered; distribution engine caches schedules to avoid re-billing.

Confirm and I'll start with Cloud + migration + Stellar wrapper.