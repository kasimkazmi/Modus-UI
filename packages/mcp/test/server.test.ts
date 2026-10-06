import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createServer } from "../src/server.js";
import { ORIGIN, mockFetch } from "./fixtures.js";

afterEach(() => vi.unstubAllGlobals());

async function connect() {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await createServer(ORIGIN).connect(serverSide);
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(clientSide);
  return async (name: string, args: Record<string, unknown>) => {
    const result = await client.callTool({ name, arguments: args });
    const content = result.content as { type: string; text: string }[];
    return { text: content[0]!.text, isError: Boolean(result.isError) };
  };
}

describe("modus-ui MCP server", () => {
  it("lists the four read-only tools", async () => {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await createServer(ORIGIN).connect(serverSide);
    const client = new Client({ name: "test", version: "0.0.0" });
    await client.connect(clientSide);
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "get_component",
      "get_install_command",
      "list_components",
      "search_components",
    ]);
    expect(tools.every((t) => t.annotations?.readOnlyHint)).toBe(true);
    expect(client.getServerVersion()?.name).toBe("modus-ui");
  });

  it("search_components ranks and validates the category", async () => {
    mockFetch();
    const call = await connect();
    const hit = await call("search_components", { query: "text animation" });
    expect(hit.text).toContain("Blur Text (`blur-text`)");
    expect(hit.text).toContain(`${ORIGIN}/docs/blur-text`);
    const bad = await call("search_components", { query: "x", category: "Nope" });
    expect(bad.isError).toBe(true);
    expect(bad.text).toContain("Typography, Actions, Backgrounds");
  });

  it("list_components groups by category with counts", async () => {
    mockFetch();
    const call = await connect();
    const all = await call("list_components", {});
    expect(all.text).toContain("Modus UI: 3 components");
    expect(all.text).toContain("## Typography (1)");
    const one = await call("list_components", { category: "Actions" });
    expect(one.text).toContain("`magnet`");
    expect(one.text).not.toContain("blur-text");
  });

  it("get_component returns markdown, falling back to the registry", async () => {
    mockFetch({ docs: false });
    const call = await connect();
    const result = await call("get_component", { name: "Blur Text" });
    expect(result.isError).toBe(false);
    expect(result.text).toContain("```tsx");
  });

  it("get_component suggests names for an unknown component", async () => {
    mockFetch();
    const call = await connect();
    const result = await call("get_component", { name: "blur" });
    expect(result.isError).toBe(true);
    expect(result.text).toContain("Did you mean: blur-text");
  });

  it("get_install_command returns the CLI command, target and dependencies", async () => {
    mockFetch();
    const call = await connect();
    const result = await call("get_install_command", { name: "magnet" });
    expect(result.text).toContain("npx @modus-ui/cli add magnet");
    expect(result.text).toContain("components/ui/magnet.tsx");
    expect(result.text).toContain("npm dependencies: framer-motion");
    expect(result.text).toContain(`${ORIGIN}/docs/magnet`);
  });

  it("turns network failures into tool errors", async () => {
    mockFetch({ fail: true });
    const call = await connect();
    const result = await call("list_components", {});
    expect(result.isError).toBe(true);
    expect(result.text).toContain("fetch failed");
    expect(result.text).toContain("MODUS_UI_URL");
  });
});
