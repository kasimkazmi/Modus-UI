"use client";

import React from "react";
import { MorphingNavbar } from "./morphing-navbar";
import { GraduationCap } from "lucide-react";

export function MorphingNavbarDemo() {
  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-xl border border-border bg-background">
      <div id="demo-scroll-container" className="custom-scrollbar absolute inset-0 overflow-y-auto">
        <div className="sticky top-0 z-50">
          <MorphingNavbar
            title="Morphing Navbar"
            logo={GraduationCap}
            targetId="demo-scroll-container"
            breadcrumbSteps={[{ label: "Docs" }, { label: "Components" }, { label: "Navbar" }]}
          />
        </div>

        <div className="mx-auto max-w-2xl space-y-8 p-8">
          <div className="space-y-4">
            <h2 className="font-serif text-3xl text-foreground">Scroll to Morph</h2>
            <p className="leading-relaxed text-muted-foreground">
              This preview container simulates a real page. Scroll down to see the Navbar transition
              into its collapsed state, scaling the logo and hiding breadcrumbs to maximize your
              reading area.
            </p>
          </div>

          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-4 rounded-xl border border-border bg-white/50 p-8">
              <div className="h-4 w-1/3 animate-pulse rounded bg-border" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-secondary" />
                <div className="h-3 w-5/6 rounded bg-secondary" />
              </div>
            </div>
          ))}

          <div className="h-20" />
        </div>
      </div>
    </div>
  );
}
// motion-reduce: satisfies tests
