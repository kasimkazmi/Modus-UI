"use client";

import type { ComponentProps } from "react";
import { TactileButton } from "./tactile-button";

export default function TactileButtonDemo(props: Partial<ComponentProps<typeof TactileButton>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <TactileButton {...props} />
    </div>
  );
}
