"use client";

import type { ComponentProps } from "react";
import { Laser } from "./laser";

export default function LaserDemo(props: Partial<ComponentProps<typeof Laser>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border bg-black">
      <Laser {...props} />
    </div>
  );
}
