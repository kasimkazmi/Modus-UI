"use client";

import type { ComponentProps } from "react";
import { ExpanseField } from "./expanse-field";

export default function ExpanseFieldDemo(props: Partial<ComponentProps<typeof ExpanseField>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <ExpanseField {...props} />
    </div>
  );
}
