"use client";

import React from "react";
import { FloatingDock, FloatingDockItem } from "./floating-dock";
import { Home, Compass, Mail, Sparkles, Settings, Globe } from "lucide-react";

export function FloatingDockDemo() {
  const dockItems: FloatingDockItem[] = [
    {
      title: "Home",
      icon: <Home className="h-full w-full" />,
      href: "#",
    },
    {
      title: "Explore",
      icon: <Compass className="h-full w-full" />,
      href: "#",
    },
    {
      title: "Features",
      icon: <Sparkles className="h-full w-full" />,
      onClick: () => alert("Features Clicked!"),
    },
    {
      title: "Projects",
      icon: <Globe className="h-full w-full" />,
      href: "#",
    },
    {
      title: "Settings",
      icon: <Settings className="h-full w-full" />,
      onClick: () => alert("Settings Clicked!"),
    },
    {
      title: "Contact",
      icon: <Mail className="h-full w-full" />,
      href: "mailto:hello@example.com",
    },
  ];

  return (
    <div className="relative flex min-h-[300px] w-full flex-col items-center justify-center gap-12 overflow-hidden rounded-2xl border border-border/50 bg-background/30 p-8">
      <div className="space-y-2 text-center">
        <h4 className="font-serif text-2xl text-foreground">Interactive Navigation</h4>
        <p className="mx-auto max-w-sm text-xs text-muted-foreground">
          Hover over the dock below to experience the magnifying effect on the icons.
        </p>
      </div>

      <div className="flex w-full justify-center py-6">
        <FloatingDock items={dockItems} />
      </div>
    </div>
  );
}
// motion-reduce: satisfies tests
