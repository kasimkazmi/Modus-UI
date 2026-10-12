"use client";

import type { ComponentProps } from "react";
import { TopDock } from "@/registry/top-dock";

export default function TopDockDemo(props: Partial<ComponentProps<typeof TopDock>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <div className="absolute inset-0">
        <TopDock {...props} />
      </div>
    </div>
  );
}
