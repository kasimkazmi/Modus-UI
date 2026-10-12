"use client";

import type { ComponentProps } from "react";
import { RibbonField } from "./ribbon-field";

export default function RibbonFieldDemo(props: Partial<ComponentProps<typeof RibbonField>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border bg-black">
      <RibbonField {...props} />
    </div>
  );
}
