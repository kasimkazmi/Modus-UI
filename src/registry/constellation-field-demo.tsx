"use client";

import type { ComponentProps } from "react";
import { ConstellationField } from "./constellation-field";

export default function ConstellationFieldDemo(
  props: Partial<ComponentProps<typeof ConstellationField>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <ConstellationField {...props} />
    </div>
  );
}
