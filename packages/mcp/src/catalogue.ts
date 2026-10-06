/**
 * A cached client over the static registry the Modus UI site publishes:
 * `/registry/index.json`, `/registry/<name>.json` and `/docs/<name>.md`.
 */

export const DEFAULT_ORIGIN = "https://modusui.kasimkazmi.com";

export interface CatalogueComponent {
  name: string;
  title: string;
  category: string;
  description: string;
  dependencies: string[];
}

export interface Catalogue {
  name: string;
  homepage: string;
  count: number;
  categories: string[];
  components: CatalogueComponent[];
}

interface RegistryItem {
  name: string;
  files: { path: string; content: string }[];
}

/** Long enough that a burst of tool calls costs one request, short enough to see new components. */
const TTL_MS = 10 * 60 * 1000;

export function installCommand(name: string): string {
  return `npx @modus-ui/cli add ${name}`;
}

async function get(url: string, accept: string): Promise<Response> {
  const response = await fetch(url, { headers: { accept } });
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status} ${response.statusText}`);
  }
  return response;
}

export function createCatalogue(origin: string) {
  let cached: { at: number; value: Catalogue } | undefined;
  let inFlight: Promise<Catalogue> | undefined;

  async function load(): Promise<Catalogue> {
    if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
    // Concurrent calls on a cold cache share one request.
    inFlight ??= (async () => {
      try {
        const value = (await (
          await get(`${origin}/registry/index.json`, "application/json")
        ).json()) as Catalogue;
        if (!Array.isArray(value?.components) || !Array.isArray(value.categories)) {
          throw new Error("registry/index.json is not a component catalogue");
        }
        cached = { at: Date.now(), value };
        return value;
      } finally {
        inFlight = undefined;
      }
    })();
    return inFlight;
  }

  /** The site's markdown page, or one built from the registry item if that route is missing. */
  async function markdown(entry: CatalogueComponent): Promise<string> {
    const response = await fetch(`${origin}/docs/${entry.name}.md`, {
      headers: { accept: "text/markdown" },
    });
    if (response.ok) return response.text();
    if (response.status !== 404) {
      throw new Error(
        `GET ${origin}/docs/${entry.name}.md failed: ${response.status} ${response.statusText}`,
      );
    }
    const item = (await (
      await get(`${origin}/registry/${entry.name}.json`, "application/json")
    ).json()) as RegistryItem;
    return fallbackMarkdown(entry, item, origin);
  }

  return { origin, load, markdown };
}

export type CatalogueClient = ReturnType<typeof createCatalogue>;

export function fallbackMarkdown(
  entry: CatalogueComponent,
  item: RegistryItem,
  origin: string,
): string {
  return [
    `# ${entry.title}`,
    "",
    entry.description,
    "",
    `Category: ${entry.category}. Docs: ${origin}/docs/${entry.name}`,
    "",
    "## Installation",
    "",
    "```bash",
    installCommand(entry.name),
    "```",
    "",
    entry.dependencies.length
      ? `npm dependencies: ${entry.dependencies.join(", ")}`
      : "No extra npm dependencies.",
    "",
    "## Source",
    "",
    ...item.files.flatMap((file) => [
      `\`components/ui/${entry.name}.tsx\` (from \`${file.path}\`)`,
      "",
      "```tsx",
      file.content.trimEnd(),
      "```",
      "",
    ]),
  ].join("\n");
}

/** Words that appear everywhere and would otherwise match every component. */
const STOPWORDS = new Set(
  "a an and any are as at be by can component components do for from i in into is it like make me my need of on or react show some something that the to use want with you".split(
    " ",
  ),
);

function tokenize(value: string): string[] {
  const all = value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const meaningful = all.filter((token) => !STOPWORDS.has(token));
  return meaningful.length ? meaningful : all;
}

/** Crude plural fold so "buttons" finds "button". */
function fold(token: string): string {
  if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

function score(entry: CatalogueComponent, tokens: string[]): number {
  const name = entry.name.toLowerCase();
  const title = entry.title.toLowerCase();
  const category = entry.category.toLowerCase();
  const prose = new Set(
    `${entry.description} ${entry.category}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map(fold),
  );
  const joined = tokens.join(" ");

  let total = 0;
  if (name === joined || name.replace(/-/g, " ") === joined || title === joined) total += 100;
  for (const token of tokens) {
    const folded = fold(token);
    if (name.includes(folded)) total += 12;
    if (title.includes(folded)) total += 10;
    if (category.split(/\s+/).includes(folded)) total += 6;
    if (prose.has(folded)) total += 2;
  }
  return total;
}

export function searchComponents(
  catalogue: Catalogue,
  query: string,
  options: { category?: string; limit?: number } = {},
): CatalogueComponent[] {
  const { category, limit = 10 } = options;
  const pool = category
    ? catalogue.components.filter((entry) => entry.category === category)
    : catalogue.components;
  const tokens = tokenize(query);
  if (!tokens.length) return pool.slice(0, limit);

  const ranked = pool
    .map((entry) => ({ entry, value: score(entry, tokens) }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value || a.entry.name.localeCompare(b.entry.name));
  if (!ranked.length) return [];

  // Drop the long tail: anything under a third of the best hit is noise.
  const threshold = ranked[0]!.value / 3;
  return ranked
    .filter((row) => row.value >= threshold)
    .slice(0, limit)
    .map((row) => row.entry);
}

/** Match by slug or title, case-insensitively, ignoring spaces and hyphens ("BlurText", "blur text"). */
export function findComponent(catalogue: Catalogue, name: string): CatalogueComponent | undefined {
  const squash = (value: string) => value.toLowerCase().replace(/[\s_-]/g, "");
  const needle = squash(name);
  return catalogue.components.find(
    (entry) => squash(entry.name) === needle || squash(entry.title) === needle,
  );
}
