const fs = require("fs");
const path = require("path");

const srcDir = path.join(process.cwd(), "src/registry");
const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".tsx"));

for (const file of files) {
  const filePath = path.join(srcDir, file);
  let code = fs.readFileSync(filePath, "utf8");

  let changed = false;
  code = code.replace(/^(\s*)'([^']+)'\s*:\s*[a-zA-Z0-9_]+\?:/gm, (match, space, propName) => {
    changed = true;
    return `${space}'${propName}'?:`;
  });

  if (changed) {
    fs.writeFileSync(filePath, code);
    console.log(`Fixed interface in ${file}`);
  }
}
