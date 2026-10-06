---
name: modus-ui-developer
description: >-
  Essential guidelines and memory for developing, porting, or adding components to the Modus UI project. 
  Use this skill whenever asked to create a new component, port a component from another library (like React Bits), or when modifying Modus UI documentation.
---

# Modus UI Developer Guide

This skill ensures you adhere to the established architectural patterns and conventions of the Modus UI project. It acts as the core memory for how this project is built.

## 1. Component Porting & Naming Rules

- **No direct copies**: Always adapt external components to Modus UI's specific identity.
- **Distinct Naming**: Rename third-party components to reflect standard UI behavior rather than stylized names (e.g., `SpotlightCard` -> `Focus Card` / `focus-card.tsx`). Use kebab-case for file names.

## 2. Tech Stack & Styling

- **TypeScript First**: Use `.tsx` exclusively. Define explicit interfaces (e.g., `interface FocusCardProps`). No generic `.jsx` or untyped props.
- **Tailwind Variables**: NEVER use hardcoded hex colors or specific colors like `bg-neutral-900`. Use Modus UI's semantic CSS variables (e.g., `bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`).
- **Utility Merging**: Always use the `cn()` utility (`clsx` + `tailwind-merge`) from `@/lib/utils` for merging class names.

## 3. Animation Guidelines

- **Framer Motion Only**: Do NOT use `gsap`, `requestAnimationFrame` custom loops, or other heavy animation libraries. Rebuild all animations natively in `framer-motion` to keep the bundle size small and consistent.

## 4. Accessibility

- All interactive components MUST include keyboard navigation support (`onKeyDown`), appropriate ARIA roles, and `aria-expanded` / `aria-hidden` / `aria-label` attributes where relevant.

## 5. CLI & Documentation Standards

- **Component CLI**: When writing installation instructions in `.mdx` files, ALWAYS use `npx modus-ui add <component-name>`. Do not use `react-ui-component` or `shadcn`.
- **Dependencies**: Provide standard package manager instructions (e.g., `npm install framer-motion`) below the CLI command if the component relies on external libraries not handled by the Modus UI CLI.
- **Preview Wiring**: New components must be registered in the following files to appear on the documentation site:
  1. `src/registry/index.ts` (Export the component)
  2. `src/components/component-preview.tsx` (Import the Demo file and add it to `COMPONENT_MAP`)
  3. `src/app/docs/components/page.tsx` (Add to `COMPONENT_LIST` for the grid view)
  4. `src/app/docs/layout.tsx` (Add to the sidebar navigation under `DOC_CATEGORIES`)
  5. `src/app/preview/[name]/page.tsx` (Add to the standalone preview `COMPONENT_MAP`)
