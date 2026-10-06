"use client";

import { Magnet } from "./magnet";
import { MousePointer2 } from "lucide-react";

export default function MagnetDemo() {
  return (
    <div className="relative flex w-full items-center justify-center min-h-[400px] overflow-hidden rounded-xl border border-border bg-background">
      <Magnet padding={150} magnetStrength={3} disabled={false}>
        <button className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors shadow-lg">
          <MousePointer2 className="w-5 h-5" />
          <span>Magnetic Button</span>
        </button>
      </Magnet>
    </div>
  );
}
