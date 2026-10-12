"use client";

import type { ComponentProps } from "react";
import { AmberHalftone } from "./amber-halftone";

export default function AmberHalftoneDemo(props: Partial<ComponentProps<typeof AmberHalftone>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <AmberHalftone {...props} />
    </div>
  );
}
