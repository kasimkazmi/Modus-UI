const fs = require("fs");
const path = require("path");

const registryPath = path.join(process.cwd(), "src/registry/index.ts");
let registryCode = fs.readFileSync(registryPath, "utf8");

const srcDir = path.join(process.cwd(), "src/registry");
const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".tsx") && !f.endsWith("-demo.tsx"));

for (const file of files) {
  const slug = file.replace(".tsx", "");
  const filePath = path.join(srcDir, file);
  const code = fs.readFileSync(filePath, "utf8");

  const deps = new Set();
  const imports = code.match(/from\s+['"]([^'".]+)['"]/g);
  if (imports) {
    imports.forEach((imp) => {
      const pkg = imp.replace(/from\s+['"]/, "").replace(/['"]$/, "");
      if (
        !pkg.startsWith("@/lib") &&
        !pkg.startsWith("react") &&
        pkg !== "next" &&
        !pkg.startsWith("./") &&
        !pkg.startsWith("../")
      ) {
        deps.add(pkg);
      }
    });
  }

  if (deps.size > 0) {
    // Also include default ones just in case
    deps.add("framer-motion");
    deps.add("clsx");
    deps.add("tailwind-merge");

    const depsArrayStr = `[${Array.from(deps)
      .map((d) => `"${d}"`)
      .join(", ")}]`;

    // Replace in registry index
    const regex = new RegExp(`name:\\s*"${slug}",[\\s\\S]*?dependencies:\\s*\\[[^\\]]*\\]`);
    registryCode = registryCode.replace(regex, (match) => {
      return match.replace(/dependencies:\s*\[[^\]]*\]/, `dependencies: ${depsArrayStr}`);
    });
  }
}

fs.writeFileSync(registryPath, registryCode);
