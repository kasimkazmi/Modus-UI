"use client";

import type { ComponentProps } from "react";
import { PlasmaButton } from "./plasma-button";

export default function PlasmaButtonDemo(props: Partial<ComponentProps<typeof PlasmaButton>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <PlasmaButton {...props} />
    </div>
  );
}
