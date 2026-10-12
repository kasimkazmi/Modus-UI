"use client";

import type { ComponentProps } from "react";
import { LaunchButton } from "./launch-button";

export default function LaunchButtonDemo(props: Partial<ComponentProps<typeof LaunchButton>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <LaunchButton className="min-h-[400px]" {...props} />
    </div>
  );
}
