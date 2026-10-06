import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { registry } from "@/registry";

const SRC = path.join(process.cwd(), "src");
const read = (file: string) => fs.readFileSync(path.join(SRC, file), "utf8");

const names = registry.map((item) => item.name);
const preview = read("components/component-preview.tsx");
const docsIndex = read("app/docs/components/page.tsx");
const sidebar = read("app/docs/layout.tsx");

describe("registry integrity", () => {
  it("has a unique name per component", () => {
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(registry)("$name points at real source files", (item) => {
    for (const file of item.files) {
      expect(fs.existsSync(path.join(SRC, file)), file).toBe(true);
    }
  });

  it.each(registry)("$name has a demo and an mdx doc", (item) => {
    expect(fs.existsSync(path.join(SRC, "registry", `${item.name}-demo.tsx`))).toBe(true);
    expect(fs.existsSync(path.join(SRC, "content/docs", `${item.name}.mdx`))).toBe(true);
  });

  it.each(registry)("$name lists every package it imports", (item) => {
    const source = read(item.files[0]);
    const imported = [...source.matchAll(/from\s+["']([^"'.@][^"']*|@[^"'/]+\/[^"'/]+)["']/g)]
      .map(([, spec]) =>
        spec
          .split("/")
          .slice(0, spec.startsWith("@") ? 2 : 1)
          .join("/"),
      )
      // Peers the host app already provides.
      .filter((pkg) => !["react", "react-dom", "next"].includes(pkg));
    for (const pkg of new Set(imported)) {
      expect(item.dependencies, `${item.name} imports ${pkg}`).toContain(pkg);
    }
  });
});

describe("every component is wired up (AGENTS.md rule 4)", () => {
  it.each(names)("%s is in the preview map", (name) => {
    expect(preview).toContain(`"${name}":`);
  });

  it.each(names)("%s is on the components index page", (name) => {
    expect(docsIndex).toContain(`"/docs/${name}"`);
  });

  it.each(names)("%s is in the docs sidebar", (name) => {
    expect(sidebar).toContain(`"/docs/${name}"`);
  });

  it("the sidebar links nothing that is not in the registry", () => {
    const linked = [...sidebar.matchAll(/href: "\/docs\/([^"]+)"/g)].map(([, n]) => n);
    const pages = new Set(["components", "coming-soon", ...names]);
    expect(linked.filter((n) => !pages.has(n))).toEqual([]);
  });
});
