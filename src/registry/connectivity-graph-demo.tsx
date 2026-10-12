"use client";

import type { ComponentProps } from "react";
import { ConnectivityGraph } from "./connectivity-graph";

export default function ConnectivityGraphDemo(
  props: Partial<ComponentProps<typeof ConnectivityGraph>>,
) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <ConnectivityGraph {...props} />
    </div>
  );
}
