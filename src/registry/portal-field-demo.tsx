"use client";

import type { ComponentProps } from "react";
import { PortalField } from "./portal-field";

export default function PortalFieldDemo(props: Partial<ComponentProps<typeof PortalField>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <PortalField {...props} />
    </div>
  );
}
