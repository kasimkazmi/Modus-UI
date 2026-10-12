"use client";

import type { ComponentProps } from "react";
import { AttuneThermal } from "./attune-thermal";

export default function AttuneThermalDemo(props: Partial<ComponentProps<typeof AttuneThermal>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <AttuneThermal className="min-h-[400px]" {...props} />
    </div>
  );
}
