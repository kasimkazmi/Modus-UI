"use client";

import type { ComponentProps } from "react";
import { TopologyField } from "./topology-field";

export default function TopologyFieldDemo(props: Partial<ComponentProps<typeof TopologyField>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <TopologyField {...props} />
    </div>
  );
}
