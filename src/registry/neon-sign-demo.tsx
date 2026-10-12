"use client";

import type { ComponentProps } from "react";
import { NeonSign } from "./neon-sign";

export default function NeonSignDemo(props: Partial<ComponentProps<typeof NeonSign>>) {
  return (
    <div className="relative flex min-h-[400px] w-full overflow-hidden rounded-xl border border-border">
      <div className="absolute inset-0">
        <NeonSign {...props} />
      </div>
    </div>
  );
}
