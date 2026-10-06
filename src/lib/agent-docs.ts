import fs from "fs";
import path from "path";
import { CATEGORIES, registry } from "@/registry";
import { getRegistryComponent } from "@/lib/registry";
import { SITE } from "@/lib/site";

interface Doc {
  title: string;
  description: string;
  body: string;
}

/** Reads a component's MDX doc and returns its frontmatter and a markdown body free of JSX components. */
export function readComponentDoc(name: string): Doc {
  const raw = fs.readFileSync(path.join(process.cwd(), "src/content/docs", `${name}.mdx`), "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const meta: Record<string, string> = {};
  for (const line of (match?.[1] ?? "").split("\n")) {
    const i = line.indexOf(":");
    if (i > 0)
      meta[line.slice(0, i).trim()] = line
        .slice(i + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
  }
  return {
    title: meta.title ?? name,
    description: meta.description ?? "",
    body: stripJsx(raw.slice(match?.[0].length ?? 0)),
  };
}

/** Removes self-closing JSX components (e.g. `<ComponentPreview name="x" />`) outside code fences. */
function stripJsx(mdx: string): string {
  let inFence = false;
  return mdx
    .split("\n")
    .filter((line) => {
      if (line.trimStart().startsWith("```")) inFence = !inFence;
      return inFence || !/^\s*<[A-Z][\w.]*\b[^>]*\/>\s*$/.test(line);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const docUrl = (name: string) => `${SITE.url}/docs/${name}.md`;

/** One component as markdown: title, description, install command, docs body and full source. Null for unknown names. */
export function componentMarkdown(name: string): string | null {
  const component = getRegistryComponent(name);
  if (!component) return null;
  const doc = readComponentDoc(name);
  return [
    `# ${doc.title}`,
    `> ${doc.description}`,
    `Install: \`${SITE.cli} ${name}\``,
    doc.body,
    `## Source\n\n\`components/ui/${name}.tsx\`\n\n\`\`\`tsx\n${component.content.trimEnd()}\n\`\`\``,
  ].join("\n\n");
}

/** The llmstxt.org index: every component grouped by category, linking to its markdown doc. */
export function llmsTxt(): string {
  const sections = CATEGORIES.map((category) => {
    const items = registry.filter((c) => c.category === category);
    if (items.length === 0) return null;
    const links = items.map(
      (c) => `- [${c.title}](${docUrl(c.name)}): ${readComponentDoc(c.name).description}`,
    );
    return `## ${category}\n\n${links.join("\n")}`;
  }).filter(Boolean);
  return (
    [
      `# ${SITE.name}`,
      `> ${SITE.description}`,
      `Install any component with \`${SITE.cli} <name>\`. It writes the source to \`components/ui/<name>.tsx\` and lists the npm packages it needs. Components import \`cn()\` from \`@/lib/utils\` (clsx + tailwind-merge). Every link below is a markdown doc with usage and full source; ${SITE.url}/llms-full.txt has all of them in one file. Project setup (Tailwind CSS v3, theme tokens as HSL channels, the \`@/\` alias) is described at ${SITE.url}/docs/installation.`,
      ...sections,
    ].join("\n\n") + "\n"
  );
}

/** Every component's markdown doc, in registry order. */
export function llmsFullTxt(): string {
  return registry.map((c) => componentMarkdown(c.name)).join("\n\n---\n\n") + "\n";
}
