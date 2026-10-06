# Sidebar Categorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Categorize the documentation sidebar into logical groups (Headers, Buttons, etc.) and include the MorphingNavbar.

**Architecture:** Update `DocsLayout` to use a structured category object instead of a flat list, and update the docs home page to show the new component.

**Tech Stack:** Next.js, Lucide React, Tailwind CSS.

---

### Task 1: Update Docs Layout Sidebar

**Files:**

- Modify: `src/app/docs/layout.tsx`

- [ ] **Step 1: Implement Categorized Sidebar**
      Update the navigation logic to use categories.

```tsx
// src/app/docs/layout.tsx modifications
// ... existing imports
import { Layout, MousePointer2, Type, CreditCard, PanelTop, Component } from "lucide-react";

// Define categories
const DOC_CATEGORIES = [
  {
    title: "Headers",
    icon: PanelTop,
    items: [{ title: "Morphing Navbar", href: "/docs/components/morphing-navbar" }],
  },
  {
    title: "Buttons",
    icon: MousePointer2,
    items: [
      { title: "Magic Button", href: "/docs/magic-button" },
      { title: "Animated Button", href: "/docs/components/animated-button" },
      { title: "Pulse Button", href: "/docs/components/pulse-button" },
    ],
  },
  {
    title: "Cards",
    icon: CreditCard,
    items: [{ title: "Rotating Card", href: "/docs/components/rotating-card" }],
  },
  {
    title: "Layout",
    icon: Layout,
    items: [{ title: "Dock", href: "/docs/dock" }],
  },
  {
    title: "Text",
    icon: Type,
    items: [{ title: "Floating Text", href: "/docs/components/floating-text" }],
  },
];
```

### Task 2: Update Docs Home Page

**Files:**

- Modify: `src/app/docs/page.tsx`

- [ ] **Step 2: Add Morphing Navbar card**
      Include the new component in the documentation overview.

```tsx
// Add this card to the grid in src/app/docs/page.tsx
<Link
  href="/docs/components/morphing-navbar"
  className="block rounded-lg border bg-white/50 p-6 transition-shadow hover:shadow-lg"
>
  <h2 className="mb-2 text-xl font-semibold">Morphing Navbar</h2>
  <p className="text-gray-600 dark:text-gray-400">
    A premium, scroll-aware header with fluid morphing animations.
  </p>
</Link>
```
