"use client";

import type { ComponentProps } from "react";
import { ElementalField } from "./elemental-field";

export default function ElementalFieldDemo(props: Partial<ComponentProps<typeof ElementalField>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <ElementalField {...props} />
    </div>
  );
}
