"use client";

import type { ComponentProps } from "react";
import { FlowField } from "./flow-field";

export default function FlowFieldDemo(props: Partial<ComponentProps<typeof FlowField>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <FlowField {...props} />
    </div>
  );
}
