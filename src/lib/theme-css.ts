import fs from "fs";
import path from "path";

/** Declarations of the first CSS block whose selector list ends with `selector`. */
function declarations(css: string, selector: string): string[] {
  const escaped = selector.replace(/[.[\]"]/g, "\\$&");
  const body = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1];
  if (!body) throw new Error(`No CSS block for ${selector} in globals.css`);
  return body
    .split("\n")
    .map((line) => line.replace(/\/\*.*?\*\//g, "").trim())
    .filter((line) => line.startsWith("--") && !line.startsWith("--font-"));
}

/**
 * The Modus theme tokens users paste into their own stylesheet, read from the
 * site's globals.css so the installation guide can never drift from the real
 * values. Fonts are site-specific and left out.
 */
export function modusThemeCss(): string {
  const css = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
  const light = declarations(css, '[data-palette="modus"]');
  const dark = declarations(css, '.dark[data-palette="modus"]');
  const block = (selector: string, lines: string[]) =>
    `  ${selector} {\n${lines.map((line) => `    ${line}`).join("\n")}\n  }`;

  return [
    "@tailwind base;",
    "@tailwind components;",
    "@tailwind utilities;",
    "",
    "@layer base {",
    block(":root", light),
    "",
    block(".dark", dark),
    "}",
  ].join("\n");
}
