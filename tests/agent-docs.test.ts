import { describe, expect, it } from "vitest";
import { componentMarkdown, docUrl, llmsFullTxt, llmsTxt } from "@/lib/agent-docs";
import { getRegistryComponent } from "@/lib/registry";
import { registry } from "@/registry";

describe("llms.txt", () => {
  const txt = llmsTxt();

  it("starts with the llmstxt.org header", () => {
    expect(txt).toMatch(/^# Modus UI\n\n> /);
    expect(txt).toContain("npx @modus-ui/cli add <name>");
  });

  it.each(registry.map((c) => [c.name, c.title]))("links %s to its markdown doc", (name, title) => {
    expect(txt).toContain(`- [${title}](${docUrl(name)}): `);
  });
});

describe("component markdown", () => {
  it.each(registry.map((c) => c.name))("%s has install command and source, no JSX", (name) => {
    const md = componentMarkdown(name)!;
    expect(md).toContain(`npx @modus-ui/cli add ${name}`);
    expect(md).not.toContain("<ComponentPreview");
    expect(md).not.toMatch(/^title:/m);
    expect(md).toContain(getRegistryComponent(name)!.content.trimEnd());
  });

  it("returns null for unknown names", () => {
    expect(componentMarkdown("does-not-exist")).toBeNull();
  });
});

describe("llms-full.txt", () => {
  it("contains every component in registry order", () => {
    const full = llmsFullTxt();
    const positions = registry.map((c) => full.indexOf(`npx @modus-ui/cli add ${c.name}\``));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(full).not.toContain("<ComponentPreview");
  });
});
