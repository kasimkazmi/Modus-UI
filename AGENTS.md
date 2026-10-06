---
description: >-
  Core coding standards for Modus UI. Applies to all component creation, styling, and documentation updates.
trigger: always_on
---

# Modus UI Coding Standards

When working in this repository, you MUST follow these rules:

1. **Tech Stack**: Use TypeScript (`.tsx`), Tailwind CSS variables (e.g. `bg-background`, `text-primary`), and `framer-motion` for all animations. Do NOT use `gsap`.
2. **Utilities**: Always use the `cn()` utility from `@/lib/utils` for class name merging.
3. **CLI**: Documentation must instruct users to use `npx modus-ui add <component>`. Do NOT use `npx shadcn` or `npx react-ui-component`.
4. **Registration**: All new components must be wired up in `src/registry/index.ts`, `src/components/component-preview.tsx`, `src/app/docs/components/page.tsx`, and `src/app/docs/layout.tsx`.
