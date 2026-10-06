import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TableOfContents } from "@/components/table-of-contents";
import { getGuideBySlug, getGuideHeadings } from "@/lib/mdx";
import { SITE } from "@/lib/site";

const SLUG = "installation";

export async function generateMetadata(): Promise<Metadata> {
  const guide = await getGuideBySlug(SLUG);
  if (!guide) return {};
  const { title, description } = guide.frontmatter;
  return {
    title,
    description,
    alternates: { canonical: `/docs/${SLUG}` },
    openGraph: { siteName: SITE.name, title, description, url: `/docs/${SLUG}` },
  };
}

export default async function InstallationPage() {
  const guide = await getGuideBySlug(SLUG);
  if (!guide) notFound();

  return (
    <div className="flex w-full gap-24">
      <main className="min-w-0 flex-1">
        <nav className="mb-10 flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/docs" className="transition-colors hover:text-foreground">
            Docs
          </Link>
          <span className="opacity-40">/</span>
          <span>Getting Started</span>
          <span className="opacity-40">/</span>
          <span className="font-medium text-foreground">{guide.frontmatter.title}</span>
        </nav>

        <div className="mb-16">
          <h1 className="heading-landing mb-6 text-5xl">{guide.frontmatter.title}</h1>
          <p className="max-w-3xl text-xl leading-relaxed text-muted-foreground">
            {guide.frontmatter.description}
          </p>
        </div>

        <div className="prose prose-neutral max-w-none prose-headings:font-serif prose-headings:font-normal prose-headings:tracking-tight prose-headings:text-foreground prose-h2:mb-6 prose-h2:mt-16 prose-h2:border-b prose-h2:border-border prose-h2:pb-3 prose-h2:text-2xl prose-p:leading-relaxed prose-p:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
          {guide.content}
        </div>
      </main>

      <aside className="hidden w-56 shrink-0 xl:block">
        <TableOfContents items={getGuideHeadings(SLUG)} />
      </aside>
    </div>
  );
}
