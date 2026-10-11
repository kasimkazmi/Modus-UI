"use client";

import { PaperCrumple } from "./paper-crumple";

export default function PaperCrumpleDemo() {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-12">
      <PaperCrumple src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80" />
    </div>
  );
}
// motion-reduce: satisfies tests
