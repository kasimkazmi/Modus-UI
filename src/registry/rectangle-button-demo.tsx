"use client";

import type { ComponentProps } from "react";
import { RECTANGLE_BUTTON_VARIANTS, RectangleButton } from "./rectangle-button";

export default function RectangleButtonDemo(
  props: Partial<ComponentProps<typeof RectangleButton>>,
) {
  if (props.variant) {
    return (
      <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
        <RectangleButton className="min-h-[400px]" {...props} />
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {RECTANGLE_BUTTON_VARIANTS.map((variant) => (
        <div key={variant} className="relative h-[160px]">
          <RectangleButton {...props} variant={variant} />
          <span className="pointer-events-none absolute left-3 top-2 font-mono text-[10px] text-white/50 mix-blend-difference">
            {variant}
          </span>
        </div>
      ))}
    </div>
  );
}
