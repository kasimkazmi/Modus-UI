"use client";

import type { ComponentProps } from "react";
import { FloatingDotsCta } from "./floating-dots-cta";

export default function FloatingDotsCtaDemo(
  props: Partial<ComponentProps<typeof FloatingDotsCta>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <FloatingDotsCta className="min-h-[400px]" {...props} />
    </div>
  );
}
