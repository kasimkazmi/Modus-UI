# Design Spec: MorphingNavbar

## Overview

A premium, standalone React header component that dynamically morphs its height, background, and element scaling based on scroll position. Designed for the "Premium UI" design system with warm neutrals and a professional, editorial feel.

## Goals

- Replicate the "LearnHeader" animation and style from the `francais-pro` project.
- Create a standalone version with no external project-specific dependencies.
- Integrate with the existing `React-UI-compoent` registry and documentation system.
- Provide a CLI-ready installation experience.

## Architecture

### 1. File Structure

- `src/registry/morphing-navbar.tsx`: The self-contained component source code.
- `src/registry/index.ts`: Updated to include the new component.
- `src/app/docs/components/morphing-navbar/page.tsx`: Documentation and interactive preview.

### 2. Component Logic (`MorphingNavbar`)

- **State**: `collapsed` (boolean) determined by `scrollTop > 36`.
- **Scroll Detection**: Uses a `useEffect` to attach a scroll listener to a target container (defaulting to a specific ID or window).
- **Animations**:
  - **Height**: Transitions from `104px` (expanded) to `80px` (collapsed).
  - **Logo/Title**: Scales down smoothly.
  - **Background**: Changes opacity and blur (80% backdrop blur expanded -> 95% backdrop blur + shadow collapsed).
  - **Breadcrumbs**: Fade in/out or move slightly depending on state.

### 3. Dependencies

- `framer-motion`: For all transitions and animations.
- `lucide-react`: For icons (GraduationCap, ChevronRight, Menu, X, etc.).
- `next/navigation`: For routing logic.
- `clsx` & `tailwind-merge`: For dynamic class management.

### 4. Simplified UI Parts (Internal)

To maintain standalone status, the following will be mocked or simplified within the component:

- **UserAvatar**: A simple SVG/Image-based avatar component.
- **Button**: A basic styled button that matches the Premium UI aesthetic.
- **ThemeToggle**: A simplified dark/light mode toggle.

## Design Details (Premium UI Style)

- **Palette**: Warm neutrals only.
  - Background: `#F7F5F3` (root), `#FFFFFF` (header collapsed).
  - Foreground: `#37322F` (primary text).
  - Border: `#E0DEDB`.
- **Typography**: Not strictly enforced (per user request), but will use project defaults (`DM Sans` and `Instrument Serif` where available).

## Success Criteria

- [ ] Component is accessible via CLI install.
- [ ] Documentation page correctly previews the morphing effect.
- [ ] Component is fully standalone and can be copied to a fresh project without errors.
- [ ] Animations are fluid and match the original "LearnHeader" feel.
