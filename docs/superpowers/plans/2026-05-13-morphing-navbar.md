# MorphingNavbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a standalone, scroll-aware "MorphingNavbar" component that changes its height and density based on scroll position, integrated into the React-UI-compoent library.

**Architecture:** Use `framer-motion` for layout transitions, `useEffect` for scroll tracking, and internalize UI helpers to ensure the component is standalone and CLI-ready.

**Tech Stack:** Next.js, Tailwind CSS, Framer Motion, Lucide React.

---

### Task 1: Create the MorphingNavbar Registry Component

**Files:**

- Create: `src/registry/morphing-navbar.tsx`

- [ ] **Step 1: Implement the MorphingNavbar component**
      Create the file with the scroll logic, Framer Motion animations, and internal sub-components.

```tsx
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight, GraduationCap, Moon, Sun, Home } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Simplified UI Helpers (Standalone) ---

const NavButton = ({
  children,
  onClick,
  className,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "ghost" | "outline";
}) => {
  const variants = {
    primary: "bg-[#37322F] text-[#F7F5F3] hover:opacity-90 shadow-sm",
    ghost: "bg-transparent text-[#37322F] hover:bg-[#F0EDEA]",
    outline: "border border-[#E0DEDB] bg-white/60 text-[#37322F] hover:bg-[#F0EDEA]",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-95 active:scale-90",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
};

const UserAvatar = ({ src, alt }: { src?: string; alt: string }) => (
  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#E0DEDB] bg-[#F0EDEA]">
    {src ? (
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    ) : (
      <span className="text-xs font-bold text-[#605A57]">{alt.charAt(0)}</span>
    )}
  </div>
);

// --- Main Component ---

export function MorphingNavbar({
  title = "Morphing Navbar",
  logo: Logo = GraduationCap,
  breadcrumbSteps = [],
  onHomeClick = () => {},
  onProfileClick = () => {},
  onToggleSidebar = () => {},
  sidebarOpen = false,
}: {
  title?: string;
  logo?: React.ElementType;
  breadcrumbSteps?: { label: string; href?: string }[];
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Look for a specific scroll container or fallback to window
      const scrollY = window.scrollY;
      setCollapsed(scrollY > 36);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-500",
        collapsed
          ? "h-[80px] border-[#E0DEDB]/80 bg-[#F7F5F3]/95 shadow-md backdrop-blur-md"
          : "h-[104px] border-[#E0DEDB]/40 bg-[#F7F5F3]/80 backdrop-blur-sm",
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-full w-full flex-col justify-center px-4 transition-all duration-500 md:px-8 lg:px-10",
          collapsed ? "max-w-full" : "max-w-[1200px]",
        )}
      >
        <div className="flex w-full items-center justify-between">
          {/* Left Section: Logo & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="rounded-md p-2 transition-colors hover:bg-[#F0EDEA] lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <button
              onClick={onHomeClick}
              className="group flex items-center gap-2 border-none bg-transparent p-0 transition-opacity hover:opacity-80"
            >
              <motion.div animate={{ scale: collapsed ? 0.9 : 1 }} className="text-[#37322F]">
                <Logo
                  className={cn("transition-all duration-500", collapsed ? "h-8 w-8" : "h-9 w-9")}
                />
              </motion.div>
              <motion.h1
                animate={{ fontSize: collapsed ? "1.25rem" : "1.75rem" }}
                className="font-serif font-normal tracking-tight text-[#37322F]"
              >
                {title}
              </motion.h1>
            </button>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-2">
            <NavButton
              variant="ghost"
              onClick={onProfileClick}
              className="hidden h-10 w-10 p-0 sm:flex"
            >
              <UserAvatar alt="User" />
            </NavButton>

            <NavButton onClick={onHomeClick}>Home</NavButton>

            <div className="ml-2 hidden items-center gap-2 rounded-full border border-[#E0DEDB] bg-white/40 p-1 sm:flex">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="rounded-full p-1.5 transition-colors hover:bg-[#F0EDEA]"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumbs (Expandable) */}
        <AnimatePresence>
          {!collapsed && breadcrumbSteps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 hidden sm:block"
            >
              <div className="flex items-center gap-1 text-xs text-[#605A57]">
                <span>All Pages</span>
                {breadcrumbSteps.map((step, i) => (
                  <React.Fragment key={i}>
                    <ChevronRight className="h-3 w-3" />
                    <span
                      className={cn(
                        "max-w-[150px] truncate",
                        i === breadcrumbSteps.length - 1 ? "font-medium text-[#37322F]" : "",
                      )}
                    >
                      {step.label}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle bottom accent line */}
      <motion.div animate={{ opacity: collapsed ? 1 : 0.6 }} className="h-px w-full bg-[#E0DEDB]" />
    </header>
  );
}
```

### Task 2: Register in Registry

**Files:**

- Modify: `src/registry/index.ts`

- [ ] **Step 2: Add MorphingNavbar to registry**
      Add the entry to the exported `registry` array.

```typescript
// ... existing imports
{
  name: "morphing-navbar",
  type: "components:ui",
  files: ["registry/morphing-navbar.tsx"],
},
```

### Task 3: Create Documentation Page

**Files:**

- Create: `src/app/docs/components/morphing-navbar/page.tsx`

- [ ] **Step 3: Implement the documentation page**
      Create the page with Tabs for Preview and Code.

```tsx
import { MorphingNavbar } from "@/registry/morphing-navbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CopyButton } from "@/components/copy-button";

export default function MorphingNavbarPage() {
  const componentCode = `"use client";
// ... (Insert content of Task 1 here)
`;

  return (
    <div className="mx-auto max-w-4xl py-10">
      <h1 className="heading-landing mb-4 text-4xl">Morphing Navbar</h1>
      <p className="mb-8 text-[#605A57]">
        A premium, scroll-aware navigation header that dynamically adjusts its height, logo scale,
        and background density.
      </p>

      <Tabs defaultValue="preview" className="mb-8">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <TabsContent value="preview">
          <div className="relative h-[500px] overflow-hidden rounded-xl border bg-[#FAF9F7]">
            {/* Simulated scroll container */}
            <div className="custom-scrollbar absolute inset-0 overflow-y-auto">
              <MorphingNavbar
                title="Premium UI Path"
                breadcrumbSteps={[{ label: "Components" }, { label: "Morphing Navbar" }]}
              />
              <div className="space-y-8 p-10">
                <h2 className="font-serif text-2xl">Scroll down to see the effect</h2>
                {Array.from({ length: 10 }).map((_, i) => (
                  <p key={i} className="leading-relaxed text-[#605A57]">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                    nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="code">
          <div className="relative">
            <CopyButton value={componentCode} />
            <pre className="mt-2 overflow-x-auto rounded-lg bg-[#37322F] p-4 text-sm text-[#F7F5F3]">
              <code>{componentCode}</code>
            </pre>
          </div>
        </TabsContent>
      </Tabs>

      {/* Installation and Props section... */}
    </div>
  );
}
```
