# Design Spec: Premium UI Theme Integration for React UI Component

This document outlines the migration of the `React-UI-compoent` project styling to match the **Premium UI** brand identity (Precise, Modern, Accessible).

## 1. Aesthetic Direction

- **Theme**: Light mode only.
- **Background**: Warm White (`#F7F5F3`).
- **Core Neutrals**: Monochrome warm palette (Warm Brown-Black `#37322F`).
- **Feel**: Premium editorial (Notion meets Linear).

## 2. Technical Architecture

### 2.1 CSS Variables (`globals.css`)

We will replace the current HSL-based dark mode variables with hex-based warm neutral variables.

| Variable               | Value      | Description                 |
| :--------------------- | :--------- | :-------------------------- |
| `--background`         | `#F7F5F3`  | Main page background        |
| `--foreground`         | `#37322F`  | Primary text color          |
| `--card`               | `#FFFFFF`  | Card backgrounds            |
| `--primary`            | `#37322F`  | Primary actions and buttons |
| `--primary-foreground` | `#FAF9F7`  | Text on primary backgrounds |
| `--secondary`          | `#F0EDEA`  | Secondary backgrounds       |
| `--muted`              | `#F0EDEA`  | Muted sections              |
| `--muted-foreground`   | `#605A57`  | Secondary/Muted text        |
| `--border`             | `#E0DEDB`  | Default border color        |
| `--input`              | `#E0DEDB`  | Form input borders          |
| `--ring`               | `#605A57`  | Focus ring color            |
| `--radius`             | `0.625rem` | Standard corner radius      |

### 2.2 Typography (`layout.tsx`)

We will integrate Google Fonts via `next/font/google`.

- **Body Font (`--font-sans`)**: `DM Sans` (Subsets: latin)
- **Heading Font (`--font-serif`)**: `Instrument Serif` (Subsets: latin)

### 2.3 Tailwind Configuration (`tailwind.config.js`)

Update the theme extension to map CSS variables to Tailwind classes and configure the font families.

```javascript
theme: {
  extend: {
    fontFamily: {
      sans: ["var(--font-dm-sans)", "ui-sans-serif", "system-ui"],
      serif: ["var(--font-instrument-serif)", "ui-serif", "Georgia"],
    },
    // ... existing color mappings
  }
}
```

## 3. Signature UI Classes

Add specific utility classes to `globals.css` to match Premium UI's high-end feel:

1.  **.btn-landing**: Pill-shaped, gradient background, subtle inner shadow.
2.  **.heading-landing**: Semantic headings with specific weight and tracking.
3.  **.custom-scrollbar**: Thin, warm-toned scrollbar for better UX.

## 4. Migration Plan

1.  Update `src/app/layout.tsx` to include font imports and class applications.
2.  Overwrite `src/app/globals.css` with the new Premium UI-inspired variables and base styles.
3.  Modify `tailwind.config.js` to include the new font families.
4.  Remove legacy dark mode logic/gradients if present.

## 5. Success Criteria

- The application background is consistently `#F7F5F3`.
- Typography uses the sophisticated serif/sans pair.
- No blue or pure black is visible in the UI.
- All components react correctly to the new CSS variables.
