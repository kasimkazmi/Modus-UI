"use client";

import React from "react";
import { AnimatedButton } from "./animated-button";

export function AnimatedButtonDemo() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-12">
      <AnimatedButton className="px-8 py-4 text-lg">Magic Button</AnimatedButton>
      <p className="text-xs font-medium uppercase tracking-widest text-[#605A57] opacity-50">
        Hover or Tap to Interact
      </p>
    </div>
  );
}
