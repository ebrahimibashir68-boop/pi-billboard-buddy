import { createFileRoute, notFound } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DOCS } from "./docs";

export const Route = createFileRoute("/docs/$slug")({
  loader: async ({ params }) => {
    const doc = DOCS.find((d) => d.slug === params.slug);
    if (!doc) throw notFound();
    const res = await fetch(`/pi-docs/${params.slug}.md`);
    if (!res.ok) throw notFound();
    const markdown = await res.text();
    return { doc, markdown };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.doc.title} — Pi Docs` },
          { name: "description", content: `${loaderData.doc.title} — Pi Network developer reference.` },
        ]
      : [],
  }),
  notFoundComponent: () => <div>Doc not found.</div>,
  errorComponent: ({ error }) => <div className="text-destructive">{String(error)}</div>,
  component: DocPage,
});

function DocPage() {
  const { doc, markdown } = Route.useLoaderData();
  return (
    <article className="prose prose-invert max-w-none prose-headings:tracking-tight prose-a:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:border prose-pre:border-border">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Pi Reference</div>
      <h1 className="!mb-6">{doc.title}</h1>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </article>
  );
}