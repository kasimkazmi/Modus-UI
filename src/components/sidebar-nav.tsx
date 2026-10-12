"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarCategory {
  title: string;
  icon: React.ReactNode;
  items: { title: string; href: string }[];
}

export function SidebarNav({ categories }: { categories: SidebarCategory[] }) {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  // Groups start open; the user's collapses are remembered for the session.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // ⌘K / Ctrl+K focuses the search box.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Keep the current page visible in the scrolling sidebar.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  const term = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      categories
        .map((category) => ({
          ...category,
          items: term
            ? category.items.filter((item) => item.title.toLowerCase().includes(term))
            : category.items,
        }))
        .filter((category) => category.items.length > 0),
    [categories, term],
  );

  const toggle = (title: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 pb-3">
        <label className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card/60 px-3 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Escape" && setQuery("")}
            placeholder="Search..."
            aria-label="Search components"
            className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
          />
          <kbd className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </label>
      </div>

      <nav className="no-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pb-6">
        {filtered.map((category) => {
          // Searching opens every matching group.
          const open = term !== "" || !collapsed.has(category.title);
          return (
            <div key={category.title}>
              <button
                type="button"
                onClick={() => toggle(category.title)}
                aria-expanded={open}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-foreground transition-colors hover:bg-secondary/60"
              >
                <span className="text-muted-foreground">{category.icon}</span>
                <span className="flex-1 text-left">{category.title}</span>
                <span className="rounded border border-border px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  {category.items.length}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform motion-reduce:transition-none",
                    !open && "-rotate-90",
                  )}
                />
              </button>
              {open && (
                <div className="mb-2 ml-[18px] space-y-0.5 border-l border-border pl-2">
                  {category.items.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        ref={active ? activeRef : undefined}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block truncate rounded-md px-3 py-1.5 text-[13px] transition-colors",
                          active
                            ? "bg-secondary font-medium text-foreground"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                        )}
                      >
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No components found.
          </p>
        )}
      </nav>
    </div>
  );
}
