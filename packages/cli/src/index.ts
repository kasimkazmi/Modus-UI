#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { add } from "./commands/add.js";
import { list } from "./commands/list.js";

const HELP = `@modus-ui/cli - add Modus UI components to your project

Usage
  npx @modus-ui/cli add <name...> [options]   Copy components into your project
  npx @modus-ui/cli list                      List all components by category

Options for add
  --path <dir>     Directory for components (default: src/components/ui or components/ui)
  --cwd <dir>      Project root (default: current directory)
  --overwrite      Replace files that already exist
  --no-install     Print the install command instead of running it

Global
  -h, --help       Show this help
  -v, --version    Show the version

Environment
  MODUS_UI_URL     Registry origin (default: https://modusui.kasimkazmi.com)
`;

function version(): string {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  return pkg.version as string;
}

export async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    allowNegative: true,
    options: {
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
      path: { type: "string" },
      cwd: { type: "string" },
      overwrite: { type: "boolean" },
      install: { type: "boolean", default: true },
    },
  });

  if (values.version) {
    console.log(version());
    return 0;
  }
  const [command, ...rest] = positionals;
  if (values.help || !command) {
    console.log(HELP);
    return values.help ? 0 : 1;
  }

  switch (command) {
    case "add":
      await add(rest, {
        cwd: values.cwd ?? process.cwd(),
        path: values.path,
        overwrite: values.overwrite,
        install: values.install,
      });
      return 0;
    case "list":
      await list();
      return 0;
    default:
      console.error(`Unknown command "${command}".\n`);
      console.log(HELP);
      return 1;
  }
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error: Error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  },
);
