"use client";

import type { ComponentProps } from "react";
import { ProceduralLandscape } from "./procedural-landscape";

export default function ProceduralLandscapeDemo(
  props: Partial<ComponentProps<typeof ProceduralLandscape>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <ProceduralLandscape {...props} />
    </div>
  );
}
