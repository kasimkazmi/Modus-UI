"use client";

import type { ComponentProps } from "react";
import { GradientBeamCta } from "./gradient-beam-cta";

export default function GradientBeamCtaDemo(
  props: Partial<ComponentProps<typeof GradientBeamCta>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <GradientBeamCta className="min-h-[400px]" {...props} />
    </div>
  );
}
