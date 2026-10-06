"use client";

import { Marquee } from "./marquee";

export default function MarqueeDemo() {
  return (
    <div className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background py-10">
      <Marquee speed={40} direction="left" pauseOnHover className="py-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="mx-4 flex h-24 w-48 items-center justify-center rounded-xl border bg-card text-2xl font-bold shadow-sm"
          >
            Item {i + 1}
          </div>
        ))}
      </Marquee>
    </div>
  );
}
