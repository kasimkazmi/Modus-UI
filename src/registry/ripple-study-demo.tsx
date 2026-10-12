"use client";

import type { ComponentProps } from "react";
import { RippleStudy } from "./ripple-study";

export default function RippleStudyDemo(props: Partial<ComponentProps<typeof RippleStudy>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <RippleStudy {...props} />
    </div>
  );
}
