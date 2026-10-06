import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fetchCatalogue, fetchComponent } from "../registry.js";
import {
  CN_SOURCE,
  defaultComponentsDir,
  detectPackageManager,
  findUtilsFile,
  installCommand,
  installedDependencies,
  readPackageJson,
  utilsFileTarget,
} from "../project.js";
import { suggest } from "../similarity.js";

export type Runner = (command: string, args: string[], cwd: string) => Promise<void>;

export interface AddOptions {
  cwd: string;
  path?: string;
  overwrite?: boolean;
  install?: boolean;
  run?: Runner;
  log?: (line: string) => void;
}

export const spawnRunner: Runner = (command, args, cwd) =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolvePromise()
        : reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`)),
    );
  });

export async function add(names: string[], options: AddOptions): Promise<void> {
  const log = options.log ?? console.log;
  const run = options.run ?? spawnRunner;
  const cwd = resolve(options.cwd);
  if (names.length === 0)
    throw new Error("Name at least one component, e.g. `npx @modus-ui/cli add blur-text`.");

  const pkg = await readPackageJson(cwd);
  const catalogue = await fetchCatalogue();
  const known = catalogue.components.map((c) => c.name);

  const unknown = names.filter((n) => !known.includes(n));
  if (unknown.length > 0) {
    const lines = unknown.map((n) => {
      const hints = suggest(n, known);
      return hints.length > 0 ? `  ${n} (did you mean ${hints.join(", ")}?)` : `  ${n}`;
    });
    throw new Error(
      `Unknown component${unknown.length > 1 ? "s" : ""}:\n${lines.join("\n")}\nRun \`npx @modus-ui/cli list\` to see all components.`,
    );
  }

  const unique = [...new Set(names)];
  // Fetch everything before writing anything, so a failure leaves no partial result.
  const components = await Promise.all(unique.map((n) => fetchComponent(n)));

  const componentsDir = options.path ? resolve(cwd, options.path) : defaultComponentsDir(cwd);
  const deps = new Set<string>();
  let wrote = false;
  for (const component of components) {
    const file = component.files[0];
    if (!file) throw new Error(`Registry entry for ${component.name} has no files.`);
    const target = join(componentsDir, `${component.name}.tsx`);
    const shown = relative(cwd, target);
    if (existsSync(target) && !options.overwrite) {
      log(`Skipped ${shown} (already exists, pass --overwrite to replace it)`);
      continue;
    }
    await mkdir(componentsDir, { recursive: true });
    await writeFile(target, file.content);
    log(`Added ${shown}`);
    wrote = true;
    for (const dep of component.dependencies) deps.add(dep);
  }

  if (!wrote) return;

  // Every component imports cn from @/lib/utils, which needs clsx and tailwind-merge.
  if (!findUtilsFile(cwd)) {
    const utils = utilsFileTarget(cwd);
    await mkdir(dirname(utils), { recursive: true });
    await writeFile(utils, CN_SOURCE);
    log(`Created ${relative(cwd, utils)} with the cn() helper`);
  }
  deps.add("clsx");
  deps.add("tailwind-merge");

  const installed = installedDependencies(pkg);
  const missing = [...deps].filter((d) => !installed.has(d)).sort();
  if (missing.length === 0) {
    log("Done.");
    return;
  }

  const [command, args] = installCommand(detectPackageManager(cwd), missing);
  const commandLine = `${command} ${args.join(" ")}`;
  if (options.install === false) {
    log(`Install the dependencies with:\n  ${commandLine}`);
    return;
  }
  log(`Installing dependencies: ${commandLine}`);
  await run(command, args, cwd);
  log("Done.");
}
