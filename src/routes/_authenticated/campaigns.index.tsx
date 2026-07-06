import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyCampaigns } from "@/lib/campaigns.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/campaigns/")({
  head: () => ({ meta: [{ title: "My Campaigns — PiBoards" }] }),
  component: CampaignsIndex,
});

function CampaignsIndex() {
  const navigate = useNavigate();
  const fetchCampaigns = useServerFn(listMyCampaigns);
  const { data, isLoading, error } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => fetchCampaigns(),
  });

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← PiBoards</Link>
            <h1 className="mt-2 text-4xl font-bold">Your campaigns</h1>
            <p className="mt-1 text-muted-foreground">AI-produced ads, on-chain escrows, live billboards.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/campaigns/new" className="px-5 py-2.5 rounded-full bg-[image:var(--gradient-neon)] font-medium text-primary-foreground">
              New campaign
            </Link>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
              className="px-4 py-2.5 rounded-full border border-border hover:bg-secondary text-sm"
            >Sign out</button>
          </div>
        </div>

        {isLoading && <p className="mt-12 text-muted-foreground">Loading…</p>}
        {error && <p className="mt-12 text-destructive">{(error as Error).message}</p>}
        {data && data.length === 0 && (
          <div className="mt-16 rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">No campaigns yet. Start one and watch it hit the jumbotron.</p>
          </div>
        )}
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data?.map((c) => (
            <Link
              key={c.id}
              to="/campaigns/$id"
              params={{ id: c.id }}
              className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 hover:border-primary transition"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono uppercase tracking-widest text-accent">{c.status}</span>
                <span className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="mt-3 text-xl font-semibold">{c.brand}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.pitch}</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gradient-neon">{Number(c.budget_pi).toFixed(2)} π</span>
                <span className="text-xs text-muted-foreground">budget</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Spent {Number(c.spent_pi).toFixed(2)} π
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}