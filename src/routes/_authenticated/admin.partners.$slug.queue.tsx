import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listPartnerQueue, decideSubmission } from "@/lib/submissions.functions";

export const Route = createFileRoute("/_authenticated/admin/partners/$slug/queue")({
  head: () => ({ meta: [{ title: "Partner review queue — PiBoards" }] }),
  component: AdminQueue,
});

function AdminQueue() {
  const { slug } = useParams({ from: "/_authenticated/admin/partners/$slug/queue" });
  const fetchFn = useServerFn(listPartnerQueue);
  const decideFn = useServerFn(decideSubmission);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["queue", slug], queryFn: () => fetchFn({ data: { partner_slug: slug } }) });
  const decide = useMutation({
    mutationFn: (v: { submission_id: string; decision: "approved" | "rejected"; notes?: string }) => decideFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queue", slug] }),
  });
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  if (q.isLoading) return <p className="p-16 text-muted-foreground">Loading…</p>;
  if (q.error) return <p className="p-16 text-destructive">{(q.error as Error).message}</p>;
  if (!q.data) return null;

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-bold">Review queue · {q.data.partner.name}</h1>
        {q.data.submissions.length === 0 && <p className="text-muted-foreground">Empty.</p>}
        <div className="space-y-4">
          {q.data.submissions.map((s) => {
            type Row = typeof s & {
              campaign_creatives?: { headline: string | null; body: string | null; image_url: string | null; kind: string } | null;
              campaigns?: { brand: string } | null;
            };
            const row = s as Row;
            const creative = row.campaign_creatives;
            const brand = row.campaigns?.brand ?? "—";
            return (
              <div key={s.id} className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 grid md:grid-cols-[220px_1fr] gap-4">
                {creative?.image_url ? (
                  <img src={creative.image_url} className="rounded-lg aspect-video object-cover" alt="" />
                ) : (
                  <div className="rounded-lg aspect-video bg-background/40 border border-border grid place-items-center text-muted-foreground text-xs">
                    {creative?.kind ?? "no image"}
                  </div>
                )}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold">{creative?.headline ?? "(no headline)"}</div>
                      <div className="text-xs text-muted-foreground">{brand}</div>
                    </div>
                    <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${s.partner_review === "approved" ? "border-accent/40 text-accent" : s.partner_review === "rejected" ? "border-destructive/40 text-destructive" : "border-border text-muted-foreground"}`}>
                      {s.partner_review}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{creative?.body}</p>
                  <div className="text-xs">
                    <span className="text-muted-foreground">AI: </span>
                    <span className={s.ai_check === "passed" ? "text-accent" : "text-destructive"}>{s.ai_check}</span>
                    {s.ai_flags?.length > 0 && <span className="ml-2 text-muted-foreground">({s.ai_flags.join(", ")})</span>}
                    {s.ai_notes && <span className="ml-2 italic text-muted-foreground">— {s.ai_notes}</span>}
                  </div>
                  {s.partner_review === "pending" && (
                    <div className="flex gap-2 items-center">
                      <input
                        placeholder="Optional review notes"
                        value={notesById[s.id] ?? ""}
                        onChange={(e) => setNotesById((m) => ({ ...m, [s.id]: e.target.value }))}
                        className="flex-1 px-3 py-2 rounded-lg bg-background/60 border border-border text-sm"
                      />
                      <button onClick={() => decide.mutate({ submission_id: s.id, decision: "approved", notes: notesById[s.id] })} className="px-4 py-2 rounded-full border border-accent text-accent text-sm hover:bg-accent/10">
                        Approve
                      </button>
                      <button onClick={() => decide.mutate({ submission_id: s.id, decision: "rejected", notes: notesById[s.id] })} className="px-4 py-2 rounded-full border border-destructive text-destructive text-sm hover:bg-destructive/10">
                        Reject
                      </button>
                    </div>
                  )}
                  {s.partner_notes && s.partner_review !== "pending" && (
                    <p className="text-xs italic text-muted-foreground">Partner notes: {s.partner_notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}