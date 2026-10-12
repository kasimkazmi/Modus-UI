"use client";

import type { ComponentProps } from "react";
import { PerformanceGauge } from "@/registry/performance-gauge";

export default function PerformanceGaugeDemo(
  props: Partial<ComponentProps<typeof PerformanceGauge>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-black p-4">
      <PerformanceGauge className="max-w-[368px]" {...props} />
    </div>
  );
}
