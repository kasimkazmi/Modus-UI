# Design Spec: GitHub Star Component & Editorial Blog (Coming Soon)

## 1. Overview

This design specification details the addition of a premium GitHub Star call-to-action (CTA) card positioned within the sticky right-side navigation, and the implementation of a brand-neutral, editorial-grade Blog "Coming Soon" page with entry points in both the homepage navigation and the documentation sidebar.

---

## 2. Goals & Requirements

- **GitHub Star Card:**
  - Create a reusable `GitHubStarCard` component located under `src/components/github-star-card.tsx`.
  - Design the card to match Modus UI's existing light, warm-neutral theme (`bg-[#F7F5F3]/50`, `#37322F` text, `#605A57` muted text).
  - Include an interactive GitHub logo, a descriptive subtitle, a link pointing to the repository, and a gold-accented "Star on GitHub" interactive button.
  - Render the component inside the `TableOfContents` sticky container in `src/components/table-of-contents.tsx`, stacked cleanly above the existing `DeveloperCard`.
- **Blog Section (Coming Soon):**
  - Create a new global page route `src/app/blog/page.tsx`.
  - Design a highly-polished, editorial-grade "Coming Soon" interface utilizing Framer Motion for entering animations.
  - Add an entry point to the Blog in the documentation sidebar under a new category "Resources".
  - Add a subtle global navigation entry point for the Blog on the homepage (`src/app/page.tsx`).

---

## 3. Component Details & Design System Alignment

### 3.1 `GitHubStarCard` Structure (`src/components/github-star-card.tsx`)

```tsx
"use client";

import React from "react";
import { Github, Star } from "lucide-react";

export function GitHubStarCard() {
  return (
    <div className="rounded-xl border border-[#E0DEDB] bg-[#F7F5F3]/50 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Category Header */}
      <div className="mb-2 flex items-center gap-2 text-[#605A57]/60">
        <Github className="h-3.5 w-3.5" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Open Source</p>
      </div>

      {/* Title */}
      <h4 className="font-serif text-2xl font-normal tracking-tight text-[#37322F]">Modus UI</h4>

      {/* Subtitle */}
      <p className="mb-3 mt-1.5 text-xs leading-relaxed text-[#605A57]">
        The premium, editorial-grade React component library, open-source and available on GitHub!
      </p>

      {/* Repo Link */}
      <a
        href="https://github.com/kasimkazmi/Modus-UI"
        target="_blank"
        rel="noopener noreferrer"
        className="mb-4 block text-[11px] font-semibold text-[#605A57] underline decoration-[#E0DEDB] underline-offset-4 transition-all hover:text-[#37322F] hover:decoration-[#37322F]"
      >
        github.com/kasimkazmi/Modus-UI
      </a>

      {/* CTA Button */}
      <a
        href="https://github.com/kasimkazmi/Modus-UI"
        target="_blank"
        rel="noopener noreferrer"
        className="group/btn flex items-center justify-center gap-2 rounded-lg bg-[#37322F] px-3 py-2.5 text-xs font-semibold text-[#FAF9F7] shadow-sm transition-all duration-200 hover:bg-[#4A4542] active:scale-[0.98]"
      >
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 transition-transform duration-300 group-hover/btn:rotate-[15deg]" />
        <span>Star on GitHub</span>
      </a>
    </div>
  );
}
```

### 3.2 Integration in `TableOfContents` (`src/components/table-of-contents.tsx`)

```tsx
import { GitHubStarCard } from "./github-star-card";
// ...
<div className="mt-4 flex flex-col gap-4 border-t border-[#E0DEDB]/60 pt-4">
  <GitHubStarCard />
  <DeveloperCard />
</div>;
```

---

## 4. Blog "Coming Soon" Page Details

### 4.1 Page Layout (`src/app/blog/page.tsx`)

- Standardizes on a clean, single-column viewport.
- Large typographic serif title: "Modus Journal".
- Soft grid lines, custom animated text, and a returning button "← Return to Library".
- An interactive, premium glassmorphic "Newsletter Sign Up" form mock with an input and button styled after the editorial brand-neutral palette `#37322F`.

### 4.2 Sidebar Integration (`src/app/docs/layout.tsx`)

We will add a "Resources" section to `DOC_CATEGORIES`:

```tsx
  {
    title: "Resources",
    icon: BookOpen,
    items: [
      { title: "Blog (Coming Soon)", href: "/blog" },
    ]
  }
```

### 4.3 Homepage Navigation (`src/app/page.tsx`)

We will add a minimalist top header to the main home page `src/app/page.tsx` or incorporate a clean "Blog" link alongside the action buttons to direct traffic smoothly.

---

## 5. Verification & Testing Plan

- **Verification Commands:** Run `npm run build` or `yarn build` to ensure zero compilation or TypeScript compilation issues.
- **Visual Checks:** Check responsiveness, alignment of the right sidebar, sticky scrolling behavior, and active menu items.
