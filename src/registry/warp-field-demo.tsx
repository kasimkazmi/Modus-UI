"use client";

import type { ComponentProps } from "react";
import { WarpField } from "./warp-field";

export default function WarpFieldDemo(props: Partial<ComponentProps<typeof WarpField>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <WarpField {...props} />
    </div>
  );
}
