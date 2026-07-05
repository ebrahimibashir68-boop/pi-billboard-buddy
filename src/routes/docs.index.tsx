import { createFileRoute, Link } from "@tanstack/react-router";
import { DOCS } from "./docs";

export const Route = createFileRoute("/docs/")({
  component: DocsIndex,
});

function DocsIndex() {
  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tight mb-3">Pi Ecosystem Docs</h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        Everything you need to build on Pi Network — bundled inside PiBoards so
        creators can ship end-to-end campaigns without leaving the app.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {DOCS.map((d) => (
          <Link
            key={d.slug}
            to="/docs/$slug"
            params={{ slug: d.slug }}
            className="rounded-xl border border-border p-5 hover:border-foreground/40 transition block"
          >
            <div className="font-medium mb-1">{d.title}</div>
            <div className="text-xs text-muted-foreground">/docs/{d.slug}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}