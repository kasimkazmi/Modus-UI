"use client";

import type { ComponentProps } from "react";
import { DataField } from "./data-field";

export default function DataFieldDemo(props: Partial<ComponentProps<typeof DataField>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <DataField {...props} />
    </div>
  );
}
