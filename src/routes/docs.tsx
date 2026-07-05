import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

const DOCS = [
  { slug: "README", title: "Frontend JS SDK — Overview" },
  { slug: "authentication", title: "Authentication" },
  { slug: "payments", title: "Payments (U2A)" },
  { slug: "payments_advanced", title: "Payments Advanced (A2U)" },
  { slug: "platform_API", title: "Platform API" },
  { slug: "SDK_reference", title: "Client SDK Reference" },
  { slug: "ads", title: "Ads" },
  { slug: "pinet", title: "PiNet Metadata" },
  { slug: "developer_portal", title: "Pi Developer Portal" },
  { slug: "tokens", title: "Tokens" },
];

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Pi Ecosystem Docs — PiBoards" },
      { name: "description", content: "Reference docs for building on Pi Network: SDK, payments, ads, platform API, and more." },
    ],
  }),
  component: DocsLayout,
});

export { DOCS };

function DocsLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight">← PiBoards</Link>
          <span className="text-sm text-muted-foreground">Pi Ecosystem Docs</span>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-10 grid md:grid-cols-[220px_1fr] gap-10">
        <aside>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Reference</div>
          <nav className="flex flex-col gap-1 text-sm">
            {DOCS.map((d) => (
              <Link
                key={d.slug}
                to="/docs/$slug"
                params={{ slug: d.slug }}
                className="px-3 py-2 rounded-md hover:bg-muted transition text-muted-foreground [&.active]:bg-muted [&.active]:text-foreground"
                activeProps={{ className: "active" }}
              >
                {d.title}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}