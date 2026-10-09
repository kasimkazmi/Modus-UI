const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const reactBitsDir = path.join(
  process.env.HOME,
  "Development-Workspace/Github Clone Projects/react-bits/src/tailwind/Micro",
);
const modusUiDir = process.cwd();

const microDirs = fs
  .readdirSync(reactBitsDir)
  .filter((f) => fs.statSync(path.join(reactBitsDir, f)).isDirectory());
const camelToKebab = (str) => str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

for (const dirName of microDirs) {
  const jsxFile = path.join(reactBitsDir, dirName, `${dirName}.jsx`);
  if (!fs.existsSync(jsxFile)) continue;

  const slug = camelToKebab(dirName);
  console.log(`\n\n--- Porting ${dirName} as ${slug} ---`);

  try {
    execSync(`pnpm new:component --name ${slug} --category Components`, { stdio: "ignore" });
  } catch (e) {
    console.log(`Scaffolding failed, skipping ${slug}.`);
    continue; // If it fails, it might already exist or something is broken. Better to skip.
  }

  let code = fs.readFileSync(jsxFile, "utf8");
  let deps = [];
  if (code.includes("motion/react") || code.includes("framer-motion")) deps.push('"framer-motion"');
  if (code.includes("lucide-react")) deps.push('"lucide-react"');

  // Update index.ts dependencies
  if (deps.length > 0) {
    let registryPath = path.join(modusUiDir, "src/registry/index.ts");
    let registryCode = fs.readFileSync(registryPath, "utf8");
    const regex = new RegExp(`name: "${slug}",[\\s\\S]*?dependencies: \\[\\]`);
    registryCode = registryCode.replace(regex, (match) =>
      match.replace("dependencies: []", `dependencies: [${deps.join(", ")}]`),
    );
    fs.writeFileSync(registryPath, registryCode);
  }

  const match = code.match(
    /export default function ([A-Za-z0-9_]+)\s*\(\{\s*([\s\S]*?)\s*\}\)\s*\{/,
  );
  if (!match) {
    fs.writeFileSync(path.join(modusUiDir, `src/registry/${slug}.tsx`), `// @ts-nocheck\n${code}`);
    continue;
  }

  const componentName = match[1];
  const propsString = match[2];
  const propsList = propsString
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith("..."));

  let mdPropsTable = "| Prop | Type | Default | Description |\n| :--- | :--- | :--- | :--- |\n";
  let interfaceProps = "";

  propsList.forEach((p) => {
    const parts = p.split("=");
    const name = parts[0].trim();
    const def = parts.length > 1 ? parts.slice(1).join("=").trim() : "";

    let type = "any";
    let mdDefault = "-";
    if (def) {
      if (def === "true" || def === "false") type = "boolean";
      else if (!isNaN(Number(def))) type = "number";
      else if (def.startsWith("'") || def.startsWith('"') || def.startsWith("`")) type = "string";

      mdDefault = def;
      if (def.startsWith("'") || def.startsWith('"')) mdDefault = `"${def.replace(/['"]/g, "")}"`;
    }

    interfaceProps += `  ${name}?: ${type};\n`;
    if (name !== "className") mdPropsTable += `| ${name} | ${type} | ${mdDefault} | - |\n`;
  });

  const interfaceDef = `interface ${componentName}Props {\n${interfaceProps}  className?: string;\n}\n\n`;
  code = code.replace(
    match[0],
    `${interfaceDef}export function ${componentName}({ ${propsString} }: ${componentName}Props) {`,
  );

  code = code.replace(/['"]motion\/react['"]/g, '"framer-motion"');
  code = code.replace(/['"]motion\/react-client['"]/g, '"framer-motion"');
  code = code.replace(/['"]lucide-react['"]/g, '"lucide-react"');

  code = code.replace(
    /('use client'|"use client");?\s*/g,
    `"use client";\n\nimport { cn } from "@/lib/utils";\n`,
  );
  if (!code.includes("import { cn }"))
    code = `"use client";\nimport { cn } from "@/lib/utils";\n` + code;

  code = code.replace(/#[0-9a-fA-F]{3,6}/g, "hsl(var(--primary))");
  code = code.replace(/transition-([a-z]+)/g, "transition-$1 motion-reduce:transition-none");

  code = `// @ts-nocheck\n${code}`;
  fs.writeFileSync(path.join(modusUiDir, `src/registry/${slug}.tsx`), code);

  const mdxFile = path.join(modusUiDir, `src/content/docs/${slug}.mdx`);
  if (fs.existsSync(mdxFile)) {
    let mdx = fs.readFileSync(mdxFile, "utf8");
    mdx = mdx.replace(/## Props[\s\S]*$/, `## Props\n\n${mdPropsTable}`);
    fs.writeFileSync(mdxFile, mdx);
  }
}
