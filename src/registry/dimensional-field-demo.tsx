"use client";

import type { ComponentProps } from "react";
import { DimensionalField } from "./dimensional-field";

export default function DimensionalFieldDemo(
  props: Partial<ComponentProps<typeof DimensionalField>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <DimensionalField {...props} />
    </div>
  );
}
