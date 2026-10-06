import { describe, expect, it } from "vitest";
import robots from "../src/app/robots";
import sitemap from "../src/app/sitemap";
import { SITE } from "../src/lib/site";
import { registry } from "../src/registry";

describe("sitemap", () => {
  const urls = sitemap().map((entry) => entry.url);

  it("lists every component docs page under the site URL", () => {
    for (const item of registry) {
      expect(urls).toContain(`${SITE.url}/docs/${item.name}`);
    }
  });

  it("keeps every URL on the site and excludes previews", () => {
    for (const url of urls) {
      expect(url.startsWith(SITE.url)).toBe(true);
      expect(url).not.toContain("/preview");
    }
  });
});

describe("robots", () => {
  it("disallows previews and points to the sitemap", () => {
    const result = robots();
    const rules = [result.rules].flat();
    expect(rules.flatMap((rule) => [rule.disallow].flat())).toContain("/preview/");
    expect(result.sitemap).toBe(`${SITE.url}/sitemap.xml`);
  });
});
