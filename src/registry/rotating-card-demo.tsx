"use client";

import React from "react";
import { RotatingCard } from "./rotating-card";
import { Sparkles } from "lucide-react";

export function RotatingCardDemo() {
  return (
    <div className="perspective-1000 flex min-h-[400px] items-center justify-center p-12">
      <RotatingCard className="group h-96 w-72 overflow-hidden rounded-2xl border border-[#E0DEDB] bg-white shadow-xl">
        <div className="flex h-full w-full flex-col bg-gradient-to-br from-white to-[#F7F5F3] p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#37322F] transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
            <Sparkles className="h-6 w-6 text-[#F7F5F3]" />
          </div>
          <h3 className="mb-4 font-serif text-2xl text-[#37322F]">Perspective</h3>
          <p className="text-sm leading-relaxed text-[#605A57]">
            Hover over this card to see the 3D rotation effect. The card follows your mouse movement
            with smooth, physics-based rotation.
          </p>
          <div className="mt-auto border-t border-[#E0DEDB]/50 pt-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#37322F]/40">
              Interactive Element
            </span>
          </div>
        </div>
      </RotatingCard>
    </div>
  );
}
