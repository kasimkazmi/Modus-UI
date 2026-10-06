import { createHighlighter } from "shiki";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

let highlighter: any = null;

async function getHighlighterInstance() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ["github-dark"],
      langs: ["tsx", "bash", "typescript", "javascript", "jsx", "css"],
    });
  }
  return highlighter;
}

export async function CodeBlock({
  code,
  lang = "tsx",
  minimal = false,
}: {
  code: string;
  lang?: string;
  minimal?: boolean;
}) {
  const instance = await getHighlighterInstance();
  let html = "";

  try {
    html = instance.codeToHtml(code, {
      lang,
      theme: "github-dark",
    });
  } catch (error) {
    console.error("Shiki highlighting failed:", error);
    // Fallback to raw code if highlighting fails
    html = `<pre><code>${code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
  }

  const content = (
    <div
      className={cn(
        "custom-scrollbar overflow-x-auto font-mono text-[13px] leading-relaxed [&>pre]:!m-0 [&>pre]:!bg-transparent [&>pre]:!p-0",
        !minimal && "p-6",
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );

  if (minimal) return content;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-foreground/20 bg-[#1A1A16] shadow-2xl">
      {/* Editor Header */}
      <div className="flex items-center justify-between border-b border-foreground/10 bg-[#242421] px-4 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-border/20" />
          <div className="h-2.5 w-2.5 rounded-full bg-border/20" />
          <div className="h-2.5 w-2.5 rounded-full bg-border/20" />
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-border/40">
            {lang}
          </div>
          <CopyButton
            value={code}
            className="h-7 w-7 border-none bg-transparent text-border/40 transition-all hover:text-border"
          />
        </div>
      </div>

      {/* Code Content */}
      {content}
    </div>
  );
}
