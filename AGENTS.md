---
description: >-
  Core coding standards for Modus UI. Applies to all component creation, styling, and documentation updates.
trigger: always_on
---

# Modus UI Coding Standards

When working in this repository, you MUST follow these rules:

1. **Tech Stack**: Use TypeScript (`.tsx`), Tailwind CSS variables (e.g. `bg-background`, `text-primary`), and `framer-motion` for all animations. Do NOT use `gsap`.
2. **Utilities**: Always use the `cn()` utility from `@/lib/utils` for class name merging.
3. **CLI**: Documentation must instruct users to use `npx @modus-ui/cli add <component>`. Do NOT use `npx shadcn`, `npx react-ui-component` or the unscoped `npx modus-ui` (that npm package belongs to someone else).
4. **Registration**: Start new components with `pnpm new:component --name <slug> --category <Category>`. Register a component in exactly two places: its entry (name, title, category, dependencies, files) in `src/registry/index.ts` and its demo in `src/registry/demos.ts`. The sidebar, components index and previews are derived from these; never hand-edit lists there.
5. **Theme colors**: Tokens are bare HSL channels, so use `hsl(var(--primary))`, never `var(--primary)`. On a `<canvas>`, resolve colors through `getComputedStyle` first.
6. **React Native components**: Components in the `React Native` category are React Native (Expo), with `platform: "native"` and `dependencies: []` in the registry. Import only from `react-native`; use `Animated` and `PanResponder`, not `framer-motion`, `className` or `cn()`. Take colors through a `colors?: Partial<...>` prop with plain defaults (there are no CSS variables in React Native), and read the system setting with `AccessibilityInfo.isReduceMotionEnabled()`. Use `NATIVE_DRIVER = Platform.OS !== "web"` and `userSelect: "none"` on draggable surfaces so the docs preview works with a mouse. The demo wraps its content in `NativeStage` (`src/registry/native-stage.tsx`) and is registered with `dynamic(..., { ssr: false })` in `demos.ts`.
