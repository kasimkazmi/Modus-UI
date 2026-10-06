import { afterEach, describe, expect, it, vi } from "vitest";
import { createCatalogue, findComponent, searchComponents } from "../src/catalogue.js";
import { ORIGIN, catalogue, mockFetch } from "./fixtures.js";

afterEach(() => vi.unstubAllGlobals());

describe("searchComponents", () => {
  it("ranks by intent", () => {
    expect(searchComponents(catalogue, "text animation")[0]?.name).toBe("blur-text");
    expect(searchComponents(catalogue, "backgrounds")[0]?.name).toBe("aurora-background");
  });

  it("filters by category and respects the limit", () => {
    expect(searchComponents(catalogue, "animated", { category: "Actions" })).toEqual([]);
    expect(searchComponents(catalogue, "", { limit: 2 })).toHaveLength(2);
  });

  it("returns nothing for an unrelated query", () => {
    expect(searchComponents(catalogue, "spreadsheet")).toEqual([]);
  });
});

describe("findComponent", () => {
  it("accepts slug or title in any case", () => {
    for (const name of ["blur-text", "Blur Text", "BLURTEXT", " blur text "]) {
      expect(findComponent(catalogue, name)?.name).toBe("blur-text");
    }
    expect(findComponent(catalogue, "nope")).toBeUndefined();
  });
});

describe("createCatalogue", () => {
  it("caches the catalogue and de-duplicates concurrent loads", async () => {
    const fetch = mockFetch();
    const client = createCatalogue(ORIGIN);
    await Promise.all([client.load(), client.load(), client.load()]);
    await client.load();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("uses the site's markdown when it exists", async () => {
    mockFetch({ docs: true });
    const client = createCatalogue(ORIGIN);
    expect(await client.markdown(catalogue.components[0]!)).toBe("# Blur Text from the site");
  });

  it("builds markdown from the registry item when /docs/<name>.md is missing", async () => {
    mockFetch({ docs: false });
    const md = await createCatalogue(ORIGIN).markdown(catalogue.components[0]!);
    expect(md).toContain("# Blur Text");
    expect(md).toContain("npx @modus-ui/cli add blur-text");
    expect(md).toContain("npm dependencies: framer-motion");
    expect(md).toContain("```tsx\nexport function BlurText() {}\n```");
  });
});
