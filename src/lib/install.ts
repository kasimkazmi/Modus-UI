export const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const;

export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

/** How each package manager runs a package without installing it. */
const RUNNERS: Record<PackageManager, string> = {
  pnpm: "pnpm dlx",
  npm: "npx",
  yarn: "yarn dlx",
  bun: "bunx",
};

/** The scoped CLI package. The unscoped `modus-ui` on npm belongs to someone else. */
export const CLI_PACKAGE = "@modus-ui/cli";

/** The command that adds a component with the given package manager. */
export function installCommand(manager: PackageManager, name: string) {
  return `${RUNNERS[manager]} ${CLI_PACKAGE} add ${name}`;
}

/** Matches the npm form written in the docs, capturing the component name. */
export const NPM_INSTALL_PATTERN = /^npx @modus-ui\/cli add ([a-z0-9-]+)$/;
