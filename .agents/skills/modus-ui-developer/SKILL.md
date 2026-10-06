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
- **Tailwind Variables**: NEVER use hardcoded hex colors or specific colors like `bg-neutral-900`. Tokens are bare HSL channels, so use `hsl(var(--primary))` for CSS properties or `bg-primary` for Tailwind classes. On a `<canvas>`, resolve colors through `getComputedStyle` first.
- **Utility Merging**: Always use the `cn()` utility (`clsx` + `tailwind-merge`) from `@/lib/utils` for merging class names.

## 3. Animation Guidelines

- **Framer Motion Only**: Do NOT use `gsap`. We prefer native `framer-motion` for animations, or clean native browser APIs (`requestAnimationFrame` for high-performance canvas/webgl work).
- **Reduced Motion**: Honour `prefers-reduced-motion` natively using Framer Motion's `useReducedMotion()`.

## 4. Accessibility

- All interactive components MUST include keyboard navigation support (`onKeyDown`), appropriate ARIA roles, and `aria-expanded` / `aria-hidden` / `aria-label` attributes where relevant.

## 5. CLI, Scaffolding & Registration Standards

- **Scaffolding**: Start new components with the CLI command:
  `pnpm new:component --name <slug> --category <Category>`
- **CLI docs**: Documentation must instruct users to use `npx @modus-ui/cli add <component>`. Do NOT use `npx shadcn`, `npx react-ui-component` or the unscoped `npx modus-ui` (that npm package belongs to someone else).
- **Registration**: Register a component in exactly TWO places:
  1. Its entry (name, title, category, dependencies, files) in `src/registry/index.ts`
  2. Its demo in `src/registry/demos.ts`
  The sidebar, components index, and previews are derived automatically from these. NEVER hand-edit lists in `src/app/docs/layout.tsx`, `src/app/docs/components/page.tsx`, `src/components/component-preview.tsx`, or `src/app/preview/[name]/page.tsx`.
- **MDX Tables**: Check MDX props tables against component props and defaults.
