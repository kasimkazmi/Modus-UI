"use client";

import type { ComponentProps } from "react";
import { DefenseLines } from "./defense-lines";

export default function DefenseLinesDemo(props: Partial<ComponentProps<typeof DefenseLines>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <DefenseLines {...props} />
    </div>
  );
}
