import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPartnerBySlug, registerWithPartner } from "@/lib/partners.functions";

export const Route = createFileRoute("/_authenticated/partners/$slug")({
  head: () => ({ meta: [{ title: "Partner — PiBoards" }] }),
  component: PartnerDetail,
});

function PartnerDetail() {
  const { slug } = useParams({ from: "/_authenticated/partners/$slug" });
  const fetchFn = useServerFn(getPartnerBySlug);
  const regFn = useServerFn(registerWithPartner);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["partner", slug], queryFn: () => fetchFn({ data: { slug } }) });
  const reg = useMutation({
    mutationFn: (partner_id: string) => regFn({ data: { partner_id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partner", slug] }),
  });

  if (q.isLoading) return <p className="p-16 text-muted-foreground">Loading…</p>;
  if (!q.data) return <p className="p-16 text-destructive">Not found</p>;
  const { partner, registration } = q.data;

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to="/partners" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← All partners</Link>
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-4xl">{partner.logo_emoji}</div>
              <h1 className="mt-2 text-3xl font-bold">{partner.name}</h1>
              <p className="mt-1 text-muted-foreground">{partner.description}</p>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border border-primary/40 text-primary">
              {partner.adapter}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-muted-foreground">Regions</dt><dd>{partner.regions.join(", ")}</dd></div>
            <div><dt className="text-muted-foreground">Venue types</dt><dd>{partner.venue_categories.join(", ")}</dd></div>
          </dl>
          <div className="pt-4 border-t border-border">
            {registration?.status === "approved" ? (
              <p className="text-accent text-sm">✓ You are registered. Submit creatives from your campaign page.</p>
            ) : registration?.status === "pending" ? (
              <div>
                <p className="text-sm text-muted-foreground">Registration pending — real partner onboarding usually takes 1-3 days.</p>
                {registration.notes && <p className="mt-2 text-xs text-muted-foreground italic">{registration.notes}</p>}
              </div>
            ) : (
              <button
                onClick={() => reg.mutate(partner.id)}
                disabled={reg.isPending}
                className="px-5 py-2.5 rounded-full bg-[image:var(--gradient-neon)] text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                {reg.isPending ? "Registering…" : "Register with this partner"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}