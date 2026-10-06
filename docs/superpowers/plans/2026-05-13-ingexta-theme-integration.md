# Premium UI Theme Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the project's visual identity to match the Premium UI brand (warm whites, precision typography, light mode only).

**Architecture:** We will replace the existing HSL-based dark mode variables in `globals.css` with hex-based warm neutral tokens. Typography will be updated via `next/font/google` and extended in `tailwind.config.js`.

**Tech Stack:** Next.js, Tailwind CSS, Google Fonts.

---

### Task 1: Typography Integration

**Files:**

- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update font imports and configuration**

Modify `src/app/layout.tsx` to include `DM_Sans` and `Instrument_Serif`:

```tsx
import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: "400",
});

export const metadata: Metadata = {
  title: "React UI Component",
  description: "Custom UI components library",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${instrumentSerif.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Commit changes**

```bash
git add src/app/layout.tsx
git commit -m "style: add DM Sans and Instrument Serif fonts"
```

---

### Task 2: Global Styles & CSS Variables

**Files:**

- Modify: `src/app/globals.css`

- [ ] **Step 1: Overwrite CSS variables with Premium UI Palette**

Replace the `:root` block and add utility classes in `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: #f7f5f3;
    --foreground: #37322f;
    --card: #ffffff;
    --card-foreground: #37322f;
    --popover: #ffffff;
    --popover-foreground: #37322f;
    --primary: #37322f;
    --primary-foreground: #faf9f7;
    --secondary: #f0edea;
    --secondary-foreground: #37322f;
    --muted: #f0edea;
    --muted-foreground: #605a57;
    --accent: #f0edea;
    --accent-foreground: #37322f;
    --destructive: #8b3a30;
    --destructive-foreground: #fff;
    --border: #e0dedb;
    --input: #e0dedb;
    --ring: #605a57;
    --radius: 0.625rem;
  }
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: var(--font-dm-sans), ui-sans-serif, system-ui;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@layer components {
  /* Primary Landing Button */
  .btn-landing {
    position: relative;
    background: linear-gradient(to bottom right, #4a4542, #3d3835, #37322f);
    box-shadow: inset 0 0 0 2.5px rgba(255, 255, 255, 0.08);
    overflow: hidden;
    border-radius: 9999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    color: #faf9f7;
    padding: 0.5rem 1.25rem;
  }
  .btn-landing::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), transparent);
    border-radius: 9999px;
    pointer-events: none;
  }
  .btn-landing:hover {
    background: linear-gradient(to bottom right, #565250, #4a4542, #3d3835);
  }

  /* Landing Heading */
  .heading-landing {
    color: #37322f;
    font-family: var(--font-instrument-serif);
    font-weight: 400;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }

  /* Warm Custom Scrollbar */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(55, 50, 47, 0.2);
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #605a57;
  }
}
```

- [ ] **Step 2: Commit changes**

```bash
git add src/app/globals.css
git commit -m "style: update global variables and add landing page utilities"
```

---

### Task 3: Tailwind Config Update

**Files:**

- Modify: `tailwind.config.js`

- [ ] **Step 1: Extend Tailwind theme with new fonts and hex-aware colors**

Modify `tailwind.config.js` to ensure it correctly maps the new hex variables (if not already handled) and adds the font families:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/registry/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "ui-sans-serif", "system-ui"],
        serif: ["var(--font-instrument-serif)", "ui-serif", "Georgia"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
```

- [ ] **Step 2: Commit changes**

```bash
git add tailwind.config.js
git commit -m "style: configure tailwind to use hex variables and new font families"
```
