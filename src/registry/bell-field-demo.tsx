"use client";

import type { ComponentProps } from "react";
import { BellField } from "./bell-field";

export default function BellFieldDemo(props: Partial<ComponentProps<typeof BellField>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border bg-black">
      <BellField {...props} />
    </div>
  );
}
