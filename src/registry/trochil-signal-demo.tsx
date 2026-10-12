"use client";

import type { ComponentProps } from "react";
import { TrochilSignal } from "./trochil-signal";

export default function TrochilSignalDemo(props: Partial<ComponentProps<typeof TrochilSignal>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <TrochilSignal className="min-h-[400px]" {...props} />
    </div>
  );
}
