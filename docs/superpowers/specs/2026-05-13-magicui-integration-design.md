# Design Specification: Magic UI Integration & Dock Component

This document outlines the design for integrating Magic UI's design system patterns and the `Dock` component into the `React-UI-compoent` project.

## 1. Objectives

- Align the project's design system with Magic UI's premium aesthetics.
- Enhance the component preview experience with "Restart" functionality and cleaner tabs.
- Implement the Magic UI `Dock` component using its native dependencies.
- Standardize MDX documentation structure for all components.

## 2. Technical Stack Changes

- **Install Dependencies**:
  - `class-variance-authority` (CVA): For managing component variants.
  - `motion`: The new package for Framer Motion (imported as `motion/react`).
- **Standardization**:
  - Migrate from `framer-motion` to `motion` package where possible to match Magic UI.
  - Use `class-variance-authority` for the new `Dock` component.

## 3. Architecture & Components

### 3.1. Enhanced Component Preview

We will refactor `src/components/component-preview-client.tsx` to match Magic UI's "Preview/Code" interface.

**Key Changes**:

- **Tab Triggers**: Remove the background and shadow from tab triggers. Use a clean, text-only style with a motion underline (matching Magic UI).
- **Restart Button**: Add a `RotateCcw` button in the preview area to reset the component state (triggers a re-render by incrementing a `key`).
- **Code Container**: Refine the code block container with better padding and a "v0" style header.

### 3.2. Dock Component implementation

The `Dock` component will be added to `src/registry/magicui/dock.tsx` (preserving the `magicui` namespace in the path if desired, or simply `src/registry/dock.tsx`).

**Properties**:

- `iconSize`: Default 40
- `iconMagnification`: Default 60
- `iconDistance`: Default 140
- `direction`: "top" | "middle" | "bottom"

### 3.3. MDX Components Update

Update `src/components/mdx-components.tsx` to include:

- **Heading Styles**: Add `font-heading tracking-tight` to `h1`, `h2`, and `h3`.
- **Paragraph Styles**: Use `leading-relaxed` for better readability.
- **Step Components**: Implement `Steps` and `Step` components for sequential installation guides.
- **Callouts**: Add a `Callout` component for tips/warnings.

## 4. Documentation Structure

Each component page in `src/content/docs` will follow this structure:

1. **Title & Description** (Frontmatter)
2. **Introduction Text**
3. **Component Preview** (with name reference)
4. **Installation Section** (CLI and Manual)
5. **Usage Section** (Code example)
6. **Props Table**

## 5. Success Criteria

- `Dock` component displays and animates correctly in the preview.
- "Restart" button successfully resets animations.
- Documentation pages feel "premium" and consistent with Magic UI's typography.
- Registry build script correctly processes the new `Dock` component.
