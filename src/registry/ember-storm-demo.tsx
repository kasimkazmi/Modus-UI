"use client";

import type { ComponentProps } from "react";
import { EmberStorm } from "./ember-storm";

export default function EmberStormDemo(props: Partial<ComponentProps<typeof EmberStorm>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <EmberStorm {...props} />
    </div>
  );
}
