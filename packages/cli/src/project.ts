import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type PackageManager = "pnpm" | "yarn" | "bun" | "npm";

export const CN_SOURCE = `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

export async function readPackageJson(cwd: string): Promise<Record<string, unknown>> {
  const file = join(cwd, "package.json");
  if (!existsSync(file)) {
    throw new Error(`No package.json found in ${cwd}. Run this inside a project, or pass --cwd.`);
  }
  return JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;
}

export function installedDependencies(pkg: Record<string, unknown>): Set<string> {
  const names = new Set<string>();
  for (const key of ["dependencies", "devDependencies"]) {
    const deps = pkg[key];
    if (deps && typeof deps === "object") for (const name of Object.keys(deps)) names.add(name);
  }
  return names;
}

export function hasSrcDir(cwd: string): boolean {
  return existsSync(join(cwd, "src"));
}

export function defaultComponentsDir(cwd: string): string {
  return join(cwd, hasSrcDir(cwd) ? "src/components/ui" : "components/ui");
}

/** Returns the existing utils file, or null when none exists. */
export function findUtilsFile(cwd: string): string | null {
  for (const candidate of ["lib/utils.ts", "src/lib/utils.ts"]) {
    const file = join(cwd, candidate);
    if (existsSync(file)) return file;
  }
  return null;
}

export function utilsFileTarget(cwd: string): string {
  return join(cwd, hasSrcDir(cwd) ? "src/lib/utils.ts" : "lib/utils.ts");
}

export function detectPackageManager(cwd: string): PackageManager {
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  if (existsSync(join(cwd, "bun.lockb")) || existsSync(join(cwd, "bun.lock"))) return "bun";
  return "npm";
}

export function installCommand(pm: PackageManager, deps: string[]): [string, string[]] {
  return [pm, [pm === "npm" ? "install" : "add", ...deps]];
}
