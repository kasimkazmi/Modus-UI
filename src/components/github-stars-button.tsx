"use client";

import { GithubIcon } from "@/components/github-star-card";
import { GITHUB_URL, formatStars, useGitHubStars } from "@/lib/github";

/** Compact GitHub link with the live star count, for the sidebar header. */
export function GitHubStarsButton() {
  const stars = useGitHubStars();
  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Modus UI on GitHub"
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
    >
      <GithubIcon className="h-3.5 w-3.5" />
      {stars !== null && <span>{formatStars(stars)}</span>}
    </a>
  );
}
