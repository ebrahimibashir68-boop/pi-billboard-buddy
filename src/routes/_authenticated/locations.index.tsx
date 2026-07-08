import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listLocations } from "@/lib/locations.functions";

export const Route = createFileRoute("/_authenticated/locations/")({
  head: () => ({ meta: [{ title: "Billboard locations — PiBoards" }] }),
  component: LocationsIndex,
});

function LocationsIndex() {
  const fetchFn = useServerFn(listLocations);
  const q = useQuery({ queryKey: ["locations"], queryFn: () => fetchFn() });
  const [region, setRegion] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  const rows = (q.data ?? []).filter((l) =>
    (!region || l.region === region) && (!category || l.venue_category === category)
  );

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Home</Link>
          <h1 className="mt-2 text-4xl font-bold">Global billboard inventory</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Browse live digital billboards in the world's most vibrant cities. Book any
            location for a campaign — pricing shown in Pi per hour with slot length and
            daily impressions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="px-3 py-2 rounded-lg bg-background/60 border border-border">
            <option value="">All regions</option>
            <option value="north-america">North America</option>
            <option value="europe">Europe</option>
            <option value="asia">Asia</option>
            <option value="south-america">South America</option>
            <option value="africa">Africa / MENA</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-lg bg-background/60 border border-border">
            <option value="">All venue types</option>
            <option value="street_billboard">Street billboard</option>
            <option value="stadium_jumbotron">Stadium jumbotron</option>
            <option value="arena_led_ribbon">Arena LED</option>
          </select>
          <Link to="/bookings" className="ml-auto px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground">My bookings →</Link>
        </div>

        {q.isLoading && <p className="text-muted-foreground">Loading inventory…</p>}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((l) => {
            type Row = typeof l & { ad_partners?: { name: string; logo_emoji: string | null; adapter: string } | null };
            const partner = (l as Row).ad_partners;
            return (
              <Link key={l.id} to="/locations/$slug" params={{ slug: l.slug }} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 hover:border-primary transition flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="text-3xl">{l.hero_emoji}</div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-accent">{Number(l.hourly_rate_pi).toFixed(2)} π / hr</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{l.venue_category.replace("_", " ")}</div>
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold leading-tight">{l.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{l.city} · {l.country}</div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{l.description}</p>
                <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>{partner?.logo_emoji} {partner?.name}</span>
                  <span>{(l.daily_impressions / 1000).toFixed(0)}k / day</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
