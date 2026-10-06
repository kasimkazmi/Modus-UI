"use client";

import { Magnet } from "./magnet";
import { MousePointer2 } from "lucide-react";

export default function MagnetDemo() {
  return (
    <div className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
      <Magnet padding={150} magnetStrength={3} disabled={false}>
        <button className="flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90">
          <MousePointer2 className="h-5 w-5" />
          <span>Magnetic Button</span>
        </button>
      </Magnet>
    </div>
  );
}
