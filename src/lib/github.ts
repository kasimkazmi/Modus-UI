"use client";

import { useEffect, useState } from "react";

export const GITHUB_REPO = "kasimkazmi/Modus-UI";
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;

/** The repo's stargazer count, or null until GitHub answers (or if it fails). */
export function useGitHubStars() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${GITHUB_REPO}`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.stargazers_count === "number") setStars(data.stargazers_count);
      })
      .catch(() => {});
  }, []);

  return stars;
}

/** 6612 → "6.6K", like GitHub's own counters. */
export function formatStars(stars: number) {
  return stars >= 1000 ? `${(stars / 1000).toFixed(1).replace(/\.0$/, "")}K` : String(stars);
}
