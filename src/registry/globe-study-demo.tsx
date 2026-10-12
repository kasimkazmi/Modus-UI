"use client";

import type { ComponentProps } from "react";
import { GlobeStudy } from "./globe-study";

export default function GlobeStudyDemo(props: Partial<ComponentProps<typeof GlobeStudy>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <GlobeStudy {...props} />
    </div>
  );
}
