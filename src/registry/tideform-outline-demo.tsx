"use client";

import type { ComponentProps } from "react";
import { TideformOutline } from "./tideform-outline";

export default function TideformOutlineDemo(
  props: Partial<ComponentProps<typeof TideformOutline>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <TideformOutline className="min-h-[400px]" {...props} />
    </div>
  );
}
