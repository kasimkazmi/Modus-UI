"use client";

import type { ComponentProps } from "react";
import { VoidField } from "./void-field";

export default function VoidFieldDemo(props: Partial<ComponentProps<typeof VoidField>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <VoidField {...props} />
    </div>
  );
}
