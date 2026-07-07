import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPartners, registerWithPartner } from "@/lib/partners.functions";

export const Route = createFileRoute("/_authenticated/partners/")({
  head: () => ({ meta: [{ title: "Partner network — PiBoards" }] }),
  component: PartnersIndex,
});

function PartnersIndex() {
  const fetchFn = useServerFn(listPartners);
  const regFn = useServerFn(registerWithPartner);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["partners"], queryFn: () => fetchFn() });
  const reg = useMutation({
    mutationFn: (partner_id: string) => regFn({ data: { partner_id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partners"] }),
  });

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Home</Link>
          <h1 className="mt-2 text-4xl font-bold">Partner network</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Register with billboard operators around the world. Simulated partners onboard instantly; real programmatic
            adapters (Broadsign, Vistar, Hivestack, Place Exchange) activate once API credentials are added in Cloud secrets.
          </p>
        </div>
        {q.isLoading && <p className="text-muted-foreground">Loading partners…</p>}
        {q.data && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {q.data.map((p) => {
              const status = p.registration?.status;
              return (
                <div key={p.id} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="text-3xl">{p.logo_emoji ?? "📺"}</div>
                    <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${p.adapter === "simulated" ? "border-accent/40 text-accent" : "border-primary/40 text-primary"}`}>
                      {p.adapter}
                    </span>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{p.name}</div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{p.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Regions: {p.regions.join(", ")}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <Link to="/partners/$slug" params={{ slug: p.slug }} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
                      Details →
                    </Link>
                    {status === "approved" ? (
                      <span className="text-xs font-mono text-accent">✓ Registered</span>
                    ) : status === "pending" ? (
                      <span className="text-xs font-mono text-muted-foreground">Pending</span>
                    ) : (
                      <button
                        onClick={() => reg.mutate(p.id)}
                        disabled={reg.isPending}
                        className="px-3 py-1.5 rounded-full text-xs border border-primary hover:bg-primary/10 disabled:opacity-50"
                      >
                        Register
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}