"use client";

import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function GitHubStarCard() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/repos/kasimkazmi/Modus-UI")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.stargazers_count === "number") {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="rounded-xl border border-border bg-background/50 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Category Header */}
      <div className="mb-2 flex items-center gap-2 text-muted-foreground/60">
        <GithubIcon className="h-3.5 w-3.5" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Open Source</p>
      </div>

      {/* Title */}
      <h4 className="font-serif text-2xl font-normal tracking-tight text-foreground">Modus UI</h4>

      {/* Subtitle */}
      <p className="mb-4 mt-1.5 text-xs leading-relaxed text-muted-foreground">
        Modus UI is completely free, open-source, and crafted for typographic precision. Support our
        craft with a star!
      </p>

      {/* CTA Button */}
      <a
        href="https://github.com/kasimkazmi/Modus-UI"
        target="_blank"
        rel="noopener noreferrer"
        className="group/btn flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
      >
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 transition-transform duration-300 group-hover/btn:rotate-[15deg]" />
        <span>Star on GitHub</span>
        {stars !== null && stars > 0 && (
          <>
            <span className="h-1 w-1 rounded-full bg-background/30" />
            <span className="rounded bg-card/10 px-1.5 py-0.5 font-mono text-[10px] tracking-wider">
              {stars}
            </span>
          </>
        )}
      </a>
    </div>
  );
}
