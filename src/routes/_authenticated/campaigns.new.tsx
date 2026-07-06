import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { createCampaign } from "@/lib/campaigns.functions";
import { VENUE_CATEGORIES, REGIONS } from "@/lib/venues";

export const Route = createFileRoute("/_authenticated/campaigns/new")({
  head: () => ({ meta: [{ title: "New campaign — PiBoards" }] }),
  component: NewCampaign,
});

function NewCampaign() {
  const navigate = useNavigate();
  const create = useServerFn(createCampaign);
  const [brand, setBrand] = useState("");
  const [pitch, setPitch] = useState("");
  const [adType, setAdType] = useState<"text" | "image" | "both">("both");
  const [venues, setVenues] = useState<string[]>(["stadium_jumbotron"]);
  const [regions, setRegions] = useState<string[]>(["north-america", "europe"]);
  const [budget, setBudget] = useState("100");
  const [days, setDays] = useState("7");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggle(arr: string[], v: string, setter: (n: string[]) => void) {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const starts = new Date();
      const ends = new Date(starts.getTime() + Number(days) * 86400_000);
      const row = await create({
        data: {
          brand, pitch, ad_type: adType, venues, regions,
          budget_pi: Number(budget),
          starts_at: starts.toISOString(),
          ends_at: ends.toISOString(),
        },
      });
      navigate({ to: "/campaigns/$id", params: { id: row.id } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-16">
      <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-4xl font-bold">New campaign</h1>
        <p className="text-muted-foreground">Describe your brand. AI produces the creative, the contract, and the schedule.</p>

        <label className="block">
          <span className="text-sm text-muted-foreground">Brand / product</span>
          <input required value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1 w-full px-4 py-3 rounded-lg bg-background/60 border border-border" placeholder="Nike Air" />
        </label>

        <label className="block">
          <span className="text-sm text-muted-foreground">What do you want to say?</span>
          <textarea required rows={4} value={pitch} onChange={(e) => setPitch(e.target.value)} className="mt-1 w-full px-4 py-3 rounded-lg bg-background/60 border border-border" placeholder="Launch of the lightest running shoe ever. Speak to marathoners." />
        </label>

        <div>
          <span className="text-sm text-muted-foreground">Creative</span>
          <div className="mt-1 flex gap-2">
            {(["text", "image", "both"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setAdType(t)} className={`px-4 py-2 rounded-full text-sm border ${adType === t ? "border-primary bg-primary/10" : "border-border"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm text-muted-foreground">Venue types</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {VENUE_CATEGORIES.map((v) => (
              <button key={v.id} type="button" onClick={() => toggle(venues, v.id, setVenues)} className={`px-4 py-2 rounded-full text-sm border ${venues.includes(v.id) ? "border-primary bg-primary/10" : "border-border"}`}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm text-muted-foreground">Regions</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button key={r.id} type="button" onClick={() => toggle(regions, r.id, setRegions)} className={`px-4 py-2 rounded-full text-sm border ${regions.includes(r.id) ? "border-primary bg-primary/10" : "border-border"}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-muted-foreground">Budget (π)</span>
            <input type="number" min="1" step="0.1" required value={budget} onChange={(e) => setBudget(e.target.value)} className="mt-1 w-full px-4 py-3 rounded-lg bg-background/60 border border-border" />
          </label>
          <label className="block">
            <span className="text-sm text-muted-foreground">Duration (days)</span>
            <input type="number" min="1" max="90" required value={days} onChange={(e) => setDays(e.target.value)} className="mt-1 w-full px-4 py-3 rounded-lg bg-background/60 border border-border" />
          </label>
        </div>

        {err && <p className="text-destructive text-sm">{err}</p>}

        <button type="submit" disabled={busy || venues.length === 0 || regions.length === 0} className="w-full px-6 py-3 rounded-full bg-[image:var(--gradient-neon)] font-medium text-primary-foreground disabled:opacity-50">
          {busy ? "Creating…" : "Create campaign"}
        </button>
      </form>
    </main>
  );
}