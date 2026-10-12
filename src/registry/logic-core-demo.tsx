"use client";

import type { ComponentProps } from "react";
import { LogicCore } from "./logic-core";

export default function LogicCoreDemo(props: Partial<ComponentProps<typeof LogicCore>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <LogicCore {...props} />
    </div>
  );
}
