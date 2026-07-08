import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getLocation, createBooking } from "@/lib/locations.functions";

export const Route = createFileRoute("/_authenticated/locations/$slug")({
  head: () => ({ meta: [{ title: "Book billboard — PiBoards" }] }),
  component: LocationDetail,
});

function LocationDetail() {
  const { slug } = useParams({ from: "/_authenticated/locations/$slug" });
  const fetchFn = useServerFn(getLocation);
  const bookFn = useServerFn(createBooking);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["location", slug], queryFn: () => fetchFn({ data: { slug } }) });

  const [campaignId, setCampaignId] = useState("");
  const [hours, setHours] = useState(4);
  const [startsAt, setStartsAt] = useState(() => {
    const d = new Date(Date.now() + 3_600_000);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  const book = useMutation({
    mutationFn: () => bookFn({ data: { campaign_id: campaignId, location_id: q.data!.location.id, hours, starts_at: new Date(startsAt).toISOString() } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["location", slug] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  if (q.isLoading) return <p className="p-16 text-muted-foreground">Loading…</p>;
  if (!q.data) return <p className="p-16 text-destructive">Not found</p>;
  const { location: loc, campaigns } = q.data;
  type Row = typeof loc & { ad_partners?: { name: string; logo_emoji: string | null; slug: string } | null };
  const partner = (loc as Row).ad_partners;

  const subtotal = Number(loc.hourly_rate_pi) * hours;
  const fee = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + fee).toFixed(2);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link to="/locations" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← All locations</Link>
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="text-5xl">{loc.hero_emoji}</div>
              <h1 className="mt-2 text-3xl font-bold">{loc.name}</h1>
              <div className="text-sm text-muted-foreground">{loc.city} · {loc.country}</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gradient-neon">{Number(loc.hourly_rate_pi).toFixed(2)} π<span className="text-sm text-muted-foreground"> / hr</span></div>
              <div className="text-xs text-muted-foreground mt-1">{loc.slot_seconds}s slot · {loc.daily_impressions.toLocaleString()} imp/day</div>
            </div>
          </div>
          <p className="text-muted-foreground">{loc.description}</p>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-4 border-t border-border">
            <Def k="Partner" v={<Link to="/partners/$slug" params={{ slug: partner?.slug ?? "" }} className="hover:text-foreground">{partner?.logo_emoji} {partner?.name}</Link>} />
            <Def k="Size" v={`${loc.width_m ?? "?"} × ${loc.height_m ?? "?"} m`} />
            <Def k="Resolution" v={loc.resolution ?? "—"} />
            <Def k="Coordinates" v={loc.latitude && loc.longitude ? `${loc.latitude}, ${loc.longitude}` : "—"} />
          </dl>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 space-y-4">
          <h2 className="text-lg font-semibold">Book this billboard</h2>
          {campaigns.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              You need a campaign first. <Link to="/campaigns/new" className="text-accent underline">Create one →</Link>
            </p>
          ) : (
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Campaign</span>
                <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-background/60 border border-border">
                  <option value="">Select…</option>
                  {campaigns.map((c) => <option key={c.id} value={c.id}>{c.brand}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Start</span>
                <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-background/60 border border-border" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Hours</span>
                <input type="number" min={1} max={720} value={hours} onChange={(e) => setHours(Number(e.target.value) || 1)} className="mt-1 w-full px-3 py-2 rounded-lg bg-background/60 border border-border" />
              </label>
              <div className="md:col-span-3 flex items-end justify-between gap-4 pt-2 border-t border-border">
                <div className="text-sm">
                  <div className="text-muted-foreground text-xs">Subtotal {subtotal.toFixed(2)} π · Fee {fee.toFixed(2)} π</div>
                  <div className="text-2xl font-bold text-gradient-neon">{total.toFixed(2)} π total</div>
                </div>
                <button
                  onClick={() => book.mutate()}
                  disabled={!campaignId || book.isPending}
                  className="px-5 py-2.5 rounded-full bg-[image:var(--gradient-neon)] text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  {book.isPending ? "Booking…" : partner?.name?.toLowerCase().includes("simulated") ? "Reserve & invoice" : "Request booking"}
                </button>
              </div>
              {book.error && <p className="md:col-span-3 text-destructive text-sm">{(book.error as Error).message}</p>}
              {book.data && <p className="md:col-span-3 text-accent text-sm">Booking placed. <Link to="/bookings" className="underline">View invoice →</Link></p>}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Def({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs uppercase tracking-widest">{k}</dt>
      <dd className="mt-1">{v}</dd>
    </div>
  );
}
