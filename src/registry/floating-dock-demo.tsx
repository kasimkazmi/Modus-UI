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
    <div className="min-h-[300px] w-full flex flex-col items-center justify-center gap-12 p-8 bg-[#09090B] border-2 border-[#3F3F46] rounded-none relative overflow-hidden">
      <div className="text-center space-y-3">
        <h4 className="font-sans text-3xl font-bold uppercase tracking-tighter text-[#FAFAFA]">
          KINETIC NAVIGATION
        </h4>
        <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
          Hover over the brutalist dock to observe high-contrast icon expansion and instant label reveals.
        </p>
      </div>

      <div className="w-full flex justify-center py-6">
        <FloatingDock items={dockItems} />
      </div>
    </div>
  );
}
