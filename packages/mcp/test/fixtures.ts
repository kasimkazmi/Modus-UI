import { vi } from "vitest";
import type { Catalogue } from "../src/catalogue.js";

export const ORIGIN = "https://example.test";

export const catalogue: Catalogue = {
  name: "modus-ui",
  homepage: ORIGIN,
  count: 3,
  categories: ["Typography", "Actions", "Backgrounds"],
  components: [
    {
      name: "blur-text",
      title: "Blur Text",
      category: "Typography",
      description: "Text animation that reveals words from a blur.",
      dependencies: ["framer-motion"],
    },
    {
      name: "magnet",
      title: "Magnet",
      category: "Actions",
      description: "Pulls an element toward the cursor.",
      dependencies: ["framer-motion"],
    },
    {
      name: "aurora-background",
      title: "Aurora Background",
      category: "Backgrounds",
      description: "Animated aurora gradient background.",
      dependencies: [],
    },
  ],
};

export const item = {
  name: "blur-text",
  files: [{ path: "registry/blur-text.tsx", content: "export function BlurText() {}\n" }],
};

/** Mock global fetch with a route table; `docs` controls whether /docs/*.md exists. */
export function mockFetch(options: { docs?: boolean; fail?: boolean } = {}) {
  const fn = vi.fn(async (input: string | URL | Request) => {
    if (options.fail) throw new TypeError("fetch failed");
    const path = new URL(String(input)).pathname;
    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
    if (path === "/registry/index.json") return json(catalogue);
    if (path === "/registry/blur-text.json") return json(item);
    if (path === "/docs/blur-text.md" && options.docs) {
      return new Response("# Blur Text from the site", { status: 200 });
    }
    return new Response("not found", { status: 404, statusText: "Not Found" });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}
