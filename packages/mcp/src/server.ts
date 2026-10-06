import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  createCatalogue,
  findComponent,
  installCommand,
  searchComponents,
  type Catalogue,
  type CatalogueComponent,
} from "./catalogue.js";

export const VERSION = (createRequire(import.meta.url)("../package.json") as { version: string })
  .version;

const INSTRUCTIONS = [
  "Modus UI is a library of animated React components (TypeScript, Tailwind CSS, Framer Motion).",
  "Components are copied into the user's project with the Modus UI CLI; they are not an npm",
  "package and nothing is imported from node_modules. Each lands in components/ui/<name>.tsx",
  "and imports `cn` from @/lib/utils.",
  "",
  "Use `search_components` (or `list_components`) to find a component, then `get_component` to",
  "read its props, usage and source before writing code. Never guess a component's props.",
  "To add one to the project, run the command from `get_install_command`.",
].join("\n");

const annotations = { readOnlyHint: true, openWorldHint: true };

function text(value: string) {
  return { content: [{ type: "text" as const, text: value }] };
}

function error(value: string) {
  return { ...text(value), isError: true };
}

export function createServer(origin: string): McpServer {
  const catalogue = createCatalogue(origin.replace(/\/$/, ""));
  const base = catalogue.origin;
  const server = new McpServer(
    { name: "modus-ui", version: VERSION },
    { instructions: INSTRUCTIONS },
  );

  /** Network failures become tool errors the agent can read, not transport failures. */
  async function guard(what: string, run: (c: Catalogue) => Promise<ReturnType<typeof text>>) {
    try {
      return await run(await catalogue.load());
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause);
      return error(
        `Could not ${what}: ${detail}\n\nThe catalogue is served from ${base}/registry/index.json. Check connectivity, or set MODUS_UI_URL to a reachable origin.`,
      );
    }
  }

  function unknownCategory(c: Catalogue, category?: string) {
    if (!category || c.categories.includes(category)) return undefined;
    return error(`No category "${category}". Categories: ${c.categories.join(", ")}.`);
  }

  function unknownName(c: Catalogue, name: string) {
    const suggestions = searchComponents(c, name, { limit: 5 }).map((e) => e.name);
    return error(
      `No component named "${name}".` +
        (suggestions.length
          ? ` Did you mean: ${suggestions.join(", ")}?`
          : " Use search_components or list_components to find one."),
    );
  }

  const summary = (e: CatalogueComponent) =>
    [
      `### ${e.title} (\`${e.name}\`)`,
      `- Category: ${e.category}`,
      `- ${e.description}`,
      `- Docs: ${base}/docs/${e.name}`,
      `- Install: \`${installCommand(e.name)}\``,
    ].join("\n");

  const categoryInput = z
    .string()
    .optional()
    .describe("Restrict to one category, e.g. 'Typography'. list_components shows them all.");

  server.registerTool(
    "search_components",
    {
      title: "Search Modus UI components",
      description:
        "Search the Modus UI catalogue by intent or name, e.g. 'text animation', 'animated background', 'magnet'. Returns ranked matches. Call get_component afterwards for props and source.",
      inputSchema: {
        query: z.string().describe("What the component should do, or its name."),
        category: categoryInput,
        limit: z.number().int().min(1).optional().describe("Maximum results (default 10)."),
      },
      annotations,
    },
    ({ query, category, limit }) =>
      guard("search the Modus UI catalogue", async (c) => {
        const rejected = unknownCategory(c, category);
        if (rejected) return rejected;
        const matches = searchComponents(c, query, { category, limit });
        if (!matches.length) {
          return text(
            `No component matched "${query}". Available: ${c.components.map((e) => e.name).join(", ")}`,
          );
        }
        return text(
          [`${matches.length} match(es) for "${query}":`, ...matches.map(summary)].join("\n\n"),
        );
      }),
  );

  server.registerTool(
    "list_components",
    {
      title: "List Modus UI components",
      description: "List every Modus UI component, grouped by category.",
      inputSchema: { category: categoryInput },
      annotations,
    },
    ({ category }) =>
      guard("list the Modus UI catalogue", async (c) => {
        const rejected = unknownCategory(c, category);
        if (rejected) return rejected;
        const sections = (category ? [category] : c.categories).map((current) => {
          const entries = c.components
            .filter((e) => e.category === current)
            .sort((a, b) => a.title.localeCompare(b.title));
          return [
            `## ${current} (${entries.length})`,
            ...entries.map((e) => `- \`${e.name}\` (${e.title}): ${e.description}`),
          ].join("\n");
        });
        return text(
          [
            `Modus UI: ${c.count} components. Install any with: ${installCommand("<name>")}`,
            ...sections,
          ].join("\n\n"),
        );
      }),
  );

  server.registerTool(
    "get_component",
    {
      title: "Get a Modus UI component",
      description:
        "Full documentation for one component: description, install command, usage, props and the entire source. Read this before writing code that uses it.",
      inputSchema: {
        name: z.string().describe("Component slug or title, e.g. 'blur-text' or 'Blur Text'."),
      },
      annotations,
    },
    ({ name }) =>
      guard(`fetch the "${name}" component`, async (c) => {
        const entry = findComponent(c, name);
        return entry ? text(await catalogue.markdown(entry)) : unknownName(c, name);
      }),
  );

  server.registerTool(
    "get_install_command",
    {
      title: "Get the install command for a component",
      description:
        "The exact Modus UI CLI command that adds a component to the current project, where the file lands and which npm packages it needs. Run it in the project root.",
      inputSchema: { name: z.string().describe("Component slug or title, e.g. 'magnet'.") },
      annotations,
    },
    ({ name }) =>
      guard(`build the install command for "${name}"`, async (c) => {
        const entry = findComponent(c, name);
        if (!entry) return unknownName(c, name);
        return text(
          [
            "```bash",
            installCommand(entry.name),
            "```",
            "",
            `Writes \`components/ui/${entry.name}.tsx\` (imports \`cn\` from \`@/lib/utils\`).`,
            entry.dependencies.length
              ? `npm dependencies: ${entry.dependencies.join(", ")}`
              : "No extra npm dependencies.",
            `Docs: ${base}/docs/${entry.name}`,
          ].join("\n"),
        );
      }),
  );

  return server;
}
