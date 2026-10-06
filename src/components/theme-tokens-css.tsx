import { CodeBlock } from "./code-block";
import { modusThemeCss } from "@/lib/theme-css";

/** The Modus theme tokens as a copyable CSS block, generated from the site's globals.css. */
export function ThemeTokensCss() {
  return (
    <div className="relative mb-8 mt-8">
      <CodeBlock code={modusThemeCss()} lang="css" />
    </div>
  );
}
