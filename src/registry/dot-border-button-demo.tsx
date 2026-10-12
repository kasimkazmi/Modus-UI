"use client";

import type { ComponentProps } from "react";
import { DotBorderButton } from "./dot-border-button";

export default function DotBorderButtonDemo(
  props: Partial<ComponentProps<typeof DotBorderButton>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <DotBorderButton className="min-h-[400px]" {...props} />
    </div>
  );
}
