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
4. **Registration**: Start new components with `pnpm new:component --name <slug> --category <Category>`. Register a component in exactly two places: its entry (name, title, category, dependencies, files) in `src/registry/index.ts` and its demo in `src/registry/demos.ts`. The sidebar, components index and previews are derived from these; never hand-edit lists there.
5. **Theme colors**: Tokens are bare HSL channels, so use `hsl(var(--primary))`, never `var(--primary)`. On a `<canvas>`, resolve colors through `getComputedStyle` first.
