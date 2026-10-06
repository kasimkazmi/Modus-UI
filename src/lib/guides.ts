import fs from "fs";
import path from "path";

/** The `## ` headings of a guide, with the same ids the MDX h2 component renders. */
export function getGuideHeadings(slug: string): { title: string; id: string }[] {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/content/guides", `${slug}.mdx`),
    "utf8",
  );
  return [...source.matchAll(/^## (.+)$/gm)].map(([, title]) => ({
    title,
    id: title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, ""),
  }));
}
