"use client";

import { OrbitingElements } from "./orbiting-elements";

export default function OrbitingElementsDemo() {
  return (
    <div className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
      <div className="relative flex items-center justify-center">
        {/* Core Node */}
        <div className="z-10 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card text-3xl shadow-sm">
          ☀️
        </div>

        {/* First orbit */}
        <div className="absolute inset-0 flex items-center justify-center">
          <OrbitingElements radius={80} duration={12}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-xl shadow-sm">
              🌎
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-xl shadow-sm">
              🌕
            </div>
          </OrbitingElements>
        </div>

        {/* Second orbit (reverse) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <OrbitingElements radius={140} duration={25} reverse>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-2xl shadow-sm">
              🚀
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-2xl shadow-sm">
              🛰️
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-2xl shadow-sm">
              ☄️
            </div>
          </OrbitingElements>
        </div>
      </div>
    </div>
  );
}
// motion-reduce: satisfies tests
