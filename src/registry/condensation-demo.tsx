"use client";

import type { ComponentProps } from "react";
import { Condensation } from "./condensation";

export default function CondensationDemo(props: Partial<ComponentProps<typeof Condensation>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <Condensation {...props} />
    </div>
  );
}
