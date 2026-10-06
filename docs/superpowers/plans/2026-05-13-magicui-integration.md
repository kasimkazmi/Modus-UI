# Implementation Plan: Magic UI Integration & Dock Component

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the project's documentation system and implement the Magic UI `Dock` component with its native dependencies.

**Architecture:**

- Use `class-variance-authority` for robust variant management.
- Standardize on the `motion` package for animations.
- Refactor MDX and Preview components to match Magic UI's premium aesthetics.

**Tech Stack:** Next.js, Tailwind CSS, Framer Motion (via `motion`), Radix UI, CVA.

---

### Task 1: Dependencies & Configuration

**Files:**

- Modify: `package.json`
- Modify: `tailwind.config.js`

- [ ] **Step 1: Install new dependencies**
      Run: `npm install class-variance-authority motion`

- [ ] **Step 2: Update Tailwind configuration for animations**
      Add Magic UI's grid and animation utilities to `tailwind.config.js`.

- [ ] **Step 3: Commit**
      Run: `git add package.json tailwind.config.js; git commit -m "chore: add magicui dependencies and tailwind config"`

---

### Task 2: MDX Component Refinement

**Files:**

- Modify: `src/components/mdx-components.tsx`

- [ ] **Step 1: Update MDX Typography**
      Apply `font-heading` and `tracking-tight` to headings.
      Modify `src/components/mdx-components.tsx` to include `font-heading` in `h1`, `h2`, `h3` classes.

- [ ] **Step 2: Add Steps and Step components**
      Implement sequential list components in `MDXComponents`.

- [ ] **Step 3: Commit**
      Run: `git add src/components/mdx-components.tsx; git commit -m "feat: refine mdx typography and add step components"`

---

### Task 3: Enhanced Component Preview

**Files:**

- Modify: `src/components/component-preview-client.tsx`

- [ ] **Step 1: Add Restart Functionality**
      Implement a `key` state that increments to force re-render in `ComponentPreviewClient`. Add a button with `RotateCcw` icon.

- [ ] **Step 2: Redesign Tab Triggers**
      Switch to the clean, underline-only style in `Tabs.Trigger`. Use `motion.div` for the underline with `layoutId="activeTab"`.

- [ ] **Step 3: Commit**
      Run: `git add src/components/component-preview-client.tsx; git commit -m "feat: enhance component preview with restart and new tab style"`

---

### Task 4: Implementation of Dock

**Files:**

- Create: `src/registry/dock.tsx`
- Modify: `src/registry/index.ts`
- Modify: `src/components/component-preview.tsx`

- [ ] **Step 1: Create Dock component**
      Create `src/registry/dock.tsx` with the Magic UI implementation (using CVA and `motion/react`).

- [ ] **Step 2: Register Dock in COMPONENT_MAP**
      Add `dock: Dock` to `COMPONENT_MAP` in `src/components/component-preview.tsx`.

- [ ] **Step 3: Update Registry Index**
      Add `dock` entry to `src/registry/index.ts`.

- [ ] **Step 4: Commit**
      Run: `git add src/registry/dock.tsx src/registry/index.ts src/components/component-preview.tsx; git commit -m "feat: implement and register dock component"`

---

### Task 5: Documentation

**Files:**

- Create: `src/content/docs/dock.mdx`

- [ ] **Step 1: Create Dock documentation**
      Create `src/content/docs/dock.mdx` with `title`, `description`, `<ComponentPreview name="dock" />`, Installation, and Usage sections.

- [ ] **Step 2: Commit**
      Run: `git add src/content/docs/dock.mdx; git commit -m "docs: add dock component documentation"`
