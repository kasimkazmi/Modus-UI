"use client";

import type { ComponentProps } from "react";
import { InterfaceLines } from "./interface-lines";

export default function InterfaceLinesDemo(props: Partial<ComponentProps<typeof InterfaceLines>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <InterfaceLines {...props} />
    </div>
  );
}
