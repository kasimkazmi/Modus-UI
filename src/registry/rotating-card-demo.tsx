"use client";

import React from "react";
import { RotatingCard } from "./rotating-card";
import { Sparkles } from "lucide-react";

export function RotatingCardDemo() {
  return (
    <div className="perspective-1000 flex min-h-[400px] items-center justify-center p-12">
      <RotatingCard className="group h-96 w-72 overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
        <div className="flex h-full w-full flex-col bg-gradient-to-br from-white to-background p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="mb-4 font-serif text-2xl text-foreground">Perspective</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Hover over this card to see the 3D rotation effect. The card follows your mouse movement
            with smooth, physics-based rotation.
          </p>
          <div className="mt-auto border-t border-border/50 pt-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
              Interactive Element
            </span>
          </div>
        </div>
      </RotatingCard>
    </div>
  );
}
