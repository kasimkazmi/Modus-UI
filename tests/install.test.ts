import { describe, expect, it } from "vitest";
import {
  CLI_PACKAGE,
  installCommand,
  NPM_INSTALL_PATTERN,
  PACKAGE_MANAGERS,
  type PackageManager,
} from "@/lib/install";
import { registry } from "@/registry";

describe("install commands", () => {
  const expected: Record<PackageManager, string> = {
    pnpm: "pnpm dlx @modus-ui/cli add blur-text",
    npm: "npx @modus-ui/cli add blur-text",
    yarn: "yarn dlx @modus-ui/cli add blur-text",
    bun: "bunx @modus-ui/cli add blur-text",
  };

  it.each(PACKAGE_MANAGERS)("%s runs the scoped CLI", (manager) => {
    expect(installCommand(manager, "blur-text")).toBe(expected[manager]);
  });

  it("only ever uses the scoped package", () => {
    expect(CLI_PACKAGE).toBe("@modus-ui/cli");
    for (const manager of PACKAGE_MANAGERS) {
      expect(installCommand(manager, "x")).not.toMatch(/(?<![\w/@-])modus-ui(?![\w/-])/);
    }
  });

  // The docs write the npm form; the page swaps it for tabs, so every page must match the pattern.
  it.each(registry)("$name's docs command is recognised as an install command", (item) => {
    expect(NPM_INSTALL_PATTERN.exec(installCommand("npm", item.name))?.[1]).toBe(item.name);
  });
});
