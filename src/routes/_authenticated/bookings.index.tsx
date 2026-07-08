import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listMyBookings, payInvoice, getBookingPlays } from "@/lib/locations.functions";

export const Route = createFileRoute("/_authenticated/bookings/")({
  head: () => ({ meta: [{ title: "My bookings — PiBoards" }] }),
  component: BookingsIndex,
});

function BookingsIndex() {
  const listFn = useServerFn(listMyBookings);
  const payFn = useServerFn(payInvoice);
  const playsFn = useServerFn(getBookingPlays);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["bookings"], queryFn: () => listFn() });
  const pay = useMutation({
    mutationFn: (invoice_id: string) => payFn({ data: { invoice_id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const playsQ = useQuery({
    queryKey: ["plays", openId],
    queryFn: () => playsFn({ data: { booking_id: openId! } }),
    enabled: !!openId,
  });

  if (q.isLoading) return <p className="p-16 text-muted-foreground">Loading…</p>;
  const { bookings, invoices } = q.data ?? { bookings: [], invoices: [] };
  const invByBooking = new Map(invoices.map((i) => [i.booking_id, i]));

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link to="/locations" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Locations</Link>
          <h1 className="mt-2 text-4xl font-bold">Bookings & invoices</h1>
        </div>

        {bookings.length === 0 && <p className="text-muted-foreground">No bookings yet. Reserve a billboard from the locations page.</p>}

        <div className="space-y-3">
          {bookings.map((b) => {
            type Row = typeof b & {
              billboard_locations?: { name: string; city: string; country: string; hero_emoji: string | null; slug: string } | null;
              ad_partners?: { name: string; logo_emoji: string | null } | null;
              campaigns?: { brand: string } | null;
            };
            const row = b as Row;
            const loc = row.billboard_locations;
            const inv = invByBooking.get(b.id);
            return (
              <div key={b.id} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{loc?.hero_emoji}</span>
                      <div>
                        <div className="font-semibold">{loc?.name}</div>
                        <div className="text-xs text-muted-foreground">{loc?.city} · {loc?.country} · {row.ad_partners?.name}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {row.campaigns?.brand} · {new Date(b.starts_at).toLocaleString()} · {b.hours_booked}h
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{Number(b.quoted_price_pi).toFixed(2)} π</div>
                    <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${
                      b.status === "running" ? "border-accent/40 text-accent" :
                      b.status === "approved" ? "border-primary/40 text-primary" :
                      b.status === "rejected" || b.status === "cancelled" ? "border-destructive/40 text-destructive" :
                      "border-border text-muted-foreground"
                    }`}>
                      {b.status}
                    </span>
                  </div>
                </div>
                {inv && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                    <div className="font-mono text-xs">
                      <span className="text-muted-foreground">Invoice </span>{inv.number}
                      <span className="ml-3 text-muted-foreground">{inv.status}</span>
                    </div>
                    <div className="flex gap-2">
                      {inv.status === "issued" && b.status === "approved" && (
                        <button
                          onClick={() => pay.mutate(inv.id)}
                          disabled={pay.isPending}
                          className="px-4 py-1.5 rounded-full bg-[image:var(--gradient-neon)] text-primary-foreground text-xs font-medium disabled:opacity-50"
                        >
                          Pay {Number(inv.total_pi).toFixed(2)} π
                        </button>
                      )}
                      <button onClick={() => setOpenId(openId === b.id ? null : b.id)} className="px-3 py-1.5 rounded-full border border-border text-xs">
                        {openId === b.id ? "Hide plays" : "Proof-of-play"}
                      </button>
                    </div>
                  </div>
                )}
                {openId === b.id && (
                  <div className="mt-3 rounded-lg bg-background/40 border border-border p-3 text-xs font-mono max-h-64 overflow-auto">
                    {playsQ.isLoading && <p className="text-muted-foreground">Loading…</p>}
                    {playsQ.data && playsQ.data.plays.length === 0 && <p className="text-muted-foreground">No plays recorded yet. Pay the invoice to activate the schedule.</p>}
                    {playsQ.data && playsQ.data.plays.length > 0 && (
                      <>
                        <div className="text-accent mb-2">Σ {playsQ.data.total_impressions.toLocaleString()} impressions over {playsQ.data.plays.length} plays</div>
                        {playsQ.data.plays.slice(0, 60).map((p) => (
                          <div key={p.id} className="flex justify-between text-muted-foreground py-0.5">
                            <span>{new Date(p.played_at).toLocaleString()}</span>
                            <span>{p.duration_seconds}s · +{p.impressions.toLocaleString()} imp</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
