import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { generateInnovationFeed } from "@/lib/innovation-feed.functions";

type Update = {
  title: string;
  category: string;
  summary: string;
  impact: string;
};

export function InnovationFeed() {
  const fetchFeed = useServerFn(generateInnovationFeed);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFeed();
      setUpdates(res.updates);
      setGeneratedAt(res.generatedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load updates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section id="innovation" className="mx-auto max-w-7xl px-6 py-24">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-3">
            <span className="h-2 w-2 rounded-full bg-[image:var(--gradient-neon)] animate-pulse" />
            AI Innovation Bot · live
          </div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
            What&apos;s new on PiBoards
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Our on-board AI scans the frontier of ad-tech, LED hardware, and Pi
            payments — then drafts product updates tailored to how you actually
            run campaigns.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-5 py-2.5 rounded-lg border border-border bg-background/50 backdrop-blur hover:bg-background transition text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate new updates"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive mb-6">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(loading && updates.length === 0
          ? Array.from({ length: 6 })
          : updates
        ).map((u, i) => {
          const item = u as Update | undefined;
          return (
            <article
              key={i}
              className="rounded-2xl border border-border bg-card/40 backdrop-blur p-6 hover:border-foreground/30 transition group"
            >
              {item ? (
                <>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    {item.category}
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {item.summary}
                  </p>
                  <div className="text-xs text-foreground/80 border-t border-border pt-3">
                    → {item.impact}
                  </div>
                </>
              ) : (
                <div className="animate-pulse space-y-3">
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-full bg-muted rounded" />
                  <div className="h-3 w-5/6 bg-muted rounded" />
                </div>
              )}
            </article>
          );
        })}
      </div>

      {generatedAt && (
        <p className="text-xs text-muted-foreground mt-6">
          Drafted by AI · {new Date(generatedAt).toLocaleString()}
        </p>
      )}
    </section>
  );
}