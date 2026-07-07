import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCampaign } from "@/lib/campaigns.functions";
import { createContract } from "@/lib/contracts.functions";
import { generateCreative } from "@/lib/creative.functions";
import { distributeCampaign, tickPlays } from "@/lib/distribution.functions";
import { stellarExplorerUrl, stellarTxUrl } from "@/lib/venues";
import { listPartners } from "@/lib/partners.functions";
import { listMySubmissions, submitCreative } from "@/lib/submissions.functions";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/campaigns/$id")({
  head: () => ({ meta: [{ title: "Campaign — PiBoards" }] }),
  component: CampaignDetail,
});

function CampaignDetail() {
  const { id } = useParams({ from: "/_authenticated/campaigns/$id" });
  const fetchIt = useServerFn(getCampaign);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => fetchIt({ data: { id } }),
    refetchInterval: 3000,
  });

  const genFn = useServerFn(generateCreative);
  const contractFn = useServerFn(createContract);
  const distFn = useServerFn(distributeCampaign);
  const tickFn = useServerFn(tickPlays);

  const gen = useMutation({ mutationFn: (venue_category: "stadium_jumbotron" | "arena_led_ribbon" | "street_billboard") =>
    genFn({ data: { campaign_id: id, brand: q.data!.campaign.brand, pitch: q.data!.campaign.pitch, ad_type: q.data!.campaign.ad_type as "text"|"image"|"both", venue_category } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaign", id] }),
  });
  const contract = useMutation({ mutationFn: () => contractFn({ data: { campaign_id: id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["campaign", id] }) });
  const dist = useMutation({ mutationFn: () => distFn({ data: { campaign_id: id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["campaign", id] }) });
  const tick = useMutation({ mutationFn: () => tickFn({ data: { campaign_id: id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["campaign", id] }) });

  const partnersFn = useServerFn(listPartners);
  const subsFn = useServerFn(listMySubmissions);
  const submitFn = useServerFn(submitCreative);
  const partnersQ = useQuery({ queryKey: ["partners"], queryFn: () => partnersFn() });
  const subsQ = useQuery({
    queryKey: ["submissions", id],
    queryFn: () => subsFn({ data: { campaign_id: id } }),
    refetchInterval: 4000,
  });
  const [pickedPartner, setPickedPartner] = useState<string>("");
  const submit = useMutation({
    mutationFn: (partner_id: string) => submitFn({ data: { campaign_id: id, creative_id: q.data!.creatives[0].id, partner_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["submissions", id] });
    },
  });

  // Auto-tick every 5s once running with unplayed slots
  useEffect(() => {
    if (!q.data) return;
    const c = q.data.campaign;
    const anyUnplayed = q.data.slots.some((s) => !s.played);
    if (c.status !== "running" || !anyUnplayed) return;
    const t = setInterval(() => tick.mutate(), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data?.campaign.status, q.data?.slots.length]);

  if (q.isLoading) return <p className="p-16 text-muted-foreground">Loading…</p>;
  if (q.error || !q.data) return <p className="p-16 text-destructive">{(q.error as Error)?.message ?? "Not found"}</p>;

  const { campaign, creatives, contract: ct, slots, events } = q.data;
  const spent = Number(campaign.spent_pi);
  const budget = Number(campaign.budget_pi);
  const pct = Math.min(100, (spent / budget) * 100);
  const latestCreative = creatives[0];
  const played = slots.filter((s) => s.played);
  const totalImp = played.reduce((n, s) => n + s.impressions_est, 0);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <Link to="/campaigns" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← All campaigns</Link>
          <div className="mt-2 flex items-baseline justify-between flex-wrap gap-4">
            <h1 className="text-4xl font-bold">{campaign.brand}</h1>
            <span className="font-mono text-xs uppercase tracking-widest text-accent">{campaign.status}</span>
          </div>
          <p className="mt-2 text-muted-foreground max-w-2xl">{campaign.pitch}</p>
        </div>

        {/* Progress */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-bold text-gradient-neon">{spent.toFixed(2)} π</div>
              <div className="text-xs text-muted-foreground">spent of {budget.toFixed(2)} π</div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>{played.length} / {slots.length} plays</div>
              <div>{totalImp.toLocaleString()} impressions</div>
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-background overflow-hidden">
            <div className="h-full bg-[image:var(--gradient-neon)]" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Creative */}
          <section className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Creative</h2>
              <div className="flex gap-2">
                {(["stadium_jumbotron", "arena_led_ribbon", "street_billboard"] as const).filter((v) => campaign.venues.includes(v)).map((v) => (
                  <button key={v} onClick={() => gen.mutate(v)} disabled={gen.isPending} className="px-3 py-1.5 rounded-full text-xs border border-border hover:border-primary disabled:opacity-50">
                    Generate for {v.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            {latestCreative ? (
              <div>
                {latestCreative.image_url && (
                  <img src={latestCreative.image_url} alt={latestCreative.headline ?? campaign.brand} className="rounded-lg w-full aspect-video object-cover" />
                )}
                <div className="mt-4 text-2xl font-bold">{latestCreative.headline}</div>
                <p className="mt-1 text-muted-foreground">{latestCreative.body}</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No creative yet. Generate one to preview the ad on a mock billboard.</p>
            )}
          </section>

          {/* Contract */}
          <section className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Smart contract</h2>
              {!ct && (
                <button onClick={() => contract.mutate()} disabled={contract.isPending} className="px-4 py-2 rounded-full bg-[image:var(--gradient-neon)] text-primary-foreground text-sm font-medium disabled:opacity-50">
                  {contract.isPending ? "Deploying…" : "Deploy escrow"}
                </button>
              )}
            </div>
            {ct ? (
              <div className="space-y-3 text-sm">
                <Row k="Network" v="Stellar testnet" />
                <Row k="State" v={<span className="font-mono">{ct.state}</span>} />
                <Row k="Terms hash" v={<code className="font-mono text-xs break-all">{ct.terms_hash.slice(0, 32)}…</code>} />
                <Row k="Escrow" v={
                  <a href={stellarExplorerUrl(ct.escrow_public_key)} target="_blank" rel="noreferrer" className="font-mono text-xs text-accent break-all hover:underline">
                    {ct.escrow_public_key.slice(0, 8)}…{ct.escrow_public_key.slice(-6)}
                  </a>
                } />
                {ct.funding_tx_hash && (
                  <Row k="Fund tx" v={
                    <a href={stellarTxUrl(ct.funding_tx_hash)} target="_blank" rel="noreferrer" className="font-mono text-xs text-accent break-all hover:underline">
                      {ct.funding_tx_hash.slice(0, 12)}…
                    </a>
                  } />
                )}
                {campaign.status === "funded" && slots.length === 0 && (
                  <button onClick={() => dist.mutate()} disabled={dist.isPending} className="mt-3 w-full px-4 py-2.5 rounded-full border border-primary text-sm font-medium">
                    {dist.isPending ? "Planning…" : "Run AI distribution"}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Deploy an escrow on Stellar testnet. The contract locks the budget until impressions are delivered.</p>
            )}
          </section>
        </div>

        {/* Live broadcast feed */}
        <section className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live broadcast</h2>
            <span className="text-xs font-mono text-accent flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" style={{ animation: "pulse-neon 1.6s ease-in-out infinite" }} />
              {campaign.status === "running" ? "LIVE" : campaign.status.toUpperCase()}
            </span>
          </div>
          {slots.length === 0 ? (
            <p className="mt-3 text-muted-foreground text-sm">Run AI distribution to schedule this campaign across billboards.</p>
          ) : (
            <div className="mt-4 space-y-2 font-mono text-sm max-h-96 overflow-auto">
              {[...slots].reverse().map((s) => (
                <div key={s.id} className={`flex items-center justify-between rounded-lg px-3 py-2 border ${s.played ? "border-accent/40 bg-accent/5" : "border-border bg-background/40"}`}>
                  <span className="text-muted-foreground text-xs">{new Date(s.slot_start).toLocaleString()}</span>
                  <span className="flex-1 ml-4">{s.venue_name}</span>
                  <span className={s.played ? "text-accent" : "text-muted-foreground"}>{s.played ? `−${Number(s.cost_pi).toFixed(2)} π` : `${Number(s.cost_pi).toFixed(2)} π`}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Contract events */}
        {events.length > 0 && (
          <section className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
            <h2 className="text-lg font-semibold">On-chain events</h2>
            <div className="mt-4 space-y-2 text-sm font-mono max-h-72 overflow-auto">
              {events.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg px-3 py-2 border border-border bg-background/40">
                  <span className="text-muted-foreground text-xs">{new Date(e.created_at).toLocaleTimeString()}</span>
                  <span className="flex-1 ml-4">{e.event_type}</span>
                  {e.amount_pi !== null && <span className="text-accent mr-3">{Number(e.amount_pi).toFixed(2)} π</span>}
                  {e.tx_hash && (
                    <a href={stellarTxUrl(e.tx_hash)} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                      {e.tx_hash.slice(0, 10)}…
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Partner submissions */}
        <section className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold">Partner submissions</h2>
            <Link to="/partners" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">Manage partners →</Link>
          </div>
          {!latestCreative ? (
            <p className="text-muted-foreground text-sm">Generate a creative first, then submit it to a billboard partner for two-stage AI + partner review.</p>
          ) : (
            <>
              <div className="flex gap-2 flex-wrap items-center">
                <select
                  value={pickedPartner}
                  onChange={(e) => setPickedPartner(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-background/60 border border-border text-sm"
                >
                  <option value="">Select approved partner…</option>
                  {(partnersQ.data ?? []).filter((p) => p.registration?.status === "approved").map((p) => (
                    <option key={p.id} value={p.id}>{p.logo_emoji} {p.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => pickedPartner && submit.mutate(pickedPartner)}
                  disabled={!pickedPartner || submit.isPending}
                  className="px-4 py-2 rounded-full bg-[image:var(--gradient-neon)] text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  {submit.isPending ? "Submitting…" : "Submit for review"}
                </button>
                {submit.error && <span className="text-destructive text-xs">{(submit.error as Error).message}</span>}
              </div>
              <div className="space-y-2">
                {(subsQ.data ?? []).map((s) => {
                  type SubRow = typeof s & {
                    ad_partners?: { name: string; logo_emoji: string | null } | null;
                  };
                  const partner = (s as SubRow).ad_partners;
                  return (
                    <div key={s.id} className="rounded-lg border border-border bg-background/40 p-3 text-sm flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span>{partner?.logo_emoji ?? "📺"}</span>
                        <span className="font-medium">{partner?.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-muted-foreground">AI</span>
                        <span className={s.ai_check === "passed" ? "text-accent" : "text-destructive"}>{s.ai_check}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">partner</span>
                        <span className={
                          s.partner_review === "approved" ? "text-accent" :
                          s.partner_review === "rejected" ? "text-destructive" :
                          "text-muted-foreground"
                        }>{s.partner_review}</span>
                      </div>
                      {(s.partner_notes || s.ai_notes) && (
                        <p className="w-full text-xs italic text-muted-foreground">
                          {s.partner_notes ?? s.ai_notes}
                        </p>
                      )}
                    </div>
                  );
                })}
                {(subsQ.data ?? []).length === 0 && (
                  <p className="text-muted-foreground text-sm">No submissions yet.</p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}