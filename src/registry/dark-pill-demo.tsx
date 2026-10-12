"use client";

import type { ComponentProps } from "react";
import { DarkPill } from "./dark-pill";

export default function DarkPillDemo(props: Partial<ComponentProps<typeof DarkPill>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <DarkPill className="min-h-[400px]" {...props} />
    </div>
  );
}
