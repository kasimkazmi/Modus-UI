"use client";

import type { ComponentProps } from "react";
import { CloudField } from "./cloud-field";

export default function CloudFieldDemo(props: Partial<ComponentProps<typeof CloudField>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <CloudField {...props} />
    </div>
  );
}
