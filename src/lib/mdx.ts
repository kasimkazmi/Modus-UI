import fs from "fs";
import path from "path";
import { compileMDX } from "next-mdx-remote/rsc";
import { ComponentPreview } from "@/components/component-preview";
import { MDXComponents } from "@/components/mdx-components";
import { ThemeTokensCss } from "@/components/theme-tokens-css";
import remarkGfm from "remark-gfm";

const contentDir = path.join(process.cwd(), "src/content/docs");
const guidesDir = path.join(process.cwd(), "src/content/guides");

const components = {
  ComponentPreview,
  ThemeTokensCss,
  ...MDXComponents,
};

/** A component's documentation page (src/content/docs/<slug>.mdx). */
export function getDocBySlug(slug: string) {
  return compileFile(contentDir, slug);
}

/** A getting-started guide (src/content/guides/<slug>.mdx). */
export function getGuideBySlug(slug: string) {
  return compileFile(guidesDir, slug);
}

async function compileFile(dir: string, slug: string) {
  const fileName = slug.endsWith(".mdx") ? slug : `${slug}.mdx`;
  const filePath = path.join(dir, fileName);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf8");

  const { content, frontmatter } = await compileMDX<{
    title: string;
    description: string;
  }>({
    source: fileContent,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
    components,
  });

  return {
    content,
    frontmatter,
    slug: fileName.replace(".mdx", ""),
  };
}
