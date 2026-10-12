"use client";

import type { ComponentProps } from "react";
import { IgnitionButton } from "./ignition-button";

export default function IgnitionButtonDemo(props: Partial<ComponentProps<typeof IgnitionButton>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <IgnitionButton {...props} />
    </div>
  );
}
