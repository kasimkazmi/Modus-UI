"use client";

import type { ComponentProps } from "react";
import { OutlineTypeflow } from "./outline-typeflow";

export default function OutlineTypeflowDemo(
  props: Partial<ComponentProps<typeof OutlineTypeflow>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <OutlineTypeflow {...props} />
    </div>
  );
}
