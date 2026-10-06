/**
 * Scaffolds a new component and registers it.
 *
 *     pnpm new:component --name flip-clock --category Typography [--title "Flip Clock"]
 *
 * Writes the component, its demo and its MDX doc, then adds the registry entry
 * and the demo mapping. The stubs compile, render and pass the full test suite,
 * so the first failure you see is about your component, not about wiring.
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { format, resolveConfig } from "prettier";
import { CATEGORIES, registry, type Category } from "../src/registry";

const ROOT = process.cwd();
const REGISTRY_DIR = path.join(ROOT, "src/registry");

function fail(message: string): never {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

const pascal = (name: string) =>
  name
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");

const titleCase = (name: string) =>
  name
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

const { values } = parseArgs({
  options: {
    name: { type: "string" },
    category: { type: "string" },
    title: { type: "string" },
  },
});

const name = values.name ?? fail("Missing --name, e.g. --name flip-clock");
if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) fail(`--name must be kebab-case: "${name}"`);
if (registry.some((item) => item.name === name)) fail(`"${name}" is already registered.`);

const category = values.category as Category;
if (!CATEGORIES.includes(category)) {
  fail(`--category must be one of: ${CATEGORIES.map((c) => `"${c}"`).join(", ")}`);
}

const title = values.title ?? titleCase(name);
const Component = pascal(name);

const files = {
  component: path.join(REGISTRY_DIR, `${name}.tsx`),
  demo: path.join(REGISTRY_DIR, `${name}-demo.tsx`),
  doc: path.join(ROOT, "src/content/docs", `${name}.mdx`),
};
for (const file of Object.values(files)) {
  if (fs.existsSync(file)) fail(`${path.relative(ROOT, file)} already exists.`);
}

fs.writeFileSync(
  files.component,
  `"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ${Component}Props {
  text?: string;
  className?: string;
}

// TODO: Replace this stub with the real component.
export function ${Component}({ text = "${title}", className }: ${Component}Props) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("font-serif text-4xl text-foreground", className)}
    >
      {text}
    </motion.div>
  );
}
`,
);

fs.writeFileSync(
  files.demo,
  `"use client";

import { ${Component} } from "./${name}";

export default function ${Component}Demo() {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-12">
      <${Component} />
    </div>
  );
}
`,
);

fs.writeFileSync(
  files.doc,
  `---
title: ${title}
description: TODO one sentence on what ${title} does.
---

TODO 2-3 sentences on why this component is useful.

<ComponentPreview name="${name}" />

## Installation

### CLI

\`\`\`bash
npx @modus-ui/cli add ${name}
\`\`\`

### Manual

1. Copy the code from the component tab.
2. Create a file at \`components/ui/${name}.tsx\`.
3. Paste the code.

## Usage

\`\`\`tsx
import { ${Component} } from "@/components/ui/${name}";

export default function Example() {
  return <${Component} />;
}
\`\`\`

## Props

| Prop        | Type     | Default          | Description              |
| :---------- | :------- | :--------------- | :----------------------- |
| \`text\`      | \`string\` | \`"${title}"\` | TODO                     |
| \`className\` | \`string\` | -                | Additional CSS classes.  |
`,
);

// Append to the end of its category so the sidebar order stays grouped.
const indexPath = path.join(REGISTRY_DIR, "index.ts");
const index = fs.readFileSync(indexPath, "utf8");
const lastInCategory = index.lastIndexOf(`category: "${category}",`);
const insertAt = index.indexOf("\n  },", lastInCategory) + "\n  },".length;
const entry = `
  {
    name: "${name}",
    title: "${title}",
    category: "${category}",
    type: "components:ui",
    dependencies: ["framer-motion", "clsx", "tailwind-merge"],
    files: ["registry/${name}.tsx"],
  },`;
fs.writeFileSync(indexPath, index.slice(0, insertAt) + entry + index.slice(insertAt));

const demosPath = path.join(REGISTRY_DIR, "demos.ts");
let demos = fs.readFileSync(demosPath, "utf8");
demos = demos.replace(
  'import type { ComponentName } from "./index";',
  `import ${Component}Demo from "./${name}-demo";\nimport type { ComponentName } from "./index";`,
);
demos = demos.replace(/\n};\n/, `\n  "${name}": ${Component}Demo,\n};\n`);
fs.writeFileSync(demosPath, demos);

// Leave every touched file exactly as the pre-commit hook would.
for (const file of [...Object.values(files), indexPath, demosPath]) {
  const source = fs.readFileSync(file, "utf8");
  const options = await resolveConfig(file);
  fs.writeFileSync(file, await format(source, { ...options, filepath: file }));
}

console.log(`
  Created ${title} in ${category}:
    src/registry/${name}.tsx
    src/registry/${name}-demo.tsx
    src/content/docs/${name}.mdx
  Registered in src/registry/index.ts and src/registry/demos.ts.

  Next: replace the TODOs, then run pnpm check.
`);
