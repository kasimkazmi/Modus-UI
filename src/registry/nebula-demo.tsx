"use client";

import type { ComponentProps } from "react";
import { Nebula } from "./nebula";

export default function NebulaDemo(props: Partial<ComponentProps<typeof Nebula>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <Nebula {...props} />
    </div>
  );
}
