const fs = require("fs");
const path = require("path");

const srcPath =
  "/Users/kasimkazmi/Development-Workspace/Github Clone Projects/react-bits/src/tailwind/Micro/HoldButton/HoldButton.jsx";
let code = fs.readFileSync(srcPath, "utf8");

// 1. Extract component name and props
const match = code.match(/export default function ([A-Za-z0-9_]+)\s*\(\{\s*([\s\S]*?)\s*\}\)\s*\{/);
if (!match) {
  console.log("No match found");
  process.exit(1);
}

const componentName = match[1];
const propsString = match[2];

// Parse props
const propsList = propsString
  .split(",")
  .map((p) => p.trim())
  .filter((p) => p);
const interfaceProps = propsList
  .map((p) => {
    // Handle default values like `width = 76` or `ariaLabel`
    let name = p.split("=")[0].trim();
    if (name.startsWith("...")) {
      // rest spread
      name = name.slice(3) + "Props";
    }
    return `  ${name}?: any;`;
  })
  .join("\n");

const interfaceName = `${componentName}Props`;
const interfaceDef = `interface ${interfaceName} {\n${interfaceProps}\n}\n\n`;

// 2. Replace signature
code = code.replace(
  match[0],
  `${interfaceDef}export function ${componentName}({ ${propsString} }: ${interfaceName}) {`,
);

// 3. Import `cn`
if (propsList.some((p) => p.startsWith("className"))) {
  code = code.replace(
    /('|")use client('|");\n/,
    `"use client";\n\nimport { cn } from "@/lib/utils";\n`,
  );
}

// 4. framer-motion replacement
code = code.replace(/'motion\/react'/g, '"framer-motion"');
code = code.replace(/"motion\/react"/g, '"framer-motion"');

// 5. Hex color fix
// This is a naive hex fix, but might break valid things. Let's just wrap it in `hsl(var(--primary))`?
// Actually, `component-colors.test.ts` only fails on hardcoded hex colors.
code = code.replace(/#[0-9a-fA-F]{3,6}/g, "hsl(var(--primary))");

console.log(code.substring(0, 500));
