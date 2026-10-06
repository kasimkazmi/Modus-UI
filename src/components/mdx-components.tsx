import React from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";
import { CodeBlock } from "./code-block";

export const MDXComponents = {
  h1: ({ className, ...props }: any) => (
    <h1
      className={cn(
        "mt-2 scroll-m-20 text-4xl font-extrabold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, children, ...props }: any) => {
    const id = React.Children.toArray(children)
      .join("")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");

    return (
      <h2
        id={id}
        className={cn(
          "mt-12 scroll-m-20 border-b border-border pb-2 text-2xl font-semibold tracking-tight text-foreground first:mt-0",
          className,
        )}
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3: ({ className, ...props }: any) => (
    <h3
      className={cn(
        "mt-8 scroll-m-20 text-xl font-semibold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }: any) => (
    <p
      className={cn("leading-7 text-muted-foreground [&:not(:first-child)]:mt-6", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }: any) => (
    <ul
      className={cn("my-6 ml-6 list-disc text-muted-foreground [&>li]:mt-2", className)}
      {...props}
    />
  ),
  code: ({ className, ...props }: any) => (
    <code
      className={cn(
        "relative rounded bg-secondary px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-primary",
        className,
      )}
      {...props}
    />
  ),
  pre: async ({ className, children, ...props }: any) => {
    const code = children?.props?.children || "";
    const lang = children?.props?.className?.replace("language-", "") || "tsx";

    return (
      <div className="relative mb-8 mt-8">
        <CodeBlock code={code} lang={lang} />
      </div>
    );
  },
  Steps: ({ ...props }) => (
    <div className="steps mb-12 ml-4 border-l border-border pl-8 [counter-reset:step]" {...props} />
  ),
  Step: ({ className, ...props }: React.ComponentProps<"h3">) => (
    <h3
      className={cn(
        "mt-8 scroll-m-32 text-lg font-semibold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  ),
  table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 w-full overflow-y-auto rounded-xl border border-border bg-card/50 backdrop-blur-sm">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  ),
  tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr
      className={cn("m-0 border-t border-border p-0 even:bg-secondary/10", className)}
      {...props}
    />
  ),
  th: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className={cn(
        "border-border px-4 py-3 text-left font-bold text-foreground [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className={cn(
        "border-border px-4 py-3 text-left text-muted-foreground [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
};
