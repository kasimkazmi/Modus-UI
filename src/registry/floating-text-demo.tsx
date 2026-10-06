"use client";

import React from "react";
import { FloatingText } from "./floating-text";

export function FloatingTextDemo() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-12">
      <FloatingText className="font-serif text-6xl tracking-tight text-[#37322F]">
        Editorial
      </FloatingText>
      <FloatingText className="text-xl font-medium italic text-[#605A57]">Atmosphere</FloatingText>
      <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.3em] text-[#37322F]/20">
        Floating Elements
      </p>
    </div>
  );
}
