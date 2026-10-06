import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { add, type Runner } from "./commands/add.js";

const catalogue = {
  name: "modus-ui",
  homepage: "https://example.test",
  count: 2,
  categories: ["Text"],
  components: [
    {
      name: "blur-text",
      title: "Blur Text",
      category: "Text",
      description: "d",
      dependencies: ["framer-motion"],
    },
    {
      name: "magnet",
      title: "Magnet",
      category: "Text",
      description: "d",
      dependencies: ["framer-motion"],
    },
  ],
};

function component(name: string) {
  return {
    name,
    title: name,
    category: "Text",
    type: "registry:ui",
    dependencies: ["framer-motion"],
    files: [{ path: `registry/${name}.tsx`, content: `// ${name}\n` }],
  };
}

let dir: string;
let run: ReturnType<typeof vi.fn<Runner>>;
const log = () => {};

async function project(pkg: Record<string, unknown> = {}, files: string[] = []) {
  await writeFile(join(dir, "package.json"), JSON.stringify({ name: "app", ...pkg }));
  for (const f of files) {
    await mkdir(join(dir, f, ".."), { recursive: true });
    await writeFile(join(dir, f), "");
  }
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "modus-cli-"));
  run = vi.fn<Runner>(async () => {});
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const name = url.split("/registry/")[1].replace(/\.json$/, "");
      const body = name === "index" ? catalogue : component(name);
      return new Response(JSON.stringify(body), { status: 200 });
    }),
  );
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await rm(dir, { recursive: true, force: true });
});

describe("add", () => {
  it("writes the component and creates lib/utils.ts without src/", async () => {
    await project();
    await add(["blur-text"], { cwd: dir, run, log });
    expect(await readFile(join(dir, "components/ui/blur-text.tsx"), "utf8")).toBe("// blur-text\n");
    expect(await readFile(join(dir, "lib/utils.ts"), "utf8")).toContain("twMerge(clsx(inputs))");
  });

  it("uses src/ when the project has one", async () => {
    await project({}, ["src/app.ts"]);
    await add(["magnet"], { cwd: dir, run, log });
    expect(existsSync(join(dir, "src/components/ui/magnet.tsx"))).toBe(true);
    expect(existsSync(join(dir, "src/lib/utils.ts"))).toBe(true);
  });

  it("keeps an existing utils file and honours --path", async () => {
    await project({}, ["lib/utils.ts"]);
    await add(["magnet"], { cwd: dir, path: "ui", run, log });
    expect(existsSync(join(dir, "ui/magnet.tsx"))).toBe(true);
    expect(await readFile(join(dir, "lib/utils.ts"), "utf8")).toBe("");
  });

  it("skips existing files unless --overwrite", async () => {
    await project({}, ["components/ui/magnet.tsx"]);
    await add(["magnet"], { cwd: dir, run, log });
    expect(await readFile(join(dir, "components/ui/magnet.tsx"), "utf8")).toBe("");
    expect(run).not.toHaveBeenCalled();
    await add(["magnet"], { cwd: dir, overwrite: true, run, log });
    expect(await readFile(join(dir, "components/ui/magnet.tsx"), "utf8")).toBe("// magnet\n");
  });

  it.each([
    ["pnpm-lock.yaml", "pnpm", "add"],
    ["yarn.lock", "yarn", "add"],
    ["bun.lockb", "bun", "add"],
    ["bun.lock", "bun", "add"],
    [null, "npm", "install"],
  ])("detects the package manager from %s", async (lockfile, pm, verb) => {
    await project({}, lockfile ? [lockfile] : []);
    await add(["magnet"], { cwd: dir, run, log });
    expect(run).toHaveBeenCalledWith(pm, [verb, "clsx", "framer-motion", "tailwind-merge"], dir);
  });

  it("skips dependencies the project already has", async () => {
    await project({ dependencies: { "framer-motion": "^12" }, devDependencies: { clsx: "^2" } });
    await add(["blur-text", "magnet"], { cwd: dir, run, log });
    expect(run).toHaveBeenCalledWith("npm", ["install", "tailwind-merge"], dir);
  });

  it("prints the install command with --no-install", async () => {
    await project();
    const lines: string[] = [];
    await add(["magnet"], { cwd: dir, install: false, run, log: (l) => lines.push(l) });
    expect(run).not.toHaveBeenCalled();
    expect(lines.join("\n")).toContain("npm install clsx framer-motion tailwind-merge");
  });

  it("rejects unknown names with suggestions and writes nothing", async () => {
    await project();
    await expect(add(["blurtext"], { cwd: dir, run, log })).rejects.toThrow(
      /did you mean blur-text/,
    );
    expect(existsSync(join(dir, "components"))).toBe(false);
  });

  it("fails without a package.json", async () => {
    await expect(add(["magnet"], { cwd: dir, run, log })).rejects.toThrow(/No package.json/);
  });

  it("writes nothing when a component fetch fails", async () => {
    await project();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.endsWith("index.json")
          ? new Response(JSON.stringify(catalogue))
          : new Response("nope", { status: 500, statusText: "Server Error" }),
      ),
    );
    await expect(add(["magnet"], { cwd: dir, run, log })).rejects.toThrow(/500/);
    expect(existsSync(join(dir, "components"))).toBe(false);
  });
});
