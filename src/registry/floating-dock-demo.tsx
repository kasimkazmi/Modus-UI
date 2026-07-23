"use client";

import React from "react";
import { FloatingDock, FloatingDockItem } from "./floating-dock";
import { Home, Compass, Mail, Sparkles, Settings, Globe } from "lucide-react";

export function FloatingDockDemo() {
  const dockItems: FloatingDockItem[] = [
    {
      title: "Home",
      icon: <Home className="w-full h-full" />,
      href: "#",
    },
    {
      title: "Explore",
      icon: <Compass className="w-full h-full" />,
      href: "#",
    },
    {
      title: "Features",
      icon: <Sparkles className="w-full h-full" />,
      onClick: () => alert("Features Clicked!"),
    },
    {
      title: "Projects",
      icon: <Globe className="w-full h-full" />,
      href: "#",
    },
    {
      title: "Settings",
      icon: <Settings className="w-full h-full" />,
      onClick: () => alert("Settings Clicked!"),
    },
    {
      title: "Contact",
      icon: <Mail className="w-full h-full" />,
      href: "mailto:hello@example.com",
    },
  ];

  return (
    <div className="min-h-[300px] w-full flex flex-col items-center justify-center gap-12 p-8 bg-[#FAF9F7]/30 border border-[#E0DEDB]/50 rounded-2xl relative overflow-hidden">
      <div className="text-center space-y-2">
        <h4 className="font-serif text-2xl text-[#37322F]">Interactive Navigation</h4>
        <p className="text-xs text-[#605A57] max-w-sm mx-auto">
          Hover over the dock below to experience the magnifying effect on the icons.
        </p>
      </div>

      <div className="w-full flex justify-center py-6">
        <FloatingDock items={dockItems} />
      </div>
    </div>
  );
}
