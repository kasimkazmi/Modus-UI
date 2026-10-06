import { componentMarkdown } from "@/lib/agent-docs";
import { registry } from "@/registry";

/** Served at /docs/<name>.md through the rewrite in next.config.js. */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return registry.map((c) => ({ name: c.name }));
}

export function GET(_request: Request, { params }: { params: { name: string } }) {
  const markdown = componentMarkdown(params.name);
  if (!markdown) return new Response("Not found", { status: 404 });
  return new Response(markdown, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
